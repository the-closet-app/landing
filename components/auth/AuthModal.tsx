'use client';

import { FormEvent, useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
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
import { useToast } from '@/components/toast/ToastProvider';
import { getFirebaseAuth, googleProvider } from '@/lib/firebase';
import { ClaiMark } from '../icons/ClaiMark';

type AuthModalProps = {
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

export function AuthModal({
	isOpen,
	onClose,
	variant = 'dark',
}: AuthModalProps) {
	const toast = useToast();
	const isLight = variant === 'light';
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>(
		'login'
	);
	const isMounted = useSyncExternalStore(
		subscribeToClient,
		getClientSnapshot,
		getServerSnapshot
	);

	useEffect(() => {
		void getRedirectResult(getFirebaseAuth())
			.then((result) => {
				if (result?.user) {
					toast.success('Logged in to CLAi.');
					onClose();
				}
			})
			.catch((error) => {
				toast.error(getAuthErrorMessage(error));
			});
	}, [onClose, toast]);

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

	const modalTextColor = isLight ? 'text-[#1C1C1C]' : 'text-white';
	const mutedLinkColor = isLight
		? 'text-[#1C1C1C]/45 hover:text-[#1C1C1C]/70'
		: 'text-white/30 hover:text-white/50';
	const inputClassName = `h-[52px] rounded-full px-6 font-antique-legacy text-base outline-none transition sm:h-14 sm:px-8 sm:text-[1.1rem] ${
		isLight
			? 'bg-[#1C1C1C]/5 text-[#1C1C1C] placeholder:text-[#1C1C1C]/35'
			: 'bg-white/10 text-white placeholder:text-white/35'
	}`;

	async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSubmitting(true);

		try {
			if (authMode === 'reset') {
				await sendPasswordResetEmail(getFirebaseAuth(), email);
				toast.success('Password reset email sent. Check your inbox.');
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
				toast.success(
					'Account created. Check your email to verify your account.'
				);
			} else {
				const credential = await signInWithEmailAndPassword(
					getFirebaseAuth(),
					email,
					password
				);

				if (!credential.user.emailVerified) {
					await sendEmailVerification(credential.user);
					toast.info(
						'Logged in. Check your email to verify your account.'
					);
					return;
				}

				toast.success('Logged in to CLAi.');
				onClose();
			}
		} catch (error) {
			toast.error(getAuthErrorMessage(error));
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleGoogleLogin() {
		setIsSubmitting(true);

		try {
			await signInWithPopup(getFirebaseAuth(), googleProvider);
			toast.success('Logged in with Google.');
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

			toast.error(getAuthErrorMessage(error));
		} finally {
			setIsSubmitting(false);
		}
	}

	return createPortal(
		<div
			className={`fixed inset-0 z-[2147483646] flex h-dvh w-dvw items-center justify-center overflow-y-auto px-3 py-4 backdrop-blur-sm sm:px-4 ${
				isLight ? 'bg-white/82' : 'bg-[#1C1C1C]/95'
			}`}
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
			<div
				className={`relative my-auto w-full max-w-[420px] rounded-[28px] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:rounded-[34px] sm:p-10 ${
					isLight
						? 'bg-white text-[#1C1C1C]'
						: 'bg-[#292929] text-white'
				}`}
			>
				<div className="mb-8 flex items-center justify-between gap-4 sm:mb-10 sm:gap-6">
					<h2
						id="auth-modal-title"
						className={`m-auto flex items-center gap-3 text-center font-mackinac text-3xl font-normal tracking-[-.04em] sm:text-4xl ${modalTextColor}`}
					>
						<ClaiMark className="h-8 w-9 shrink-0 text-[#D88435] sm:h-8 sm:w-8" />
						<span className="font-mackinac text-3xl font-normal leading-none sm:text-4xl">
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
								className={inputClassName}
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
							className={inputClassName}
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
								className={inputClassName}
								placeholder="Your password"
							/>
						</label>
					) : null}

					<button
						type="submit"
						disabled={isSubmitting}
						className="h-[52px] rounded-full bg-[#F47016] px-6 font-antique-legacy text-lg font-medium tracking-[-.02em] text-white transition hover:bg-[#F47016] disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:text-[1.2rem]"
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

				<div
					className={`mt-4 flex font-antique-legacy text-base tracking-[-.01em] sm:text-[1.1rem] ${
						authMode === 'login'
							? 'items-center justify-between gap-4'
							: 'justify-center'
					}`}
				>
					{authMode === 'login' ? (
						<button
							type="button"
							onClick={() => {
								setAuthMode('reset');
							}}
							className={`transition ${mutedLinkColor}`}
						>
							Forgot password?
						</button>
					) : null}
					<button
						type="button"
						onClick={() => {
							setAuthMode((currentMode) => {
								if (currentMode === 'signup') {
									return 'login';
								}

								return 'signup';
							});
						}}
						className={`transition ${mutedLinkColor}`}
					>
						{authMode === 'signup'
							? 'Already have an account? Login'
							: authMode === 'reset'
								? 'Back to login'
								: 'Create an account'}
					</button>
				</div>

				{authMode !== 'reset' ? (
					<>
						<div
							className={`my-6 flex items-center gap-3 ${
								isLight ? 'text-[#1C1C1C]/35' : 'text-white/35'
							}`}
						>
							<div
								className={`h-px flex-1 ${
									isLight ? 'bg-[#1C1C1C]/10' : 'bg-white/10'
								}`}
							/>
							<span className="font-antique-legacy text-base sm:text-[1.1rem]">
								or
							</span>
							<div
								className={`h-px flex-1 ${
									isLight ? 'bg-[#1C1C1C]/10' : 'bg-white/10'
								}`}
							/>
						</div>

						<button
							type="button"
							onClick={handleGoogleLogin}
							disabled={isSubmitting}
							className={`flex h-[52px] w-full items-center justify-center gap-3 rounded-full text-base font-medium tracking-[-.02em] transition disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:text-[1.1rem] ${
								isLight
									? 'bg-[#1C1C1C]/5 text-[#1C1C1C] hover:bg-[#1C1C1C]/10'
									: 'bg-white text-[#1C1C1C] hover:bg-white/90'
							}`}
						>
							<GoogleIcon className="size-6 shrink-0" />
							Continue with Google
						</button>
					</>
				) : null}
			</div>
		</div>,
		document.body
	);
}
