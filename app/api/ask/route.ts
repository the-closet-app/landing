import { NextResponse } from 'next/server';

import { saveAskChatTurn } from '@/lib/chat-history-server';
import {
	getDailyMessageUsage,
	incrementDailyMessageUsage,
} from '@/lib/daily-usage-server';
import {
	getBearerToken,
	requireAuthenticatedUser,
} from '@/lib/firebase-auth-server';
import {
	formatStyleProfileForPrompt,
	getServerStyleProfile,
} from '@/lib/style-profile-server';

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

type RequestCategory =
	| 'greeting_request'
	| 'profile_detail_request'
	| 'simple_request'
	| 'significant_request'
	| 'image_based_request'
	| 'shopping_buying_request'
	| 'out_of_scope_request';

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

For image analysis, keep the response compact and professional. Reference only visible garment details, colors, fit, coverage, proportions, and styling opportunities. Prefer a concise structure such as: What works, What to change, Final look. Ask for budget only if the user clearly wants to buy something or after a bit of back-and-forth.`,
} as const;

const maxHistoryMessages = 24;
const maxHistoryCharacters = 1200;

const fashionSignals =
	/\b(style|styling|outfit|wear|wardrobe|clothes|clothing|fashion|dress|dressed|dressing|attire|garment|shirt|top|tops|blouse|trouser|trousers|pants|jeans|skirt|jacket|coat|blazer|shoe|shoes|trainer|trainers|sneaker|sneakers|boot|boots|heels|sandals|bag|accessor|jewelry|jewellery|color|colour|fit|fabric|textile|texture|layer|layers|modest|tailor|tailoring|alter|alteration|alterations|hem|hemming|sew|sewing|stitch|stitching|thread|needle|patch|patching|repair|mend|mending|tear|torn|rip|ripped|care|clean|cleaning|stain|stains|suede|leather|canvas|mesh|cashmere|sweater|jumper|occasion|look|looks|pack|packing|packed|swimwear|sleepwear|undergarments)\b/i;

const shoppingSignals =
	/\b(buy|purchase|shop|shopping|worth it|should i get|should i buy|where can i find|recommend.*(?:brand|store|piece|item)|budget|price|cost|afford|dupe|alternative)\b/i;

const significantSignals =
	/\b(wedding|interview|job interview|wimbledon|first date|date night|presentation|big presentation|speech|conference|gala|ceremony|funeral|graduation|photoshoot|photo shoot|campaign|client|meeting|important event|special occasion|black tie|formal|red carpet|launch event|networking)\b/i;

const simpleSignals =
	/\b(which|what|how|can|should|need)\b.*\b(go with|match|pair|style|wear|fix|repair|layer|pack|packing|clothes|clothing|outfit|look)\b/i;

const greetingSignals =
	/^(hi|hello|hey|hiya|good morning|good afternoon|good evening|yo|sup|what'?s up|how are you|howdy)[.!?\s]*$/i;

const profileAnswerSignals =
	/\b(i am|i'm|im|my gender|female|woman|lady|male|man|masc|femme|neutral presentation|gender neutral|nonbinary|non-binary|prefer not to say)\b/i;

const profileFashionFollowUpSignals =
	/\b(what if|how about|if i am|if i'm|if im|for a|as a)\b.*\b(woman|lady|female|man|male|femme|masc|neutral presentation|gender neutral|nonbinary|non-binary)\b/i;

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

function classifyRequest({
	hasImage,
	history,
	prompt,
}: {
	hasImage: boolean;
	history?: AskRequestBody['history'];
	prompt?: string;
}): RequestCategory {
	const request = prompt?.trim() ?? '';
	const recentAssistantMessages = Array.isArray(history)
		? [...history]
				.reverse()
				.filter(
					(message) =>
						message.role === 'assistant' &&
						typeof message.content === 'string'
				)
				.slice(0, 8)
				.map((message) => message.content ?? '')
		: [];
	const hasRecentProfileQuestion = recentAssistantMessages.some((message) =>
		message.includes('Before I generate a person wearing')
	);
	const isProfileCorrection =
		/\b(gender|presentation)\b/i.test(request) &&
		/\b(you asked|already told|i said|i am|i'm|im|prefer not to say)\b/i.test(
			request
		);
	const isAnsweringProfileQuestion =
		(hasRecentProfileQuestion || isProfileCorrection) &&
		profileAnswerSignals.test(request);
	const hasFashionHistory = recentAssistantMessages.some(
		(message) =>
			fashionSignals.test(message) ||
			message.includes('Generate look inspiration')
	);
	const isFashionProfileFollowUp =
		hasFashionHistory && profileFashionFollowUpSignals.test(request);

	if (hasImage) {
		return 'image_based_request';
	}

	if (greetingSignals.test(request)) {
		return 'greeting_request';
	}

	if (isAnsweringProfileQuestion) {
		return 'profile_detail_request';
	}

	if (isFashionProfileFollowUp) {
		return 'simple_request';
	}

	if (
		!request ||
		(!fashionSignals.test(request) && !simpleSignals.test(request))
	) {
		return 'out_of_scope_request';
	}

	if (shoppingSignals.test(request)) {
		return 'shopping_buying_request';
	}

	if (significantSignals.test(request)) {
		return 'significant_request';
	}

	return 'simple_request';
}

function getCategoryInstruction(category: RequestCategory) {
	switch (category) {
		case 'greeting_request':
			return `Request category: Greeting.
Behavior:
- Reply warmly and briefly as CLAi.
- Invite the user to ask a fashion, styling, wardrobe, outfit, color, fit, shopping, occasion, garment-care, or personal-style question.
- Do not use the out-of-scope boundary for greetings.
- Do not give a long explanation.`;
		case 'profile_detail_request':
			return `Request category: Profile detail answer.
Behavior:
- The user is answering an optional style profile question.
- Treat gender, style presentation, and "prefer not to say" answers as fashion-chat context, not out-of-scope.
- Acknowledge briefly that you have the detail.
- Do not apologize unless you previously contradicted the user.
- Do not repeat the same profile question.
- If another requested profile detail is still missing, ask only for that missing detail.
- If enough detail is available, continue with fashion advice.`;
		case 'image_based_request':
			return `Request category: Image-based request.
Behavior:
- Start with a compact visual read of the uploaded outfit or garment.
- Mention only visible fashion details.
- Ask one or two refinement questions only if context is missing and would materially improve the advice.
- Still give immediately useful advice in the same answer.`;
		case 'shopping_buying_request':
			return `Request category: Shopping/buying request.
Behavior:
- Help the user decide whether, what, or how to buy.
- Ask about budget only if it is needed for the buying decision and the user has not provided it.
- Prioritize practicality, repeat wear, wardrobe fit, and sustainability.
- Give clear buy / do not buy / consider instead criteria where appropriate.`;
		case 'significant_request':
			return `Request category: Significant request.
Behavior:
- Treat this as a higher-stakes moment where context and desired impression matter.
- Ask two to four sharp diagnostic questions before final refinement.
- Always include a solid provisional recommendation now.
- Prefer questions about occasion, setting, desired impression, presentation, constraints, and comfort.`;
		case 'out_of_scope_request':
			return `Request category: Out-of-scope request.
Behavior:
- If the request is not fashion-related, respond only: "I am CLAi, I only give fashion advice."
- Greetings are not out-of-scope requests; if the user is only greeting CLAi, greet them back and invite a fashion question.
- Do not answer the non-fashion request.
- Do not add styling advice, image-generation suggestions, or extra explanation.`;
		case 'simple_request':
		default:
			return `Request category: Simple request.
Behavior:
- Ask at most one sharp clarifying question only if it would materially improve the answer.
- Give a direct, useful answer immediately.
- Keep the response short and practical.`;
	}
}

function getDiagnosticQuestionPolicy(category: RequestCategory) {
	switch (category) {
		case 'greeting_request':
			return `Diagnostic question policy:
- Ask no diagnostic questions yet.
- Respond with a short greeting and invite a fashion question.`;
		case 'profile_detail_request':
			return `Diagnostic question policy:
- Do not ask broad diagnostic questions.
- Only ask for a missing styling detail if it is still needed for the fashion advice.
- Do not repeat details the user already provided in the current chat.`;
		case 'simple_request':
			return `Diagnostic question policy:
- Ask 0-1 clarifying question.
- Ask the question only if the missing detail would materially change the recommendation.
- Do not pause after asking. Give the answer in the same response.
- Keep the answer concise and practical.`;
		case 'significant_request':
			return `Diagnostic question policy:
- Ask 2-4 diagnostic questions because this is a higher-stakes styling moment.
- Include a fast-path provisional answer in the same response.
- Do not make the user answer before receiving a useful starting point.
- Questions should focus on occasion, setting, desired impression, presentation, comfort, constraints, weather, or dress code.
- Make the provisional answer clearly adjustable once the user replies.`;
		case 'image_based_request':
			return `Diagnostic question policy:
- First give a quick visual read based only on visible fashion details.
- Then ask 1-2 refinement questions only if needed.
- Still include immediately useful advice before asking refinement questions.
- If the image and user request already provide enough context, ask no questions.`;
		case 'shopping_buying_request':
			return `Diagnostic question policy:
- Ask only the buying questions needed to make a responsible recommendation.
- Ask budget only when it would materially change the advice and the user has not provided it.
- Give clear provisional buy / skip / consider instead guidance in the same response.`;
		case 'out_of_scope_request':
		default:
			return `Diagnostic question policy:
- Ask no diagnostic questions.
- Respond only with the fashion-only boundary message.`;
	}
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
- What is the weather, season, time of day, or venue condition?
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

function getAnswerFormatPolicy(category: RequestCategory) {
	switch (category) {
		case 'greeting_request':
			return `Answer format:
- One short greeting only.
- Invite the user to ask a fashion question.
- Do not use headings.`;
		case 'profile_detail_request':
			return `Answer format:
- One or two short sentences only.
- No headings, bullets, markdown bold, or long explanation.
- Do not add a generated-image description.
- Do not include the fashion-only boundary message.`;
		case 'out_of_scope_request':
			return `Answer format:
- Use only the exact sentence: "I am CLAi, I only give fashion advice."
- Do not use headings.`;
		case 'image_based_request':
			return `Answer format:
- Use the image response format when an image is attached.
- If refinement questions are needed, add them after the quick visual read.
- Do not wrap the answer in a long essay.`;
		case 'significant_request':
			return `Answer format:
Use a natural three-paragraph structure without visible section labels:
- Paragraph 1: a quick read of what CLAi understands so far.
- Paragraph 2: useful provisional advice the user can act on now.
- Paragraph 3: two to four sharp diagnostic questions, only the most relevant ones.
- Do not write labels such as "Quick read", "Fast path", "Sharp questions", or "Once you answer".
- Do not use markdown bold.`;
		case 'shopping_buying_request':
			return `Answer format:
Use a natural three-paragraph structure without visible section labels:
- Paragraph 1: a quick read of what CLAi understands about the buying decision.
- Paragraph 2: provisional buy / skip / consider instead guidance.
- Paragraph 3: one or two sharp buying questions only if needed, such as budget, use case, or wardrobe gap.
- Do not write labels such as "Quick read", "Fast path", "Sharp questions", or "Once you answer".
- Do not use markdown bold.`;
		case 'simple_request':
		default:
			return `Answer format:
- Keep the response short.
- Write naturally without visible section labels.
- Paragraph 1 should be a quick read only if it helps summarize the request.
- Paragraph 2 should give useful provisional advice.
- Paragraph 3 should ask one sharp clarifying question only if genuinely needed.
- Do not write labels such as "Quick read", "Fast path", "Sharp questions", or "Once you answer".
- Do not use markdown bold.`;
	}
}

function getNeutralDefaultPolicy() {
	return `Neutral-by-default policy:
- Do not assume gender, race, ethnicity, body type, size, budget, culture, age, religion, location, or style identity.
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
	const chatId = body.chatId?.trim() || crypto.randomUUID();
	const image = body.image;
	const hasImage = Boolean(image?.data && image.mimeType);
	const historyContents = getHistoryContents(body.history);
	const requestCategory = classifyRequest({
		hasImage,
		history: body.history,
		prompt,
	});
	let styleProfileContext = formatStyleProfileForPrompt(null);

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
			text: `${contextInstructions[context]}\n\nUser request: ${
				prompt || 'Analyze this image and give me fashion advice.'
			}\n\n${getCategoryInstruction(
				requestCategory
			)}\n\n${getDiagnosticQuestionPolicy(
				requestCategory
			)}\n\n${getAnswerFormatPolicy(
				requestCategory
			)}\n\n${getDiagnosticQuestionBank()}\n\n${getCurrentChatMemoryPolicy()}\n\n${getCurrentRequestOverridePolicy(
				prompt
			)}\n\n${getFashionCareScopePolicy()}\n\n${getNeutralDefaultPolicy()}\n\n${styleProfileContext}\n\n${
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

		if (candidate?.finishReason === 'MAX_TOKENS') {
			return NextResponse.json(
				{
					error: 'CLAi started a response but did not finish. Please try again.',
				},
				{ status: 502 }
			);
		}

		if (!answer) {
			return NextResponse.json({
				answer: '',
				chatId,
				noTextResponse: true,
				usage,
			});
		}

		const nextUsage = await incrementDailyMessageUsage({
			idToken,
			uid: user.localId,
		});
		let chatSaved = true;

		try {
			await saveAskChatTurn({
				answer,
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

		return NextResponse.json({
			answer,
			chatId,
			chatSaved,
			usage: nextUsage,
		});
	} catch {
		return NextResponse.json(
			{ error: 'Unable to reach Gemini. Please try again.' },
			{ status: 502 }
		);
	}
}
