'use client';

import { Ask } from '@/components/form/Ask';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { FaqSection } from '@/components/sections/FaqSection';
import { useTheme } from '@/components/theme/ThemeProvider';

export default function Home() {
	const { theme } = useTheme();
	const isLight = theme === 'light';

	return (
		<>
			<div
				className={`relative isolate min-h-screen overflow-hidden text-white transition-colors duration-500 ${
					isLight
						? 'bg-[linear-gradient(135deg,#4EA0D9_0%,#92B9DF_42%,#E8D5E6_100%)]'
						: 'bg-[#1C1C1C]'
				}`}
			>
				<div
					className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
						isLight
							? 'bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_76%_46%,rgba(255,255,255,0.16),transparent_30%)] opacity-100'
							: 'bg-[radial-gradient(circle_at_50%_0%,rgba(244,112,22,0.08),transparent_34%)] opacity-100'
					}`}
				/>
				<Header variant={theme} />
				<main className="relative z-10 flex items-center justify-center px-4 pb-10 pt-3 sm:min-h-[calc(100svh-132px)] sm:py-20 mt-10">
					<section className="flex w-[min(92vw,860px)] flex-col items-center gap-7 text-center text-white sm:gap-8 lg:gap-10">
						<h1 className="z-10 max-w-[11ch] font-mackinac text-[clamp(3.25rem,15vw,6rem)] font-normal leading-[1] tracking-[-.04em] sm:max-w-none">
							Your Fashion Intelligence Assistant
						</h1>
						<p className="z-10 w-[min(88vw,520px)] font-antique-legacy text-base font-normal leading-[1.35] tracking-[-.02em] text-white sm:text-[1.3rem]">
							For informed guidance on what to wear, what to buy,
							how to style, and how to get more from fashion.
						</p>
						<Ask variant={theme} />
					</section>
				</main>
				<FaqSection variant={theme} />
			</div>
			<Footer variant={theme} />
		</>
	);
}
