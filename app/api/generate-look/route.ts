import { NextResponse } from 'next/server';

import {
	getBearerToken,
	requireAuthenticatedUser,
} from '@/lib/firebase-auth-server';
import {
	formatStyleProfileForPrompt,
	getServerStyleProfile,
} from '@/lib/style-profile-server';
import { classifyVisualIntent, type VisualIntent } from '@/lib/visual-intent';

type GenerateLookRequestBody = {
	context?: 'consumer' | 'stylist';
	prompt?: string;
	advice?: string;
	visualProfileContext?: string;
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

async function removeImageBackground({
	imageData,
	mimeType,
}: {
	imageData: string;
	mimeType: string;
}) {
	const removeBgApiKey = process.env.REMOVE_BG_API_KEY;

	if (!removeBgApiKey) {
		throw new Error('REMOVE_BG_API_KEY is not configured.');
	}

	const imageBuffer = Buffer.from(imageData, 'base64');
	const formData = new FormData();
	formData.append('size', 'auto');
	formData.append('format', 'png');
	formData.append('type', 'person');
	formData.append('image_file', new Blob([imageBuffer], { type: mimeType }));

	const response = await fetch('https://api.remove.bg/v1.0/removebg', {
		method: 'POST',
		headers: {
			'X-Api-Key': removeBgApiKey,
		},
		body: formData,
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			errorText || 'remove.bg could not remove the image background.'
		);
	}

	return Buffer.from(await response.arrayBuffer());
}

function buildLookPrompt({
	context,
	prompt,
	advice,
	hasReferenceImage,
	styleProfileContext,
	visualIntent,
}: {
	context: 'consumer' | 'stylist';
	prompt: string;
	advice: string;
	hasReferenceImage: boolean;
	styleProfileContext: string;
	visualIntent: VisualIntent;
}) {
	const audience =
		context === 'stylist'
			? 'for a professional stylist or fashion creator to use as client-ready visual direction'
			: 'for a modest fashion user who wants practical styling inspiration';

	if (visualIntent !== 'outfit') {
		const visualBriefs: Record<Exclude<VisualIntent, 'outfit'>, string> = {
			alteration:
				'showing a clear tailoring or alteration setup for the garment: measuring, pinning, hemming, adjusting fit, or marking the change in progress',
			care: 'showing a practical garment-care setup: steaming, folding, storing, protecting, brushing, or maintaining the item with the correct tools',
			cleaning:
				'showing a practical fashion-care cleaning setup for the garment or footwear: appropriate brush, cloth, mild cleaner, towel, water bowl, or material-safe cleaning tools',
			comparison:
				'showing a clean visual comparison of the fashion items or outfit options, with the key differences easy to see at a glance',
			repair: 'showing a practical repair setup for the garment or accessory: stitching, patching, reattaching a button, fixing a small tear, or mending the damaged area',
		};

		return `Create one polished fashion guidance visual ${audience}.

Visual intent:
- This is a ${visualIntent.replace('-', ' ')} visual, not outfit inspiration.
- Create a task-specific image ${visualBriefs[visualIntent]}.
- Prioritize clarity, usefulness, and realistic fashion-care details over editorial styling.
- Show the relevant garment, footwear, accessory, fabric, tool, or hand action clearly.
- If a person appears, show only neutral hands or a partial working view unless the user specifically asked for a worn outfit.
- Do not create a person/model wearing a full outfit unless the user explicitly asked for outfit inspiration.
- Do not create a flat-lay outfit board, unrelated outfit collage, shopping ad, mood board, or decorative scene.
- Do not imply a specific gender, race, ethnicity, religion, body type, or identity.
- Do not add readable text, logos, captions, UI, watermarks, labels, or shopping prices.
- Use a clean, simple background or work surface. Keep the image compact and readable in a web chat response.

User request:
${prompt || 'Create a practical fashion guidance visual.'}

CLAi guidance to visualize:
${advice}

${
	hasReferenceImage
		? 'Use the attached image only as a fashion reference for visible garments, colors, material, condition, damage, or care context. Do not recreate the person or body.'
		: ''
}`;
	}

	return `Create one polished modest-fashion outfit inspiration image ${audience}.

Output style:
- Show one real-looking full-body person/model wearing the outfit. The clothing must be worn on the body, not arranged as objects.
- The full outfit should be clearly visible from head to toe, including the full head, hair, shoes, and accessories.
- Do not crop the head, forehead, face, chin, hair, shoulders, hands, legs, shoes, or bag.
- Use a zoomed-out fashion catalog composition. The complete model must fit inside the frame.
- Leave at least 20% empty flat background margin above the head and below the feet, and 12% margin on the left and right.
- Center the complete model in frame. If needed, make the model smaller rather than cropping any body part.
- Use a realistic fashion catalog or editorial e-commerce style with natural posing.
- Use a flat, solid #F47015 backdrop only as a removable production background. Do not make it part of the styling, lighting, outfit, prop, outline, rim, glow, shadow, or aura.
- The person/model must be visually separated from the backdrop with clean natural edges so the background can be removed into a transparent cutout.
- Do not create a flat-lay, outfit board, product grid, hanger shot, mannequin, or clothing-only image.
- Do not generate floating garments, separate accessories, or an outfit collage.
- Do not imply a specific gender, race, ethnicity, religion, body type, or identity unless the user explicitly provided it.
- Avoid sexualized posing, body emphasis, body judgment, exaggerated proportions, or stereotyped identity cues.

- Do not use a busy scene, room, wall texture, outdoor setting, props, readable text, logos, shopping labels, or decorative background.
- Do not add colored outlines, edge strokes, halos, glow, or colored rim artifacts around the person.
- Keep the subject cleanly separated from the background with natural edges.
- Keep it compact, realistic, tasteful, and easy to understand.
- Do not add readable text, logos, captions, UI, watermarks, or shopping prices.
- Optimize for confidence, practicality, repeat wear, and sustainability.
- Image should be small enough for a web chat response, square aspect ratio, not overly detailed.

Style profile:
${styleProfileContext}

Profile precedence:
- If current chat visual profile details conflict with saved style profile details, use the current chat details.
- The newest user-provided gender, presentation, race, or ethnicity detail is the source of truth.
- Do not use an older masc, femme, neutral, race, ethnicity, or presentation detail after the user gives a newer one.

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
	const idToken = getBearerToken(request);
	const user = await requireAuthenticatedUser(request);

	if (!idToken || !user?.localId) {
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
	const visualProfileContext = body.visualProfileContext?.trim() ?? '';
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
		const visualIntent = classifyVisualIntent(prompt);
		let styleProfileContext = formatStyleProfileForPrompt(null);

		if (visualIntent === 'outfit') {
			try {
				const styleProfile = await getServerStyleProfile({
					idToken,
					uid: user.localId,
				});
				styleProfileContext = formatStyleProfileForPrompt(styleProfile);
			} catch (error) {
				console.error(error);
			}

			if (visualProfileContext) {
				styleProfileContext = `${styleProfileContext}\n\n${visualProfileContext}`;
			}
		}

		const input: GeminiInteractionInput[] = [
			{
				type: 'text',
				text: buildLookPrompt({
					context,
					prompt,
					advice,
					hasReferenceImage: hasImage,
					styleProfileContext,
					visualIntent,
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

		if (visualIntent !== 'outfit') {
			return NextResponse.json({
				imageUrl: `data:${mimeType};base64,${imageData}`,
				sourceMimeType: mimeType,
				visualIntent,
			});
		}

		const cutoutImage = await removeImageBackground({
			imageData,
			mimeType,
		});

		return NextResponse.json({
			imageUrl: `data:image/png;base64,${cutoutImage.toString('base64')}`,
			sourceMimeType: mimeType,
			visualIntent,
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
