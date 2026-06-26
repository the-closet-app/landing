import { ClaiMark } from '@/components/icons/ClaiMark';

export function Footer() {
	return (
		<footer id="footer" className="relative z-10 text-white">
			<div className="relative mx-auto flex w-full max-w-[1280px] overflow-hidden mt-40 mb-20">
				<div className="relative z-10 mx-auto grid justify-between w-full items-center gap-14 px-6 pb-10 pt-10 sm:px-12 sm:pb-16 lg:grid-cols-[minmax(0,540px)_minmax(420px,460px)] lg:gap-32">
					<div className="flex flex-col gap-8">
						<div className="flex items-center gap-3">
							<ClaiMark className="h-9 w-10 text-white" />
							<span className="font-mackinac text-4xl leading-none tracking-[-.02em]">
								CLAi
							</span>
						</div>
						<p className="max-w-[560px] font-antique-legacy text-lg font-medium leading-[1.4] tracking-[-.02em] text-white/50 sm:text-[1.1rem]">
							CLAi is your personal AI styling assistant, designed to help you make better decisions with what you wear. From answering everyday fashion questions to
							guiding more intentional use of your wardrobe, CLAi provides thoughtful, context-aware support tailored to you.
						</p>
						<p className="font-antique-legacy font-normal tracking-[-.02em] text-white/50 sm:text-[1.1rem]">
							&copy; 2026 CLAi. All rights reserved.
						</p>
					</div>
					<div className="flex flex-col gap-6">
						<h2 className="font-mackinac text-3xl font-normal tracking-[-.04em] sm:text-3xl">
							Join the waitlist
						</h2>
						<form className="flex h-14 w-full pr-[4px] items-center rounded-full border-[0.5] border-[#e5e5e5]/5 bg-[white]/10 px-3 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-md sm:h-[64px]">
							<label className="sr-only" htmlFor="footer-email">
								Email address
							</label>
							<input
								id="footer-email"
								type="email"
								placeholder="Your email address"
								className="min-w-0 flex-1 px-5 font-antique-legacy font-normal tracking-[-.03em] text-white outline-none placeholder:text-white/55 sm:text-[1.1rem]"
							/>
							<button
								type="submit"
								className="grid size-12 shrink-0 place-items-center rounded-full bg-[#F47016] text-white transition hover:bg-[#E19245] focus:outline-none focus:ring-2 focus:ring-[#F4B77B] sm:size-14"
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
