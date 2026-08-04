import { NextResponse } from 'next/server';

type WaitlistRequestBody = {
	email?: string;
};

function normalizeEmail(email: string) {
	return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toFirestoreValue(value: string) {
	return { stringValue: value };
}

export async function POST(request: Request) {
	let body: WaitlistRequestBody;

	try {
		body = (await request.json()) as WaitlistRequestBody;
	} catch {
		return NextResponse.json(
			{ error: 'Invalid request body.' },
			{ status: 400 }
		);
	}

	const email = normalizeEmail(body.email ?? '');

	if (!email || !isValidEmail(email)) {
		return NextResponse.json(
			{ error: 'Enter a valid email address.' },
			{ status: 400 }
		);
	}

	const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
	const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

	if (!projectId || !apiKey) {
		return NextResponse.json(
			{ error: 'Firebase is not configured.' },
			{ status: 500 }
		);
	}

	const documentId = encodeURIComponent(email);
	const timestamp = new Date().toISOString();
	const searchParams = new URLSearchParams({
		key: apiKey,
	});
	const documentUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/claiWaitlist/${documentId}`;

	for (const field of [
		'email',
		'source',
		'status',
		'createdAt',
		'updatedAt',
	]) {
		searchParams.append('updateMask.fieldPaths', field);
	}

	const fields: Record<string, ReturnType<typeof toFirestoreValue>> = {
		email: toFirestoreValue(email),
		source: toFirestoreValue('landing_waitlist'),
		status: toFirestoreValue('joined'),
		createdAt: toFirestoreValue(timestamp),
		updatedAt: toFirestoreValue(timestamp),
	};

	const response = await fetch(`${documentUrl}?${searchParams.toString()}`, {
		body: JSON.stringify({
			fields,
		}),
		headers: {
			'Content-Type': 'application/json',
		},
		method: 'PATCH',
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('Waitlist Firestore write failed:', errorText);

		return NextResponse.json(
			{
				error: 'Unable to join the waitlist right now.',
				firebaseError:
					process.env.NODE_ENV === 'development'
						? errorText
						: undefined,
			},
			{ status: 502 }
		);
	}

	return NextResponse.json({ ok: true });
}
