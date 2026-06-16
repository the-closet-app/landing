import { Ask } from '@/components/form/Ask';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

export default function Home() {
	return (
		<>
			<Header />
			<main className="flex min-h-screen items-center justify-center px-4 py-10">
				<section className="w-[min(90vw,860px)] flex flex-col items-center gap-10 text-center text-white sm:gap-8">
					<h1 className="text-5xl sm:text-8xl font-normal tracking-[-.04em] font-mackinac z-10">
						Your AI Fashion Assistant
					</h1>
					<p className="w-[min(80vw,480px)] text-1xl sm:text-[1.3rem] text-[#ffffff]/80 font-normal font-antique-legacy z-10 tracking-[-.02em] leading-[1.3]">
						Get clear, AI-powered answers to your styling questions.
						Simple, helpful, and tailored to you.
					</p>
					<Ask />
				</section>
			</main>
			<Footer />
		</>
	);
}