'use client';

import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { AuthModal } from '@/components/auth/AuthModal';
import { ProfileModal } from '@/components/auth/ProfileModal';
import { ClaiMark } from '@/components/icons/ClaiMark';
import { LogoutIcon } from '@/components/icons/LogoutIcon';
import { ProfileIcon } from '@/components/icons/ProfileIcon';
import {
	ThemeToggle,
	useTheme,
	type Theme,
} from '@/components/theme/ThemeProvider';
import { useToast } from '@/components/toast/ToastProvider';
import { WaitlistModal } from '@/components/waitlist/WaitlistModal';
import { getFirebaseAuth } from '@/lib/firebase';

function getUserInitial(user: User) {
	const name = user.displayName ?? user.email ?? 'C';

	return name.trim().charAt(0).toUpperCase();
}

type HeaderProps = {
	variant?: Theme;
};

export function Header({ variant }: HeaderProps) {
	const { theme } = useTheme();
	const toast = useToast();
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
	const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
	const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
	const [user, setUser] = useState<User | null>(null);
	const accountMenuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		return onAuthStateChanged(getFirebaseAuth(), setUser);
	}, []);

	useEffect(() => {
		if (!isAccountMenuOpen) {
			return;
		}

		function handlePointerDown(event: PointerEvent) {
			if (
				accountMenuRef.current &&
				!accountMenuRef.current.contains(event.target as Node)
			) {
				setIsAccountMenuOpen(false);
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setIsAccountMenuOpen(false);
			}
		}

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isAccountMenuOpen]);

	async function handleLogout() {
		setIsAccountMenuOpen(false);
		await signOut(getFirebaseAuth());
		setIsProfileModalOpen(false);
		toast.success('Logged out of CLAi.');
	}

	const activeVariant = variant ?? theme;
	const isLight = activeVariant === 'light';

	return (
		<>
			<header className="z-20 flex items-center justify-center px-3 py-5 sm:px-4 sm:py-10">
				<div className="flex w-[min(94vw,720px)] flex-col items-center gap-10 text-center text-white sm:gap-8">
					<nav
						className={`mx-auto flex w-full items-center justify-between gap-2 rounded-full px-1 py-1 backdrop-blur-[10px] sm:gap-4 sm:p-2 ${
							isLight
								? 'bg-[#A6C8E8]/80 shadow-[0_18px_60px_rgba(67,122,191,0.16),inset_0_1px_0_rgba(255,255,255,0.38)]'
								: 'bg-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.18)]'
						}`}
						aria-label="Primary navigation"
					>
						<Link
							href="/"
							className="ml-1 flex min-w-0 items-center gap-2 text-white transition hover:opacity-90 sm:ml-3 sm:gap-3"
							aria-label="CLAi home"
						>
							<ClaiMark
								className={`h-7 w-8 shrink-0 sm:h-8 sm:w-8 ${
									isLight ? 'text-white' : 'text-[#D88435]'
								}`}
							/>
							<span className="font-mackinac text-[1.85rem] font-normal leading-none sm:text-4xl">
								CLAi
							</span>
						</Link>
						<div className="flex shrink-0 items-center gap-1 sm:gap-2">
							{user ? (
								<div ref={accountMenuRef} className="relative">
									<button
										type="button"
										onClick={() =>
											setIsAccountMenuOpen(
												(isOpen) => !isOpen
											)
										}
										className={`grid size-10 place-items-center rounded-full font-antique-legacy font-medium shadow-[0_20px_70px_rgba(255,111,24,0.05),inset_0_1px_0_rgba(255,255,255,0.08)] transition focus:outline-none sm:size-12 ${
											isLight
												? 'bg-white text-[#1C1C1C]'
												: 'bg-white/10 text-[#FFFFFF]/50'
										}`}
										aria-label="Open account menu"
										aria-expanded={isAccountMenuOpen}
									>
										{getUserInitial(user)}
									</button>
									<div
										className={`absolute right-[-10px] top-[calc(100%+0.5rem)] z-100 w-35 rounded-3xl p-2 text-left shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-[10px] transition ${
											isAccountMenuOpen
												? 'visible opacity-100'
												: 'invisible pointer-events-none opacity-0'
										} ${
											isLight
												? 'bg-white text-[#1C1C1C]'
												: 'bg-[#292929] text-white'
										}`}
									>
										<button
											type="button"
											onClick={() => {
												setIsAccountMenuOpen(false);
												setIsProfileModalOpen(true);
											}}
											className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2 text-left font-antique-legacy text-[1.1rem] transition ${
												isLight
													? 'text-[#1C1C1C]/70 hover:bg-[#F47016]/10 hover:text-[#1C1C1C]'
													: 'text-white/70 hover:bg-white/10 hover:text-white'
											}`}
										>
											<ProfileIcon className="size-5 shrink-0" />
											Profile
										</button>
										<button
											type="button"
											onClick={handleLogout}
											className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2 text-left font-antique-legacy text-[1.1rem] transition ${
												isLight
													? 'text-[#1C1C1C]/70 hover:bg-[#F47016]/10 hover:text-[#1C1C1C]'
													: 'text-white/70 hover:bg-white/10 hover:text-white'
											}`}
										>
											<LogoutIcon className="size-5 shrink-0" />
											Logout
										</button>
									</div>
								</div>
							) : (
								<>
									<button
										type="button"
										onClick={() => setIsAuthModalOpen(true)}
										className={`flex h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium tracking-[-.02em] shadow-[0_20px_70px_rgba(255,111,24,0.05),inset_0_1px_0_rgba(255,255,255,0.08)] sm:h-12 sm:px-6 sm:text-lg ${
											isLight
												? 'bg-transparent text-white'
												: 'bg-white/10 text-[#FFFFFF]/50'
										}`}
									>
										Login
									</button>
									<button
										type="button"
										onClick={() =>
											setIsWaitlistModalOpen(true)
										}
										className={`flex h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium tracking-[-.02em] transition sm:h-12 sm:px-6 sm:text-lg ${
											isLight
												? 'bg-white text-[#1C1C1C] shadow-[0_14px_30px_rgba(80,111,175,0.18)] hover:bg-white/90'
												: 'bg-[#F47016] text-white hover:bg-[#F47016]'
										}`}
									>
										<span className="sm:hidden">
											Waitlist
										</span>
										<span className="hidden sm:inline">
											Join the waitlist
										</span>
									</button>
								</>
							)}
							<ThemeToggle />
						</div>
					</nav>
				</div>
			</header>
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
				variant={activeVariant}
			/>
			<ProfileModal
				isOpen={isProfileModalOpen}
				onClose={() => setIsProfileModalOpen(false)}
				onLogout={handleLogout}
				user={user}
				variant={activeVariant}
			/>
			<WaitlistModal
				isOpen={isWaitlistModalOpen}
				onClose={() => setIsWaitlistModalOpen(false)}
				variant={activeVariant}
			/>
		</>
	);
}
