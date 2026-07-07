'use client';

import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AuthModal } from '@/components/auth/AuthModal';
import { ClaiMark } from '@/components/icons/ClaiMark';
import { LogoutIcon } from '@/components/icons/LogoutIcon';
import { ProfileIcon } from '@/components/icons/ProfileIcon';
import { getFirebaseAuth } from '@/lib/firebase';

function getUserInitial(user: User) {
	const name = user.displayName ?? user.email ?? 'C';

	return name.trim().charAt(0).toUpperCase();
}

export function Header() {
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		return onAuthStateChanged(getFirebaseAuth(), setUser);
	}, []);

	async function handleLogout() {
		await signOut(getFirebaseAuth());
	}

	return (
		<>
			<header className="flex items-center justify-center px-4 py-10 z-20">
				<div className="w-[min(90vw,720px)] flex flex-col items-center gap-10 text-center text-white sm:gap-8">
					<nav
						className="mx-auto flex w-full items-center justify-between gap-4 rounded-full bg-white/10 backdrop-blur-[10px] px-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)] sm:p-2"
						aria-label="Primary navigation"
					>
						<Link
							href="/"
							className="flex min-w-0 items-center gap-3 text-white transition hover:opacity-90 ml-3"
							aria-label="CLAi home"
						>
							<ClaiMark className="h-9 w-10 shrink-0 text-[#D88435] sm:h-8 sm:w-8" />
							<span className="font-mackinac text-4xl font-normal leading-none sm:text-4xl">
								CLAi
							</span>
						</Link>
						<div className="flex shrink-0 items-center gap-3 sm:gap-8">
							{user ? (
								<div className="group relative">
									<button
										type="button"
										className="grid size-12 font-medium font-antique-legacy text-[#FFFFFF]/50 shadow-[0_20px_70px_rgba(255,111,24,0.05),inset_0_1px_0_rgba(255,255,255,0.08)] grid size-12 place-items-center rounded-full bg-white/10 transition focus:outline-none"
										aria-label="Open account menu"
									>
										{getUserInitial(user)}
									</button>
									<div className="invisible absolute right-[-10px] top-[100%] w-44 rounded-3xl bg-[#292929] p-2 text-left opacity-0 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-[10px] transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
										<Link
											href="/profile"
											className="flex items-center gap-3 rounded-2xl px-4 py-3 font-antique-legacy text-[1.1rem] text-white/70 transition hover:bg-white/10 hover:text-white"
										>
											<ProfileIcon className="size-5 shrink-0" />
											Profile
										</Link>
										<button
											type="button"
											onClick={handleLogout}
											className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-antique-legacy text-[1.1rem] text-white/70 transition hover:bg-white/10 hover:text-white"
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
										className="font-antique-legacy text-base font-medium text-white decoration-white/80 transition hover:text-white/80 sm:text-lg"
									>
										Login
									</button>
									<Link
										href="/#footer"
										className="flex items-center h-12 tracking-[-.02em] rounded-full bg-[#F47016] px-5 text-base font-medium text-white transition hover:bg-[#F47016] focus:outline-none focus:ring-2 focus:ring-[#ffb178] sm:px-6 sm:text-lg"
									>
										Join the waitlist
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
		</>
	);
}
