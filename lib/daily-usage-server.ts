type FirestoreValue = {
	integerValue?: string;
	stringValue?: string;
	timestampValue?: string;
};

type FirestoreDocument = {
	fields?: Record<string, FirestoreValue>;
};

export const dailyMessageLimit = 10;

function getProjectId() {
	const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

	if (!projectId) {
		throw new Error('Firebase project ID is not configured.');
	}

	return projectId;
}

function getUsageDate() {
	return new Date().toISOString().slice(0, 10);
}

function getUsageDocumentId(uid: string, date = getUsageDate()) {
	return `${uid}_${date}`;
}

function getUsageDocumentUrl(uid: string, date = getUsageDate()) {
	const projectId = getProjectId();
	const documentId = encodeURIComponent(getUsageDocumentId(uid, date));

	return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/claiUsage/${documentId}`;
}

function getFirestoreHeaders(idToken: string) {
	return {
		Authorization: `Bearer ${idToken}`,
		'Content-Type': 'application/json',
	};
}

function getIntegerField(document: FirestoreDocument, fieldName: string) {
	const value = document.fields?.[fieldName]?.integerValue;

	if (!value) {
		return 0;
	}

	return Number.parseInt(value, 10) || 0;
}

async function writeDailyMessageUsage({
	count,
	date,
	idToken,
	uid,
}: {
	count: number;
	date: string;
	idToken: string;
	uid: string;
}) {
	const response = await fetch(
		`${getUsageDocumentUrl(uid, date)}?updateMask.fieldPaths=count&updateMask.fieldPaths=date&updateMask.fieldPaths=uid&updateMask.fieldPaths=updatedAt`,
		{
			body: JSON.stringify({
				fields: {
					count: {
						integerValue: String(count),
					},
					date: {
						stringValue: date,
					},
					uid: {
						stringValue: uid,
					},
					updatedAt: {
						timestampValue: new Date().toISOString(),
					},
				},
			}),
			headers: getFirestoreHeaders(idToken),
			method: 'PATCH',
		}
	);

	if (!response.ok) {
		throw new Error('Unable to update daily message usage.');
	}
}

async function initializeDailyMessageUsage({
	date,
	idToken,
	uid,
}: {
	date: string;
	idToken: string;
	uid: string;
}) {
	await writeDailyMessageUsage({
		count: 0,
		date,
		idToken,
		uid,
	});

	return {
		date,
		limit: dailyMessageLimit,
		remaining: dailyMessageLimit,
		used: 0,
	};
}

export async function getDailyMessageUsage({
	idToken,
	uid,
}: {
	idToken: string;
	uid: string;
}) {
	const date = getUsageDate();
	const response = await fetch(getUsageDocumentUrl(uid, date), {
		headers: getFirestoreHeaders(idToken),
	});

	if (response.status === 404 || response.status === 403) {
		try {
			return await initializeDailyMessageUsage({
				date,
				idToken,
				uid,
			});
		} catch {
			if (response.status === 404) {
				return {
					date,
					limit: dailyMessageLimit,
					remaining: dailyMessageLimit,
					used: 0,
				};
			}

			throw new Error('Unable to read daily message usage.');
		}
	}

	if (!response.ok) {
		throw new Error('Unable to read daily message usage.');
	}

	const document = (await response.json()) as FirestoreDocument;
	const used = getIntegerField(document, 'count');

	return {
		date,
		limit: dailyMessageLimit,
		remaining: Math.max(0, dailyMessageLimit - used),
		used,
	};
}

export async function incrementDailyMessageUsage({
	idToken,
	uid,
}: {
	idToken: string;
	uid: string;
}) {
	const currentUsage = await getDailyMessageUsage({ idToken, uid });
	const nextCount = currentUsage.used + 1;
	await writeDailyMessageUsage({
		count: nextCount,
		date: currentUsage.date,
		idToken,
		uid,
	});

	return {
		date: currentUsage.date,
		limit: dailyMessageLimit,
		remaining: Math.max(0, dailyMessageLimit - nextCount),
		used: nextCount,
	};
}
