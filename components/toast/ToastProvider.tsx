'use client';

import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from 'react';
import type { ReactNode } from 'react';

type ToastType = 'error' | 'info' | 'success';

type Toast = {
	id: string;
	message: string;
	type: ToastType;
};

type ToastContextValue = {
	error: (message: string) => void;
	info: (message: string) => void;
	success: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const toastDuration = 4200;

function getToastIconClass(type: ToastType) {
	if (type === 'success') {
		return 'text-[#71C98A]';
	}

	if (type === 'error') {
		return 'text-[#D94A3A]';
	}

	return 'text-[#D7A600]';
}

function ToastIcon({ type }: { type: ToastType }) {
	if (type === 'success') {
		return (
			<svg
				aria-hidden="true"
				className={`mt-[0.1rem] size-5 shrink-0 ${getToastIconClass(type)}`}
				fill="none"
				viewBox="0 0 20 20"
			>
				<path
					d="M16.25 5.83 8.13 13.96 3.75 9.58"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
				/>
				<path
					d="M10 18.13a8.13 8.13 0 1 0 0-16.26 8.13 8.13 0 0 0 0 16.26Z"
					stroke="currentColor"
					strokeWidth="1.6"
				/>
			</svg>
		);
	}

	if (type === 'error') {
		return (
			<svg
				aria-hidden="true"
				className={`mt-[0.1rem] size-5 shrink-0 ${getToastIconClass(type)}`}
				fill="none"
				viewBox="0 0 20 20"
			>
				<path
					d="M10 18.13a8.13 8.13 0 1 0 0-16.26 8.13 8.13 0 0 0 0 16.26Z"
					stroke="currentColor"
					strokeWidth="1.6"
				/>
				<path
					d="M10 5.83v5"
					stroke="currentColor"
					strokeLinecap="round"
					strokeWidth="2"
				/>
				<path
					d="M10 14.17h.01"
					stroke="currentColor"
					strokeLinecap="round"
					strokeWidth="2.4"
				/>
			</svg>
		);
	}

	return (
		<svg
			aria-hidden="true"
			className={`mt-[0.1rem] size-5 shrink-0 ${getToastIconClass(type)}`}
			fill="none"
			viewBox="0 0 20 20"
		>
			<path
				d="M10 18.13a8.13 8.13 0 1 0 0-16.26 8.13 8.13 0 0 0 0 16.26Z"
				stroke="currentColor"
				strokeWidth="1.6"
			/>
			<path
				d="M10 8.75v5"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
			/>
			<path
				d="M10 5.83h.01"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2.4"
			/>
		</svg>
	);
}

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const dismiss = useCallback((id: string) => {
		setToasts((currentToasts) =>
			currentToasts.filter((toast) => toast.id !== id)
		);
	}, []);

	const show = useCallback(
		(message: string, type: ToastType) => {
			const id = crypto.randomUUID();

			setToasts((currentToasts) => [
				...currentToasts.slice(-2),
				{ id, message, type },
			]);
			window.setTimeout(() => dismiss(id), toastDuration);
		},
		[dismiss]
	);

	const value = useMemo<ToastContextValue>(
		() => ({
			error: (message) => show(message, 'error'),
			info: (message) => show(message, 'info'),
			success: (message) => show(message, 'success'),
		}),
		[show]
	);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div
				className="fixed bottom-4 right-4 z-[2147483647] flex w-[min(calc(100vw-2rem),380px)] flex-col gap-3 sm:bottom-6 sm:right-6"
				aria-live="polite"
				aria-relevant="additions"
			>
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className="flex items-start justify-between gap-4 rounded-3xl bg-white px-5 py-4 font-antique-legacy text-base font-medium leading-[1.25] tracking-[-.02em] text-[#1C1C1C] shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:text-[1.05rem]"
						role={toast.type === 'error' ? 'alert' : 'status'}
					>
						<div className="flex min-w-0 items-start gap-3">
							<ToastIcon type={toast.type} />
							<span>{toast.message}</span>
						</div>
						<button
							type="button"
							onClick={() => dismiss(toast.id)}
							className="shrink-0 text-lg leading-none text-[#1C1C1C]/45 transition hover:text-[#1C1C1C]"
							aria-label="Dismiss notification"
						>
							×
						</button>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);

	if (!context) {
		throw new Error('useToast must be used inside ToastProvider.');
	}

	return context;
}
