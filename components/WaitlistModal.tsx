'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';

type WaitlistModalProps = {
	isOpen: boolean;
	onClose: () => void;
};

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState('');
	const [status, setStatus] = useState<'error' | 'idle' | 'success'>('idle');
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				onClose();
			}
		}

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen, onClose]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		return () => {
			document.body.style.overflow = originalOverflow;
		};
	}, [isOpen]);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setMessage('');
		setStatus('idle');
		setIsSubmitting(true);

		try {
			const response = await fetch('/api/waitlist', {
				body: JSON.stringify({ email }),
				headers: {
					'Content-Type': 'application/json',
				},
				method: 'POST',
			});
			const data = (await response.json()) as { error?: string };

			if (!response.ok) {
				throw new Error(data.error ?? 'Unable to join the waitlist.');
			}

			setEmail('');
			setStatus('success');
			setMessage("You're on the CLAi waitlist.");
		} catch (error) {
			setStatus('error');
			setMessage(
				error instanceof Error
					? error.message
					: 'Unable to join the waitlist.'
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	if (!isOpen) {
		return null;
	}

	return (
		<div
			aria-labelledby="waitlist-title"
			aria-modal="true"
			className="fixed inset-0 z-50 flex min-h-dvh items-start justify-center overflow-y-auto bg-[#1C1C1C]/90 px-4 py-16 text-white backdrop-blur-md sm:items-center sm:py-6"
			role="dialog"
		>
			<button
				aria-label="Close waitlist modal"
				className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-white/10 text-2xl leading-none text-white/75 transition hover:bg-white/15 hover:text-white"
				onClick={onClose}
				type="button"
			>
				×
			</button>
			<div className="grid w-full max-w-[1100px] items-center gap-8 rounded-[28px] p-4 sm:p-8 md:grid-cols-[minmax(0,1fr)_minmax(300px,440px)]">
				<div className="flex min-w-0 flex-col gap-4">
					<div className="flex flex-col gap-3">
						<h2
							className="font-mackinac text-[clamp(2.6rem,12vw,4rem)] font-normal leading-[0.95] tracking-[-.05em]"
							id="waitlist-title"
						>
							Join the waitlist
						</h2>
						<p className="max-w-[520px] font-antique-legacy text-base leading-[1.45] tracking-[-.02em] text-white/60 sm:text-[1.15rem]">
							Be the first to experience smarter, more personal
							styling. Join the waitlist for early access.
						</p>
					</div>
					<form
						className="flex h-14 w-full min-w-0 max-w-[560px] items-center rounded-full bg-white/10 px-2 pr-[4px] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-md sm:h-[64px] sm:pl-3 sm:pr-2"
						onSubmit={handleSubmit}
					>
						<label className="sr-only" htmlFor="waitlist-email">
							Email address
						</label>
						<input
							autoComplete="email"
							className="min-w-0 flex-1 px-3 font-antique-legacy text-base font-normal tracking-[-.03em] text-white outline-none placeholder:text-white/55 sm:px-5 sm:text-[1.1rem]"
							id="waitlist-email"
							onChange={(event) => setEmail(event.target.value)}
							placeholder="Your email address"
							type="email"
							value={email}
						/>
						<button
							aria-label="Join waitlist"
							className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F47016] text-white transition hover:bg-[#E19245] focus:outline-none focus:ring-2 focus:ring-[#F4B77B] disabled:cursor-not-allowed disabled:opacity-60 sm:size-12"
							disabled={isSubmitting}
							type="submit"
						>
							<svg
								aria-hidden="true"
								className={isSubmitting ? 'animate-pulse' : ''}
								fill="none"
								height="28"
								viewBox="0 0 28 28"
								width="28"
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
					{message ? (
						<p
							className={`font-antique-legacy text-base tracking-[-.02em] ${
								status === 'success'
									? 'text-[#8BD59E]'
									: 'text-[#F4B77B]'
							}`}
						>
							{message}
						</p>
					) : null}
				</div>
				<div className="relative hidden aspect-[4/3] min-h-[320px] overflow-hidden rounded-[26px] md:block">
					<Image
						alt=""
						className="object-cover"
						fill
						priority={false}
						sizes="(min-width: 1024px) 440px, 40vw"
						src="/clai-back.jpg"
					/>
					<div className="absolute inset-0 bg-[#1c1c1c]/25" />
				</div>
			</div>
		</div>
	);
}
