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
			'What should I wear to a summer wedding?',
			'Help me style black wide-leg trousers.',
			'What colors work with olive green?',
			'Give me outfit ideas for a casual first date.',
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

export function Ask() {
	const toast = useToast();
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
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [user, setUser] = useState<User | null>(null);
	const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
		null
	);
	const imageInputRef = useRef<HTMLInputElement | null>(null);
	const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
	const transcriptBaseRef = useRef('');
	const overlayPlaceholder =
		isListening && !promptValue
			? 'CLAi is listening...'
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
		if (isPromptFocused || promptValue) {
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
		return (
			<form
				className={
					isOverlay
						? 'mx-auto mt-auto flex w-[min(92vw,920px)] shrink-0 flex-col justify-between gap-5 rounded-[32px] border-[0.5] border-[#e5e5e5]/5 bg-[#292929]/50 px-5 py-5 text-left shadow-[0_20px_70px_rgba(255,111,24,0.05),inset_0_1px_0_rgba(255,255,255,0.08)] sm:rounded-[34px]'
						: 'flex w-full flex-col justify-between gap-5 rounded-[32px] border-[0.5] border-[#e5e5e5]/5 bg-[#292929]/50 px-5 py-5 text-left shadow-[0_20px_70px_rgba(255,111,24,0.05),inset_0_1px_0_rgba(255,255,255,0.08)] sm:rounded-[34px] sm:px-6 sm:py-6'
				}
				onSubmit={handleSubmit}
			>
				<div className="flex min-w-0 items-start gap-5 px-2 py-1">
					<ClaiMark className="mt-[0.2rem] h-6 w-[26px] shrink-0 text-[#787878]" />
					<label className="sr-only" htmlFor="ask-clai-prompt">
						Ask CLAi prompt for {activeOption.label}
					</label>
					<div className="relative min-w-0 flex-1">
						{!promptValue && (!isPromptFocused || isListening) ? (
							<p
								className="pointer-events-none absolute left-0 top-0 pr-2 text-lg font-medium leading-relaxed tracking-[-.02em] text-white/45 sm:text-[1.1rem]"
								aria-hidden="true"
							>
								{overlayPlaceholder}
								<span className="ml-0.5 animate-pulse text-white/55">
									_
								</span>
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
							className="w-full resize-none bg-transparent text-lg font-medium leading-[1.3] tracking-[-.02em] text-[white]/75 outline-none placeholder:text-white/45 sm:text-[1.1rem]"
						/>
					</div>
				</div>
				<div className="flex items-center justify-between gap-3">
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
						className={`shadow-[0_20px_70px_rgba(255,111,24,0.05),inset_0_1px_0_rgba(255,255,255,0.08)] grid size-12 place-items-center rounded-full bg-white/10 transition focus:outline-none ${
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
								isListening ? 'mic-listening' : 'text-[#787878]'
							}`}
						/>
					</button>
					<button
						type="button"
						onClick={handleImageButtonClick}
						className="shadow-[0_20px_70px_rgba(255,111,24,0.05),inset_0_1px_0_rgba(255,255,255,0.08)] grid size-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/10 focus:outline-none"
						aria-label="Add an outfit image"
					>
						<Upload />
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
						className="h-12 rounded-full bg-[#F47016] px-6 text-base font-medium tracking-[-.02em] text-white transition hover:bg-[#F47016] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:px-7 sm:text-lg"
					>
						{isSubmitting ? 'Asking...' : 'Ask CLAi'}
					</button>
				</div>
			</form>
		);
	}

	const chatOverlay =
		isChatOpen && isMounted
			? createPortal(
					<div
						data-testid="ask-chat-overlay"
						className="fixed left-0 top-0 z-[2147483646] flex h-dvh w-dvw flex-col overflow-hidden bg-[#1C1C1C] px-4 py-5 text-left sm:px-8 sm:py-4"
					>
						<div className="absolute right-5 top-5 z-10 sm:right-8 sm:top-7">
							<button
								type="button"
								onClick={(event) => {
									event.stopPropagation();
									handleChatClose();
								}}
								className="grid size-8 place-items-center rounded-full bg-white/10 pb-1 text-[1.2em] leading-none text-white/70 transition hover:bg-white/15 hover:text-white"
								aria-label="Close Ask CLAi chat"
								title="Close Ask CLAi chat"
							>
								×
							</button>
						</div>
						<div className="scrollbar-none mx-auto flex w-[min(92vw,920px)] flex-1 flex-col space-y-6 overflow-y-auto pb-8 pt-20 sm:pt-24">
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
										className={`font-antique-legacy text-[1.1rem] font-medium ${
											message.role === 'user'
												? 'w-auto rounded-[24px] bg-white/10 px-3 py-3 leading-[1.3] text-white/40 backdrop-blur-[10px] sm:max-w-[50%]'
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
													<p className="mb-2 mt-4 text-lg font-medium text-[white]/70 first:mt-0">
														{children}
													</p>
												),
												h2: ({ children }) => (
													<p className="mb-2 mt-4 text-base font-medium text-[white]/70 first:mt-0">
														{children}
													</p>
												),
												h3: ({ children }) => (
													<p className="mb-2 mt-4 font-medium text-[white]/70 first:mt-0">
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
										{message.generatedImageUrl ? (
											<img
												src={message.generatedImageUrl}
												alt="Generated modest fashion look inspiration"
												className="mt-5 aspect-square w-full max-w-[360px] rounded-[24px] object-cover"
											/>
										) : null}
										{message.role === 'assistant' &&
										message.content !==
											'CLAi is thinking...' &&
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
												className="mt-5 rounded-full py-2 text-[1em] font-medium text-white/20 hover:text-white/40 transition disabled:cursor-not-allowed disabled:opacity-40"
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
		<div className="z-10 flex w-full flex-col items-center gap-6 mt-10">
			<div
				className="border-1 border-[#e5e5e5]/5 grid h-16 w-[min(90vw,280px)] grid-cols-2 rounded-full bg-white/10 p-[0.25rem] font-medium font-antique-legacy text-white/45 backdrop-blur-[10px] sm:h-[52px] sm:text-base"
				aria-label="Ask CLAi context"
			>
				{contextOptions.map((option) => {
					const isActive = activeContext === option.id;

					return (
						<button
							key={option.id}
							type="button"
							onClick={() => handleContextChange(option.id)}
							className={`rounded-full transition duration-200 text-[1.1rem] tracking-[-.04em] ${
								isActive
									? 'bg-[#E0E0E0] text-[#1C1C1C] shadow-[inset_0_2px_2px_0_#FFF,0_0_12px_0_rgba(0,0,0,0.10)]'
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
			/>
		</div>
	);
}
