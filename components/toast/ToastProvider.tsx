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

function getToastStyles(type: ToastType) {
	if (type === 'success') {
		return 'bg-[#315C46] text-white';
	}

	if (type === 'error') {
		return 'bg-[#8F3A32] text-white';
	}

	return 'bg-[#F2F2F2] text-[#1C1C1C]';
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
						className={`flex items-start justify-between gap-4 rounded-3xl px-5 py-4 font-antique-legacy text-base font-medium leading-[1.25] tracking-[-.02em] shadow-[0_18px_50px_rgba(0,0,0,0.38)] backdrop-blur-[10px] sm:text-[1.05rem] ${getToastStyles(
							toast.type
						)}`}
						role={toast.type === 'error' ? 'alert' : 'status'}
					>
						<span>{toast.message}</span>
						<button
							type="button"
							onClick={() => dismiss(toast.id)}
							className="shrink-0 text-lg leading-none opacity-55 transition hover:opacity-100"
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
