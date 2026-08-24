import {
	getBearerToken,
	requireAuthenticatedUser,
} from '@/lib/firebase-auth-server';
import { noStoreJson } from '@/lib/no-store-response';
import {
	getDailyMessageUsage,
	incrementDailyMessageUsage,
} from '@/lib/daily-usage-server';
import { classifyVisualIntent, type VisualIntent } from '@/lib/visual-intent';

type GenerateLookRequestBody = {
	context?: 'consumer' | 'stylist';
	prompt?: string;
	advice?: string;
	visualIntent?: VisualIntent;
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
const visualIntents = new Set<VisualIntent>([
	'outfit',
	'cleaning',
	'repair',
	'care',
	'alteration',
	'comparison',
]);

function isVisualIntent(value: unknown): value is VisualIntent {
	return (
		typeof value === 'string' && visualIntents.has(value as VisualIntent)
	);
}

function buildLookPrompt({
	context,
	prompt,
	advice,
	hasReferenceImage,
	visualIntent,
}: {
	context: 'consumer' | 'stylist';
	prompt: string;
	advice: string;
	hasReferenceImage: boolean;
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
- Show the relevant garment, footwear, accessory, fabric, or tool clearly.
- Do not show a person, model, mannequin, face, body, hand, skin, or partial human figure.
- Do not create a person/model wearing a full outfit.
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
- Show only the recommended clothing, footwear, bags, jewelry, and accessories.
- Every visible object must be a wearable fashion item or wearable accessory.
- Use a polished flat-lay, product-board, capsule wardrobe, or editorial wardrobe layout.
- Arrange the items clearly so the user can understand the recommended wear without needing a model.
- Show complete outfit components: at least one main garment for the upper body and one lower-body garment or full-body garment, plus relevant footwear or accessories when mentioned.
- Do not show any person, model, mannequin, face, body, hand, skin, or partial human figure.
- Do not show clothing worn on a body.
- Do not imply race, ethnicity, religion, body type, age, or identity.
- Do not create a hanger shot unless the garment naturally needs one for clarity.
- Do not show cleaning, care, repair, laundry, or maintenance objects: no brushes, cloths, towels, water bowls, soap, polish, sprays, bottles, shoe-care kits, sewing tools, measuring tape, pins, scissors, or workbench setups.
- If footwear is included, show it as part of a styled outfit board, never as an item being cleaned, repaired, washed, polished, brushed, or maintained.
- Do not use a busy room, outdoor scene, readable text, logos, shopping labels, or decorative background.
- Do not add colored outlines, halos, glow, or rim artifacts.
- Use a clean, simple background that works well inside a web chat response.
- Keep it compact, realistic, tasteful, and easy to understand.
- Do not add readable text, logos, captions, UI, watermarks, or shopping prices.
- Optimize for confidence, practicality, repeat wear, and sustainability.
- Image should be small enough for a web chat response, square aspect ratio, not overly detailed.

User request:
${prompt || 'Create a modest fashion look inspiration image.'}

CLAi styling advice to visualize:
${advice}

Critical interpretation:
- This is outfit inspiration only.
- Convert any budget, shopping, quality, shoe, or care-adjacent language into wearable outfit items.
- If the advice mentions stores, prices, sales, quality basics, or budget, do not visualize stores, price tags, shopping pages, cleaning supplies, or care tools.

${
	hasReferenceImage
		? 'Use the attached image only as a fashion reference for visible garments, colors, textures, and styling direction. Do not recreate any person or body.'
		: ''
}`;
}

export async function POST(request: Request) {
	const idToken = getBearerToken(request);
	const user = await requireAuthenticatedUser(request);

	if (!idToken || !user?.localId) {
		return noStoreJson(
			{ error: 'Please log in to generate a look inspiration image.' },
			{ status: 401 }
		);
	}

	const apiKey = process.env.GEMINI_API_KEY;

	if (!apiKey) {
		return noStoreJson(
			{ error: 'GEMINI_API_KEY is not configured.' },
			{ status: 500 }
		);
	}

	let usage: Awaited<ReturnType<typeof getDailyMessageUsage>>;

	try {
		usage = await getDailyMessageUsage({
			idToken,
			uid: user.localId,
		});
	} catch {
		return noStoreJson(
			{ error: 'Unable to check your daily message usage.' },
			{ status: 502 }
		);
	}

	if (usage.used >= usage.limit) {
		return noStoreJson(
			{
				error: `You have used all ${usage.limit} CLAi messages for today.`,
				usage,
			},
			{ status: 429 }
		);
	}

	let body: GenerateLookRequestBody;

	try {
		body = (await request.json()) as GenerateLookRequestBody;
	} catch {
		return noStoreJson({ error: 'Invalid request body.' }, { status: 400 });
	}

	const context = body.context === 'stylist' ? 'stylist' : 'consumer';
	const prompt = body.prompt?.trim() ?? '';
	const advice = body.advice?.trim() ?? '';
	const image = body.image;
	const hasImage = Boolean(image?.data && image.mimeType);

	if (!prompt && !advice) {
		return noStoreJson(
			{ error: 'Please ask CLAi for styling advice first.' },
			{ status: 400 }
		);
	}

	if (hasImage && !image?.mimeType?.startsWith('image/')) {
		return noStoreJson(
			{ error: 'Please upload a valid image file.' },
			{ status: 400 }
		);
	}

	try {
		const visualIntent = isVisualIntent(body.visualIntent)
			? body.visualIntent
			: classifyVisualIntent(prompt);

		const input: GeminiInteractionInput[] = [
			{
				type: 'text',
				text: buildLookPrompt({
					context,
					prompt,
					advice,
					hasReferenceImage: hasImage,
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
			return noStoreJson(
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
			return noStoreJson(
				{ error: 'Gemini did not return an image.' },
				{ status: 502 }
			);
		}

		const nextUsage = await incrementDailyMessageUsage({
			idToken,
			uid: user.localId,
		});

		return noStoreJson({
			imageUrl: `data:${mimeType};base64,${imageData}`,
			sourceMimeType: mimeType,
			usage: nextUsage,
			visualIntent,
		});
	} catch {
		return noStoreJson(
			{
				error: 'Unable to reach Gemini image generation. Please try again.',
			},
			{ status: 502 }
		);
	}
}
