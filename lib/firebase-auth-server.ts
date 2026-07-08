type FirebaseLookupResponse = {
	error?: {
		message?: string;
	};
	users?: Array<{
		localId?: string;
		email?: string;
		emailVerified?: boolean;
	}>;
};

export function getBearerToken(request: Request) {
	const authorization = request.headers.get('authorization');

	if (!authorization?.startsWith('Bearer ')) {
		return null;
	}

	return authorization.slice('Bearer '.length).trim();
}

export async function verifyFirebaseIdToken(idToken: string) {
	const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

	if (!apiKey) {
		throw new Error('Firebase API key is not configured.');
	}

	const response = await fetch(
		`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ idToken }),
		}
	);
	const data = (await response.json()) as FirebaseLookupResponse;

	if (!response.ok || !data.users?.[0]?.localId) {
		throw new Error(data.error?.message ?? 'Invalid Firebase ID token.');
	}

	return data.users[0];
}

export async function requireAuthenticatedUser(request: Request) {
	const idToken = getBearerToken(request);

	if (!idToken) {
		return null;
	}

	try {
		return await verifyFirebaseIdToken(idToken);
	} catch {
		return null;
	}
}
