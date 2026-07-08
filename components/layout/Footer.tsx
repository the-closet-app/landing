import { ClaiMark } from '@/components/icons/ClaiMark';

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
							CLAi is your personal AI styling assistant, designed
							to help you make better decisions with what you
							wear. From answering everyday fashion questions to
							guiding more intentional use of your wardrobe, CLAi
							provides thoughtful, context-aware support tailored
							to you.
						</p>
						<p className="font-antique-legacy text-base font-normal tracking-[-.02em] text-white/50 sm:text-[1.1rem]">
							&copy; 2026 CLAi. All rights reserved.
						</p>
					</div>
					<div className="flex flex-col gap-6 md:min-w-[420px]">
						<h2 className="font-mackinac text-2xl font-normal tracking-[-.04em] sm:text-3xl">
							Join the waitlist
						</h2>
						<form className="flex h-14 w-full items-center rounded-full border-[0.5] border-[#e5e5e5]/5 bg-[white]/10 px-2 pr-[4px] shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-md sm:h-[64px] sm:pl-3 sm:pr-2">
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
