'use client';

import { useState } from 'react';

import type { Theme } from '@/components/theme/ThemeProvider';

type FaqSectionProps = {
	variant: Theme;
};

const faqs = [
	{
		question: 'What is the CLAi Fashion Intelligence Agent?',
		answer: 'The CLAi Fashion Intelligence Agent is an AI-powered experience designed to help you make more informed fashion decisions. Whether you\'re deciding what to wear, what to buy, how to style an outfit, or how to get more from your wardrobe, CLAi is here to guide you.',
	},
	{
		question: 'Is CLAi available as an app?',
		answer: 'Not yet. You\'re currently experiencing the first public beta of CLAi. This Fashion Intelligence Assistant is the first step towards the wider CLAi platform, which is currently in development.',
	},
	{
		question: 'What kinds of questions can I ask?',
		answer: 'You can ask CLAi fashion-related questions like what to wear to a Wimbledon tennis tournament, whether a jacket is worth buying, how to style a pair of trousers, what colours may suit you, how to make better use of your wardrobe, or whether a torn cashmere sweater can be fixed. CLAi is designed specifically to give practical fashion guidance.',
	},
	{
		question: 'Can I upload photos?',
		answer: 'Yes. You can upload images of outfits or clothing items to receive more personalised fashion guidance. Image uploads are optional.',
	},
	{
		question: 'Who is CLAi designed for?',
		answer: 'CLAi is designed for anyone who wants to make better fashion decisions—from people who simply want help getting dressed to fashion enthusiasts looking for more informed styling guidance.',
	},
	{
		question: 'How is CLAi different from a general AI chatbot?',
		answer: 'CLAi has been built specifically for fashion. Rather than providing general-purpose answers, it focuses on fashion guidance and is being developed with input from fashion psychologists and professional stylists to create a more thoughtful and specialised experience.',
	},
	{
		question: 'Will my feedback make a difference?',
		answer: 'Absolutely. This beta is designed to help us learn from real users. Your questions, suggestions, and feedback will directly influence how future versions of CLAi evolve.',
	},
	{
		question: 'Is my information secure?',
		answer: 'We take your privacy seriously. Any personal information you choose to provide is handled in accordance with our Privacy Policy. If you upload an image, it is used only to help generate your fashion guidance.',
	},
	{
		question: 'How can I stay involved?',
		answer: 'Join the waitlist to receive updates, early access opportunities, product news, newsletters and invitations to future testing phases as CLAi continues to grow.',
	},
	{
		question: 'Who is behind CLAi?',
		answer: 'The Closet App LTD is the owner of CLAi. They are building a new category of Fashion Intelligence—helping people make better fashion decisions through AI, expert insight, and a deeper understanding of style and behaviour.',
	},
];

export function FaqSection({ variant }: FaqSectionProps) {
	const [openIndex, setOpenIndex] = useState(0);
	const isLight = variant === 'light';

	return (
		<section
			className={`relative z-10 px-4 py-16 sm:py-24 ${
				isLight
					? 'text-white'
					: 'text-white'
			}`}
		>
			<div className="mx-auto flex w-[min(92vw,640px)] flex-col gap-8">
				<div className="flex flex-col gap-3 text-center">
					<h2
						className={`font-mackinac text-[clamp(2.5rem,8vw,4rem)] font-normal leading-[1] tracking-[-.04em] ${
							isLight ? 'text-white/90' : 'text-white/90'
						}`}
					>
						FAQs
					</h2>
				</div>
				<div className="flex flex-col">
					{faqs.map((faq, index) => {
						const isOpen = openIndex === index;

						return (
							<div
								key={faq.question}
								className={`border-b py-1 transition ${
									isLight
										? 'border-white/30 text-white'
										: 'border-white/5 text-white'
								}`}
							>
								<button
									type="button"
									onClick={() =>
										setOpenIndex(isOpen ? -1 : index)
									}
									className="flex w-full items-center justify-between gap-5 py-3 text-left"
									aria-expanded={isOpen}
								>
									<span className="font-antique-legacy text-lg font-medium leading-[1.3] tracking-[-.02em] sm:text-[1.4rem]">
										{faq.question}
									</span>
									<span
										className={`grid size-8 shrink-0 place-items-center transition ${
											isLight
												? 'text-white/90'
												: 'text-white'
										} ${isOpen ? 'rotate-45' : ''}`}
										aria-hidden="true"
									>
										<svg
											className="size-4"
											viewBox="0 0 16 16"
											fill="none"
										>
											<path
												d="M8 3.5v9M3.5 8h9"
												stroke="currentColor"
												strokeLinecap="round"
												strokeWidth="1.6"
											/>
										</svg>
									</span>
								</button>
								<div
									className={`grid transition-[grid-template-rows,opacity] duration-300 ${
										isOpen
											? 'grid-rows-[1fr] opacity-100'
											: 'grid-rows-[0fr] opacity-0'
									}`}
								>
									<div className="overflow-hidden">
										<p
											className={`pb-5 font-antique-legacy text-base leading-[1.35] tracking-[-.02em] sm:pb-7 sm:text-[1.2rem] ${
												isLight
													? 'text-white/90'
													: 'text-white/45'
											}`}
										>
											{faq.answer}
										</p>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
