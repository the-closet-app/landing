import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

export default function AboutCLAi() {
    return (
        <>
            <Header />
            <main className="flex justify-center px-4 pb-10 pt-6 sm:min-h-[calc(100svh-132px)] sm:py-10">
                <section className="flex w-[min(92vw,720px)] flex-col items-center gap-4 text-center text-white sm:gap-4 lg:gap-4">
                    <h1 className="z-10 font-antique-legacy font-normal uppercase leading-[1] text-[#ffffff]/65 tracking-[.1em] sm:text-[1rem] sm:max-w-none">
                        About CLAi
                    </h1>
                    <h2 className="z-10 font-mackinac text-center text-base font-normal leading-[1.05] text-[clamp(3.25rem,15vw,3.8rem)] tracking-[-.04em] text-[#ffffff]/80">
                        Fashion Intelligence.
                    </h2>
                    <p className="z-10 font-antique-legacy text-center text-base font-normal leading-[1.3] tracking-[-.01em] text-[#ffffff]/65 sm:text-[1.1rem] px-4">
                        CLAi exists to help consumers, creators, and brands make better fashion decisions - through intelligence, insight, psychology, and guidance.
                    </p>
                    <p className="z-10 font-mackinac text-left text-base font-normal rounded-[1em] leading-[1.3] tracking-[-.01em] text-[#ffffff]/65 sm:text-[1.6rem] p-8 my-5 bg-[#232323]">
                        <small className="uppercase tracking-[.2em] font-antique-legacy text-left block mb-3 sm:text-[0.85rem]">
                            Brand Belief
                        </small>
                        The future of fashion isn&apos;t owning more. <em>It&apos;s getting more from fashion.</em>
                    </p>
                    <p className="z-10 font-mackinac text-left text-base font-normal rounded-[1em] leading-[1.3] tracking-[-.01em] text-[#ffffff]/65 sm:text-[2rem] my-5">
                        <small className="uppercase tracking-[.2em] font-antique-legacy text-[#F47016] text-left block mb-3 sm:text-[0.8rem]">
                            Why We Exist
                        </small>
                        Most fashion decisions are made without any real intelligence behind them.
                    </p>
                    <p className="z-10 font-antique-legacy text-left text-base font-normal leading-[1.4] tracking-[-.01em] text-[#ffffff]/65 sm:text-[1.1rem]">
                        What to wear, what to buy, what to keep, what&apos;s actually worth repairing or reselling - people make these calls every day with no real support, and often
                        end up with wardrobes full of things they don&apos;t wear and questions they don&apos;t have answers to. CLAi was built to close that gap: a Fashion Intelligence 
                        Platform that combines AI, fashion psychology, and professional styling expertise, so every decision - for a consumer or a working stylist - is an informed one.
                    </p>
                    <div className="flex flex-col gap-4 sm:gap-3 mt-8">
                        <h2 className="uppercase tracking-[.2em] font-antique-legacy text-left text-[#F47016] sm:text-[0.8rem]">
                            Where we&apos;re going
                        </h2>
                        <p className="z-10 font-mackinac text-left text-base font-normal rounded-[1em] leading-[1.3] tracking-[-.01em] text-[#ffffff]/65 sm:text-[1.6rem] p-8 my-1 sm:my-2 bg-[#232323]">
                            <small className="uppercase tracking-[.2em] font-antique-legacy text-left block mb-3 sm:text-[0.85rem]">
                                Vision
                            </small>
                            To become the world&apos;s leading Fashion Intelligence Platform, creating a more intelligent, personalised, and circular fashion ecosystem.
                        </p>
                        <p className="z-10 font-mackinac text-left text-base font-normal rounded-[1em] leading-[1.3] tracking-[-.01em] text-[#ffffff]/65 sm:text-[1.6rem] p-8 my-1 sm:my-2 bg-[#232323]">
                            <small className="uppercase tracking-[.2em] font-antique-legacy text-left block mb-3 sm:text-[0.85rem]">
                                Mission
                            </small>
                            To help consumers and fashion professionals make better decisions about what to wear, what to buy, how to style, and how to get more from fashion - through AI-powered intelligence, fashion psychology, expert guidance, and personalised recommendations.
                        </p>
                    </div>
                    <p className="z-10 font-mackinac text-left text-base font-normal rounded-[1em] leading-[1.3] tracking-[-.01em] text-[#ffffff]/65 sm:text-[2rem] my-6">
                        <small className="uppercase tracking-[.2em] font-antique-legacy text-[#F47016] text-left block mb-3 sm:text-[0.8rem]">
                            Why you can believe it
                        </small>
                        Every recommendation stands on four pillars.
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
                        <p className="z-10 font-antique-legacy text-left text-base font-normal rounded-[1em] leading-[1.2] tracking-[-.01em] text-[#ffffff]/65 sm:text-[1.4rem] p-8 bg-[#232323]">
                            <small className="uppercase tracking-[.2em] text-[#F47016] font-antique-legacy text-left block mb-3 sm:text-[0.85rem]">
                                01
                            </small>
                            Powered by AI.
                        </p>
                        <p className="z-10 font-antique-legacy text-left text-base font-normal rounded-[1em] leading-[1.2] tracking-[-.01em] text-[#ffffff]/65 sm:text-[1.4rem] p-8 bg-[#232323]">
                            <small className="uppercase tracking-[.2em] text-[#F47016] font-antique-legacy text-left block mb-3 sm:text-[0.85rem]">
                               02
                            </small>
                            Informed by Fashion Psychology.
                        </p>
                        <p className="z-10 font-antique-legacy text-left text-base font-normal rounded-[1em] leading-[1.2] tracking-[-.01em] text-[#ffffff]/65 sm:text-[1.4rem] p-8 bg-[#232323]">
                            <small className="uppercase tracking-[.2em] text-[#F47016] font-antique-legacy text-left block mb-3 sm:text-[0.85rem]">
                                03
                            </small>
                            Guided by Professional Styling Expertise.
                        </p>
                        <p className="z-10 font-antique-legacy text-left text-base font-normal rounded-[1em] leading-[1.2] tracking-[-.01em] text-[#ffffff]/65 sm:text-[1.4rem] p-8 bg-[#232323]">
                            <small className="uppercase tracking-[.2em] text-[#F47016] font-antique-legacy text-left block mb-3 sm:text-[0.85rem]">
                                04
                            </small>
                            Designed for Circular Outcomes.
                        </p>
                    </div>
                    <div className="flex flex-col gap-5 z-10 font-antique-legacy leading-[1.3] text-[#ffffff]/45 tracking-[-.01em] text-center text-base font-normal mt-6">
                        <p>
                            CLAi, short for The Closet App Intelligence. Is a Fashion Intelligence Platform for consumers and fashion professionals.
                        </p>
                        <p>
                            It helps you make better decisions about what to wear, what to buy, how to style, and how to get more from fashion. From everyday 
                            styling questions and fashion fixes to personalised recommendations that help you unlock more from your wardrobe, CLAi delivers intelligent 
                            guidance for every stage of the fashion experience-built with real fashion psychologists and professional stylists.
                        </p>
                        <p>
                            The Fashion Intelligence Assistant is the first way to experience CLAi, with a broader
                            platform connecting consumers, creators, and brands through Fashion Intelligence currently in development.
                        </p>
                        <p className="z-10 font-mackinac text-center text-base font-normal rounded-[1em] leading-[1.3] tracking-[-.01em] text-[#ffffff]/65 sm:text-[1.6rem] my-5">
                            Better Fashion Decision Starts Here
                        </p>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
