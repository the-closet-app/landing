'use client';

import { useState } from 'react';

import { WaitlistModal } from '@/components/WaitlistModal';

export default function Home() {
	const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

	return (
		<>
			<main className="min-h-screen flex items-center justify-center px-4 py-10">
				<section className="w-[min(90vw,360px)] flex flex-col items-center gap-20 text-center text-white sm:gap-32">
					<h1 className="text-5xl sm:text-6xl font-normal tracking-[-.04em] font-mackinac z-10">
						Transforming your closet
					</h1>
					<button
						type="button"
						onClick={() => setIsWaitlistOpen(true)}
						className="bg-[#f47017] rounded-[100px] px-8 py-4 text-2xl sm:text-3xl font-medium font-antique-legacy z-10 tracking-[-.04em] transition focus:outline-none focus:ring-2 focus:ring-white/45"
					>
						<span>Join waitlist</span>
					</button>
					<h2 className="text-4xl sm:text-5xl font-medium font-antique-legacy z-10 tracking-[-.04em]">
						Into a personal decision engine.
					</h2>
				</section>
			</main>
			<WaitlistModal
				isOpen={isWaitlistOpen}
				onClose={() => setIsWaitlistOpen(false)}
			/>
		</>
	);
}
