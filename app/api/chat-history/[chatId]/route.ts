import { NextResponse } from 'next/server';

import { getSavedChatMessages } from '@/lib/chat-history-server';
import {
	getBearerToken,
	requireAuthenticatedUser,
} from '@/lib/firebase-auth-server';

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
		return NextResponse.json(
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

		return NextResponse.json({ chatId, messages });
	} catch (error) {
		console.error(error);

		return NextResponse.json(
			{ error: 'Unable to load this chat right now.' },
			{ status: 502 }
		);
	}
}
