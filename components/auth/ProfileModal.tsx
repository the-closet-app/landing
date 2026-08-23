'use client';

import type { User } from 'firebase/auth';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import { ClaiMark } from '@/components/icons/ClaiMark';
import { useToast } from '@/components/toast/ToastProvider';
import {
	getStyleProfileErrorMessage,
	getStyleProfile,
	saveStyleProfile,
	type StyleProfileInput,
} from '@/lib/style-profile';

type ProfileModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onLogout: () => Promise<void>;
	user: User | null;
	variant?: 'dark' | 'light';
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

export function ProfileModal({
	isOpen,
	onClose,
	onLogout,
	user,
	variant = 'dark',
}: ProfileModalProps) {
	const toast = useToast();
	const isLight = variant === 'light';
	const [usage, setUsage] = useState<DailyUsage | null>(null);
	const [isLoadingUsage, setIsLoadingUsage] = useState(false);
	const [isLoadingProfile, setIsLoadingProfile] = useState(false);
	const [isSavingProfile, setIsSavingProfile] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [styleProfile, setStyleProfile] = useState<StyleProfileInput>({
		gender: '',
	});
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

	useEffect(() => {
		if (!isOpen || !user) {
			return;
		}

		let isActive = true;
		const currentUser = user;

		async function loadProfile() {
			setIsLoadingProfile(true);

			try {
				const profile = await getStyleProfile(currentUser);

				if (isActive) {
					setStyleProfile({
						gender: profile?.gender ?? '',
					});
				}
			} catch {
				if (isActive) {
					toast.error('Unable to load your style profile right now.');
				}
			} finally {
				if (isActive) {
					setIsLoadingProfile(false);
				}
			}
		}

		void loadProfile();

		return () => {
			isActive = false;
		};
	}, [isOpen, toast, user]);

	if (!isOpen || !isMounted || !user) {
		return null;
	}

	const activeUser = user;
	const modalTextColor = isLight ? 'text-[#1C1C1C]' : 'text-white';
	const labelTextColor = isLight ? 'text-[#1C1C1C]/35' : 'text-white/20';
	const valueTextColor = isLight ? 'text-[#1C1C1C]/80' : 'text-white/80';
	const inputClassName = `h-[48px] rounded-[32px] px-5 font-antique-legacy text-base outline-none transition sm:h-[52px] sm:px-6 sm:text-[1.05rem] ${
		isLight
			? 'bg-[#1C1C1C]/5 text-[#1C1C1C] placeholder:text-[#1C1C1C]/35'
			: 'bg-white/10 text-white placeholder:text-white/35'
	}`;

	async function handleLogout() {
		setIsLoggingOut(true);

		try {
			await onLogout();
			onClose();
		} finally {
			setIsLoggingOut(false);
		}
	}

	async function handleSaveStyleProfile() {
		setIsSavingProfile(true);

		try {
			await saveStyleProfile(activeUser, styleProfile);
			toast.success('Style profile saved.');
		} catch (error) {
			toast.error(getStyleProfileErrorMessage(error));
		} finally {
			setIsSavingProfile(false);
		}
	}

	function updateStyleProfile(field: keyof StyleProfileInput, value: string) {
		setStyleProfile((currentProfile) => ({
			...currentProfile,
			[field]: value,
		}));
	}

	return createPortal(
		<div
			className={`fixed inset-0 z-[2147483646] flex h-dvh w-dvw items-center justify-center overflow-y-auto px-3 py-4 backdrop-blur-sm sm:px-4 ${
				isLight ? 'bg-white/82' : 'bg-[#1C1C1C]/95'
			}`}
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
			<div
				className={`relative my-auto w-full max-w-[420px] rounded-[28px] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:rounded-[34px] sm:p-10 ${
					isLight
						? 'bg-white text-[#1C1C1C]'
						: 'bg-[#292929] text-white'
				}`}
			>
				<div className="mb-8 flex items-center justify-between gap-4 sm:mb-10 sm:gap-6">
					<h2
						id="profile-modal-title"
						className={`m-auto flex items-center gap-3 text-center font-mackinac text-3xl font-normal leading-none tracking-[-.04em] sm:text-4xl ${modalTextColor}`}
					>
						<ClaiMark className="h-8 w-9 shrink-0 text-[#D88435] sm:h-8 sm:w-8" />
						<span>Your Profile</span>
					</h2>
				</div>

				<div className="flex flex-col gap-4 font-antique-legacy">
					<div>
						<p
							className={`text-[0.8rem] uppercase tracking-[.08em] ${labelTextColor}`}
						>
							Name
						</p>
						<p
							className={`break-words text-base tracking-[-.02em] sm:text-[1.1rem] ${valueTextColor}`}
						>
							{getDisplayName(user)}
						</p>
					</div>
					<div>
						<p
							className={`text-[0.8rem] uppercase tracking-[.08em] ${labelTextColor}`}
						>
							Email
						</p>
						<p
							className={`break-all text-base tracking-[-.02em] sm:text-[1.1rem] ${valueTextColor}`}
						>
							{user.email}
						</p>
					</div>
					<div>
						<p
							className={`text-[0.8rem] uppercase tracking-[.08em] ${labelTextColor}`}
						>
							Daily CLAi messages
						</p>
						<p
							className={`text-base tracking-[-.02em] sm:text-[1.1rem] ${valueTextColor}`}
						>
							{isLoadingUsage
								? 'Loading usage...'
								: usage
									? `${usage.used} of ${usage.limit} used today`
									: 'Usage unavailable'}
						</p>
						<div
							className={`mt-2 h-2 overflow-hidden rounded-full ${
								isLight ? 'bg-[#1C1C1C]/10' : 'bg-white/10'
							}`}
						>
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
					</div>
					<div className="border-t border-white/10 pt-4">
						<h3
							className={`text-[1.8rem] capatalize font-mackinac tracking-[-.02em] text-center`}
						>
							Style profile
						</h3>
						<div className="mt-4 flex flex-col gap-2">
							<p className="mb-2 flex flex-col">
								<label
									className={`text-[0.8rem] mb-2 uppercase tracking-[.08em] ${labelTextColor}`}
								>
									Gender/style presentation
								</label>
								<input
									type="text"
									value={styleProfile.gender}
									onChange={(event) =>
										updateStyleProfile(
											'gender',
											event.target.value
										)
									}
									disabled={isLoadingProfile}
									className={inputClassName}
									placeholder="e.g. femme, masc, neutral..."
								/>
							</p>

							<button
								type="button"
								onClick={handleSaveStyleProfile}
								disabled={isLoadingProfile || isSavingProfile}
								className="mt-3 h-[52px] w-full rounded-full bg-[#F47016] px-6 font-antique-legacy text-lg font-medium tracking-[-.02em] text-white transition hover:bg-[#F47016] disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:text-[1.2rem]"
							>
								{isSavingProfile
									? 'Saving...'
									: isLoadingProfile
										? 'Loading...'
										: 'Save style profile'}
							</button>
						</div>
					</div>
				</div>
				<p
					className={`mt-1 text-[1rem] leading-[1.35] text-center tracking-[-.02em]`}
				>
					<button
						type="button"
						onClick={handleLogout}
						disabled={isLoggingOut}
						className="mt-4 text-center text-[1rem] transition hover:text-[#F47016] disabled:cursor-not-allowed disabled:opacity-60 w-full"
					>
						{isLoggingOut ? 'Logging out...' : 'Logout'}
					</button>
				</p>
			</div>
		</div>,
		document.body
	);
}
