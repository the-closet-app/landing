import { ClaiMark } from '@/components/icons/ClaiMark';
import Link from 'next/link';

export function Footer() {
	return (
		<footer id="footer" className="relative z-10 text-white">
			<div className="relative mx-auto mt-20 mb-10 flex w-full max-w-[1280px] overflow-hidden sm:mt-32 sm:mb-16 lg:mt-40 lg:mb-20">
				<div className="relative z-10 mx-auto flex w-full flex-col justify-between gap-10 px-5 pb-10 pt-10 md:flex-row sm:px-12 sm:pb-16 lg:gap-16">
					<div className="flex flex-col gap-6 sm:gap-8">
						<div className="flex items-center gap-3">
							<ClaiMark className="h-8 w-9 text-white sm:h-9 sm:w-10" />
							<span className="font-mackinac text-3xl leading-none tracking-[-.02em] sm:text-4xl">
								CLAi
							</span>
						</div>
						<p className="sm:max-w-[560px] font-antique-legacy text-base font-medium leading-[1.45] tracking-[-.02em] text-white/50 sm:text-[1.1rem]">
							CLAi helps you make better decisions about what to wear, what to buy, how to style, and how to get 
							more from fashion. From everyday styling questions and fashion fixes to personalised 
							recommendations that help you unlock more from your wardrobe, CLAi delivers intelligent 
							guidance for every stage of the fashion experience..
						</p>
						<p className="font-antique-legacy text-base font-normal tracking-[-.02em] text-white/50 sm:text-[1.1rem]">
							<Link href="/privacy-policy" className="hover:text-[white]/65 mr-1">
								Privacy Policy
							</Link>
							{' · '}
							<Link href="/terms-of-service" className="hover:text-[white]/65 mx-1">
								Terms of Service
							</Link>
							{' · '}
							<Link href="/cookie-notice" className="hover:text-[white]/65 ml-1">
								Cookie Notice
							</Link>
						</p>
						<p className="font-antique-legacy text-base font-normal tracking-[-.02em] text-white/50 sm:text-[1.1rem]">
							&copy; 2026 CLAi. All rights reserved.
						</p>
					</div>
					<div className="flex flex-col md:min-w-[420px]">
						<h2 className="mb-1 font-mackinac text-2xl font-normal tracking-[-.04em] sm:text-3xl">
							Join the waitlist
						</h2>
						<p className="text-white/50 font-antique-legacy text-base sm:text-[1.1rem]">
							A full Fashion Intelligence platform is coming.
						</p>
						<form className="flex mt-5 h-14 w-full items-center rounded-full border-[0.5] border-[#e5e5e5]/5 bg-[white]/10 px-2 pr-[4px] shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-md sm:h-[64px] sm:pl-3 sm:pr-2">
							<label className="sr-only" htmlFor="footer-email">
								Email address
							</label>
							<input
								id="footer-email"
								type="email"
								placeholder="Your email address"
								className="min-w-0 flex-1 px-3 font-antique-legacy text-base font-normal tracking-[-.03em] text-white outline-none placeholder:text-white/55 sm:px-5 sm:text-[1.1rem]"
							/>
							<button
								type="submit"
								className="grid size-11 shrink-0 place-items-center rounded-full bg-[#F47016] text-white transition hover:bg-[#E19245] focus:outline-none focus:ring-2 focus:ring-[#F4B77B] sm:size-12"
								aria-label="Join waitlist"
							>
								<svg
									width="28"
									height="28"
									viewBox="0 0 28 28"
									fill="none"
									aria-hidden="true"
								>
									<path
										d="M7 14H20"
										stroke="currentColor"
										strokeWidth="1.6"
										strokeLinecap="round"
									/>
									<path
										d="M15 8.75L20.25 14L15 19.25"
										stroke="currentColor"
										strokeWidth="1.6"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</button>
						</form>
					</div>
				</div>
			</div>
		</footer>
	);
}
