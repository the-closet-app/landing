import { NextResponse } from 'next/server';

import {
	getDailyMessageUsage,
	incrementDailyMessageUsage,
} from '@/lib/daily-usage-server';
import {
	getBearerToken,
	requireAuthenticatedUser,
} from '@/lib/firebase-auth-server';

type AskRequestBody = {
	prompt?: string;
	context?: 'consumer' | 'stylist';
	history?: Array<{
		role?: 'user' | 'assistant';
		content?: string;
		hasImage?: boolean;
	}>;
	image?: {
		data?: string;
		mimeType?: string;
		name?: string;
	};
};

type GeminiPart = {
	text?: string;
	inline_data?: {
		mime_type: string;
		data: string;
	};
};

type GeminiContent = {
	role: 'user' | 'model';
	parts: GeminiPart[];
};

type GeminiResponse = {
	candidates?: Array<{
		content?: {
			parts?: GeminiPart[];
		};
		finishReason?: string;
	}>;
	error?: {
		message?: string;
	};
};

const contextInstructions = {
	consumer: `You are CLAi, a sharp personal stylist and fashion psychologist for modest fashion users across all genders. Give short, direct, confidence-building fashion advice that is practical and sustainability-aware.

Only answer fashion, styling, wardrobe, outfit, color, fit, shopping, occasion, garment-care, or personal-style questions. If the user asks about anything unrelated to fashion, respond briefly: "I am CLAi, I only give fashion advice."

Do not assume gender, size, body shape, religion, budget, or location. Avoid body-shaming, size assumptions, and comments that judge the user's body. Focus on garments, proportions, coverage, color, texture, occasion, comfort, confidence, and styling intention.

For image analysis, keep the response compact. Reference only visible outfit details, colors, fit, coverage, proportions, and styling opportunities. Do not over-explain. Prefer a concise structure such as: What works, What to change, Final look. Ask for budget only if the user clearly wants to buy something or after a bit of back-and-forth.`,
	stylist: `You are CLAi, a sharp stylist and fashion psychologist for professional fashion stylists, personal shoppers, and fashion creators working with modest fashion clients across all genders. Give polished, client-ready direction that is concise, practical, confidence-building, and sustainability-aware.

Only answer fashion, styling, wardrobe, outfit, color, fit, shopping, occasion, garment-care, or personal-style questions. If the user asks about anything unrelated to fashion, respond briefly: "I am CLAi, I only give fashion advice."

Do not assume gender, size, body shape, religion, budget, or location. Avoid body-shaming, size assumptions, and comments that judge the client's body. Focus on garment behavior, coverage, silhouette, color story, texture, styling intention, occasion, client confidence, and repeatable wardrobe value.

For image analysis, keep the response compact and professional. Reference only visible garment details, colors, fit, coverage, proportions, and styling opportunities. Prefer a concise structure such as: What works, What to change, Final look. Ask for budget only if the user clearly wants to buy something or after a bit of back-and-forth.`,
} as const;

const maxHistoryMessages = 8;
const maxHistoryCharacters = 1200;

const imageAnalysisInstruction = `Image response rules:
- Analyze the image as a modest-fashion styling assistant.
- Look only at visible fashion details: garments, colors, coverage, proportions, texture, layering, footwear, accessories, and occasion readiness.
- Do not comment on body size, attractiveness, weight, gender, religion, identity, or body shape.
- Do not assume the user's gender, body shape, budget, or identity.
- Keep the response under 90 words. Do not write an essay.
- If the image is unclear, say what cannot be determined and ask for a clearer photo.
- Each bullet must be one complete sentence and should be 12 words or fewer.
- Do not use nested bullets.

Use this exact format:
Quick take: one sentence.
What works:
- bullet one.
- bullet two.
What to change:
- bullet one.
- bullet two.
Final look: one concise outfit direction.`;

function getRegionalContext(request: Request) {
	const city = request.headers.get('x-vercel-ip-city');
	const region = request.headers.get('x-vercel-ip-country-region');
	const country = request.headers.get('x-vercel-ip-country');
	const location = [city, region, country].filter(Boolean).join(', ');

	if (!location) {
		return 'No reliable location context is available. Do not assume local weather, stores, sizing, or cultural context unless the user provides it.';
	}

	return `User location context from request headers: ${location}. Use this only when it helps with climate, occasion, regional fashion language, or shopping context. Do not mention the location unless useful.`;
}

function trimForHistory(content: string) {
	const normalized = content.replace(/\s+/g, ' ').trim();

	if (normalized.length <= maxHistoryCharacters) {
		return normalized;
	}

	return `${normalized.slice(0, maxHistoryCharacters).trim()}...`;
}

function getHistoryContents(history: AskRequestBody['history']) {
	if (!Array.isArray(history)) {
		return [];
	}

	return history
		.filter(
			(message) =>
				(message.role === 'user' || message.role === 'assistant') &&
				typeof message.content === 'string' &&
				message.content.trim() &&
				message.content !== 'CLAi is thinking...'
		)
		.slice(-maxHistoryMessages)
		.map<GeminiContent>((message) => ({
			role: message.role === 'assistant' ? 'model' : 'user',
			parts: [
				{
					text: `${trimForHistory(message.content ?? '')}${
						message.hasImage
							? '\n[The user attached an outfit image in this turn. Use the prior text summary; the image itself is not resent.]'
							: ''
					}`,
				},
			],
		}));
}

export async function POST(request: Request) {
	const idToken = getBearerToken(request);
	const user = await requireAuthenticatedUser(request);

	if (!idToken || !user?.localId) {
		return NextResponse.json(
			{ error: 'Please log in to use Ask CLAi.' },
			{ status: 401 }
		);
	}

	let usage: Awaited<ReturnType<typeof getDailyMessageUsage>>;

	try {
		usage = await getDailyMessageUsage({
			idToken,
			uid: user.localId,
		});
	} catch {
		return NextResponse.json(
			{ error: 'Unable to check your daily message usage.' },
			{ status: 502 }
		);
	}

	if (usage.used >= usage.limit) {
		return NextResponse.json(
			{
				error: `You have used all ${usage.limit} CLAi messages for today.`,
				usage,
			},
			{ status: 429 }
		);
	}

	const apiKey = process.env.GEMINI_API_KEY;

	if (!apiKey) {
		return NextResponse.json(
			{ error: 'GEMINI_API_KEY is not configured.' },
			{ status: 500 }
		);
	}

	let body: AskRequestBody;

	try {
		body = (await request.json()) as AskRequestBody;
	} catch {
		return NextResponse.json(
			{ error: 'Invalid request body.' },
			{ status: 400 }
		);
	}

	const prompt = body.prompt?.trim();
	const context = body.context === 'stylist' ? 'stylist' : 'consumer';
	const image = body.image;
	const hasImage = Boolean(image?.data && image.mimeType);
	const historyContents = getHistoryContents(body.history);

	if (!prompt && !hasImage) {
		return NextResponse.json(
			{ error: 'Please enter a styling question or add an image.' },
			{ status: 400 }
		);
	}

	if (hasImage && !image?.mimeType?.startsWith('image/')) {
		return NextResponse.json(
			{ error: 'Please upload a valid image file.' },
			{ status: 400 }
		);
	}

	const parts: GeminiPart[] = [
		{
			text: `${contextInstructions[context]}\n\nUser request: ${
				prompt || 'Analyze this image and give me fashion advice.'
			}\n\n${
				hasImage ? `${imageAnalysisInstruction}\n\n` : ''
			}Regional context: ${getRegionalContext(request)}`,
		},
	];

	if (hasImage && image?.data && image.mimeType) {
		parts.unshift({
			inline_data: {
				mime_type: image.mimeType,
				data: image.data,
			},
		});
	}

	try {
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					contents: [
						...historyContents,
						{
							role: 'user',
							parts,
						},
					],
					generationConfig: {
						temperature: hasImage ? 0.45 : 0.65,
						maxOutputTokens: hasImage ? 1200 : 4096,
					},
				}),
			}
		);

		const data = (await response.json()) as GeminiResponse;

		if (!response.ok) {
			const message =
				data.error?.message ?? 'Unable to get a response from Gemini.';
			const isApiKeyBlocked = message.toLowerCase().includes('blocked');

			return NextResponse.json(
				{
					error: isApiKeyBlocked
						? 'The Gemini API key is blocked by its Google Cloud restrictions. Check that the key can access Gemini API / generativelanguage.googleapis.com.'
						: message,
				},
				{ status: response.status }
			);
		}

		const candidate = data.candidates?.[0];
		const answer = candidate?.content?.parts
			?.map((part) => part.text)
			.filter(Boolean)
			.join('\n')
			.trim();

		if (!answer || candidate?.finishReason === 'MAX_TOKENS') {
			return NextResponse.json(
				{
					error:
						candidate?.finishReason === 'MAX_TOKENS'
							? 'CLAi started a response but did not finish. Please try again.'
							: 'Gemini did not return a styling response.',
				},
				{ status: 502 }
			);
		}

		const nextUsage = await incrementDailyMessageUsage({
			idToken,
			uid: user.localId,
		});

		return NextResponse.json({ answer, usage: nextUsage });
	} catch {
		return NextResponse.json(
			{ error: 'Unable to reach Gemini. Please try again.' },
			{ status: 502 }
		);
	}
}
