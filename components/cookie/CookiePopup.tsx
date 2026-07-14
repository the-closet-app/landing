'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { Theme } from '@/components/theme/ThemeProvider';

type CookiePopupProps = {
	variant: Theme;
};

const cookieConsentKey = 'clai-cookie-consent';

export function CookiePopup({ variant }: CookiePopupProps) {
	const [isVisible, setIsVisible] = useState(false);
	const isLight = variant === 'light';

	useEffect(() => {
		const savedConsent = window.localStorage.getItem(cookieConsentKey);
		let frameId: number | null = null;

		if (!savedConsent) {
			frameId = window.requestAnimationFrame(() => {
				setIsVisible(true);
			});
		}

		return () => {
			if (frameId) {
				window.cancelAnimationFrame(frameId);
			}
		};
	}, []);

	function saveConsent(choice: 'accepted' | 'rejected') {
		window.localStorage.setItem(cookieConsentKey, choice);
		setIsVisible(false);
	}

	if (!isVisible) {
		return null;
	}

	return (
		<div className="fixed bottom-4 left-1/2 z-[2147483645] w-[min(calc(100vw-2rem),560px)] -translate-x-1/2 px-0 sm:bottom-6">
			<div
				className={`rounded-[1.25rem] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-6 ${
					isLight
						? 'bg-white text-[#1C1C1C]'
						: 'bg-[#292929] text-white'
				}`}
			>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<h2 className="font-mackinac text-2xl font-normal leading-[1.05] tracking-[-.04em]">
							We use cookies
						</h2>
						<p
							className={`font-antique-legacy text-base leading-[1.4] tracking-[-.02em] ${
								isLight ? 'text-[#1C1C1C]/65' : 'text-white/60'
							}`}
						>
							CLAi uses necessary cookies to make the site work
							and may use non-essential cookies to improve the
							experience. You can accept or reject non-essential
							cookies.
						</p>
						<Link
							href="/cookie-notice"
							className="w-fit font-antique-legacy text-sm font-medium tracking-[-.01em] text-[#F47016] transition hover:opacity-75"
						>
							Read our Cookie Notice
						</Link>
					</div>
					<div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={() => saveConsent('rejected')}
							className={`h-11 rounded-full px-5 font-antique-legacy text-base font-medium transition ${
								isLight
									? 'bg-[#1C1C1C]/5 text-[#1C1C1C]/70 hover:bg-[#1C1C1C]/10'
									: 'bg-white/10 text-white/70 hover:bg-white/15'
							}`}
						>
							Reject
						</button>
						<button
							type="button"
							onClick={() => saveConsent('accepted')}
							className="h-11 rounded-full bg-[#F47016] px-5 font-antique-legacy text-base font-medium text-white transition hover:bg-[#E19245]"
						>
							Accept
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
