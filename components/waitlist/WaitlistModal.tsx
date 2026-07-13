'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import { WaitlistContent } from '@/components/waitlist/WaitlistContent';

type WaitlistModalProps = {
	isOpen: boolean;
	onClose: () => void;
	variant?: 'dark' | 'light';
};

function subscribeToClient() {
	return () => {};
}

function getClientSnapshot() {
	return true;
}

function getServerSnapshot() {
	return false;
}

export function WaitlistModal({
	isOpen,
	onClose,
	variant = 'dark',
}: WaitlistModalProps) {
	const isMounted = useSyncExternalStore(
		subscribeToClient,
		getClientSnapshot,
		getServerSnapshot
	);

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

	if (!isOpen || !isMounted) {
		return null;
	}

	const isLight = variant === 'light';

	return createPortal(
		<div
			aria-labelledby="waitlist-modal-title"
			aria-modal="true"
			className={`fixed inset-0 z-[2147483646] flex h-dvh items-center justify-center overflow-y-auto px-3 py-4 backdrop-blur-sm sm:px-4 ${
				isLight
					? 'bg-white/82 text-[#1C1C1C]'
					: 'bg-[#1C1C1C]/95 text-white'
			}`}
			role="dialog"
		>
			<button
				aria-label="Close waitlist modal"
				className={`absolute right-5 top-5 grid size-8 place-items-center rounded-full text-xl leading-none transition ${
					isLight
						? 'bg-[#1C1C1C]/10 text-[#1C1C1C]/70 hover:bg-[#1C1C1C]/15 hover:text-[#1C1C1C]'
						: 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
				}`}
				onClick={onClose}
				type="button"
			>
				×
			</button>
			<div className="w-full max-w-[1280px]" id="waitlist-modal-title">
				<WaitlistContent
					emailInputId="waitlist-modal-email"
					variant={variant}
				/>
			</div>
		</div>,
		document.body
	);
}
