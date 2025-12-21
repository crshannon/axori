import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/about')({
  component: About,
})

function About() {
  const accentColorClass = 'text-violet-600 dark:text-[#E8FF4D]'

  return (
    <main className="flex-grow pt-12">
      <div className="max-w-[1440px] mx-auto px-6">
        {/* Header Hero */}
        <div className="mb-24">
          <h1 className="text-[clamp(3rem,8vw,6rem)] leading-[0.9] tracking-[-0.04em] font-extrabold uppercase mb-8 transition-colors text-slate-900 dark:text-white">
            WE BUILT THE <br />
            <span className={accentColorClass}>EYE</span> IN THE SKY <br />
            FOR YOUR <span className="opacity-30">DIRT</span>.
          </h1>
          <p className="max-w-2xl text-xl text-slate-400 font-medium leading-relaxed">
            Axori started when we realized most real estate "pro-formas" were
            just creative writing. We replaced gut feelings with cold, hard
            data.
          </p>
        </div>

        {/* Bento Grid Story */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-24">
          <div className="md:col-span-8 p-12 rounded-[3rem] border transition-colors bg-slate-900 text-white dark:bg-white dark:text-black">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 leading-tight">
              The Problem:
              <br />
              Spreadsheet Blindness
            </h2>
            <p className="text-lg opacity-70 leading-relaxed max-w-xl">
              Most investors manage multi-million dollar portfolios using
              software built in the 90s or spreadsheets that break if you look
              at them wrong. We wanted something that actually thought like an
              analyst.
            </p>
            <div className="mt-12 flex gap-4">
              <div className="w-12 h-1 bg-current opacity-20"></div>
              <div className="w-12 h-1 bg-current transition-colors duration-500 text-violet-500 dark:text-[#E8FF4D]"></div>
            </div>
          </div>

          <div className="md:col-span-4 p-12 rounded-[3rem] border flex flex-col justify-between transition-colors bg-white border-black/5 shadow-xl shadow-slate-200/50 dark:bg-[#1A1A1A] dark:border-white/10 dark:shadow-black/20">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              QUIRKY DATA
            </span>
            <div>
              <span
                className={`text-6xl font-black tabular-nums tracking-tighter ${accentColorClass}`}
              >
                12k+
              </span>
              <p className="text-xs font-bold uppercase tracking-widest mt-2 opacity-60">
                Spreadsheets retired to the grave since launch.
              </p>
            </div>
          </div>

          <div className="md:col-span-4 bg-slate-300 rounded-[3rem] overflow-hidden min-h-[400px] relative group">
            <img
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800"
              className="absolute inset-0 w-full h-full object-cover grayscale transition-transform duration-700 group-hover:scale-110"
              alt="Team Office"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-8 left-8">
              <h3 className="text-white text-2xl font-black uppercase tracking-tighter">
                OUR HQ: 99 WALL ST
              </h3>
            </div>
          </div>

          <div className="md:col-span-4 p-12 rounded-[3rem] border flex flex-col justify-between transition-colors bg-violet-600 text-white shadow-xl shadow-violet-200 dark:bg-white dark:text-black dark:shadow-black/20">
            <div className="flex gap-1 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 border-white dark:border-black ${
                    i === 2 ? 'bg-current' : ''
                  }`}
                ></div>
              ))}
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">
              Data is the <br />
              new location.
            </h3>
          </div>

          <div className="md:col-span-4 p-12 rounded-[3rem] border border-black/5 flex flex-col justify-between transition-colors bg-white text-slate-900 shadow-sm dark:bg-[#1A1A1A] dark:border-white/10 dark:text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-40">
              The Vision
            </p>
            <p className="text-lg font-bold leading-relaxed mt-6">
              To empower the next 1 million investors to build generational
              wealth without the "accidental landlord" headache.
            </p>
            <button className="mt-8 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-105 bg-slate-900 text-white dark:bg-white dark:text-black">
              JOIN THE MISSION
            </button>
          </div>
        </div>

        {/* The Why Section */}
        <section className="pb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 text-slate-900 dark:text-white">
              WHY WE DO IT
            </h2>
            <p className="text-slate-400 font-medium italic">
              Because the top 1% shouldn't have all the fun.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: 'Transparency',
                desc: 'No hidden biases. Just the numbers that matter for your specific strategy.',
              },
              {
                title: 'Efficiency',
                desc: "AI doesn't sleep, so you can. We process leases while you're at the beach.",
              },
              {
                title: 'Sovereignty',
                desc: 'Take back control of your time and your assets. Own the platform, own your future.',
              },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-8 transition-all group-hover:rotate-6 bg-violet-50 border border-violet-100 text-violet-600 shadow-lg shadow-violet-100 dark:bg-white/5 dark:border-white/10 dark:text-[#E8FF4D] dark:shadow-black/20">
                  <span className="text-2xl font-black">{i + 1}</span>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-4 text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
