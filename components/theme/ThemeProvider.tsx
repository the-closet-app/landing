'use client';

import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark';

type ThemeContextValue = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useState<Theme>('light');

	useEffect(() => {
		const storedTheme = window.localStorage.getItem('clai-theme');
		let frameId: number | null = null;

		if (storedTheme === 'light' || storedTheme === 'dark') {
			frameId = window.requestAnimationFrame(() => {
				setTheme(storedTheme);
			});
		}

		return () => {
			if (frameId) {
				window.cancelAnimationFrame(frameId);
			}
		};
	}, []);

	useEffect(() => {
		document.documentElement.dataset.theme = theme;
		window.localStorage.setItem('clai-theme', theme);
	}, [theme]);

	const value = useMemo<ThemeContextValue>(
		() => ({
			theme,
			setTheme,
			toggleTheme: () =>
				setTheme((currentTheme) =>
					currentTheme === 'light' ? 'dark' : 'light'
				),
		}),
		[theme]
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);

	if (!context) {
		throw new Error('useTheme must be used within ThemeProvider');
	}

	return context;
}

export function ThemeToggle() {
	const { theme, toggleTheme } = useTheme();
	const isLight = theme === 'light';

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className="grid size-9 shrink-0 place-items-center text-white transition hover:opacity-75 focus:outline-none sm:size-10"
			aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
			aria-pressed={!isLight}
		>
			{isLight ? (
				<svg
					aria-hidden="true"
					className="size-6"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						d="M20.25 15.31A8.5 8.5 0 0 1 8.69 3.75 8.5 8.5 0 1 0 20.25 15.31Z"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="1.8"
					/>
				</svg>
			) : (
				<svg
					aria-hidden="true"
					className="size-6"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						d="M12 16.25A4.25 4.25 0 1 0 12 7.75a4.25 4.25 0 0 0 0 8.5Z"
						stroke="currentColor"
						strokeWidth="1.8"
					/>
					<path
						d="M12 2.75v2M12 19.25v2M4.42 4.42l1.42 1.42M18.16 18.16l1.42 1.42M2.75 12h2M19.25 12h2M4.42 19.58l1.42-1.42M18.16 5.84l1.42-1.42"
						stroke="currentColor"
						strokeLinecap="round"
						strokeWidth="1.8"
					/>
				</svg>
			)}
		</button>
	);
}
