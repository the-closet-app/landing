'use client';

import { useEffect, useRef, useState } from 'react';

import { ClaiMark } from '@/components/icons/ClaiMark';
import { Upload } from '@/components/icons/Upload';
import { Mic } from '@/components/icons/Mic';

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

export function Ask() {
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
	const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
	const transcriptBaseRef = useRef('');
	const overlayPlaceholder =
		isListening && !promptValue
			? 'CLAi is listening...'
			: animatedPlaceholder;

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
			<form
				className="flex min-h-[200px] w-full flex-col justify-between gap-5 rounded-[32px] border-[0.5] border-[#e5e5e5]/5 bg-[#292929]/50 px-5 py-5 text-left shadow-[0_20px_70px_rgba(255,111,24,0.05),inset_0_1px_0_rgba(255,255,255,0.08)] sm:min-h-[200px] sm:rounded-[34px] sm:px-6 sm:py-6"
				onSubmit={(event) => event.preventDefault()}
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
							rows={2}
							className="min-h-16 w-full resize-none bg-transparent text-lg font-medium tracking-[-.02em] text-[white]/75 outline-none placeholder:text-white/45 sm:text-[1.1rem] leading-[1.3]"
						/>
					</div>
				</div>
				<div className="flex items-center justify-end gap-3">
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
						className="shadow-[0_20px_70px_rgba(255,111,24,0.05),inset_0_1px_0_rgba(255,255,255,0.08)] grid size-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/10 focus:outline-none"
						aria-label="Add an outfit image"
					>
						<Upload />
					</button>
					<button
						type="submit"
						className="h-12 rounded-full bg-[#F47016] tracking-[-.02em] px-6 text-base font-medium text-white transition hover:bg-[#F47016] focus:outline-none sm:px-7 sm:text-lg"
					>
						Ask CLAi
					</button>
				</div>
			</form>
		</div>
	);
}
