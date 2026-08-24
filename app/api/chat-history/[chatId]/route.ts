import { getSavedChatMessages } from '@/lib/chat-history-server';
import {
	getBearerToken,
	requireAuthenticatedUser,
} from '@/lib/firebase-auth-server';
import { noStoreJson } from '@/lib/no-store-response';

type RouteContext = {
	params: Promise<{
		chatId: string;
	}>;
};

export async function GET(request: Request, context: RouteContext) {
	const idToken = getBearerToken(request);
	const user = await requireAuthenticatedUser(request);
	const { chatId } = await context.params;

	if (!idToken || !user?.localId) {
		return noStoreJson(
			{ error: 'Please log in to view chat history.' },
			{ status: 401 }
		);
	}

	try {
		const messages = await getSavedChatMessages({
			chatId,
			idToken,
			uid: user.localId,
		});

		return noStoreJson({ chatId, messages });
	} catch (error) {
		console.error(error);

		return noStoreJson(
			{ error: 'Unable to load this chat right now.' },
			{ status: 502 }
		);
	}
}
