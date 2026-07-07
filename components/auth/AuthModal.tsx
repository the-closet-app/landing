'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
	createUserWithEmailAndPassword,
	getRedirectResult,
	sendEmailVerification,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signInWithPopup,
	signInWithRedirect,
	type AuthError,
	updateProfile,
} from 'firebase/auth';

import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { getFirebaseAuth, googleProvider } from '@/lib/firebase';
import { ClaiMark } from '../icons/ClaiMark';

type AuthModalProps = {
	isOpen: boolean;
	onClose: () => void;
};

function getAuthErrorMessage(error: unknown) {
	const code = (error as AuthError | undefined)?.code;

	if (code === 'auth/email-already-in-use') {
		return 'An account already exists for this email. Try logging in instead.';
	}

	if (code === 'auth/invalid-credential') {
		return 'The email or password is not correct.';
	}

	if (code === 'auth/operation-not-allowed') {
		return 'This sign-in method is not enabled in Firebase yet.';
	}

	if (code === 'auth/configuration-not-found') {
		return 'Firebase Authentication is not configured for this project yet.';
	}

	if (code === 'auth/unauthorized-domain') {
		return 'This domain is not authorized in Firebase Authentication.';
	}

	if (code === 'auth/popup-closed-by-user') {
		return 'Google login was closed before it finished.';
	}

	if (code === 'auth/popup-blocked') {
		return 'Your browser blocked the Google login popup.';
	}

	if (code === 'auth/weak-password') {
		return 'Please use a password with at least 6 characters.';
	}

	if (code === 'auth/user-not-found') {
		return 'No account was found for that email.';
	}

	if (code === 'auth/too-many-requests') {
		return 'Too many attempts. Please wait a moment and try again.';
	}

	return 'Something went wrong. Please try again.';
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>(
		'login'
	);

	useEffect(() => {
		void getRedirectResult(getFirebaseAuth())
			.then((result) => {
				if (result?.user) {
					onClose();
				}
			})
			.catch((error) => {
				setErrorMessage(getAuthErrorMessage(error));
			});
	}, [onClose]);

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

	if (!isOpen) {
		return null;
	}

	async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrorMessage('');
		setSuccessMessage('');
		setIsSubmitting(true);

		try {
			if (authMode === 'reset') {
				await sendPasswordResetEmail(getFirebaseAuth(), email);
				setSuccessMessage(
					'Password reset email sent. Check your inbox.'
				);
				return;
			}

			if (authMode === 'signup') {
				const credential = await createUserWithEmailAndPassword(
					getFirebaseAuth(),
					email,
					password
				);

				if (name.trim()) {
					await updateProfile(credential.user, {
						displayName: name.trim(),
					});
				}

				await sendEmailVerification(credential.user);
				setSuccessMessage(
					'Account created. We sent you a verification email.'
				);
			} else {
				const credential = await signInWithEmailAndPassword(
					getFirebaseAuth(),
					email,
					password
				);

				if (!credential.user.emailVerified) {
					await sendEmailVerification(credential.user);
					setSuccessMessage(
						'You are signed in. We sent a verification email to your inbox.'
					);
					return;
				}

				onClose();
			}
		} catch (error) {
			setErrorMessage(getAuthErrorMessage(error));
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleGoogleLogin() {
		setErrorMessage('');
		setSuccessMessage('');
		setIsSubmitting(true);

		try {
			await signInWithPopup(getFirebaseAuth(), googleProvider);
			onClose();
		} catch (error) {
			const code = (error as AuthError | undefined)?.code;

			if (
				code === 'auth/popup-blocked' ||
				code === 'auth/cancelled-popup-request'
			) {
				await signInWithRedirect(getFirebaseAuth(), googleProvider);
				return;
			}

			setErrorMessage(getAuthErrorMessage(error));
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1C1C]/75 px-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-labelledby="auth-modal-title"
		>
			<button
				type="button"
				className="absolute inset-0 cursor-default"
				aria-label="Close login modal"
				onClick={onClose}
			/>
			<div className="relative w-full max-w-[460px] rounded-[34px] bg-[#292929] p-10 text-white sm:p-14">
				<div className="mb-8 flex items-center justify-between gap-6">
					<h2
						id="auth-modal-title"
						className="font-mackinac m-auto text-4xl font-normal text-center tracking-[-.04em] flex items-center gap-3 text-white"
					>
						<ClaiMark className="h-9 w-10 shrink-0 text-[#D88435] sm:h-8 sm:w-8" />
						<span className="font-mackinac text-4xl font-normal leading-none sm:text-4xl">
							{authMode === 'reset'
								? 'Reset password'
								: authMode === 'login'
									? 'Login to CLAi'
									: 'Join CLAi'}
						</span>
					</h2>
					{/* <button
						type="button"
						onClick={onClose}
						className="grid size-5 shrink-0 place-items-center rounded-full bg-white/10 text-[1rem] leading-none text-white/70 transition hover:text-white"
						aria-label="Close"
					>
						×
					</button> */}
				</div>
				<form
					className="flex flex-col gap-4"
					onSubmit={handleEmailLogin}
				>
					{authMode === 'signup' ? (
						<label className="flex flex-col gap-2 font-antique-legacy text-sm tracking-[-.02em] text-white/65">
							<input
								type="text"
								value={name}
								onChange={(event) =>
									setName(event.target.value)
								}
								required
								className="h-14 rounded-full bg-white/10 font-antique-legacy px-8 text-[1.1rem] text-white outline-none transition placeholder:text-white/35"
								placeholder="Your name"
							/>
						</label>
					) : null}
					<label className="flex flex-col gap-2 font-antique-legacy text-sm tracking-[-.02em] text-white/65">
						<input
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							required
							className="h-14 rounded-full bg-white/10 font-antique-legacy px-8 text-[1.1rem] text-white outline-none transition placeholder:text-white/35"
							placeholder="you@example.com"
						/>
					</label>
					{authMode !== 'reset' ? (
						<label className="flex flex-col gap-2 font-antique-legacy text-sm tracking-[-.02em] text-white/65">
							<input
								type="password"
								value={password}
								onChange={(event) =>
									setPassword(event.target.value)
								}
								required
								className="h-14 rounded-full bg-white/10 font-antique-legacy px-8 text-[1.1rem] text-white outline-none transition placeholder:text-white/35"
								placeholder="Your password"
							/>
						</label>
					) : null}

					{errorMessage ? (
						<p className="rounded-2xl bg-[#F47016]/10 px-4 py-3 font-antique-legacy text-sm tracking-[-.02em] text-[#ffb178]">
							{errorMessage}
						</p>
					) : null}
					{successMessage ? (
						<p className="rounded-2xl bg-white/10 px-4 py-3 font-antique-legacy text-sm tracking-[-.02em] text-white/75">
							{successMessage}
						</p>
					) : null}

					<button
						type="submit"
						disabled={isSubmitting}
						className="mt-2 h-14 rounded-full bg-[#F47016] px-6 font-antique-legacy text-[1.2rem] font-medium tracking-[-.02em] text-white transition hover:bg-[#F47016] disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isSubmitting
							? authMode === 'reset'
								? 'Sending...'
								: authMode === 'login'
									? 'Signing in...'
									: 'Creating account...'
							: authMode === 'reset'
								? 'Send reset email'
								: authMode === 'login'
									? 'Login'
									: 'Create account'}
					</button>
				</form>

				{authMode === 'login' ? (
					<button
						type="button"
						onClick={() => {
							setErrorMessage('');
							setSuccessMessage('');
							setAuthMode('reset');
						}}
						className="mt-4 w-full text-center font-antique-legacy text-sm tracking-[-.02em] text-white/55 transition hover:text-white"
					>
						Forgot password?
					</button>
				) : null}

				<button
					type="button"
					onClick={() => {
						setErrorMessage('');
						setSuccessMessage('');
						setAuthMode((currentMode) => {
							if (currentMode === 'signup') {
								return 'login';
							}

							return 'signup';
						});
					}}
					className="mt-4 w-full text-center font-antique-legacy text-sm tracking-[-.02em] text-white/55 transition hover:text-white"
				>
					{authMode === 'signup'
						? 'Already have an account? Login'
						: authMode === 'reset'
							? 'Back to login'
							: 'Need an account? Sign up'}
				</button>

				{authMode !== 'reset' ? (
					<>
						<div className="my-6 flex items-center gap-3 text-white/35">
							<div className="h-px flex-1 bg-white/10" />
							<span className="font-antique-legacy text-sm">
								or
							</span>
							<div className="h-px flex-1 bg-white/10" />
						</div>

						<button
							type="button"
							onClick={handleGoogleLogin}
							disabled={isSubmitting}
							className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-[#e5e5e5]/10 bg-white text-[1.1rem] font-medium tracking-[-.02em] text-[#1C1C1C] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
						>
							<GoogleIcon className="size-6 shrink-0" />
							Continue with Google
						</button>
					</>
				) : null}
			</div>
		</div>
	);
}
