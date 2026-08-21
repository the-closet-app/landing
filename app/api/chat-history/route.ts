import { NextResponse } from 'next/server';

import { listSavedChats } from '@/lib/chat-history-server';
import {
	getBearerToken,
	requireAuthenticatedUser,
} from '@/lib/firebase-auth-server';

export async function GET(request: Request) {
	const idToken = getBearerToken(request);
	const user = await requireAuthenticatedUser(request);

	if (!idToken || !user?.localId) {
		return NextResponse.json(
			{ error: 'Please log in to view chat history.' },
			{ status: 401 }
		);
	}

	try {
		const chats = await listSavedChats({
			idToken,
			uid: user.localId,
		});

		return NextResponse.json({ chats });
	} catch {
		return NextResponse.json(
			{ error: 'Unable to load chat history right now.' },
			{ status: 502 }
		);
	}
}
