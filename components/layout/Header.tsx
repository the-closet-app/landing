import Link from 'next/link';

import { ClaiMark } from '@/components/icons/ClaiMark';

export function Header() {
	return (
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
						<Link
							href="/login"
							className="font-antique-legacy text-base font-medium text-white decoration-white/80 transition hover:text-white/80 sm:text-lg"
						>
							Login
						</Link>
						<Link
							href="/#footer"
							className="flex items-center h-12 tracking-[-.02em] rounded-full bg-[#F47016] px-5 text-base font-medium text-white transition hover:bg-[#F47016] focus:outline-none focus:ring-2 focus:ring-[#ffb178] sm:px-6 sm:text-lg"
						>
							Join the waitlist
						</Link>
					</div>
				</nav>
			</div>
		</header>
	);
}
