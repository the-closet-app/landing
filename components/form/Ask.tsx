'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';

import { AuthModal } from '@/components/auth/AuthModal';
import { ClaiMark } from '@/components/icons/ClaiMark';
import { Upload } from '@/components/icons/Upload';
import { Mic } from '@/components/icons/Mic';
import { useToast } from '@/components/toast/ToastProvider';
import { getFirebaseAuth } from '@/lib/firebase';

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
	imageData?: string;
	imageMimeType?: string;
	imageName?: string;
	imagePreviewUrl?: string;
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
const maxChatHistoryMessages = 8;
const supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

function subscribeToClient() {
	return () => {};
}

function getClientSnapshot() {
	return true;
}

function getServerSnapshot() {
	return false;
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
	const [generatingLookForMessageId, setGeneratingLookForMessageId] =
		useState<string | null>(null);
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [chatId, setChatId] = useState<string | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [user, setUser] = useState<User | null>(null);
	const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
		null
	);
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
		return onAuthStateChanged(getFirebaseAuth(), setUser);
	}, []);

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
				`${transcriptBaseRef.current}${interimTranscript}`.trim()
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
			toast.error('Upload an image smaller than 5MB.');
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
			};

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
							}
						: message
				)
			);

			if (data.chatId) {
				setChatId(data.chatId);
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

		const assistantIndex = messages.findIndex(
			(message) =>
				message.id === messageId && message.role === 'assistant'
		);
		const assistantMessage = messages[assistantIndex];
		const userMessage = messages
			.slice(0, assistantIndex)
			.reverse()
			.find((message) => message.role === 'user');

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
					prompt: userMessage?.content,
				}),
			});
			const data = (await response.json()) as {
				error?: string;
				imageUrl?: string;
			};

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
		const formClassName = isOverlay
			? isLight
				? 'mx-auto mt-auto flex w-[min(94vw,920px)] shrink-0 flex-col justify-between gap-4 rounded-[28px] border border-white/70 bg-white px-4 py-4 text-left shadow-[0_22px_70px_rgba(75,116,178,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] sm:gap-5 sm:rounded-[34px] sm:px-5 sm:py-5'
				: 'mx-auto mt-auto flex w-[min(94vw,920px)] shrink-0 flex-col justify-between gap-4 rounded-[26px] border-[0.5] border-[#e5e5e5]/5 bg-[#292929]/50 px-4 py-4 text-left shadow-[0_20px_70px_rgba(255,111,24,0.05),inset_0_1px_0_rgba(255,255,255,0.08)] sm:gap-5 sm:rounded-[34px] sm:px-5 sm:py-5'
			: isLight
				? 'flex min-h-[180px] w-full flex-col justify-between gap-4 rounded-[26px] border border-white/70 bg-white px-4 py-4 text-left shadow-[0_22px_70px_rgba(75,116,178,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] sm:min-h-[180px] sm:gap-5 sm:rounded-[34px] sm:px-6 sm:py-6'
				: 'flex w-full min-h-[180px] flex-col justify-between gap-4 rounded-[26px] border-[0.5] border-[#e5e5e5]/5 bg-[#292929]/50 px-4 py-4 text-left shadow-[0_20px_70px_rgba(255,111,24,0.05),inset_0_1px_0_rgba(255,255,255,0.08)] sm:gap-5 sm:rounded-[34px] sm:px-6 sm:py-6';
		const placeholderClassName = isLight
			? 'pointer-events-none absolute left-0 top-0 pr-2 text-base font-medium leading-relaxed tracking-[-.02em] text-[#1C1C1C]/35 sm:text-[1.1rem]'
			: 'pointer-events-none absolute left-0 top-0 pr-2 text-base font-medium leading-relaxed tracking-[-.02em] text-white/45 sm:text-[1.1rem]';
		const textareaClassName = isLight
			? 'w-full resize-none bg-transparent text-base font-medium leading-[1.3] tracking-[-.02em] text-[#1C1C1C]/80 outline-none placeholder:text-[#1C1C1C]/35 sm:text-[1.1rem]'
			: 'w-full resize-none bg-transparent text-base font-medium leading-[1.3] tracking-[-.02em] text-[white]/75 outline-none placeholder:text-white/45 sm:text-[1.1rem]';
		const iconButtonClassName = isLight
			? 'grid size-11 place-items-center rounded-full border border-[#1C1C1C]/10 bg-white text-[#1C1C1C] shadow-[0_12px_28px_rgba(75,116,178,0.10)] transition hover:bg-[#F7F7F7] focus:outline-none sm:size-12'
			: 'shadow-[0_20px_70px_rgba(255,111,24,0.05),inset_0_1px_0_rgba(255,255,255,0.08)] grid size-11 place-items-center rounded-full bg-white/10 transition focus:outline-none sm:size-12';

		return (
			<>
				<form className={formClassName} onSubmit={handleSubmit}>
					<div className="flex min-w-0 items-start gap-3 px-1 py-1 sm:gap-5 sm:px-2">
						<ClaiMark
							className={`mt-[0.2rem] h-5 w-[22px] shrink-0 sm:h-6 sm:w-[26px] ${
								isLight ? 'text-[#F47016]' : 'text-[#787878]'
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
												isLight
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
										: isLight
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
									isLight
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
						<div className="absolute right-4 top-4 z-10 sm:right-8 sm:top-7">
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
							className="scrollbar-none mx-auto flex w-[min(94vw,920px)] flex-1 flex-col space-y-5 overflow-y-auto pb-6 pt-16 sm:space-y-6 sm:pb-8 sm:pt-24"
						>
							{messages.map((message) => (
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
												src={message.imagePreviewUrl}
												alt={message.imageName ?? ''}
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
													strong: ({ children }) => (
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
												src={message.generatedImageUrl}
												alt="Generated modest fashion look inspiration"
												className="mt-5 max-h-[58vh] w-full max-w-[320px] object-contain drop-shadow-[0_18px_32px_rgba(0,0,0,0.38)] sm:max-h-[520px] sm:max-w-[360px]"
											/>
										) : null}
										{message.role === 'assistant' &&
										message.content !==
											'CLAi is thinking...' &&
										!isOnlyOutOfScopeFashionResponse(
											message.content
										) &&
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
												className={`mt-5 rounded-full py-2 text-[1em] font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
													isLight
														? 'text-white/65 hover:text-white'
														: 'text-white/20 hover:text-white/40'
												} ${
													generatingLookForMessageId ===
													message.id
														? 'animate-pulse'
														: ''
												}`}
											>
												{generatingLookForMessageId ===
												message.id
													? 'Generating look...'
													: 'Generate look inspiration'}
											</button>
										) : null}
									</article>
								</div>
							))}
						</div>
						{renderComposer(true)}
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
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
				variant={variant}
			/>
		</div>
	);
}
