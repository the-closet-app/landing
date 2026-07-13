'use client';

import { ClaiMark } from '@/components/icons/ClaiMark';
import { useTheme, type Theme } from '@/components/theme/ThemeProvider';
import Link from 'next/link';

type FooterProps = {
	variant?: Theme;
};

export function Footer({ variant }: FooterProps) {
	const { theme } = useTheme();
	const activeVariant = variant ?? theme;
	const isLight = activeVariant === 'light';

	return (
		<footer
			id="footer"
			className={`relative z-10 ${
				isLight
					? 'bg-white text-[#1C1C1C]'
					: "bg-[#1C1C1C] bg-[url('/clai_footer_back.webp')] bg-cover bg-center bg-no-repeat text-white"
			}`}
		>
			{isLight ? null : (
				<div className="absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(28,28,28,1)_0%,rgba(28,28,28,0.95)_25%,rgba(28,28,28,0.75)_55%,rgba(28,28,28,0)_100%)]" />
			)}
			<div className="relative mx-auto pt-20 pb-10 flex w-full max-w-[1280px] overflow-hidden sm:pt-24 sm:pb-16 lg:pt-24 lg:pb-20">
				<div className="relative z-10 mx-auto flex w-full flex-col justify-between gap-10 px-5 pb-10 pt-10 md:flex-row sm:px-12 sm:pb-16 lg:gap-16">
					<div className="flex flex-col gap-5 sm:gap-5">
						<div className="flex items-center gap-3">
							<ClaiMark
								className={`h-8 w-9 sm:h-9 sm:w-10 ${
									isLight ? 'text-[#1C1C1C]' : 'text-white'
								}`}
							/>
							<span className="font-mackinac text-3xl leading-none tracking-[-.02em] sm:text-4xl">
								CLAi
							</span>
						</div>
						<p
							className={`sm:max-w-[560px] font-antique-legacy text-base font-medium leading-[1.45] tracking-[-.02em] sm:text-[1.1rem] ${
								isLight ? 'text-[#1C1C1C]/60' : 'text-white/50'
							}`}
						>
							CLAi exists to help consumers, creators, and brands
							make better fashion decisions - through
							intelligence, insight, psychology, and guidance.
						</p>
						<p
							className={`font-antique-legacy text-base font-normal tracking-[-.02em] sm:text-[1.1rem] ${
								isLight ? 'text-[#1C1C1C]/60' : 'text-white/50'
							}`}
						>
							<Link
								href="/about"
								className={`mr-1 ${
									isLight
										? 'hover:text-[#1C1C1C]'
										: 'hover:text-white/65'
								}`}
							>
								About CLAi
							</Link>
							{' · '}
							<Link
								href="/privacy-policy"
								className={`mx-1 ${
									isLight
										? 'hover:text-[#1C1C1C]'
										: 'hover:text-white/65'
								}`}
							>
								Privacy Policy
							</Link>
							{' · '}
							<Link
								href="/terms-of-use"
								className={`mx-1 ${
									isLight
										? 'hover:text-[#1C1C1C]'
										: 'hover:text-white/65'
								}`}
							>
								Terms of Use
							</Link>
						</p>
						<p
							className={`font-antique-legacy text-base font-normal tracking-[-.02em] sm:text-[1.1rem] ${
								isLight ? 'text-[#1C1C1C]/60' : 'text-white/50'
							}`}
						>
							&copy; 2026 CLAi. All rights reserved.
						</p>
					</div>
					<div className="flex flex-col md:max-w-[500px]">
						<h2 className="mb-3 font-mackinac text-2xl font-normal tracking-[-.04em] sm:text-3xl">
							Share your feedback
						</h2>
						<p
							className={`font-antique-legacy text-base sm:text-[1.1rem] ${
								isLight ? 'text-[#1C1C1C]/60' : 'text-white/50'
							}`}
						>
							CLAi is still learning.{' '}
							<Link
								href="https://docs.google.com/forms/d/e/1FAIpQLSe7TKRdTqlKw7bIA2wAEukMCemsdVtyrjHBPaSqNjKqGBCAiQ/viewform?usp=preview"
								className="text-[#F47016]/70"
								target="_blank"
							>
								Share
							</Link>{' '}
							what felt useful, confusing, or missing so we can
							make the experience better.
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
