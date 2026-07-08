'use client';

import { sendEmailVerification, type User } from 'firebase/auth';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import { ClaiMark } from '@/components/icons/ClaiMark';
import { useToast } from '@/components/toast/ToastProvider';

type ProfileModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onLogout: () => Promise<void>;
	user: User | null;
};

type DailyUsage = {
	date: string;
	limit: number;
	remaining: number;
	used: number;
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

function getDisplayName(user: User | null) {
	return user?.displayName || user?.email || 'CLAi user';
}

function getProviderLabel(user: User) {
	const providerId = user.providerData[0]?.providerId;

	if (providerId === 'google.com') {
		return 'Google';
	}

	if (providerId === 'password') {
		return 'Email and password';
	}

	return 'CLAi account';
}

export function ProfileModal({
	isOpen,
	onClose,
	onLogout,
	user,
}: ProfileModalProps) {
	const toast = useToast();
	const [usage, setUsage] = useState<DailyUsage | null>(null);
	const [isLoadingUsage, setIsLoadingUsage] = useState(false);
	const [isSendingVerification, setIsSendingVerification] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
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

	useEffect(() => {
		if (!isOpen || !user) {
			return;
		}

		let isActive = true;
		const currentUser = user;

		async function loadUsage() {
			setIsLoadingUsage(true);

			try {
				const idToken = await currentUser.getIdToken();
				const response = await fetch('/api/usage', {
					headers: {
						Authorization: `Bearer ${idToken}`,
					},
				});
				const data = (await response.json()) as
					| DailyUsage
					| { error?: string };

				if (!response.ok) {
					throw new Error(
						'error' in data && data.error
							? data.error
							: 'Unable to load usage right now.'
					);
				}

				if (isActive) {
					setUsage(data as DailyUsage);
				}
			} catch (error) {
				if (isActive) {
					toast.error(
						error instanceof Error
							? error.message
							: 'Unable to load usage right now.'
					);
				}
			} finally {
				if (isActive) {
					setIsLoadingUsage(false);
				}
			}
		}

		void loadUsage();

		return () => {
			isActive = false;
		};
	}, [isOpen, toast, user]);

	if (!isOpen || !isMounted || !user) {
		return null;
	}

	async function handleResendVerification() {
		if (!user) {
			return;
		}

		const currentUser = user;
		setIsSendingVerification(true);

		try {
			await sendEmailVerification(currentUser);
			toast.success('Verification email sent. Check your inbox.');
		} catch {
			toast.error('We could not send the verification email right now.');
		} finally {
			setIsSendingVerification(false);
		}
	}

	async function handleLogout() {
		setIsLoggingOut(true);

		try {
			await onLogout();
			onClose();
		} finally {
			setIsLoggingOut(false);
		}
	}

	return createPortal(
		<div
			className="fixed inset-0 z-[2147483646] flex h-dvh w-dvw items-center justify-center overflow-hidden bg-[#1C1C1C]/95 px-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-labelledby="profile-modal-title"
		>
			<button
				type="button"
				className="absolute inset-0 cursor-default"
				aria-label="Close profile modal"
				onClick={onClose}
			/>
			<div className="relative w-full max-w-[420px] rounded-[34px] bg-[#292929] p-8 text-white sm:p-10">
				<div className="mb-10 flex items-center justify-between gap-6">
					<h2
						id="profile-modal-title"
						className="font-mackinac m-auto flex items-center gap-3 text-center text-4xl font-normal leading-none tracking-[-.04em] text-white"
					>
						<ClaiMark className="h-9 w-10 shrink-0 text-[#D88435] sm:h-8 sm:w-8" />
						<span>Your Profile</span>
					</h2>
				</div>

				<div className="flex flex-col gap-4 font-antique-legacy">
					<div>
						<p className="text-sm tracking-[-.02em] text-white/35">
							Name
						</p>
						<p className="text-[1.1rem] tracking-[-.02em] text-white">
							{getDisplayName(user)}
						</p>
					</div>
					<div>
						<p className="text-sm tracking-[-.02em] text-white/35">
							Email
						</p>
						<p className="mt-1 break-words text-[1.1rem] tracking-[-.02em] text-white">
							{user.email}
						</p>
					</div>
					<div>
						<p className="text-sm tracking-[-.02em] text-white/35">
							Sign-in method
						</p>
						<p className="mt-1 text-[1.1rem] tracking-[-.02em] text-white">
							{getProviderLabel(user)}
						</p>
					</div>
					<div>
						<p className="text-sm tracking-[-.02em] text-white/35">
							Email verification
						</p>
						<p className="mt-1 text-[1.1rem] tracking-[-.02em] text-white">
							{user.emailVerified
								? 'Verified'
								: 'Not verified yet'}
						</p>
						{!user.emailVerified ? (
							<button
								type="button"
								onClick={handleResendVerification}
								disabled={isSendingVerification}
								className="mt-4 rounded-full bg-[#F47016] px-5 py-2 text-base font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isSendingVerification
									? 'Sending...'
									: 'Resend verification email'}
							</button>
						) : null}
					</div>
					<div>
						<p className="text-sm tracking-[-.02em] text-white/35">
							Daily CLAi messages
						</p>
						<p className="mt-1 text-[1.1rem] tracking-[-.02em] text-white">
							{isLoadingUsage
								? 'Loading usage...'
								: usage
									? `${usage.used} of ${usage.limit} used today`
									: 'Usage unavailable'}
						</p>
						<div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
							<div
								className="h-full rounded-full bg-[#F47016] transition-[width]"
								style={{
									width: usage
										? `${Math.min(
												100,
												(usage.used / usage.limit) * 100
											)}%`
										: '0%',
								}}
							/>
						</div>
						{usage ? (
							<p className="mt-3 text-sm tracking-[-.02em] text-white/35">
								{usage.remaining} remaining
							</p>
						) : null}
					</div>
				</div>

				<button
					type="button"
					onClick={handleLogout}
					disabled={isLoggingOut}
					className="mt-6 h-14 w-full rounded-full bg-[#F47016] px-6 font-antique-legacy text-[1.2rem] font-medium tracking-[-.02em] text-white transition hover:bg-[#F47016] disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isLoggingOut ? 'Logging out...' : 'Logout'}
				</button>
			</div>
		</div>,
		document.body
	);
}
