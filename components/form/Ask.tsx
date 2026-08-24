'use client';

import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';

import { AuthModal } from '@/components/auth/AuthModal';
import { ClaiMark } from '@/components/icons/ClaiMark';
import { Upload } from '@/components/icons/Upload';
import { Mic } from '@/components/icons/Mic';
import { ThemeToggle } from '@/components/theme/ThemeProvider';
import { useToast } from '@/components/toast/ToastProvider';
import { getFirebaseAuth } from '@/lib/firebase';
import { classifyVisualIntent, type VisualIntent } from '@/lib/visual-intent';

const contextOptions = [
	{
		id: 'consumer',
		label: 'Consumer',
		prompts: [
			'How do I style a white shirt?',
			'What should I wear to a wedding?',
			'Help me style black wide-leg trousers.',
			'What colors work with olive green?',
			'Give me outfit ideas for a casual date.',
		],
	},
	{
		id: 'stylist',
		label: 'Stylist',
		prompts: [
			'Create a polished client look with a white shirt.',
			'Build a capsule wardrobe for a minimalist client.',
			'Suggest 3 editorial looks for a spring shoot.',
			'Style a client for a tech conference keynote.',
			'Pull color palettes for a warm autumn wardrobe.',
		],
	},
] as const;

type ContextOption = (typeof contextOptions)[number]['id'];

type SelectedImage = {
	data: string;
	mimeType: string;
	name: string;
	previewUrl: string;
};

type ChatMessage = {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	generatedImageUrl?: string;
	generatedVisualPrompt?: string;
	generatedVisualIntent?: VisualIntent;
	imageButtonLabel?: string;
	imageData?: string;
	imageMimeType?: string;
	imageName?: string;
	imagePreviewUrl?: string;
	suppressGenerateVisual?: boolean;
};

type SavedChatSummary = {
	id: string;
	context: ContextOption;
	lastMessage: string;
	updatedAt: string;
};

type SavedChatMessage = {
	id: string;
	content: string;
	createdAt: string;
	hasImage: boolean;
	imageMimeType?: string;
	imageName?: string;
	role: 'assistant' | 'user';
};

type ChatHistoryGroup = {
	label: string;
	chats: SavedChatSummary[];
};

type DailyUsage = {
	date: string;
	limit: number;
	remaining: number;
	used: number;
};

type BrowserSpeechRecognition = {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	start: () => void;
	stop: () => void;
	abort: () => void;
	onresult: ((event: SpeechRecognitionEventLike) => void) | null;
	onend: (() => void) | null;
	onerror: (() => void) | null;
};

type SpeechRecognitionEventLike = {
	resultIndex: number;
	results: ArrayLike<{
		isFinal?: boolean;
		0: {
			transcript: string;
		};
	}>;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
	interface Window {
		SpeechRecognition?: SpeechRecognitionConstructor;
		webkitSpeechRecognition?: SpeechRecognitionConstructor;
	}
}

const maxImageSize = 5 * 1024 * 1024;
const optimizedImageMaxSize = 1280;
const optimizedImageQuality = 0.82;
const maxChatHistoryMessages = 24;
const supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const suedeContextPattern =
	/\b(shoe|shoes|sneaker|sneakers|trainer|trainers|boot|boots|loafer|loafers|bag|bags|jacket|jackets|coat|coats|skirt|skirts|trouser|trousers|pants|dress|dresses|fabric|material|leather|clean|cleaning|stain|stains|brush|brushes)\b/i;

function subscribeToClient() {
	return () => {};
}

function getClientSnapshot() {
	return true;
}

function getServerSnapshot() {
	return false;
}

function applyFashionTranscriptCorrections(transcript: string) {
	if (!suedeContextPattern.test(transcript)) {
		return transcript;
	}

	return transcript.replace(/\bsweet\b/gi, (match) =>
		match[0] === match[0].toUpperCase() ? 'Suede' : 'suede'
	);
}

function loadImage(dataUrl: string) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = document.createElement('img');

		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error('Unable to load image.'));
		image.src = dataUrl;
	});
}

async function optimizeImage(file: File): Promise<SelectedImage> {
	const sourceDataUrl = await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			if (typeof reader.result !== 'string') {
				reject(new Error('Unable to read image.'));
				return;
			}

			resolve(reader.result);
		};
		reader.onerror = () => reject(new Error('Unable to read image.'));
		reader.readAsDataURL(file);
	});
	const image = await loadImage(sourceDataUrl);
	const scale = Math.min(
		1,
		optimizedImageMaxSize / Math.max(image.width, image.height)
	);
	const width = Math.max(1, Math.round(image.width * scale));
	const height = Math.max(1, Math.round(image.height * scale));
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');

	if (!context) {
		throw new Error('Unable to optimize image.');
	}

	canvas.width = width;
	canvas.height = height;
	context.drawImage(image, 0, 0, width, height);

	const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
	const optimizedDataUrl = canvas.toDataURL(
		mimeType,
		mimeType === 'image/jpeg' ? optimizedImageQuality : undefined
	);
	const base64Data = optimizedDataUrl.split(',')[1];

	if (!base64Data) {
		throw new Error('Unable to optimize image.');
	}

	return {
		data: base64Data,
		mimeType,
		name: file.name,
		previewUrl: optimizedDataUrl,
	};
}

function getChatHistory(messages: ChatMessage[]) {
	return messages
		.filter(
			(message) =>
				message.content &&
				message.content !== 'CLAi is thinking...' &&
				!message.generatedImageUrl
		)
		.slice(-maxChatHistoryMessages)
		.map((message) => ({
			content: message.content,
			hasImage: Boolean(message.imagePreviewUrl),
			role: message.role,
		}));
}

function isOnlyOutOfScopeFashionResponse(content: string) {
	return (
		content
			.replaceAll('*', '')
			.replace(/\s+/g, ' ')
			.trim()
			.toLowerCase() === 'i am clai, i only give fashion advice.'
	);
}

function formatHistoryDate(dateString: string) {
	const date = new Date(dateString);

	if (Number.isNaN(date.getTime())) {
		return 'Earlier';
	}

	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
	}).format(date);
}

function formatHistoryTime(dateString: string) {
	const date = new Date(dateString);

	if (Number.isNaN(date.getTime())) {
		return '';
	}

	return new Intl.DateTimeFormat(undefined, {
		hour: 'numeric',
		minute: '2-digit',
	}).format(date);
}

function groupChatsByDate(chats: SavedChatSummary[]): ChatHistoryGroup[] {
	const groups = new Map<string, SavedChatSummary[]>();

	chats.forEach((chat) => {
		const label = formatHistoryDate(chat.updatedAt);
		const group = groups.get(label) ?? [];
		group.push(chat);
		groups.set(label, group);
	});

	return Array.from(groups.entries()).map(
		([label, groupedChats]) =>
			({
				chats: groupedChats,
				label,
			}) satisfies ChatHistoryGroup
	);
}

function getGenerateVisualLabel(intent: VisualIntent, isLoading: boolean) {
	const labels: Record<VisualIntent, { idle: string; loading: string }> = {
		alteration: {
			idle: 'Generate alteration visual',
			loading: 'Generating alteration visual...',
		},
		care: {
			idle: 'Generate care visual',
			loading: 'Generating care visual...',
		},
		cleaning: {
			idle: 'Generate cleaning visual',
			loading: 'Generating cleaning visual...',
		},
		comparison: {
			idle: 'Generate comparison visual',
			loading: 'Generating comparison visual...',
		},
		outfit: {
			idle: 'Generate look inspiration',
			loading: 'Generating look...',
		},
		repair: {
			idle: 'Generate repair visual',
			loading: 'Generating repair visual...',
		},
	};

	return isLoading ? labels[intent].loading : labels[intent].idle;
}

function shouldAutoGenerateVisual(prompt: string) {
	return /\b(generate|create|make|show|visuali[sz]e|draw|render)\b.*\b(image|visual|picture|illustration|look|outfit|guide|steps?|process|before.?after)\b/i.test(
		prompt
	);
}

function isShoppingSourcePrompt(prompt: string) {
	return /\b(where|which|what|how)\b.*\b(buy|find|get|order|source|shop|store|stores|brand|brands|retailer|retailers|link|links|price|cost|budget|available|similar|alternative|dupe)\b|\b(?:buy|find|get|order|source|shop)\b.*\b(?:this|that|these|those|them|items?|pieces?|look|outfit|clothes|clothing|wears?)\b|\b(?:this|that|these|those|them|items?|pieces?|look|outfit|clothes|clothing|wears?)\b.*\b(?:buy|find|get|order|source|shop|store|stores|brand|brands|retailer|retailers|link|links|price|cost|available|similar|alternative|dupe)\b/i.test(
		prompt
	);
}

type AskProps = {
	variant?: 'dark' | 'light';
};

export function Ask({ variant = 'dark' }: AskProps) {
	const toast = useToast();
	const isLight = variant === 'light';
	const [activeContext, setActiveContext] =
		useState<ContextOption>('consumer');
	const activeOption =
		contextOptions.find((option) => option.id === activeContext) ??
		contextOptions[0];
	const activePrompts = activeOption.prompts;
	const [promptIndex, setPromptIndex] = useState(0);
	const [characterIndex, setCharacterIndex] = useState(0);
	const [isDeleting, setIsDeleting] = useState(false);
	const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');
	const [promptValue, setPromptValue] = useState('');
	const [isPromptFocused, setIsPromptFocused] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const [isSpeechSupported, setIsSpeechSupported] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	const [isHistoryLoading, setIsHistoryLoading] = useState(false);
	const [historyError, setHistoryError] = useState('');
	const [chatHistory, setChatHistory] = useState<SavedChatSummary[]>([]);
	const [loadingChatId, setLoadingChatId] = useState<string | null>(null);
	const [generatingLookForMessageId, setGeneratingLookForMessageId] =
		useState<string | null>(null);
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [chatId, setChatId] = useState<string | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [user, setUser] = useState<User | null>(null);
	const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
	const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
		null
	);
	const hasNoCredits = dailyUsage ? dailyUsage.remaining <= 0 : false;
	const hasStartedChat = messages.length > 0;
	const imageInputRef = useRef<HTMLInputElement | null>(null);
	const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
	const chatScrollRef = useRef<HTMLDivElement | null>(null);
	const transcriptBaseRef = useRef('');
	const overlayPlaceholder =
		isListening && !promptValue
			? 'CLAi is listening...'
			: hasStartedChat
				? 'Ask a follow-up...'
				: animatedPlaceholder;
	const isMounted = useSyncExternalStore(
		subscribeToClient,
		getClientSnapshot,
		getServerSnapshot
	);

	useEffect(() => {
		return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
			setUser(nextUser);

			if (!nextUser) {
				setDailyUsage(null);
			}
		});
	}, []);

	useEffect(() => {
		if (!user) {
			return;
		}

		let isActive = true;
		const currentUser = user;

		async function loadDailyUsage() {
			try {
				const idToken = await currentUser.getIdToken();
				const response = await fetch('/api/usage', {
					headers: {
						Authorization: `Bearer ${idToken}`,
					},
				});
				const data = (await response.json()) as
					| DailyUsage
					| { error?: string };

				if (response.ok && isActive) {
					setDailyUsage(data as DailyUsage);
				}
			} catch {
				if (isActive) {
					setDailyUsage(null);
				}
			}
		}

		void loadDailyUsage();

		return () => {
			isActive = false;
		};
	}, [user]);

	useEffect(() => {
		const recognitionConstructor =
			window.SpeechRecognition ?? window.webkitSpeechRecognition;

		if (!recognitionConstructor) {
			return;
		}

		const recognition = new recognitionConstructor();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = 'en-US';

		recognition.onresult = (event) => {
			let nextTranscript = transcriptBaseRef.current;
			let interimTranscript = '';

			for (
				let index = event.resultIndex;
				index < event.results.length;
				index += 1
			) {
				const result = event.results[index];
				const transcript = result[0]?.transcript ?? '';

				if (result.isFinal) {
					nextTranscript += `${transcript} `;
					transcriptBaseRef.current = nextTranscript;
				} else {
					interimTranscript += transcript;
				}
			}

			setPromptValue(
				applyFashionTranscriptCorrections(
					`${transcriptBaseRef.current}${interimTranscript}`.trim()
				)
			);
		};

		recognition.onend = () => {
			setIsListening(false);
			transcriptBaseRef.current = '';
		};

		recognition.onerror = () => {
			setIsListening(false);
			transcriptBaseRef.current = '';
		};

		recognitionRef.current = recognition;
		setTimeout(() => {
			setIsSpeechSupported(true);
		}, 0);

		return () => {
			recognition.abort();
			recognitionRef.current = null;
		};
	}, []);

	useEffect(() => {
		if (hasStartedChat || isPromptFocused || promptValue) {
			return;
		}

		const prompt = activePrompts[promptIndex];

		if (!prompt) {
			return;
		}

		const timeout = window.setTimeout(
			() => {
				if (!isDeleting && characterIndex <= prompt.length) {
					setAnimatedPlaceholder(prompt.slice(0, characterIndex));
					setCharacterIndex((currentIndex) => currentIndex + 1);
					return;
				}

				if (!isDeleting) {
					setIsDeleting(true);
					return;
				}

				if (characterIndex >= 0) {
					setAnimatedPlaceholder(prompt.slice(0, characterIndex));
					setCharacterIndex((currentIndex) => currentIndex - 1);
					return;
				}

				setIsDeleting(false);
				setPromptIndex(
					(currentIndex) => (currentIndex + 1) % activePrompts.length
				);
				setCharacterIndex(0);
			},
			!isDeleting && characterIndex > prompt.length
				? 2200
				: isDeleting
					? 42
					: 78
		);

		return () => window.clearTimeout(timeout);
	}, [
		activePrompts,
		characterIndex,
		hasStartedChat,
		isDeleting,
		isPromptFocused,
		promptIndex,
		promptValue,
	]);

	useEffect(() => {
		if (!isChatOpen) {
			return;
		}

		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		return () => {
			document.body.style.overflow = originalOverflow;
		};
	}, [isChatOpen]);

	useEffect(() => {
		if (!isChatOpen) {
			return;
		}

		const scrollContainer = chatScrollRef.current;

		if (!scrollContainer) {
			return;
		}

		requestAnimationFrame(() => {
			scrollContainer.scrollTo({
				behavior: 'smooth',
				top: scrollContainer.scrollHeight,
			});
		});
	}, [generatingLookForMessageId, isChatOpen, messages]);

	useEffect(() => {
		if (!isHistoryOpen || !user) {
			return;
		}

		let isCurrent = true;
		const authenticatedUser = user;

		async function loadHistory() {
			setIsHistoryLoading(true);
			setHistoryError('');

			try {
				const idToken = await authenticatedUser.getIdToken();
				const response = await fetch('/api/chat-history', {
					headers: {
						Authorization: `Bearer ${idToken}`,
					},
				});
				const data = (await response.json()) as {
					chats?: SavedChatSummary[];
					error?: string;
				};

				if (!response.ok) {
					throw new Error(
						data.error ?? 'Unable to load chat history.'
					);
				}

				if (isCurrent) {
					setChatHistory(data.chats ?? []);
				}
			} catch (error) {
				if (isCurrent) {
					setHistoryError(
						error instanceof Error
							? error.message
							: 'Unable to load chat history.'
					);
				}
			} finally {
				if (isCurrent) {
					setIsHistoryLoading(false);
				}
			}
		}

		void loadHistory();

		return () => {
			isCurrent = false;
		};
	}, [isHistoryOpen, user]);

	function handleContextChange(context: ContextOption) {
		recognitionRef.current?.stop();
		setActiveContext(context);
		setPromptIndex(0);
		setCharacterIndex(0);
		setIsDeleting(false);
		setAnimatedPlaceholder('');
		setPromptValue('');
		setIsPromptFocused(false);
	}

	function handlePromptBlur() {
		setIsPromptFocused(false);

		if (!promptValue) {
			setPromptIndex(0);
			setCharacterIndex(0);
			setIsDeleting(false);
			setAnimatedPlaceholder('');
		}
	}

	function handleSpeechToggle() {
		if (!recognitionRef.current) {
			return;
		}

		if (isListening) {
			recognitionRef.current.stop();
			return;
		}

		setIsPromptFocused(true);
		transcriptBaseRef.current = promptValue ? `${promptValue.trim()} ` : '';
		setIsListening(true);
		recognitionRef.current.start();
	}

	function handleImageButtonClick() {
		imageInputRef.current?.click();
	}

	function handleImageRemove() {
		setSelectedImage(null);

		if (imageInputRef.current) {
			imageInputRef.current.value = '';
		}
	}

	function handlePromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
		if (
			event.key !== 'Enter' ||
			event.shiftKey ||
			event.nativeEvent.isComposing
		) {
			return;
		}

		event.preventDefault();
		event.currentTarget.form?.requestSubmit();
	}

	async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];

		if (!file) {
			return;
		}

		if (!supportedImageTypes.includes(file.type)) {
			toast.error('Upload a JPG, PNG, or WebP image.');
			event.target.value = '';
			return;
		}

		if (file.size > maxImageSize) {
			toast.error(
				'Image upload limit is 5MB. Please choose a smaller image.'
			);
			event.target.value = '';
			return;
		}

		try {
			const image = await optimizeImage(file);
			setSelectedImage(image);
			toast.success('Image added.');
		} catch {
			toast.error('CLAi could not read that image.');
			event.target.value = '';
		}
	}

	function handleChatClose() {
		recognitionRef.current?.stop();
		setIsChatOpen(false);
		setChatId(null);
		setMessages([]);
		setPromptValue('');
		handleImageRemove();
	}

	function handleHistoryOpen() {
		if (!user) {
			toast.info('Please log in to view chat history.');
			setIsAuthModalOpen(true);
			return;
		}

		setIsHistoryOpen(true);
	}

	async function handleSavedChatOpen(chat: SavedChatSummary) {
		if (!user) {
			toast.info('Please log in to view chat history.');
			setIsAuthModalOpen(true);
			return;
		}

		setLoadingChatId(chat.id);

		try {
			const idToken = await user.getIdToken();
			const response = await fetch(
				`/api/chat-history/${encodeURIComponent(chat.id)}`,
				{
					headers: {
						Authorization: `Bearer ${idToken}`,
					},
				}
			);
			const data = (await response.json()) as {
				chatId?: string;
				error?: string;
				messages?: SavedChatMessage[];
			};

			if (!response.ok) {
				throw new Error(data.error ?? 'Unable to open this chat.');
			}

			setActiveContext(chat.context);
			setChatId(data.chatId ?? chat.id);
			setMessages(
				(data.messages ?? []).map((message) => ({
					content: message.content,
					id: message.id,
					imageMimeType: message.imageMimeType,
					imageName: message.imageName,
					role: message.role,
					suppressGenerateVisual:
						message.role === 'assistant' &&
						message.content.startsWith(
							'Before I generate a person wearing the look'
						),
				}))
			);
			setPromptValue('');
			handleImageRemove();
			setIsHistoryOpen(false);
			setIsChatOpen(true);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Unable to open this chat.'
			);
		} finally {
			setLoadingChatId(null);
		}
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const prompt = promptValue.trim();
		const outgoingImage = selectedImage;

		if (!prompt && !outgoingImage) {
			toast.info('Ask CLAi a styling question first.');
			return;
		}

		if (!user) {
			recognitionRef.current?.stop();
			toast.info('Please log in to use Ask CLAi.');
			setIsAuthModalOpen(true);
			return;
		}

		recognitionRef.current?.stop();
		setIsSubmitting(true);
		setIsChatOpen(true);
		const activeChatId = chatId ?? crypto.randomUUID();
		setChatId(activeChatId);
		const history = getChatHistory(messages);

		const userMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: 'user',
			content: prompt || 'Analyze this image.',
			imageData: outgoingImage?.data,
			imageMimeType: outgoingImage?.mimeType,
			imageName: outgoingImage?.name,
			imagePreviewUrl: outgoingImage?.previewUrl,
		};
		const assistantMessageId = crypto.randomUUID();

		setMessages((currentMessages) => [
			...currentMessages,
			userMessage,
			{
				id: assistantMessageId,
				role: 'assistant',
				content: 'CLAi is thinking...',
			},
		]);
		setPromptValue('');
		setSelectedImage(null);

		if (imageInputRef.current) {
			imageInputRef.current.value = '';
		}

		try {
			const idToken = await user.getIdToken();
			const response = await fetch('/api/ask', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${idToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					chatId: activeChatId,
					context: activeContext,
					history,
					image: outgoingImage
						? {
								data: outgoingImage.data,
								mimeType: outgoingImage.mimeType,
								name: outgoingImage.name,
							}
						: undefined,
					prompt,
				}),
			});

			const data = (await response.json()) as {
				answer?: string;
				chatId?: string;
				chatSaved?: boolean;
				error?: string;
				imageButtonLabel?: string;
				intent?: string;
				scope?: 'in_scope' | 'out_of_scope';
				shouldOfferImageGeneration?: boolean;
				suppressGenerateVisual?: boolean;
				usage?: DailyUsage;
				visualIntent?: VisualIntent;
				visualPrompt?: string;
			};

			if (data.usage) {
				setDailyUsage(data.usage);
			}

			if (!response.ok) {
				throw new Error(
					data.error ?? 'CLAi could not answer right now.'
				);
			}

			setMessages((currentMessages) =>
				currentMessages.map((message) =>
					message.id === assistantMessageId
						? {
								...message,
								content: data.answer ?? '',
								generatedVisualIntent: data.visualIntent,
								generatedVisualPrompt: data.visualPrompt,
								imageButtonLabel: data.imageButtonLabel,
								suppressGenerateVisual:
									data.suppressGenerateVisual ||
									!data.shouldOfferImageGeneration ||
									data.scope === 'out_of_scope',
							}
						: message
				)
			);

			if (data.chatId) {
				setChatId(data.chatId);
			}

			if (
				data.answer &&
				data.shouldOfferImageGeneration &&
				!data.suppressGenerateVisual &&
				shouldAutoGenerateVisual(prompt) &&
				(!data.usage || data.usage.remaining > 0)
			) {
				const visualIntent =
					data.visualIntent ?? classifyVisualIntent(prompt);

				setGeneratingLookForMessageId(assistantMessageId);

				try {
					const visualResponse = await fetch('/api/generate-look', {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${idToken}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							advice: data.answer,
							context: activeContext,
							image: outgoingImage
								? {
										data: outgoingImage.data,
										mimeType: outgoingImage.mimeType,
										name: outgoingImage.name,
									}
								: undefined,
							prompt: data.visualPrompt ?? prompt,
							visualIntent,
						}),
					});
					const visualData = (await visualResponse.json()) as {
						error?: string;
						imageUrl?: string;
						usage?: DailyUsage;
						visualIntent?: VisualIntent;
					};

					if (visualData.usage) {
						setDailyUsage(visualData.usage);
					}

					if (!visualResponse.ok || !visualData.imageUrl) {
						throw new Error(
							visualData.error ??
								'CLAi could not generate an image right now.'
						);
					}

					setMessages((currentMessages) =>
						currentMessages.map((message) =>
							message.id === assistantMessageId
								? {
										...message,
										generatedImageUrl: visualData.imageUrl,
										generatedVisualIntent:
											visualData.visualIntent ??
											visualIntent,
									}
								: message
						)
					);
				} catch (visualError) {
					toast.error(
						visualError instanceof Error
							? visualError.message
							: 'CLAi could not generate an image right now.'
					);
				} finally {
					setGeneratingLookForMessageId(null);
				}
			}
		} catch (submitError) {
			const message =
				submitError instanceof Error
					? submitError.message
					: 'CLAi could not answer right now.';

			toast.error(message);
			setMessages((currentMessages) =>
				currentMessages.map((chatMessage) =>
					chatMessage.id === assistantMessageId
						? {
								...chatMessage,
								content: message,
							}
						: chatMessage
				)
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleGenerateLook(messageId: string) {
		if (!user) {
			toast.info('Please log in to generate a look inspiration image.');
			setIsAuthModalOpen(true);
			return;
		}

		if (hasNoCredits) {
			toast.info(
				`You have used all ${dailyUsage?.limit ?? 20} CLAi messages for today.`
			);
			return;
		}

		const assistantIndex = messages.findIndex(
			(message) =>
				message.id === messageId && message.role === 'assistant'
		);
		const assistantMessage = messages[assistantIndex];
		const userMessage = messages
			.slice(0, assistantIndex)
			.reverse()
			.find((message) => message.role === 'user');
		const visualIntent =
			assistantMessage?.generatedVisualIntent ??
			classifyVisualIntent(userMessage?.content ?? '');

		if (
			!assistantMessage ||
			assistantMessage.content === 'CLAi is thinking...'
		) {
			return;
		}

		setGeneratingLookForMessageId(messageId);

		try {
			const idToken = await user.getIdToken();
			const response = await fetch('/api/generate-look', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${idToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					advice: assistantMessage.content,
					context: activeContext,
					image:
						userMessage?.imageData && userMessage.imageMimeType
							? {
									data: userMessage.imageData,
									mimeType: userMessage.imageMimeType,
									name: userMessage.imageName,
								}
							: undefined,
					prompt:
						assistantMessage.generatedVisualPrompt ??
						userMessage?.content,
					visualIntent,
				}),
			});
			const data = (await response.json()) as {
				error?: string;
				imageUrl?: string;
				usage?: DailyUsage;
				visualIntent?: VisualIntent;
			};

			if (data.usage) {
				setDailyUsage(data.usage);
			}

			if (!response.ok || !data.imageUrl) {
				throw new Error(
					data.error ?? 'CLAi could not generate an image right now.'
				);
			}

			setMessages((currentMessages) =>
				currentMessages.map((message) =>
					message.id === messageId
						? {
								...message,
								generatedImageUrl: data.imageUrl,
								generatedVisualIntent:
									data.visualIntent ?? visualIntent,
							}
						: message
				)
			);
		} catch (generateError) {
			toast.error(
				generateError instanceof Error
					? generateError.message
					: 'CLAi could not generate an image right now.'
			);
		} finally {
			setGeneratingLookForMessageId(null);
		}
	}

	function renderComposer(isOverlay: boolean) {
		const useLightComposer = true;
		const formClassName = isOverlay
			? useLightComposer
				? 'mx-auto mt-auto flex w-[min(94vw,920px)] shrink-0 flex-col justify-between gap-4 rounded-[28px] border border-white/70 bg-white px-4 py-4 text-left shadow-[0_22px_70px_rgba(75,116,178,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] sm:gap-5 sm:rounded-[34px] sm:px-5 sm:py-5'
				: 'mx-auto mt-auto flex w-[min(94vw,920px)] shrink-0 flex-col justify-between gap-4 rounded-[28px] border border-white/70 bg-white px-4 py-4 text-left shadow-[0_22px_70px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.9)] sm:gap-5 sm:rounded-[34px] sm:px-5 sm:py-5'
			: useLightComposer
				? 'flex min-h-[180px] w-full flex-col justify-between gap-4 rounded-[26px] border border-white/70 bg-white px-4 py-4 text-left shadow-[0_22px_70px_rgba(75,116,178,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] sm:min-h-[180px] sm:gap-5 sm:rounded-[34px] sm:px-6 sm:py-6'
				: 'flex min-h-[180px] w-full flex-col justify-between gap-4 rounded-[26px] border border-white/70 bg-white px-4 py-4 text-left shadow-[0_22px_70px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.9)] sm:min-h-[180px] sm:gap-5 sm:rounded-[34px] sm:px-6 sm:py-6';
		const placeholderClassName = useLightComposer
			? 'pointer-events-none absolute left-0 top-0 pr-2 text-base font-medium leading-relaxed tracking-[-.02em] text-[#1C1C1C]/35 sm:text-[1.1rem]'
			: 'pointer-events-none absolute left-0 top-0 pr-2 text-base font-medium leading-relaxed tracking-[-.02em] text-white/45 sm:text-[1.1rem]';
		const textareaClassName = useLightComposer
			? 'w-full resize-none bg-transparent text-base font-medium leading-[1.3] tracking-[-.02em] text-[#1C1C1C]/80 outline-none placeholder:text-[#1C1C1C]/35 sm:text-[1.1rem]'
			: 'w-full resize-none bg-transparent text-base font-medium leading-[1.3] tracking-[-.02em] text-[white]/75 outline-none placeholder:text-white/45 sm:text-[1.1rem]';
		const iconButtonClassName = useLightComposer
			? 'grid size-11 place-items-center rounded-full border border-[#1C1C1C]/10 bg-white text-[#1C1C1C] shadow-[0_12px_28px_rgba(75,116,178,0.10)] transition hover:bg-[#F7F7F7] focus:outline-none sm:size-12'
			: 'shadow-[0_20px_70px_rgba(255,111,24,0.05),inset_0_1px_0_rgba(255,255,255,0.08)] grid size-11 place-items-center rounded-full bg-white/10 transition focus:outline-none sm:size-12';

		return (
			<>
				<form className={formClassName} onSubmit={handleSubmit}>
					<div className="flex min-w-0 items-start gap-3 px-1 py-1 sm:gap-5 sm:px-2">
						<ClaiMark
							className={`mt-[0.2rem] h-5 w-[22px] shrink-0 sm:h-6 sm:w-[26px] ${
								useLightComposer
									? 'text-[#F47016]'
									: 'text-[#787878]'
							}`}
						/>
						<label className="sr-only" htmlFor="ask-clai-prompt">
							Ask CLAi prompt for {activeOption.label}
						</label>
						<div className="relative min-w-0 flex-1">
							{!promptValue &&
							(hasStartedChat ||
								!isPromptFocused ||
								isListening) ? (
								<p
									className={placeholderClassName}
									aria-hidden="true"
								>
									{overlayPlaceholder}
									{isListening || !hasStartedChat ? (
										<span
											className={`ml-0.5 animate-pulse ${
												useLightComposer
													? 'text-[#1C1C1C]/40'
													: 'text-white/55'
											}`}
										>
											_
										</span>
									) : null}
								</p>
							) : null}
							<textarea
								id="ask-clai-prompt"
								value={promptValue}
								onFocus={() => setIsPromptFocused(true)}
								onBlur={handlePromptBlur}
								onKeyDown={handlePromptKeyDown}
								onChange={(event) =>
									setPromptValue(event.target.value)
								}
								key={activeOption.id}
								rows={isOverlay ? 1 : 2}
								className={textareaClassName}
							/>
						</div>
					</div>
					<div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap sm:justify-between sm:gap-3">
						<div className="flex min-w-0 flex-1 items-center">
							{selectedImage ? (
								<div className="relative size-11 shrink-0">
									<img
										src={selectedImage.previewUrl}
										alt=""
										className="size-11 rounded-[10px] border border-white/15 object-cover"
									/>
									<button
										type="button"
										onClick={handleImageRemove}
										className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#1C1C1C] text-xs leading-none text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition hover:bg-[#F47016]"
										aria-label="Remove selected image"
										title="Remove selected image"
									>
										×
									</button>
								</div>
							) : null}
						</div>
						<button
							type="button"
							onClick={handleSpeechToggle}
							disabled={!isSpeechSupported}
							className={`${iconButtonClassName} ${
								!isSpeechSupported
									? 'cursor-not-allowed opacity-40'
									: ''
							}`}
							aria-label="Speak to Ask CLAi"
							aria-pressed={isListening}
							title={
								isSpeechSupported
									? isListening
										? 'Stop voice input'
										: 'Start voice input'
									: 'Speech input is not supported in this browser'
							}
						>
							<Mic
								className={`transition-colors duration-300 ${
									isListening
										? 'mic-listening'
										: useLightComposer
											? 'text-[#1C1C1C]'
											: 'text-[#787878]'
								}`}
							/>
						</button>
						<button
							type="button"
							onClick={handleImageButtonClick}
							className={iconButtonClassName}
							aria-label="Add an outfit image"
						>
							<Upload
								className={
									useLightComposer
										? 'size-5 text-[#1C1C1C]'
										: 'size-5 text-[#787878]'
								}
							/>
						</button>
						<input
							ref={imageInputRef}
							type="file"
							accept="image/jpeg,image/png,image/webp"
							className="hidden"
							onChange={handleImageChange}
						/>
						<button
							type="submit"
							data-testid="ask-clai-submit"
							disabled={isSubmitting}
							className={`h-11 rounded-full px-5 text-sm font-medium tracking-[-.02em] transition focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:px-7 sm:text-lg ${
								isLight
									? 'bg-[#1C1C1C] text-white hover:bg-[#2A2A2A]'
									: 'bg-[#F47016] text-white hover:bg-[#F47016]'
							}`}
						>
							{isSubmitting ? 'Asking...' : 'Ask CLAi'}
						</button>
					</div>
				</form>
			</>
		);
	}

	const chatHistoryGroups = groupChatsByDate(chatHistory);

	const chatOverlay =
		isChatOpen && isMounted
			? createPortal(
					<div
						data-testid="ask-chat-overlay"
						className={`fixed left-0 top-0 z-[2147483646] flex h-dvh w-dvw flex-col overflow-hidden px-3 py-4 text-left sm:px-8 sm:py-4 ${
							isLight
								? 'bg-[linear-gradient(135deg,#4EA0D9_0%,#92B9DF_42%,#E8D5E6_100%)]'
								: 'bg-[#1C1C1C]'
						}`}
					>
						{isLight ? (
							<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_76%_46%,rgba(255,255,255,0.16),transparent_30%)]" />
						) : null}
						<div className="absolute left-4 top-4 z-10 sm:left-8 sm:top-7">
							<button
								type="button"
								onClick={handleHistoryOpen}
								className={`rounded-full px-4 py-2 font-antique-legacy text-sm font-medium transition ${
									isLight
										? 'bg-white/25 text-white hover:bg-white/35'
										: 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
								}`}
							>
								History
							</button>
						</div>
						<div className="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-8 sm:top-7">
							<ThemeToggle />
							<button
								type="button"
								onClick={(event) => {
									event.stopPropagation();
									handleChatClose();
								}}
								className={`grid size-8 place-items-center rounded-full pb-1 text-[1.2em] leading-none transition ${
									isLight
										? 'bg-white/25 text-white hover:bg-white/35'
										: 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
								}`}
								aria-label="Close Ask CLAi chat"
								title="Close Ask CLAi chat"
							>
								×
							</button>
						</div>
						<div
							ref={chatScrollRef}
							className="scrollbar-none mx-auto flex w-[min(94vw,920px)] flex-1 flex-col space-y-5 overflow-y-auto pb-6 pt-28 sm:space-y-6 sm:pb-8 sm:pt-24"
						>
							{messages.map((message, messageIndex) => {
								const previousUserMessage = messages
									.slice(0, messageIndex)
									.reverse()
									.find(
										(chatMessage) =>
											chatMessage.role === 'user'
									);
								const visualIntent =
									message.generatedVisualIntent ??
									classifyVisualIntent(
										previousUserMessage?.content ?? ''
									);
								const isGeneratingThisVisual =
									generatingLookForMessageId === message.id;
								const shouldSuppressGenerateVisual =
									message.suppressGenerateVisual ||
									isShoppingSourcePrompt(
										previousUserMessage?.content ?? ''
									);
								const visualButtonLabel = isGeneratingThisVisual
									? getGenerateVisualLabel(visualIntent, true)
									: (message.imageButtonLabel ??
										getGenerateVisualLabel(
											visualIntent,
											false
										));

								return (
									<div
										key={message.id}
										className={`flex ${
											message.role === 'user'
												? 'justify-end'
												: 'justify-start'
										}`}
									>
										<article
											className={`font-antique-legacy text-base font-medium sm:text-[1.1rem] ${
												message.role === 'user'
													? isLight
														? 'w-auto max-w-[86%] rounded-[22px] bg-white/35 px-4 py-3 leading-[1.3] text-white backdrop-blur-[10px] sm:max-w-[50%]'
														: 'w-auto max-w-[86%] rounded-[22px] bg-white/10 px-4 py-3 leading-[1.3] text-white/70 backdrop-blur-[10px] sm:max-w-[50%]'
													: isLight
														? 'w-full text-white leading-[1.3]'
														: 'w-full text-[white]/70 leading-[1.3]'
											}`}
										>
											{message.imagePreviewUrl ? (
												<img
													src={
														message.imagePreviewUrl
													}
													alt={
														message.imageName ?? ''
													}
													className="mb-3 h-14 w-14 rounded-[12px] object-cover"
												/>
											) : null}
											{message.content ===
											'CLAi is thinking...' ? (
												<div
													className="flex min-h-8 items-center"
													aria-label="CLAi is thinking"
													role="status"
												>
													<ClaiMark className="clai-loading-mark mt-[0.2rem] h-6 w-[26px] shrink-0 text-[#787878]" />
												</div>
											) : (
												<ReactMarkdown
													components={{
														p: ({ children }) => (
															<p className="mb-2 last:mb-0">
																{children}
															</p>
														),
														strong: ({
															children,
														}) => (
															<strong className="font-medium">
																{children}
															</strong>
														),
														h1: ({ children }) => (
															<p
																className={`mb-2 mt-4 text-lg font-medium first:mt-0 ${
																	isLight
																		? 'text-white'
																		: 'text-[white]/70'
																}`}
															>
																{children}
															</p>
														),
														h2: ({ children }) => (
															<p
																className={`mb-2 mt-4 text-base font-medium first:mt-0 ${
																	isLight
																		? 'text-white'
																		: 'text-[white]/70'
																}`}
															>
																{children}
															</p>
														),
														h3: ({ children }) => (
															<p
																className={`mb-2 mt-4 font-medium first:mt-0 ${
																	isLight
																		? 'text-white'
																		: 'text-[white]/70'
																}`}
															>
																{children}
															</p>
														),
														ul: ({ children }) => (
															<ul className="mb-3 ml-5 list-disc space-y-1 marker:text-current last:mb-0">
																{children}
															</ul>
														),
														ol: ({ children }) => (
															<ol className="mb-3 ml-5 list-decimal space-y-1 marker:text-current last:mb-0">
																{children}
															</ol>
														),
														li: ({ children }) => (
															<li className="pl-1">
																{children}
															</li>
														),
														hr: () => null,
													}}
												>
													{message.content}
												</ReactMarkdown>
											)}
											{message.generatedImageUrl ? (
												<img
													src={
														message.generatedImageUrl
													}
													alt={`Generated ${visualIntent} fashion visual`}
													className="mt-5 max-h-[58vh] w-full max-w-[320px] object-contain drop-shadow-[0_18px_32px_rgba(0,0,0,0.38)] sm:max-h-[520px] sm:max-w-[360px]"
												/>
											) : null}
											{message.role === 'assistant' &&
											message.content !==
												'CLAi is thinking...' &&
											!shouldSuppressGenerateVisual &&
											!isOnlyOutOfScopeFashionResponse(
												message.content
											) &&
											!hasNoCredits &&
											!message.generatedImageUrl ? (
												<button
													type="button"
													onClick={() =>
														handleGenerateLook(
															message.id
														)
													}
													disabled={
														generatingLookForMessageId !==
														null
													}
													className={`mt-5 inline-flex rounded-full bg-[linear-gradient(90deg,#4196D9,#E6CFE1)] p-[2px] text-[0.95em] font-medium text-white transition hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-[#E6CFE1]/60 disabled:cursor-not-allowed disabled:opacity-50 ${
														isGeneratingThisVisual
															? 'animate-pulse'
															: ''
													}`}
												>
													<span className="rounded-full bg-[#1C1C1C] px-4 py-2">
														{visualButtonLabel}
													</span>
												</button>
											) : null}
										</article>
									</div>
								);
							})}
						</div>
						{renderComposer(true)}
					</div>,
					document.body
				)
			: null;

	const chatHistoryOverlay =
		isHistoryOpen && isMounted
			? createPortal(
					<div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm">
						<section
							className={`flex max-h-[min(78vh,720px)] w-full max-w-[560px] flex-col rounded-[28px] p-4 shadow-[0_26px_90px_rgba(0,0,0,0.28)] sm:p-5 ${
								isLight
									? 'bg-white text-[#1C1C1C]'
									: 'bg-[#292929] text-white'
							}`}
							aria-label="CLAi chat history"
						>
							<div className="flex items-center justify-between gap-4 border-b border-current/10 pb-4">
								<div>
									<h2 className="font-mackinac text-2xl font-normal tracking-[-.04em]">
										Chat history
									</h2>
									<p
										className={`mt-1 font-antique-legacy text-sm ${
											isLight
												? 'text-[#1C1C1C]/55'
												: 'text-white/50'
										}`}
									>
										Reopen a previous CLAi conversation.
									</p>
								</div>
								<button
									type="button"
									onClick={() => setIsHistoryOpen(false)}
									className={`grid size-9 shrink-0 place-items-center rounded-full text-xl leading-none transition ${
										isLight
											? 'bg-[#1C1C1C]/5 text-[#1C1C1C]/60 hover:bg-[#1C1C1C]/10 hover:text-[#1C1C1C]'
											: 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white'
									}`}
									aria-label="Close chat history"
								>
									×
								</button>
							</div>
							<div className="scrollbar-none min-h-[220px] overflow-y-auto py-3">
								{isHistoryLoading ? (
									<div
										className={`flex h-48 items-center justify-center font-antique-legacy ${
											isLight
												? 'text-[#1C1C1C]/55'
												: 'text-white/50'
										}`}
									>
										Loading chats...
									</div>
								) : historyError ? (
									<div
										className={`rounded-2xl px-4 py-3 font-antique-legacy ${
											isLight
												? 'bg-[#F47016]/10 text-[#1C1C1C]/70'
												: 'bg-white/10 text-white/65'
										}`}
									>
										{historyError}
									</div>
								) : chatHistoryGroups.length ? (
									<div className="space-y-5">
										{chatHistoryGroups.map((group) => (
											<div key={group.label}>
												<p
													className={`mb-2 font-antique-legacy text-xs uppercase tracking-[.18em] ${
														isLight
															? 'text-[#1C1C1C]/45'
															: 'text-white/35'
													}`}
												>
													{group.label}
												</p>
												<div className="space-y-2">
													{group.chats.map((chat) => (
														<button
															key={chat.id}
															type="button"
															onClick={() =>
																handleSavedChatOpen(
																	chat
																)
															}
															disabled={
																loadingChatId !==
																null
															}
															className={`w-full rounded-2xl px-4 py-3 text-left transition disabled:cursor-wait disabled:opacity-60 ${
																isLight
																	? 'bg-[#EFF6FB] hover:bg-[#E2F0FA]'
																	: 'bg-white/5 hover:bg-white/10'
															}`}
														>
															<span className="flex items-center justify-between gap-3">
																<span className="min-w-0 truncate font-antique-legacy text-base font-medium">
																	{chat.lastMessage ||
																		'Untitled CLAi chat'}
																</span>
																<span
																	className={`shrink-0 font-antique-legacy text-xs ${
																		isLight
																			? 'text-[#1C1C1C]/45'
																			: 'text-white/35'
																	}`}
																>
																	{loadingChatId ===
																	chat.id
																		? 'Opening...'
																		: formatHistoryTime(
																				chat.updatedAt
																			)}
																</span>
															</span>
															<span
																className={`mt-1 block font-antique-legacy text-xs capitalize ${
																	isLight
																		? 'text-[#1C1C1C]/45'
																		: 'text-white/35'
																}`}
															>
																{chat.context}
															</span>
														</button>
													))}
												</div>
											</div>
										))}
									</div>
								) : (
									<div
										className={`flex h-48 items-center justify-center text-center font-antique-legacy ${
											isLight
												? 'text-[#1C1C1C]/55'
												: 'text-white/50'
										}`}
									>
										No saved chats yet.
									</div>
								)}
							</div>
						</section>
					</div>,
					document.body
				)
			: null;

	return (
		<div className="z-10 mt-6 flex w-full flex-col items-center gap-5 sm:mt-10 sm:gap-6">
			<div
				className={`border-1 grid h-14 w-[min(90vw,280px)] grid-cols-2 rounded-full p-[0.25rem] font-antique-legacy font-medium backdrop-blur-[10px] sm:h-[52px] sm:text-base ${
					isLight
						? 'border-white/25 bg-white/20 text-white/80'
						: 'border-[#e5e5e5]/5 bg-white/10 text-white/45'
				}`}
				aria-label="Ask CLAi context"
			>
				{contextOptions.map((option) => {
					const isActive = activeContext === option.id;

					return (
						<button
							key={option.id}
							type="button"
							onClick={() => handleContextChange(option.id)}
							className={`rounded-full text-base tracking-[-.04em] transition duration-200 sm:text-[1.1rem] ${
								isActive
									? 'bg-[#E0E0E0] text-[#1C1C1C] shadow-[inset_0_2px_2px_0_#FFF,0_0_12px_0_rgba(0,0,0,0.10)]'
									: isLight
										? 'text-white/80 hover:text-white'
										: 'text-[#787878] hover:text-white/75'
							}`}
							aria-pressed={isActive}
						>
							{option.label}
						</button>
					);
				})}
			</div>
			{isChatOpen ? null : renderComposer(false)}
			{chatOverlay}
			{chatHistoryOverlay}
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
				variant={variant}
			/>
		</div>
	);
}
