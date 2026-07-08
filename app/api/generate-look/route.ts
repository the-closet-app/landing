import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/firebase-auth-server';

type GenerateLookRequestBody = {
	context?: 'consumer' | 'stylist';
	prompt?: string;
	advice?: string;
	image?: {
		data?: string;
		mimeType?: string;
		name?: string;
	};
};

type GeminiInteractionResponse = {
	output_image?: {
		data?: string;
		mime_type?: string;
		mimeType?: string;
	};
	steps?: Array<{
		content?: Array<{
			data?: string;
			mime_type?: string;
			mimeType?: string;
			type?: string;
		}>;
		type?: string;
	}>;
	error?: {
		message?: string;
	};
};

type GeminiInteractionInput =
	| {
			type: 'text';
			text: string;
	  }
	| {
			type: 'image';
			mime_type: string;
			data: string;
	  };

const imageModel = process.env.GEMINI_IMAGE_MODEL ?? 'gemini-3.1-flash-image';

function buildLookPrompt({
	context,
	prompt,
	advice,
	hasReferenceImage,
}: {
	context: 'consumer' | 'stylist';
	prompt: string;
	advice: string;
	hasReferenceImage: boolean;
}) {
	const audience =
		context === 'stylist'
			? 'for a professional stylist or fashion creator to use as client-ready visual direction'
			: 'for a modest fashion user who wants practical styling inspiration';

	return `Create one polished modest-fashion outfit inspiration image ${audience}.

Output style:
- Editorial flat-lay or outfit-board composition on a clean neutral background.
- Show garments, shoes, accessories, textures, and color relationships clearly.
- Keep it compact, realistic, tasteful, and easy to understand.
- Do not include people, faces, bodies, mannequins, body silhouettes, measurements, size labels, or identity cues.
- Do not add readable text, logos, captions, UI, watermarks, or shopping prices.
- Optimize for confidence, practicality, repeat wear, and sustainability.
- Image should be small enough for a web chat response, square aspect ratio, not overly detailed.

User request:
${prompt || 'Create a modest fashion look inspiration image.'}

CLAi styling advice to visualize:
${advice}

${
	hasReferenceImage
		? 'Use the attached image only as a fashion reference for visible garments, colors, textures, and styling direction. Do not recreate the person or body.'
		: ''
}`;
}

export async function POST(request: Request) {
	const user = await requireAuthenticatedUser(request);

	if (!user) {
		return NextResponse.json(
			{ error: 'Please log in to generate a look inspiration image.' },
			{ status: 401 }
		);
	}

	const apiKey = process.env.GEMINI_API_KEY;

	if (!apiKey) {
		return NextResponse.json(
			{ error: 'GEMINI_API_KEY is not configured.' },
			{ status: 500 }
		);
	}

	let body: GenerateLookRequestBody;

	try {
		body = (await request.json()) as GenerateLookRequestBody;
	} catch {
		return NextResponse.json(
			{ error: 'Invalid request body.' },
			{ status: 400 }
		);
	}

	const context = body.context === 'stylist' ? 'stylist' : 'consumer';
	const prompt = body.prompt?.trim() ?? '';
	const advice = body.advice?.trim() ?? '';
	const image = body.image;
	const hasImage = Boolean(image?.data && image.mimeType);

	if (!prompt && !advice) {
		return NextResponse.json(
			{ error: 'Please ask CLAi for styling advice first.' },
			{ status: 400 }
		);
	}

	if (hasImage && !image?.mimeType?.startsWith('image/')) {
		return NextResponse.json(
			{ error: 'Please upload a valid image file.' },
			{ status: 400 }
		);
	}

	try {
		const input: GeminiInteractionInput[] = [
			{
				type: 'text',
				text: buildLookPrompt({
					context,
					prompt,
					advice,
					hasReferenceImage: hasImage,
				}),
			},
		];

		if (hasImage && image?.data && image.mimeType) {
			input.push({
				type: 'image',
				mime_type: image.mimeType,
				data: image.data,
			});
		}

		const response = await fetch(
			'https://generativelanguage.googleapis.com/v1beta/interactions',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-goog-api-key': apiKey,
				},
				body: JSON.stringify({
					model: imageModel,
					input,
					response_format: {
						type: 'image',
						mime_type: 'image/jpeg',
						aspect_ratio: '1:1',
						image_size: '1K',
					},
				}),
			}
		);

		const data = (await response.json()) as GeminiInteractionResponse;

		if (!response.ok) {
			return NextResponse.json(
				{
					error:
						data.error?.message ??
						'Unable to generate a look inspiration image.',
				},
				{ status: response.status }
			);
		}

		const outputImage =
			data.output_image ??
			data.steps
				?.flatMap((step) => step.content ?? [])
				.find((part) => part.type === 'image' && part.data);
		const imageData = outputImage?.data;
		const mimeType =
			outputImage?.mime_type ?? outputImage?.mimeType ?? 'image/jpeg';

		if (!imageData) {
			return NextResponse.json(
				{ error: 'Gemini did not return an image.' },
				{ status: 502 }
			);
		}

		return NextResponse.json({
			imageUrl: `data:${mimeType};base64,${imageData}`,
		});
	} catch {
		return NextResponse.json(
			{
				error: 'Unable to reach Gemini image generation. Please try again.',
			},
			{ status: 502 }
		);
	}
}
