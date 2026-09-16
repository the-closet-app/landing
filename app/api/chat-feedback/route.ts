import { saveMessageFeedback } from '@/lib/chat-history-server';
import {
	getBearerToken,
	requireAuthenticatedUser,
} from '@/lib/firebase-auth-server';
import { noStoreJson } from '@/lib/no-store-response';

export async function POST(request: Request) {
	const idToken = getBearerToken(request);
	const user = await requireAuthenticatedUser(request);
	if (!idToken || !user?.localId) {
		return noStoreJson(
			{ error: 'Please log in to give feedback.' },
			{ status: 401 }
		);
	}
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return noStoreJson({ error: 'Invalid feedback.' }, { status: 400 });
	}
	if (
		!body ||
		typeof body !== 'object' ||
		!('chatId' in body) ||
		!('messageId' in body) ||
		!('feedback' in body) ||
		typeof body.chatId !== 'string' ||
		!/^[a-zA-Z0-9_-]{1,128}$/.test(body.chatId) ||
		typeof body.messageId !== 'string' ||
		!/^[a-zA-Z0-9_-]{1,128}$/.test(body.messageId) ||
		(body.feedback !== 'up' &&
			body.feedback !== 'down' &&
			body.feedback !== null)
	) {
		return noStoreJson({ error: 'Invalid feedback.' }, { status: 400 });
	}
	try {
		await saveMessageFeedback(
			body.chatId,
			body.messageId,
			body.feedback,
			idToken,
			user.localId
		);
		return noStoreJson({ feedback: body.feedback });
	} catch (error) {
		console.error('Chat feedback save failed:', error);
		return noStoreJson(
			{ error: 'Unable to save feedback. Please try again.' },
			{ status: 502 }
		);
	}
}
