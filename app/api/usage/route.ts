import {
	getBearerToken,
	requireAuthenticatedUser,
} from '@/lib/firebase-auth-server';
import { getDailyMessageUsage } from '@/lib/daily-usage-server';
import { noStoreJson } from '@/lib/no-store-response';

export async function GET(request: Request) {
	const idToken = getBearerToken(request);
	const user = await requireAuthenticatedUser(request);

	if (!idToken || !user?.localId) {
		return noStoreJson(
			{ error: 'Please log in to view usage.' },
			{ status: 401 }
		);
	}

	try {
		const usage = await getDailyMessageUsage({
			idToken,
			uid: user.localId,
		});

		return noStoreJson(usage);
	} catch {
		return noStoreJson(
			{ error: 'Unable to load usage right now.' },
			{ status: 502 }
		);
	}
}
