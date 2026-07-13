'use client';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { useTheme } from '@/components/theme/ThemeProvider';

export default function CookieNotice() {
	const { theme } = useTheme();
	const isLight = theme === 'light';
	const pageClass = isLight
		? 'bg-[#eff6fb] text-[#1C1C1C]'
		: 'bg-[#1C1C1C] text-white';
	const headingClass = isLight ? 'text-[#1C1C1C]/90' : 'text-white/90';
	const subheadingClass = isLight ? 'text-[#1C1C1C]/80' : 'text-white/80';
	const bodyClass = isLight ? 'text-[#1C1C1C]/65' : 'text-white/65';

	return (
		<div className={pageClass}>
			<Header />
			<main className="flex justify-center px-4 pb-10 pt-6 sm:min-h-[calc(100svh-132px)] sm:py-20">
				<section className="flex w-[min(92vw,860px)] flex-col items-center gap-4 text-center sm:gap-4 lg:gap-4">
					<h1
						className={`z-10 mb-6 max-w-[11ch] font-mackinac text-[clamp(3.25rem,15vw,4rem)] font-normal leading-[1] tracking-[-.04em] sm:max-w-none ${headingClass}`}
					>
						Cookie Notice
					</h1>
					<h2
						className={`z-10 mt-4 w-[min(100vw,720px)] text-left font-mackinac text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						1 · Who We Are
					</h2>
					<p
						className={`z-10 w-[min(100vw,720px)] text-left font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						CLAi (“CLAi”, “we”, “us”, “our”) is the trading name of
						The Closet App LTD, a company registered in England and
						Wales under company number 16742543, with its registered
						office at 20 Lesney Park Road, United Kingdom.
					</p>
					<p
						className={`z-10 w-[min(100vw,720px)] text-left font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						You can contact us about data protection matters at:
						info@theclai.co.
					</p>
					<h2
						className={`z-10 mt-4 w-[min(100vw,720px)] text-left font-mackinac text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						2 · Scope of This Policy
					</h2>
					<p
						className={`z-10 w-[min(100vw,720px)] text-left font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						This Privacy Policy applies to personal information we
						collect when you:
					</p>
					<ul
						className={`z-10 w-[min(100vw,720px)] list-disc pl-6 text-left font-antique-legacy font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						<li>join our waitlist;</li>
						<li>
							take part in our beta or early access programme;
						</li>
						<li>use the CLAi fashion intelligence chatbot; or</li>
						<li>
							contact us or interact with us in any other way.
						</li>
					</ul>
					<p
						className={`z-10 w-[min(100vw,720px)] text-left font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						This policy does not cover third-party websites or
						services linked from CLAi.
					</p>
					<h2
						className={`z-10 mt-4 w-[min(100vw,720px)] text-left font-mackinac text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						3 · Information We Collect
					</h2>
					<p
						className={`z-10 w-[min(100vw,720px)] text-left font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						3.1 · Information you give us
					</p>
					<ul
						className={`z-10 w-[min(100vw,720px)] list-disc pl-6 text-left font-antique-legacy font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						<li>
							Your name and email address when you join the
							waitlist or sign up.
						</li>
						<li>
							Messages you send to the CLAi chatbot, including
							descriptions of your style, preferences, and goals.
						</li>
						<li>
							Photographs or images you choose to upload of
							clothing, outfits, or yourself (always optional —
							see Section 6).
						</li>
						<li>
							Feedback, ratings, survey responses, and comments.
						</li>
					</ul>
					<p
						className={`z-10 w-[min(100vw,720px)] text-left font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						3.2 · Information we collect automatically
					</p>
					<ul
						className={`z-10 w-[min(100vw,720px)] list-disc pl-6 text-left font-antique-legacy font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						<li>
							Device type, browser, operating system, and IP
							address.
						</li>
						<li>
							Usage data: pages visited, features used, session
							duration.
						</li>
						<li>
							Cookie and similar tracking data (see our Cookie
							Notice).
						</li>
					</ul>
				</section>
			</main>
			<Footer />
		</div>
	);
}
