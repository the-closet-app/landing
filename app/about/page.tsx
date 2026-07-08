import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

export default function About() {
    return (
        <>
            <Header />
            <main className="flex justify-center px-4 pb-10 pt-6 sm:min-h-[calc(100svh-132px)] sm:py-10">
                <section className="flex w-[min(92vw,860px)] flex-col items-center gap-7 text-center text-white sm:gap-8 lg:gap-10">
                    <h1 className="z-10 max-w-[11ch] font-mackinac text-[clamp(3.25rem,15vw,4rem)] font-normal leading-[1] text-[#ffffff]/90 tracking-[-.04em] sm:max-w-none">
                        About CLAi
                    </h1>
                    <p className="z-10 w-[min(100vw,720px)] font-antique-legacy text-left text-base font-normal leading-[1.4] tracking-[-.01em] text-[#ffffff]/60 sm:text-[1.2rem]">
                        CLAi (The Closet App) is a fashion intelligence platform that helps consumers optimise, manage, and extend the value of the clothes they already own through 
                        AI-powered styling, wardrobe organisation, resale, rental, repair, and personalised fashion recommendations. The platform combines closet digitisation with 
                        behavioural and fashion intelligence to help users make smarter purchasing and styling decisions while reducing unnecessary consumption and textile waste. 
                        CLAi also includes a creator marketplace that connects users with professional stylists, fashion influencers, and image consultants for personalised styling 
                        services, closet optimisation, curated recommendations, and digital fashion experiences - creating new income opportunities for creators while increasing 
                        engagement and premium service revenue within the platform. CLAi also supports fashion brands through future circularity insights, customer behaviour analytics,
                         and sustainability integrations aligned with emerging regulations such as EPR and ESPR. The primary target customers are Gen Z and Millennial consumers, 
                         style-conscious professionals, fashion creators, and sustainability-aware shoppers across the UK, US, Canada, and selected African markets.
                    </p>
                    <p className="z-10 w-[min(100vw,720px)] font-antique-legacy text-left text-base font-normal leading-[1.4] tracking-[-.01em] text-[#ffffff]/60 sm:text-[1.2rem]">
                        CLAi is currently in early-stage product development, focused on launching its Phase 1 AI-powered fashion intelligence chat bot experience within the next six months. 
                        While funds are raised to build the entire ecosystem.
                    </p>
                </section>
            </main>
            <Footer />
        </>
    );
}
