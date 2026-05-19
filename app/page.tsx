export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <section className="w-[min(90vw,360px)] flex flex-col items-center gap-20 text-center text-white sm:gap-32">
        <h1 className="text-5xl sm:text-6xl font-normal tracking-[-.04em] font-mackinac z-10">Transforming your closet</h1>
        <p className="glass-btn text-3xl sm:text-4xl font-medium font-antique-legacy z-10 tracking-[-.04em]">
          coming soon
        </p>
        <h2 className="text-4xl sm:text-5xl font-medium font-antique-legacy z-10 tracking-[-.04em]">
          Into a personal decision engine.
        </h2>
      </section>
    </main>
  );
}
