type FirestoreValue = {
	booleanValue?: boolean;
	integerValue?: string;
	stringValue?: string;
	timestampValue?: string;
};

function getProjectId() {
	const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

	if (!projectId) {
		throw new Error('Firebase project ID is not configured.');
	}

	return projectId;
}

function getFirestoreHeaders(idToken: string) {
	return {
		Authorization: `Bearer ${idToken}`,
		'Content-Type': 'application/json',
	};
}

function getCollectionUrl(path: string) {
	const projectId = getProjectId();

	return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
}

function getChatDocumentUrl(chatId: string) {
	return getCollectionUrl(`claiChats/${encodeURIComponent(chatId)}`);
}

function getChatMessagesUrl(chatId: string) {
	return getCollectionUrl(`claiChats/${encodeURIComponent(chatId)}/messages`);
}

function toFirestoreFields(fields: Record<string, FirestoreValue>) {
	return {
		fields,
	};
}

async function writeChatSummary({
	chatId,
	context,
	idToken,
	lastMessage,
	timestamp,
	uid,
}: {
	chatId: string;
	context: 'consumer' | 'stylist';
	idToken: string;
	lastMessage: string;
	timestamp: string;
	uid: string;
}) {
	const response = await fetch(
		`${getChatDocumentUrl(chatId)}?updateMask.fieldPaths=context&updateMask.fieldPaths=lastMessage&updateMask.fieldPaths=uid&updateMask.fieldPaths=updatedAt`,
		{
			body: JSON.stringify(
				toFirestoreFields({
					context: {
						stringValue: context,
					},
					lastMessage: {
						stringValue: lastMessage.slice(0, 240),
					},
					uid: {
						stringValue: uid,
					},
					updatedAt: {
						timestampValue: timestamp,
					},
				})
			),
			headers: getFirestoreHeaders(idToken),
			method: 'PATCH',
		}
	);

	if (!response.ok) {
		throw new Error('Unable to save chat summary.');
	}
}

async function writeChatMessage({
	chatId,
	content,
	hasImage,
	idToken,
	imageMimeType,
	imageName,
	role,
	timestamp,
	uid,
}: {
	chatId: string;
	content: string;
	hasImage: boolean;
	idToken: string;
	imageMimeType?: string;
	imageName?: string;
	role: 'assistant' | 'user';
	timestamp: string;
	uid: string;
}) {
	const messageId = crypto.randomUUID();
	const fields: Record<string, FirestoreValue> = {
		content: {
			stringValue: content,
		},
		createdAt: {
			timestampValue: timestamp,
		},
		hasImage: {
			booleanValue: hasImage,
		},
		role: {
			stringValue: role,
		},
		uid: {
			stringValue: uid,
		},
	};

	if (imageName) {
		fields.imageName = {
			stringValue: imageName,
		};
	}

	if (imageMimeType) {
		fields.imageMimeType = {
			stringValue: imageMimeType,
		};
	}

	const response = await fetch(
		`${getChatMessagesUrl(chatId)}?documentId=${encodeURIComponent(messageId)}`,
		{
			body: JSON.stringify(toFirestoreFields(fields)),
			headers: getFirestoreHeaders(idToken),
			method: 'POST',
		}
	);

	if (!response.ok) {
		throw new Error('Unable to save chat message.');
	}
}

export async function saveAskChatTurn({
	answer,
	chatId,
	context,
	hasImage,
	idToken,
	imageMimeType,
	imageName,
	prompt,
	uid,
}: {
	answer: string;
	chatId: string;
	context: 'consumer' | 'stylist';
	hasImage: boolean;
	idToken: string;
	imageMimeType?: string;
	imageName?: string;
	prompt: string;
	uid: string;
}) {
	const timestamp = new Date().toISOString();
	const userContent = prompt || 'Analyze this image.';

	await writeChatSummary({
		chatId,
		context,
		idToken,
		lastMessage: userContent,
		timestamp,
		uid,
	});
	await writeChatMessage({
		chatId,
		content: userContent,
		hasImage,
		idToken,
		imageMimeType,
		imageName,
		role: 'user',
		timestamp,
		uid,
	});
	await writeChatMessage({
		chatId,
		content: answer,
		hasImage: false,
		idToken,
		role: 'assistant',
		timestamp,
		uid,
	});
}
