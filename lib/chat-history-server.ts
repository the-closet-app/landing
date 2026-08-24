type FirestoreValue = {
	booleanValue?: boolean;
	integerValue?: string;
	stringValue?: string;
	timestampValue?: string;
};

type FirestoreDocument = {
	fields?: Record<string, FirestoreValue>;
	name?: string;
};

type FirestoreRunQueryResponse = Array<{
	document?: FirestoreDocument;
}>;

export type SavedChatSummary = {
	id: string;
	context: 'consumer' | 'stylist';
	lastMessage: string;
	updatedAt: string;
};

export type SavedChatMessage = {
	id: string;
	content: string;
	createdAt: string;
	hasImage: boolean;
	imageMimeType?: string;
	imageName?: string;
	role: 'assistant' | 'user';
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

function getDocumentsRootUrl() {
	const projectId = getProjectId();

	return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

function getChatDocumentUrl(chatId: string) {
	return getCollectionUrl(`claiChats/${encodeURIComponent(chatId)}`);
}

function getChatMessagesUrl(chatId: string) {
	return getCollectionUrl(`claiChats/${encodeURIComponent(chatId)}/messages`);
}

function getDocumentId(documentName?: string) {
	if (!documentName) {
		return crypto.randomUUID();
	}

	return documentName.split('/').at(-1) ?? crypto.randomUUID();
}

function getStringField(
	fields: Record<string, FirestoreValue> | undefined,
	field: string
) {
	return fields?.[field]?.stringValue ?? '';
}

function getTimestampField(
	fields: Record<string, FirestoreValue> | undefined,
	field: string
) {
	return fields?.[field]?.timestampValue ?? '';
}

function getBooleanField(
	fields: Record<string, FirestoreValue> | undefined,
	field: string
) {
	return fields?.[field]?.booleanValue ?? false;
}

function getChatContext(value: string): 'consumer' | 'stylist' {
	return value === 'stylist' ? 'stylist' : 'consumer';
}

function getMessageRole(value: string): 'assistant' | 'user' {
	return value === 'assistant' ? 'assistant' : 'user';
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

export async function listSavedChats({
	idToken,
	limit = 30,
	uid,
}: {
	idToken: string;
	limit?: number;
	uid: string;
}) {
	const response = await fetch(`${getDocumentsRootUrl()}:runQuery`, {
		body: JSON.stringify({
			structuredQuery: {
				from: [{ collectionId: 'claiChats' }],
				where: {
					fieldFilter: {
						field: { fieldPath: 'uid' },
						op: 'EQUAL',
						value: { stringValue: uid },
					},
				},
			},
		}),
		headers: getFirestoreHeaders(idToken),
		method: 'POST',
	});

	if (!response.ok) {
		throw new Error('Unable to load chat history.');
	}

	const data = (await response.json()) as FirestoreRunQueryResponse;

	return data
		.map((result) => result.document)
		.filter((document): document is FirestoreDocument => Boolean(document))
		.map((document) => {
			const fields = document.fields;

			return {
				context: getChatContext(getStringField(fields, 'context')),
				id: getDocumentId(document.name),
				lastMessage: getStringField(fields, 'lastMessage'),
				updatedAt: getTimestampField(fields, 'updatedAt'),
			};
		})
		.filter((chat) => chat.updatedAt)
		.sort(
			(firstChat, secondChat) =>
				new Date(secondChat.updatedAt).getTime() -
				new Date(firstChat.updatedAt).getTime()
		)
		.slice(0, limit) satisfies SavedChatSummary[];
}

export async function getSavedChatMessages({
	chatId,
	idToken,
	uid,
}: {
	chatId: string;
	idToken: string;
	uid: string;
}) {
	const response = await fetch(`${getChatDocumentUrl(chatId)}:runQuery`, {
		body: JSON.stringify({
			structuredQuery: {
				from: [{ collectionId: 'messages' }],
				where: {
					fieldFilter: {
						field: { fieldPath: 'uid' },
						op: 'EQUAL',
						value: { stringValue: uid },
					},
				},
			},
		}),
		headers: getFirestoreHeaders(idToken),
		method: 'POST',
	});

	if (!response.ok) {
		const errorText = await response.text();

		throw new Error(errorText || 'Unable to load chat messages.');
	}

	const data = (await response.json()) as FirestoreRunQueryResponse;

	return data
		.map((result) => result.document)
		.filter((document): document is FirestoreDocument => Boolean(document))
		.map((document) => {
			const fields = document.fields;

			return {
				content: getStringField(fields, 'content'),
				createdAt: getTimestampField(fields, 'createdAt'),
				hasImage: getBooleanField(fields, 'hasImage'),
				id: getDocumentId(document.name),
				imageMimeType:
					getStringField(fields, 'imageMimeType') || undefined,
				imageName: getStringField(fields, 'imageName') || undefined,
				role: getMessageRole(getStringField(fields, 'role')),
				uid: getStringField(fields, 'uid'),
			};
		})
		.filter((message) => message.uid === uid && message.createdAt)
		.sort(
			(firstMessage, secondMessage) =>
				new Date(firstMessage.createdAt).getTime() -
				new Date(secondMessage.createdAt).getTime()
		)
		.map(
			(message) =>
				({
					content: message.content,
					createdAt: message.createdAt,
					hasImage: message.hasImage,
					id: message.id,
					imageMimeType: message.imageMimeType,
					imageName: message.imageName,
					role: message.role,
				}) satisfies SavedChatMessage
		);
}
