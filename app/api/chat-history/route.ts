import { listSavedChats } from '@/lib/chat-history-server';
import {
	getBearerToken,
	requireAuthenticatedUser,
} from '@/lib/firebase-auth-server';
import { noStoreJson } from '@/lib/no-store-response';

export async function GET(request: Request) {
	const idToken = getBearerToken(request);
	const user = await requireAuthenticatedUser(request);

	if (!idToken || !user?.localId) {
		return noStoreJson(
			{ error: 'Please log in to view chat history.' },
			{ status: 401 }
		);
	}

	try {
		const chats = await listSavedChats({
			idToken,
			uid: user.localId,
		});

		return noStoreJson({ chats });
	} catch {
		return noStoreJson(
			{ error: 'Unable to load chat history right now.' },
			{ status: 502 }
		);
	}
}
