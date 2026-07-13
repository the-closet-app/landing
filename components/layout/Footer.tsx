import { ClaiMark } from '@/components/icons/ClaiMark';
import Link from 'next/link';

export function Footer() {
	return (
		<footer id="footer" className="relative z-10 text-white">
			<div className="relative mx-auto mt-20 mb-10 flex w-full max-w-[1280px] overflow-hidden sm:mt-32 sm:mb-16 lg:mt-40 lg:mb-20">
				<div className="relative z-10 mx-auto flex w-full flex-col justify-between gap-10 px-5 pb-10 pt-10 md:flex-row sm:px-12 sm:pb-16 lg:gap-16">
					<div className="flex flex-col gap-5 sm:gap-5">
						<div className="flex items-center gap-3">
							<ClaiMark className="h-8 w-9 text-white sm:h-9 sm:w-10" />
							<span className="font-mackinac text-3xl leading-none tracking-[-.02em] sm:text-4xl">
								CLAi
							</span>
						</div>
						<p className="sm:max-w-[560px] font-antique-legacy text-base font-medium leading-[1.45] tracking-[-.02em] text-white/50 sm:text-[1.1rem]">
							CLAi exists to help consumers, creators, and brands
							make better fashion decisions - through
							intelligence, insight, psychology, and guidance.
						</p>
						<p className="font-antique-legacy text-base font-normal tracking-[-.02em] text-white/50 sm:text-[1.1rem]">
							<Link
								href="/about"
								className="hover:text-[white]/65 mr-1"
							>
								About CLAi
							</Link>
							{' · '}
							<Link
								href="/privacy-policy"
								className="hover:text-[white]/65 mx-1"
							>
								Privacy Policy
							</Link>
							{' · '}
							<Link
								href="/terms-of-service"
								className="hover:text-[white]/65 mx-1"
							>
								Terms of Service
							</Link>
						</p>
						<p className="font-antique-legacy text-base font-normal tracking-[-.02em] text-white/50 sm:text-[1.1rem]">
							&copy; 2026 CLAi. All rights reserved.
						</p>
					</div>
					<div className="flex flex-col md:max-w-[500px]">
						<h2 className="mb-3 font-mackinac text-2xl font-normal tracking-[-.04em] sm:text-3xl">
							Share your feedback
						</h2>
						<p className="font-antique-legacy text-base text-white/50 sm:text-[1.1rem]">
							CLAi is still learning. <Link href="https://docs.google.com/forms/d/e/1FAIpQLSe7TKRdTqlKw7bIA2wAEukMCemsdVtyrjHBPaSqNjKqGBCAiQ/viewform?usp=preview" className="text-[#F47016]/70" target="_blank">Share</Link> what felt useful, confusing, or missing so we can make the experience better.
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
