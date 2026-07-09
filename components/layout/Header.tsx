'use client';

import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AuthModal } from '@/components/auth/AuthModal';
import { ProfileModal } from '@/components/auth/ProfileModal';
import { ClaiMark } from '@/components/icons/ClaiMark';
import { LogoutIcon } from '@/components/icons/LogoutIcon';
import { ProfileIcon } from '@/components/icons/ProfileIcon';
import { useToast } from '@/components/toast/ToastProvider';
import { getFirebaseAuth } from '@/lib/firebase';

function getUserInitial(user: User) {
	const name = user.displayName ?? user.email ?? 'C';

	return name.trim().charAt(0).toUpperCase();
}

export function Header() {
	const toast = useToast();
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		return onAuthStateChanged(getFirebaseAuth(), setUser);
	}, []);

	async function handleLogout() {
		await signOut(getFirebaseAuth());
		setIsProfileModalOpen(false);
		toast.success('Logged out of CLAi.');
	}

	return (
		<>
			<header className="z-20 flex items-center justify-center px-3 py-5 sm:px-4 sm:py-10">
				<div className="flex w-[min(94vw,720px)] flex-col items-center gap-10 text-center text-white sm:gap-8">
					<nav
						className="mx-auto flex w-full items-center justify-between gap-2 rounded-full bg-white/10 px-1 py-1 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-[10px] sm:gap-4 sm:p-2"
						aria-label="Primary navigation"
					>
						<Link
							href="/"
							className="ml-1 flex min-w-0 items-center gap-2 text-white transition hover:opacity-90 sm:ml-3 sm:gap-3"
							aria-label="CLAi home"
						>
							<ClaiMark className="h-7 w-8 shrink-0 text-[#D88435] sm:h-8 sm:w-8" />
							<span className="font-mackinac text-[1.85rem] font-normal leading-none sm:text-4xl">
								CLAi
							</span>
						</Link>
						<div className="flex shrink-0 items-center gap-2 sm:gap-2">
							{user ? (
								<div className="group relative">
									<button
										type="button"
										className="grid size-10 place-items-center rounded-full bg-white/10 font-antique-legacy font-medium text-[#FFFFFF]/50 shadow-[0_20px_70px_rgba(255,111,24,0.05),inset_0_1px_0_rgba(255,255,255,0.08)] transition focus:outline-none sm:size-12"
										aria-label="Open account menu"
									>
										{getUserInitial(user)}
									</button>
									<div className="invisible absolute right-[-10px] top-[100%] w-35 rounded-3xl bg-[#292929] p-2 text-left opacity-0 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-[10px] transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
										<button
											type="button"
											onClick={() =>
												setIsProfileModalOpen(true)
											}
											className="flex w-full items-center gap-3 rounded-2xl px-4 py-2 text-left font-antique-legacy text-[1.1rem] text-white/70 transition hover:bg-white/10 hover:text-white"
										>
											<ProfileIcon className="size-5 shrink-0" />
											Profile
										</button>
										<button
											type="button"
											onClick={handleLogout}
											className="flex w-full items-center gap-3 rounded-2xl px-4 py-2 text-left font-antique-legacy text-[1.1rem] text-white/70 transition hover:bg-white/10 hover:text-white"
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
										className="flex h-10 items-center whitespace-nowrap rounded-full bg-white/10 text-[#FFFFFF]/50 shadow-[0_20px_70px_rgba(255,111,24,0.05),inset_0_1px_0_rgba(255,255,255,0.08)] px-4 text-sm font-medium tracking-[-.02em] sm:h-12 sm:px-6 sm:text-lg"
									>
										Login
									</button>
									<Link
										href="/#footer"
										className="flex h-10 items-center whitespace-nowrap rounded-full bg-[#F47016] px-4 text-sm font-medium tracking-[-.02em] text-white transition hover:bg-[#F47016] sm:h-12 sm:px-6 sm:text-lg"
									>
										<span className="sm:hidden">
											Waitlist
										</span>
										<span className="hidden sm:inline">
											Join the waitlist
										</span>
									</Link>
								</>
							)}
						</div>
					</nav>
				</div>
			</header>
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
			/>
			<ProfileModal
				isOpen={isProfileModalOpen}
				onClose={() => setIsProfileModalOpen(false)}
				onLogout={handleLogout}
				user={user}
			/>
		</>
	);
}
