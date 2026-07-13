'use client';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { useTheme } from '@/components/theme/ThemeProvider';

export default function AboutCLAi() {
	const { theme } = useTheme();
	const isLight = theme === 'light';
	const pageClass = isLight
		? 'bg-[#eff6fb] text-[#1C1C1C]'
		: 'bg-[#1C1C1C] text-white';
	const labelClass = isLight ? 'text-[#1C1C1C]/60' : 'text-white/65';
	const headingClass = isLight ? 'text-[#1C1C1C]/85' : 'text-white/80';
	const bodyClass = isLight ? 'text-[#1C1C1C]/65' : 'text-white/65';
	const mutedClass = isLight ? 'text-[#1C1C1C]/50' : 'text-white/45';
	const cardClass = isLight
		? 'bg-[#ffffff] text-[#1C1C1C]/70'
		: 'bg-[#232323] text-white/65';

	return (
		<div className={pageClass}>
			<Header />
			<main className="flex justify-center px-4 pb-10 pt-6 sm:min-h-[calc(100svh-132px)] sm:py-20">
				<section className="flex w-[min(92vw,720px)] flex-col items-center gap-4 text-center sm:gap-4 lg:gap-4">
					<h1
						className={`z-10 font-antique-legacy font-normal uppercase leading-[1] tracking-[.1em] sm:max-w-none sm:text-[1rem] ${labelClass}`}
					>
						About CLAi
					</h1>
					<h2
						className={`z-10 text-center font-mackinac text-base font-normal leading-[1.05] tracking-[-.04em] text-[clamp(3.25rem,15vw,3.8rem)] ${headingClass}`}
					>
						Fashion Intelligence.
					</h2>
					<p
						className={`z-10 px-4 text-center font-antique-legacy text-base font-normal leading-[1.3] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						CLAi exists to help consumers, creators, and brands make
						better fashion decisions - through intelligence,
						insight, psychology, and guidance.
					</p>
					<p
						className={`z-10 my-5 rounded-[1em] p-8 text-left font-mackinac text-base font-normal leading-[1.3] tracking-[-.01em] sm:text-[1.6rem] ${cardClass}`}
					>
						<small className="mb-3 block text-left font-antique-legacy uppercase tracking-[.2em] sm:text-[0.85rem]">
							Brand Belief
						</small>
						The future of fashion isn&apos;t owning more.{' '}
						<em>It&apos;s getting more from fashion.</em>
					</p>
					<p
						className={`z-10 my-5 text-left font-mackinac text-base font-normal leading-[1.3] tracking-[-.01em] sm:text-[2rem] ${bodyClass}`}
					>
						<small className="mb-3 block text-left font-antique-legacy uppercase tracking-[.2em] text-[#F47016] sm:text-[0.8rem]">
							Why We Exist
						</small>
						Most fashion decisions are made without any real
						intelligence behind them.
					</p>
					<p
						className={`z-10 text-left font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						What to wear, what to buy, what to keep, what&apos;s
						actually worth repairing or reselling - people make
						these calls every day with no real support, and often
						end up with wardrobes full of things they don&apos;t
						wear and questions they don&apos;t have answers to. CLAi
						was built to close that gap: a Fashion Intelligence
						Platform that combines AI, fashion psychology, and
						professional styling expertise, so every decision - for
						a consumer or a working stylist - is an informed one.
					</p>
					<div className="mt-8 flex flex-col gap-4 sm:gap-3">
						<h2 className="text-left font-antique-legacy uppercase tracking-[.2em] text-[#F47016] sm:text-[0.8rem]">
							Where we&apos;re going
						</h2>
						<p
							className={`z-10 my-1 rounded-[1em] p-8 text-left font-mackinac text-base font-normal leading-[1.3] tracking-[-.01em] sm:my-2 sm:text-[1.6rem] ${cardClass}`}
						>
							<small className="mb-3 block text-left font-antique-legacy uppercase tracking-[.2em] sm:text-[0.85rem]">
								Vision
							</small>
							To become the world&apos;s leading Fashion
							Intelligence Platform, creating a more intelligent,
							personalised, and circular fashion ecosystem.
						</p>
						<p
							className={`z-10 my-1 rounded-[1em] p-8 text-left font-mackinac text-base font-normal leading-[1.3] tracking-[-.01em] sm:my-2 sm:text-[1.6rem] ${cardClass}`}
						>
							<small className="mb-3 block text-left font-antique-legacy uppercase tracking-[.2em] sm:text-[0.85rem]">
								Mission
							</small>
							To help consumers and fashion professionals make
							better decisions about what to wear, what to buy,
							how to style, and how to get more from fashion -
							through AI-powered intelligence, fashion psychology,
							expert guidance, and personalised recommendations.
						</p>
					</div>
					<p
						className={`z-10 my-6 text-left font-mackinac text-base font-normal leading-[1.3] tracking-[-.01em] sm:text-[2rem] ${bodyClass}`}
					>
						<small className="mb-3 block text-left font-antique-legacy uppercase tracking-[.2em] text-[#F47016] sm:text-[0.8rem]">
							Why you can believe it
						</small>
						Every recommendation stands on four pillars.
					</p>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
						{[
							'Powered by AI.',
							'Informed by Fashion Psychology.',
							'Guided by Professional Styling Expertise.',
							'Designed for Circular Outcomes.',
						].map((pillar, index) => (
							<p
								key={pillar}
								className={`z-10 rounded-[1em] p-8 text-left font-antique-legacy text-base font-normal leading-[1.2] tracking-[-.01em] sm:text-[1.4rem] ${cardClass}`}
							>
								<small className="mb-3 block text-left font-antique-legacy uppercase tracking-[.2em] text-[#F47016] sm:text-[0.85rem]">
									{String(index + 1).padStart(2, '0')}
								</small>
								{pillar}
							</p>
						))}
					</div>
					<div
						className={`z-10 mt-6 flex flex-col gap-5 text-center font-antique-legacy text-base font-normal leading-[1.3] tracking-[-.01em] ${mutedClass}`}
					>
						<p>
							CLAi, short for The Closet App Intelligence. Is a
							Fashion Intelligence Platform for consumers and
							fashion professionals.
						</p>
						<p>
							It helps you make better decisions about what to
							wear, what to buy, how to style, and how to get more
							from fashion. From everyday styling questions and
							fashion fixes to personalised recommendations that
							help you unlock more from your wardrobe, CLAi
							delivers intelligent guidance for every stage of the
							fashion experience-built with real fashion
							psychologists and professional stylists.
						</p>
						<p>
							The Fashion Intelligence Assistant is the first way
							to experience CLAi, with a broader platform
							connecting consumers, creators, and brands through
							Fashion Intelligence currently in development.
						</p>
						<p
							className={`z-10 my-5 rounded-[1em] text-center font-mackinac text-base font-normal leading-[1.3] tracking-[-.01em] sm:text-[1.6rem] ${bodyClass}`}
						>
							Better Fashion Decision Starts Here
						</p>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
}
