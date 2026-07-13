import Image from 'next/image';

type WaitlistContentProps = {
	emailInputId: string;
	variant?: 'dark' | 'light';
};

export function WaitlistContent({
	emailInputId,
	variant = 'dark',
}: WaitlistContentProps) {
	const isLight = variant === 'light';

	return (
		<div
			className={`grid w-full max-w-[1280px] items-center gap-8 rounded-[28px] p-6 sm:rounded-[34px] sm:p-10 md:grid-cols-[minmax(0,1fr)_minmax(320px,520px)] lg:p-12 ${
				isLight ? 'text-[#1C1C1C]' : 'text-white'
			}`}
		>
			<div className="flex min-w-0 flex-col gap-2 px-10">
				<h2 className="mb-4 font-mackinac text-2xl font-normal tracking-[-.04em] text-5xl">
					Join the waitlist
				</h2>
				<p
					className={`font-antique-legacy text-base leading-[1.5rem] tracking-[-.02em] sm:text-[1.15rem] text-[1.1rem] ${
						isLight ? 'text-[#1C1C1C]/60' : 'text-white/50'
					}`}
				>
					Be the first to experience smarter, more personalized
					styling. Join the waitlist for early access.
				</p>
				<form
					className={`mt-5 flex h-14 w-full items-center rounded-full border-[0.5] px-2 pr-[4px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_80px_rgba(0,0,0,0.1)] backdrop-blur-md sm:h-[64px] sm:pl-3 sm:pr-2 ${
						isLight
							? 'border-[#1C1C1C]/5 bg-[#1C1C1C]/5'
							: 'border-[#e5e5e5]/5 bg-[white]/10'
					}`}
				>
					<label className="sr-only" htmlFor={emailInputId}>
						Email address
					</label>
					<input
						id={emailInputId}
						type="email"
						placeholder="Your email address"
						className={`min-w-0 flex-1 px-3 font-antique-legacy text-base font-normal tracking-[-.03em] outline-none sm:px-5 sm:text-[1.1rem] ${
							isLight
								? 'text-[#1C1C1C] placeholder:text-[#1C1C1C]/45'
								: 'text-white placeholder:text-white/55'
						}`}
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
								strokeLinecap="round"
								strokeWidth="1.6"
							/>
							<path
								d="M15 8.75L20.25 14L15 19.25"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="1.6"
							/>
						</svg>
					</button>
				</form>
			</div>
			<div className="relative hidden aspect-[4/3] min-h-[320px] overflow-hidden rounded-[26px] md:block lg:min-h-[420px]">
				<Image
					alt=""
					className="object-cover"
					fill
					priority={false}
					sizes="(min-width: 1024px) 520px, 40vw"
					src="/pexels.webp"
				/>
				<div className="absolute inset-0 bg-[#1c1c1c]/25" />
			</div>
		</div>
	);
}
