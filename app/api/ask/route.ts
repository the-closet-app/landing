import { saveAskChatTurn } from '@/lib/chat-history-server';
import {
	getDailyMessageUsage,
	incrementDailyMessageUsage,
} from '@/lib/daily-usage-server';
import {
	getBearerToken,
	requireAuthenticatedUser,
} from '@/lib/firebase-auth-server';
import { noStoreJson } from '@/lib/no-store-response';
import {
	formatStyleProfileForPrompt,
	getServerStyleProfile,
} from '@/lib/style-profile-server';
import type { VisualIntent } from '@/lib/visual-intent';

type AskRequestBody = {
	prompt?: string;
	context?: 'consumer' | 'stylist';
	chatId?: string;
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

type GeminiIntent =
	| 'outfit_advice'
	| 'fashion_cleaning'
	| 'fashion_care'
	| 'fashion_repair'
	| 'fashion_alteration'
	| 'fashion_sustainability'
	| 'shopping_advice'
	| 'image_analysis'
	| 'style_follow_up'
	| 'other_fashion'
	| 'out_of_scope';

type GeminiRoutingResponse = {
	answer?: string;
	imageButtonLabel?: string;
	intent?: GeminiIntent;
	scope?: 'in_scope' | 'out_of_scope';
	shouldAskFollowUp?: boolean;
	shouldOfferImageGeneration?: boolean;
	suppressGenerateVisual?: boolean;
	visualIntent?: VisualIntent;
	visualPrompt?: string;
};

type NormalizedGeminiRoutingResponse = {
	answer: string;
	imageButtonLabel?: string;
	intent: GeminiIntent;
	scope: 'in_scope' | 'out_of_scope';
	shouldAskFollowUp: boolean;
	shouldOfferImageGeneration: boolean;
	suppressGenerateVisual: boolean;
	visualIntent: VisualIntent;
	visualPrompt?: string;
};

const contextInstructions = {
	consumer: `You are CLAi, a sharp personal stylist and fashion psychologist for modest fashion users across all genders. Your core behavior is: diagnose before you recommend. Give short, direct, confidence-building fashion advice that is practical and sustainability-aware.

Diagnose before you recommend:
- Read the situation first, then advise.
- For simple requests, ask at most one sharp clarifying question only if it would materially improve the answer, then give a useful answer.
- For significant requests such as weddings, interviews, Wimbledon, first dates, presentations, or high-stakes events, ask two to four high-leverage diagnostic questions before refining.
- Always offer a fast path: give a solid provisional answer now, then explain what detail would sharpen it.
- Never make the user answer questions before getting any value.
- Ask stylist-psychology questions when relevant: who they are dressing for, what they want people to read about them, and what the moment means.

Only answer fashion, styling, wardrobe, outfit, color, fit, shopping, occasion, garment-care, fabric-care, basic clothing repair, textile maintenance, alterations, sneaker care, or personal-style questions. If a request crosses fashion/textiles and another domain, answer only the fashion, garment, fabric, stitching, care, repair, or alteration part and briefly say you cannot advise on unrelated structural, medical, legal, or non-fashion parts. If the user asks about something entirely unrelated to fashion or textiles, respond briefly: "I am CLAi, I only give fashion advice."

Do not assume gender, race, ethnicity, size, body shape, religion, budget, age, culture, or location. If gender presentation would materially change the recommendation and the user has not provided it, ask lightly: "Are you dressing femme, masc, or somewhere in between for this?" Do not infer gender from skirts, tailoring, heels, or the topic alone. Avoid body-shaming, size assumptions, and comments that judge the user's body. Focus on garments, proportions, coverage, color, texture, occasion, comfort, confidence, and styling intention.

Do infer from hard evidence and common knowledge when it is useful: if the user gives a city, country, season, month, occasion, venue, or activity, use reasonable climate, cultural, dress-code, and practicality assumptions. Do not ask the user for information you can confidently infer, such as typical March weather in Morocco or likely walking needs for a city trip. If the exact detail is uncertain, state it as a useful assumption and ask only for confirmation when it would materially change the advice.

For image analysis, keep the response compact. Reference only visible outfit details, colors, fit, coverage, proportions, and styling opportunities. Do not over-explain. Prefer a concise structure such as: What works, What to change, Final look. Ask for budget only if the user clearly wants to buy something or after a bit of back-and-forth.`,
	stylist: `You are CLAi, a sharp stylist and fashion psychologist for professional fashion stylists, personal shoppers, and fashion creators working with modest fashion clients across all genders. Your core behavior is: diagnose before you recommend. Give polished, client-ready direction that is concise, practical, confidence-building, and sustainability-aware.

Diagnose before you recommend:
- Read the client brief first, then advise.
- For simple styling questions, ask at most one sharp clarifying question only if it would materially improve the answer, then give a useful answer.
- For significant client moments such as weddings, interviews, Wimbledon, first dates, presentations, campaign shoots, or high-stakes events, ask two to four high-leverage diagnostic questions before refining.
- Always offer a fast path: give a solid provisional direction now, then explain what detail would sharpen it.
- Never make the stylist answer questions before getting any value.
- Ask stylist-psychology questions when relevant: who the client is dressing for, what the client wants people to read about them, and what the moment means.

Only answer fashion, styling, wardrobe, outfit, color, fit, shopping, occasion, garment-care, fabric-care, basic clothing repair, textile maintenance, alterations, sneaker care, or personal-style questions. If a request crosses fashion/textiles and another domain, answer only the fashion, garment, fabric, stitching, care, repair, or alteration part and briefly say you cannot advise on unrelated structural, medical, legal, or non-fashion parts. If the user asks about something entirely unrelated to fashion or textiles, respond briefly: "I am CLAi, I only give fashion advice."

Do not assume gender, race, ethnicity, size, body shape, religion, budget, age, culture, or location. If gender presentation would materially change the recommendation and the user has not provided it, ask lightly: "Is the client dressing femme, masc, or somewhere in between for this?" Do not infer gender from skirts, tailoring, heels, or the topic alone. Avoid body-shaming, size assumptions, and comments that judge the client's body. Focus on garment behavior, coverage, silhouette, color story, texture, styling intention, occasion, client confidence, and repeatable wardrobe value.

Do infer from hard evidence and common knowledge when it is useful: if the brief gives a city, country, season, month, occasion, venue, or activity, use reasonable climate, cultural, dress-code, and practicality assumptions. Do not ask the stylist for information you can confidently infer, such as typical March weather in Morocco or likely walking needs for a city trip. If the exact detail is uncertain, state it as a useful assumption and ask only for confirmation when it would materially change the advice.

For image analysis, keep the response compact and professional. Reference only visible garment details, colors, fit, coverage, proportions, and styling opportunities. Prefer a concise structure such as: What works, What to change, Final look. Ask for budget only if the user clearly wants to buy something or after a bit of back-and-forth.`,
} as const;

const maxHistoryMessages = 24;
const maxHistoryCharacters = 1200;

const imageAnalysisInstruction = `Image response rules:
- Analyze the image as a modest-fashion styling assistant.
- Look only at visible fashion details: garments, colors, coverage, proportions, texture, layering, footwear, accessories, and occasion readiness.
- Do not comment on body size, attractiveness, weight, gender, religion, identity, or body shape.
- Do not assume the user's gender, race, ethnicity, body shape, budget, or identity.
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
Final look: one concise outfit direction.
Refinement questions: one or two short questions only if needed.`;

const allowedIntents = new Set<GeminiIntent>([
	'outfit_advice',
	'fashion_cleaning',
	'fashion_care',
	'fashion_repair',
	'fashion_alteration',
	'fashion_sustainability',
	'shopping_advice',
	'image_analysis',
	'style_follow_up',
	'other_fashion',
	'out_of_scope',
]);

const allowedVisualIntents = new Set<VisualIntent>([
	'outfit',
	'cleaning',
	'repair',
	'care',
	'alteration',
	'comparison',
]);

function getVisualIntentForGeminiIntent(intent: GeminiIntent): VisualIntent {
	switch (intent) {
		case 'fashion_cleaning':
			return 'cleaning';
		case 'fashion_repair':
			return 'repair';
		case 'fashion_care':
			return 'care';
		case 'fashion_alteration':
			return 'alteration';
		case 'shopping_advice':
			return 'comparison';
		case 'outfit_advice':
		case 'image_analysis':
		case 'style_follow_up':
		case 'other_fashion':
		case 'fashion_sustainability':
		case 'out_of_scope':
		default:
			return 'outfit';
	}
}

function stripJsonFence(value: string) {
	return value
		.trim()
		.replace(/^```(?:json)?\s*/i, '')
		.replace(/\s*```$/i, '')
		.trim();
}

function parseGeminiRoutingResponse(rawAnswer: string): GeminiRoutingResponse {
	const jsonText = stripJsonFence(rawAnswer);

	try {
		return JSON.parse(jsonText) as GeminiRoutingResponse;
	} catch {
		return {
			answer: rawAnswer,
			intent: 'other_fashion',
			scope: 'in_scope',
			shouldAskFollowUp: false,
			shouldOfferImageGeneration: false,
			suppressGenerateVisual: true,
		};
	}
}

function normalizeGeminiRoutingResponse({
	hasImage,
	response,
}: {
	hasImage: boolean;
	response: GeminiRoutingResponse;
}): NormalizedGeminiRoutingResponse {
	const scope =
		response.scope === 'out_of_scope' ? 'out_of_scope' : 'in_scope';
	const intent =
		response.intent && allowedIntents.has(response.intent)
			? response.intent
			: scope === 'out_of_scope'
				? 'out_of_scope'
				: hasImage
					? 'image_analysis'
					: 'other_fashion';
	const visualIntent =
		response.visualIntent && allowedVisualIntents.has(response.visualIntent)
			? response.visualIntent
			: getVisualIntentForGeminiIntent(intent);
	const answer =
		scope === 'out_of_scope'
			? 'I am CLAi, I only give fashion advice.'
			: (response.answer ?? '').trim();
	const isVisualSuppressedIntent =
		intent === 'shopping_advice' ||
		intent === 'fashion_sustainability' ||
		intent === 'out_of_scope';
	const isVisualFriendlyIntent =
		intent === 'outfit_advice' ||
		intent === 'image_analysis' ||
		intent === 'style_follow_up' ||
		intent === 'fashion_cleaning' ||
		intent === 'fashion_care' ||
		intent === 'fashion_repair' ||
		intent === 'fashion_alteration';
	const shouldOfferImageGeneration =
		scope === 'in_scope' &&
		(Boolean(response.shouldOfferImageGeneration) ||
			Boolean(response.visualPrompt) ||
			isVisualFriendlyIntent) &&
		!isVisualSuppressedIntent;
	const suppressGenerateVisual =
		scope === 'out_of_scope' ||
		Boolean(response.suppressGenerateVisual) ||
		!shouldOfferImageGeneration;

	return {
		answer,
		imageButtonLabel: response.imageButtonLabel?.trim() || undefined,
		intent,
		scope,
		shouldAskFollowUp: Boolean(response.shouldAskFollowUp),
		shouldOfferImageGeneration,
		suppressGenerateVisual,
		visualIntent,
		visualPrompt: response.visualPrompt?.trim() || undefined,
	};
}

function getGeminiRoutingPrompt({
	context,
	hasImage,
	prompt,
	regionalContext,
	styleProfileContext,
}: {
	context: 'consumer' | 'stylist';
	hasImage: boolean;
	prompt?: string;
	regionalContext: string;
	styleProfileContext: string;
}) {
	return `${contextInstructions[context]}

You are now responsible for understanding the user's intent from the current message, uploaded image when present, saved style profile, regional context, and the current chat history. The app should not need keyword rules to decide what the user means.

Return only valid JSON. Do not wrap it in markdown. Use this exact shape:
{
	"scope": "in_scope" | "out_of_scope",
	"intent": "outfit_advice" | "fashion_cleaning" | "fashion_care" | "fashion_repair" | "fashion_alteration" | "fashion_sustainability" | "shopping_advice" | "image_analysis" | "style_follow_up" | "other_fashion" | "out_of_scope",
	"answer": "natural user-facing answer",
	"shouldAskFollowUp": true | false,
	"shouldOfferImageGeneration": true | false,
	"suppressGenerateVisual": true | false,
	"visualIntent": "outfit" | "cleaning" | "repair" | "care" | "alteration" | "comparison",
	"imageButtonLabel": "short button label",
	"visualPrompt": "prompt for a fashion visual generator"
}

Scope rules:
- In scope: fashion styling, what to wear, packing, wardrobe decisions, modest fashion, color, fit, garment care, cleaning, repair, alterations, textile maintenance, sustainability, outfit-shopping guidance, and where/how to buy recommended fashion items.
- Out of scope only when the request is clearly unrelated to fashion, clothes, footwear, accessories, textiles, shopping for fashion items, care, repair, alterations, or a fashion follow-up from history.
- If the latest message is ambiguous but the chat history is fashion-related, treat it as a fashion follow-up and answer it.
- If out of scope, set answer exactly to: I am CLAi, I only give fashion advice.

Inference rules:
- Use hard evidence from the user request, chat history, style profile, uploaded image, regional headers, and general world knowledge.
- If the user gives a destination and month, infer typical seasonal conditions and style implications unless an exact live forecast is essential.
- If the user gives an occasion, infer likely dress-code pressure and social meaning, then ask only for missing details that materially affect the recommendation.
- Do not ask questions such as "what is the weather like there?" when the place and month give enough reliable context for provisional advice.
- Say "assuming..." when an inference is useful but not guaranteed.
- Never guess sensitive or personal identity details about the asker: race, ethnicity, body type, age, religion, or gender presentation. If gender presentation is needed and is not in the style profile or chat, ask lightly. Do not ask for race or ethnicity.

Intent guidance:
- Use shopping_advice when the user's primary ask is where to buy, find, source, shop for, compare retailers, get alternatives, find dupes, understand availability, or choose stores/brands for fashion items. Do not invent links.
- If the user asks for outfit recommendations within a budget, keep the intent as outfit_advice unless they explicitly ask where to buy/source/shop. Treat the budget as a styling constraint, not as shopping_advice.
- Use fashion_cleaning, fashion_care, fashion_repair, or fashion_alteration for garment, textile, footwear, stain, wash, suede, leather, stitching, patching, hemming, and maintenance questions.
- Use fashion_sustainability for reuse, circular fashion, ethical buying, wardrobe longevity, repairs over replacement, and lower-waste choices.
- Use image_analysis when an image is attached and the user asks about the image or outfit.
- Use outfit_advice for what-to-wear, packing, event, travel, wardrobe, styling, and occasion questions.

Diagnostic behavior:
${getDiagnosticQuestionBank()}
${getCurrentChatMemoryPolicy()}
${getFashionCareScopePolicy()}
${getScopeDiscretionPolicy()}
${getNeutralDefaultPolicy()}
${getCurrentRequestOverridePolicy(prompt)}

Answer format:
- Write the answer naturally. Do not use visible labels like "Quick read", "Fast path", or "One or two sharp questions".
- For significant outfit requests, use three natural paragraphs: quick read, useful provisional advice, then two to four sharp questions.
- For simple requests, ask 0-1 question only if the answer would materially change.
- For image requests, give the quick visual read first.
- For shopping/source requests, answer where/how to buy the items using search terms, store categories, retailer types, and practical filters. Do not repeat the full outfit advice unless needed. Ask for country, budget, new/secondhand, or preferred retailers only if needed.
- Keep answers concise. Do not write an essay.
- Do not use markdown bold.

Image generation metadata:
- shouldOfferImageGeneration should be true only when a visual would genuinely help the fashion advice and the user has not merely asked a shopping/source, sustainability-only, or out-of-scope question.
- Generated visuals should show recommended clothing/items only, not models or people.
- For outfit visuals, visualPrompt should describe a clean flat-lay or clothing-only recommendation image using the advised garments, footwear, accessories, season, and context.
- For budget-constrained outfit advice, visualPrompt must still be an outfit board. Do not describe stores, shopping pages, cleaning tools, care supplies, isolated footwear, or product maintenance imagery.
- For cleaning, care, repair, alteration, or comparison visuals, visualPrompt should describe a clear clothing-only instructional or comparison visual.
- Use visualIntent to match the visual type.
- imageButtonLabel should be short, such as "Generate look inspiration", "Generate cleaning visual", "Generate repair visual", "Generate care visual", "Generate alteration visual", or "Generate comparison visual".

${hasImage ? `${imageAnalysisInstruction}\n\n` : ''}
Saved style profile:
${styleProfileContext}

Regional context:
${regionalContext}

Current user request:
	${prompt || 'Analyze this image and give me fashion advice.'}`;
}

function getDiagnosticQuestionBank() {
	return `Diagnostic question bank:
Selection rule:
- Select only the most relevant few questions from these groups.
- Never ask every question or every group.
- Do not ask what the user already answered in the current request, style profile, image, or chat history.
- For simple requests, use at most one question from the bank.
- For significant requests, use two to four questions across the most relevant groups.
- For image requests, give the visual read first, then use one or two questions only if needed.

Occasion/context:
- What is the occasion, and how formal does it need to feel?
- Where are you going, and who will be there?

Desired impression:
- What do you want this look to say about you?
- Do you want to feel polished, relaxed, creative, authoritative, understated, or memorable?

Personal comfort:
- Anything you want to feel especially comfortable in?
- Anything you prefer to flatter, downplay, avoid, or make easier to move in?

Style identity:
- What kind of style feels most like you?
- Are you drawn to minimal, classic, soft, sharp, experimental, modest-neutral, femme, masc, or somewhere in between?

Budget/shopping:
- Are you trying to buy something, or style what you already own?
- If buying, what budget range feels comfortable?

Wardrobe ownership:
- Which pieces do you already have and want to use?
- Is there anything in your wardrobe you want CLAi to build around?

Weather/setting:
- What is the weather, season, time of day, or venue condition? Ask this only when it cannot be reasonably inferred from the location, date, season, or event details already provided.
- Will you be indoors, outdoors, walking, sitting, travelling, or photographed?

Modesty/presentation:
- What level of coverage or layering feels right for you?
- Are you dressing femme, masc, neutral, modest, or somewhere in between for this?
- Generated look images are clothing-only. Do not ask for gender, race, ethnicity, or body details before image generation.
- Ask about body type, fit notes, or comfort preferences only during the conversation when it materially improves the styling advice. Do not store these as part of the style profile.`;
}

function getCurrentChatMemoryPolicy() {
	return `Current-chat memory policy:
- Treat the previous messages in this same chat as active memory.
- If the user already answered gender presentation, budget, occasion, weather, style preference, wardrobe ownership, comfort preference, desired impression, dress code, or shopping intent earlier in this chat, use that answer and do not ask for it again.
- Do not repeat a diagnostic question unless the user gave a vague answer and the missing detail is still essential.
- If the current user message corrects, changes, or tests a profile detail, use the newest user message as the source of truth.
- Current-chat details override saved style profile details when they conflict.
- If the user asks "what if I am..." or "how about if I am..." with a gender or presentation, revise the fashion advice for that presentation immediately.
- Never keep using an older masc, femme, neutral, gender, budget, occasion, or weather assumption after the user gives a newer one.
- If a detail is available from the style profile and has not been contradicted in chat, use the style profile detail.
- If the user says "I already told you" or similar, acknowledge briefly and continue using the existing detail.`;
}

function getFashionCareScopePolicy() {
	return `Fashion care and repair scope:
- Treat garment repair, stitching, patching, hemming, fabric maintenance, sneaker cleaning, suede care, leather care, canvas care, mesh care, cashmere care, and basic alterations as fashion-related.
- If the user asks about a non-clothing textile item, answer only the textile, fabric, stitching, patching, or care part and avoid structural repair advice.
- For sneaker or material care, tailor advice to the material when known: leather, suede, mesh, canvas, knit, rubber, or mixed materials.
- If the material, stain type, or damage type is unknown and it would change the advice, ask one concise clarifying question while still giving a safe general starting point.
- Give practical warnings when needed, such as avoiding soaking suede, avoiding heat on delicate materials, testing products on a hidden area, and using specialist repair for expensive or delicate items.`;
}

function getScopeDiscretionPolicy() {
	return `Scope discretion:
- Before using the fashion-only boundary message, consider the current request together with the current chat history.
- If the latest user message is short, ambiguous, or uses references such as "these", "those", "this", "that", "them", "it", "the items", "the outfit", "the look", or "where can I buy", and the recent chat is about fashion, treat it as a fashion follow-up.
- For buying/source follow-ups, answer by using the most recent recommended garments, accessories, or outfit items from chat history.
- If exact stores are unknown, give useful search terms, store categories, brand/store types, and ask for country, budget, and preferred shopping style only if needed.
- Use the boundary message only when the user request is clearly unrelated to fashion, clothing, textiles, wardrobe, shopping for fashion items, styling, care, repair, or alterations after considering chat history.`;
}

function getNeutralDefaultPolicy() {
	return `Neutral-by-default policy:
- Do not assume gender, race, ethnicity, body type, size, budget, culture, age, religion, location, or style identity.
- Do infer practical context from hard evidence such as destination, month, season, venue, occasion, activity, garment photo, and stated constraints.
- Do not ask for general facts that can be reasonably inferred from hard evidence, such as typical weather for a known destination and month.
- Do not infer gender from garments, categories, or occasions. Skirts, heels, tailoring, modestwear, and suits do not prove gender.
- Do not infer race, ethnicity, budget, culture, age, body shape, or style identity from an uploaded image.
- If a missing detail would materially change the recommendation, ask one light clarifying question.
- If the missing detail does not materially change the recommendation, give neutral, flexible advice with options across presentations and contexts.
- Use language such as "person", "client", "user", "they", "outfit", "piece", and "look" until the user provides a more specific signal.
- Once the user provides a detail, use it and do not re-ask in the same chat.`;
}

function getCurrentRequestOverridePolicy(prompt?: string) {
	const request = prompt?.toLowerCase() ?? '';
	const presentationSignals = [
		{
			label: 'man / male presentation',
			pattern: /\b(man|male|masc|masculine)\b/i,
		},
		{
			label: 'woman / female presentation',
			pattern: /\b(woman|female|lady|femme|feminine)\b/i,
		},
		{
			label: 'neutral / non-binary presentation',
			pattern:
				/\b(neutral presentation|gender neutral|nonbinary|non-binary)\b/i,
		},
	].find(({ pattern }) => pattern.test(request));

	const overrideLines = [
		presentationSignals
			? `The current user message explicitly asks for ${presentationSignals.label}.`
			: null,
	].filter(Boolean);

	if (!overrideLines.length) {
		return `Current user message priority:
- The current user message is the newest source of truth.
- If it conflicts with earlier chat history or saved style profile details, follow the current user message.`;
	}

	return `Current user message priority:
- ${overrideLines.join('\n- ')}
- For this answer, use the current message details and do not use any older conflicting woman, man, femme, masc, neutral, saved-profile, or prior-chat details.
- Revise the previous fashion advice for the current details instead of repeating an older one.`;
}

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
		return noStoreJson(
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

	const apiKey = process.env.GEMINI_API_KEY;

	if (!apiKey) {
		return noStoreJson(
			{ error: 'GEMINI_API_KEY is not configured.' },
			{ status: 500 }
		);
	}

	let body: AskRequestBody;

	try {
		body = (await request.json()) as AskRequestBody;
	} catch {
		return noStoreJson({ error: 'Invalid request body.' }, { status: 400 });
	}

	const prompt = body.prompt?.trim();
	const context = body.context === 'stylist' ? 'stylist' : 'consumer';
	const chatId = body.chatId?.trim() || crypto.randomUUID();
	const image = body.image;
	const hasImage = Boolean(image?.data && image.mimeType);
	const historyContents = getHistoryContents(body.history);
	let styleProfileContext = formatStyleProfileForPrompt(null);

	if (!prompt && !hasImage) {
		return noStoreJson(
			{ error: 'Please enter a styling question or add an image.' },
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
		const styleProfile = await getServerStyleProfile({
			idToken,
			uid: user.localId,
		});
		styleProfileContext = formatStyleProfileForPrompt(styleProfile);
	} catch (error) {
		console.error(error);
	}

	const parts: GeminiPart[] = [
		{
			text: getGeminiRoutingPrompt({
				context,
				hasImage,
				prompt,
				regionalContext: getRegionalContext(request),
				styleProfileContext,
			}),
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
						temperature: hasImage ? 0.35 : 0.45,
						maxOutputTokens: hasImage ? 1600 : 2400,
						responseMimeType: 'application/json',
					},
				}),
			}
		);

		const data = (await response.json()) as GeminiResponse;

		if (!response.ok) {
			const message =
				data.error?.message ?? 'Unable to get a response from Gemini.';
			const isApiKeyBlocked = message.toLowerCase().includes('blocked');

			return noStoreJson(
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

		if (candidate?.finishReason === 'MAX_TOKENS') {
			return noStoreJson(
				{
					error: 'CLAi started a response but did not finish. Please try again.',
				},
				{ status: 502 }
			);
		}

		if (!answer) {
			return noStoreJson({
				answer: '',
				chatId,
				noTextResponse: true,
				scope: 'in_scope',
				intent: 'other_fashion',
				shouldAskFollowUp: false,
				shouldOfferImageGeneration: false,
				suppressGenerateVisual: true,
				visualIntent: 'outfit',
				usage,
			});
		}

		const routedAnswer = normalizeGeminiRoutingResponse({
			hasImage,
			response: parseGeminiRoutingResponse(answer),
		});

		if (!routedAnswer.answer) {
			return noStoreJson({
				answer: '',
				chatId,
				noTextResponse: true,
				scope: routedAnswer.scope,
				intent: routedAnswer.intent,
				shouldAskFollowUp: routedAnswer.shouldAskFollowUp,
				shouldOfferImageGeneration:
					routedAnswer.shouldOfferImageGeneration,
				suppressGenerateVisual: routedAnswer.suppressGenerateVisual,
				visualIntent: routedAnswer.visualIntent,
				usage,
			});
		}

		const nextUsage = await incrementDailyMessageUsage({
			idToken,
			uid: user.localId,
		});
		let chatSaved = true;
		let assistantMessageId: string | undefined;

		try {
			assistantMessageId = await saveAskChatTurn({
				answer: routedAnswer.answer,
				chatId,
				context,
				hasImage,
				idToken,
				imageMimeType: image?.mimeType,
				imageName: image?.name,
				prompt: prompt ?? '',
				uid: user.localId,
			});
		} catch (chatSaveError) {
			chatSaved = false;
			console.error(chatSaveError);
		}

		return noStoreJson({
			answer: routedAnswer.answer,
			chatId,
			chatSaved,
			assistantMessageId,
			imageButtonLabel: routedAnswer.imageButtonLabel,
			intent: routedAnswer.intent,
			scope: routedAnswer.scope,
			shouldAskFollowUp: routedAnswer.shouldAskFollowUp,
			shouldOfferImageGeneration: routedAnswer.shouldOfferImageGeneration,
			suppressGenerateVisual: routedAnswer.suppressGenerateVisual,
			usage: nextUsage,
			visualIntent: routedAnswer.visualIntent,
			visualPrompt: routedAnswer.visualPrompt,
		});
	} catch {
		return noStoreJson(
			{ error: 'Unable to reach Gemini. Please try again.' },
			{ status: 502 }
		);
	}
}
