'use client';

import { ClaiMark } from '@/components/icons/ClaiMark';
import { useTheme, type Theme } from '@/components/theme/ThemeProvider';
import Link from 'next/link';

type FooterProps = {
	variant?: Theme;
};

const socialLinks = [
	{
		href: 'https://www.linkedin.com/company/the-clai/',
		label: 'LinkedIn',
		Icon: LinkedInIcon,
	},
	{
		href: 'https://www.instagram.com/the_clai?igsi=MXFuMm8xNXM0N2NoNQ%3D%3D&utm_source=qr',
		label: 'Instagram',
		Icon: InstagramIcon,
	},
];

function LinkedInIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			className={className}
			aria-hidden="true"
		>
			<path
				d="M6.94 8.9v9.18H4.04V8.9h2.9ZM5.49 5.01c.94 0 1.58.62 1.6 1.43 0 .79-.6 1.43-1.62 1.43h-.02c-.96 0-1.58-.64-1.58-1.43 0-.81.64-1.43 1.62-1.43Zm6.27 3.89.13 1.26c.42-.65 1.24-1.48 2.75-1.48 2.03 0 3.55 1.34 3.55 4.2v5.2h-2.9v-4.84c0-1.22-.43-2.06-1.5-2.06-.82 0-1.31.56-1.53 1.1-.08.2-.1.47-.1.74v5.06H9.25V8.9h2.51Z"
				fill="currentColor"
			/>
		</svg>
	);
}

function InstagramIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			className={className}
			aria-hidden="true"
		>
			<path
				d="M8.2 3.5h7.6c2.6 0 4.7 2.1 4.7 4.7v7.6c0 2.6-2.1 4.7-4.7 4.7H8.2c-2.6 0-4.7-2.1-4.7-4.7V8.2c0-2.6 2.1-4.7 4.7-4.7Zm0 1.8c-1.6 0-2.9 1.3-2.9 2.9v7.6c0 1.6 1.3 2.9 2.9 2.9h7.6c1.6 0 2.9-1.3 2.9-2.9V8.2c0-1.6-1.3-2.9-2.9-2.9H8.2Zm3.8 3.2a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm0 1.8a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Zm4.1-2.76a.92.92 0 1 1 0 1.84.92.92 0 0 1 0-1.84Z"
				fill="currentColor"
			/>
		</svg>
	);
}

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
							{' · '}
							<Link
								href="/cookie-notice"
								className={`mx-1 ${
									isLight
										? 'hover:text-[#1C1C1C]'
										: 'hover:text-white/65'
								}`}
							>
								Cookie Notice
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
							Follow us on social
						</h2>
						<div className="flex items-center gap-3">
							{socialLinks.map(({ href, label, Icon }) => (
								<a
									key={label}
									href={href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={`Follow CLAi on ${label}`}
									className={`grid size-11 place-items-center rounded-full border transition ${
										isLight
											? 'border-[#1C1C1C]/10 text-[#1C1C1C] hover:border-[#F47016]/40 hover:text-[#F47016]'
											: 'border-white/15 text-white hover:border-[#F47016]/50 hover:text-[#F47016]'
									}`}
								>
									<Icon className="size-6" />
								</a>
							))}
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
