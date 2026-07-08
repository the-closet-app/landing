import { NextResponse } from 'next/server';

import {
	getBearerToken,
	requireAuthenticatedUser,
} from '@/lib/firebase-auth-server';
import { getDailyMessageUsage } from '@/lib/daily-usage-server';

export async function GET(request: Request) {
	const idToken = getBearerToken(request);
	const user = await requireAuthenticatedUser(request);

	if (!idToken || !user?.localId) {
		return NextResponse.json(
			{ error: 'Please log in to view usage.' },
			{ status: 401 }
		);
	}

	try {
		const usage = await getDailyMessageUsage({
			idToken,
			uid: user.localId,
		});

		return NextResponse.json(usage);
	} catch {
		return NextResponse.json(
			{ error: 'Unable to load usage right now.' },
			{ status: 502 }
		);
	}
}
