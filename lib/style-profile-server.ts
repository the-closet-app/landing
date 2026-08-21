type FirestoreField = {
	stringValue?: string;
};

type FirestoreDocument = {
	fields?: {
		gender?: FirestoreField;
		race?: FirestoreField;
	};
};

export type ServerStyleProfile = {
	gender?: string;
	race?: string;
};

const collectionName = 'claiUserProfiles';

function getProjectId() {
	const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

	if (!projectId) {
		throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not configured.');
	}

	return projectId;
}

function getProfileUrl(uid: string) {
	return `https://firestore.googleapis.com/v1/projects/${getProjectId()}/databases/(default)/documents/${collectionName}/${uid}`;
}

function getStringValue(field?: FirestoreField) {
	return field?.stringValue?.trim() || undefined;
}

export function formatStyleProfileForPrompt(
	profile: ServerStyleProfile | null
) {
	if (!profile) {
		return 'No optional style profile has been provided. Do not assume gender, race, ethnicity, body type, budget, culture, age, or style identity.';
	}

	const details = [
		profile.gender ? `Gender / presentation: ${profile.gender}` : null,
		profile.race ? `Race / ethnicity: ${profile.race}` : null,
	].filter(Boolean);

	if (!details.length) {
		return 'The user skipped the optional style profile. Do not assume gender, race, ethnicity, body type, budget, culture, age, or style identity.';
	}

	return `Optional user style profile provided by the user. Use only these supplied details, and do not infer anything beyond them:\n- ${details.join('\n- ')}`;
}

export async function getServerStyleProfile({
	idToken,
	uid,
}: {
	idToken: string;
	uid: string;
}) {
	const response = await fetch(getProfileUrl(uid), {
		headers: {
			Authorization: `Bearer ${idToken}`,
		},
	});

	if (response.status === 404) {
		return null;
	}

	if (!response.ok) {
		throw new Error('Unable to load style profile.');
	}

	const data = (await response.json()) as FirestoreDocument;

	return {
		gender: getStringValue(data.fields?.gender),
		race: getStringValue(data.fields?.race),
	};
}
