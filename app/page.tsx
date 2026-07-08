import { Ask } from '@/components/form/Ask';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

export default function Home() {
	return (
		<>
			<Header />
			<main className="flex items-center justify-center px-4 pb-10 pt-6 sm:min-h-[calc(100svh-132px)] sm:py-10">
				<section className="flex w-[min(92vw,860px)] flex-col items-center gap-7 text-center text-white sm:gap-8 lg:gap-10">
					<h1 className="z-10 max-w-[11ch] font-mackinac text-[clamp(3.25rem,15vw,6rem)] font-normal leading-[1] tracking-[-.04em] sm:max-w-none">
						Your Fashion Intelligence
					</h1>
					<p className="z-10 w-[min(88vw,520px)] font-antique-legacy text-base font-normal leading-[1.35] tracking-[-.02em] text-[#ffffff]/80 sm:text-[1.3rem]">
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
