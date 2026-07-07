'use client';

import {
	onAuthStateChanged,
	sendEmailVerification,
	signOut,
	type User,
} from 'firebase/auth';
import { useEffect, useState } from 'react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getFirebaseAuth } from '@/lib/firebase';

function getDisplayName(user: User | null) {
	return user?.displayName || user?.email || 'CLAi user';
}

export default function ProfilePage() {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSendingVerification, setIsSendingVerification] = useState(false);
	const [message, setMessage] = useState('');

	useEffect(() => {
		return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
			setUser(nextUser);
			setIsLoading(false);
		});
	}, []);

	async function handleResendVerification() {
		if (!user) {
			return;
		}

		setIsSendingVerification(true);
		setMessage('');

		try {
			await sendEmailVerification(user);
			setMessage('Verification email sent. Check your inbox.');
		} catch {
			setMessage('We could not send the verification email right now.');
		} finally {
			setIsSendingVerification(false);
		}
	}

	async function handleLogout() {
		await signOut(getFirebaseAuth());
	}

	return (
		<>
			<Header />
			<main className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 pb-20 text-white">
				<section className="w-[min(90vw,720px)] rounded-[34px] bg-white/10 p-8 text-left shadow-[0_20px_70px_rgba(0,0,0,0.18)] backdrop-blur-[10px] sm:p-12">
					<p className="font-antique-legacy text-sm uppercase tracking-[0.2em] text-white/45">
						Profile
					</p>
					<h1 className="mt-4 font-mackinac text-5xl font-normal tracking-[-.04em] sm:text-6xl">
						Your CLAi Profile
					</h1>

					{isLoading ? (
						<p className="mt-6 font-antique-legacy text-lg tracking-[-.02em] text-white/65">
							Loading your account...
						</p>
					) : user ? (
						<div className="mt-8 space-y-5 font-antique-legacy text-lg tracking-[-.02em] text-white/70">
							<div className="rounded-3xl bg-[#1C1C1C]/45 p-5">
								<p className="text-sm text-white/45">Name</p>
								<p className="mt-1 text-white">
									{getDisplayName(user)}
								</p>
							</div>
							<div className="rounded-3xl bg-[#1C1C1C]/45 p-5">
								<p className="text-sm text-white/45">Email</p>
								<p className="mt-1 text-white">{user.email}</p>
							</div>
							<div className="rounded-3xl bg-[#1C1C1C]/45 p-5">
								<p className="text-sm text-white/45">
									Email verification
								</p>
								<p className="mt-1 text-white">
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
							{message ? (
								<p className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/75">
									{message}
								</p>
							) : null}
							<button
								type="button"
								onClick={handleLogout}
								className="rounded-full border border-white/15 px-5 py-2 text-base text-white/70 transition hover:bg-white/10 hover:text-white"
							>
								Logout
							</button>
						</div>
					) : (
						<p className="mt-6 font-antique-legacy text-lg tracking-[-.02em] text-white/65">
							Please log in to view your account.
						</p>
					)}
				</section>
			</main>
			<Footer />
		</>
	);
}
