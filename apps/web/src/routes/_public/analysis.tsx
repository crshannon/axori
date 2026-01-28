import { Link, createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, MapPin, TrendingUp } from 'lucide-react'
import { Button } from '@axori/ui'
import PropertyScoreGauge from '@/components/home/PropertyScoreGauge'
import { RadarChart } from '@/components/charts/RadarChart'

export const Route = createFileRoute('/_public/analysis')({
  component: Analysis,
})

function Analysis() {
  const accentColorClass = 'text-violet-600 dark:text-[#E8FF4D]'
  const accentBgClass = 'bg-violet-600 dark:bg-[#E8FF4D]'
  const cardClass =
    'p-12 rounded-[4rem] border transition-all duration-700 bg-white border-black/5 shadow-sm hover:shadow-2xl dark:bg-[#1A1A1A] dark:border-white/5'

  return (
    <main className="flex-grow pt-12 pb-40">
      <div className="max-w-[1440px] mx-auto px-6">
        {/* Sales Hero */}
        <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-10">
              <div className="flex gap-1.5">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${accentBgClass}`}
                ></div>
                <div
                  className={`w-3.5 h-3.5 rounded-full opacity-30 ${accentBgClass}`}
                ></div>
                <div
                  className={`w-3.5 h-3.5 rounded-full opacity-10 ${accentBgClass}`}
                ></div>
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40">
                System Architecture / V2.5
              </span>
            </div>
            <h1 className="text-[clamp(3rem,8vw,6rem)] leading-[0.9] tracking-[-0.04em] font-extrabold uppercase mb-8 transition-colors text-slate-900 dark:text-white">
              ANALYTICS <br />
              BEYOND <br />
              <span className={accentColorClass}>SIGHT</span>.
            </h1>
            <p className="max-w-xl text-2xl text-slate-500 font-medium leading-relaxed">
              We process 10,000+ data points per asset to give you the highest
              fidelity view of your portfolio's alpha.
            </p>
          </div>
          <div className="hidden lg:block p-8 rounded-[3rem] border border-white/5 bg-white/5 backdrop-blur-md">
            <div className="flex gap-6 items-center">
              <div className="w-12 h-12 rounded-full border border-emerald-500/50 flex items-center justify-center text-emerald-500">
                <TrendingUp className="w-6 h-6" strokeWidth={3} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">
                  Avg. Yield Lift
                </p>
                <p className="text-3xl font-black tabular-nums">+2.4%</p>
              </div>
            </div>
          </div>
        </div>

        {/* 6 High Level Features Bento */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-32">
          {/* 1. Property Score */}
          <div
            className={`${cardClass} md:col-span-8 flex flex-col lg:flex-row items-center gap-16`}
          >
            <div className="flex-shrink-0 transform hover:scale-105 transition-transform duration-700">
              <PropertyScoreGauge score={87} size="lg" />
            </div>
            <div>
              <div className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 mb-6">
                HEADLINE METRIC
              </div>
              <h3 className="text-4xl font-black uppercase tracking-tighter mb-6 text-slate-900 dark:text-white">
                01. THE PROPERTY SCORE
              </h3>
              <p className="text-slate-400 font-medium leading-relaxed text-lg mb-8">
                A single composite rating that instantly communicates asset
                health across Financial Performance, Market Position, and Risk.
              </p>
              <div className="flex flex-wrap gap-4">
                {['Financial', 'Market', 'Operational', 'Risk', 'Goals'].map(
                  (dim) => (
                    <div
                      key={dim}
                      className="px-4 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/40 text-[10px] font-black uppercase tracking-widest"
                    >
                      {dim}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* 6. Goal Alignment */}
          <div
            className={`${cardClass} md:col-span-4 flex flex-col justify-between relative overflow-hidden group`}
          >
            <div
              className={`absolute -right-24 -bottom-24 w-64 h-64 rounded-full blur-[100px] opacity-20 transition-all duration-700 group-hover:scale-110 ${accentBgClass}`}
            ></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-6">
                PERSONALIZED INTEL
              </p>
              <h3 className="text-4xl font-black uppercase tracking-tighter mb-4 text-slate-900 dark:text-white">
                06. GOAL <br />
                ALIGNMENT
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Matches every asset to your specific "Investment DNA"—whether
                you're focused on Cash Flow, Appreciation, or BRRRR.
              </p>
            </div>
            <div className="mt-12">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                  Strategy Fit
                </span>
                <span
                  className={`text-5xl font-black tabular-nums tracking-tighter ${accentColorClass}`}
                >
                  94%
                </span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${accentBgClass} rounded-full`}
                  style={{ width: '94%' }}
                ></div>
              </div>
            </div>
          </div>

          {/* 3. Performance DNA */}
          <div
            className={`${cardClass} md:col-span-5 flex flex-col items-center justify-center text-center group`}
          >
            <div className="transform group-hover:scale-110 transition-transform duration-700">
              <RadarChart />
            </div>
            <div className="mt-10">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 text-slate-900 dark:text-white">
                03. PERFORMANCE DNA
              </h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-60">
                Multi-dimensional property fingerprint.
              </p>
            </div>
          </div>

          {/* 2. Cash Flow Analysis */}
          <div
            className={`${cardClass} md:col-span-7 flex flex-col justify-between`}
          >
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                  02. CASH FLOW ENGINE
                </h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">
                  Dynamic yield projections.
                </p>
              </div>
              <div className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                +12.8% Yield Target
              </div>
            </div>

            <div className="space-y-6 flex-grow">
              {[
                {
                  label: 'Gross Potential Rent',
                  val: '$14,200',
                  opacity: 'opacity-40',
                },
                {
                  label: 'Projected Expenses',
                  val: '-$5,100',
                  opacity: 'opacity-40',
                  color: 'text-red-500',
                },
                {
                  label: 'Net Monthly Income',
                  val: '$9,100',
                  opacity: 'opacity-100',
                  bold: true,
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className={`flex justify-between items-center ${
                    row.bold ? 'pt-6 border-t border-white/10 mt-2' : ''
                  }`}
                >
                  <span
                    className={`text-[11px] font-black uppercase tracking-widest ${row.opacity}`}
                  >
                    {row.label}
                  </span>
                  <span
                    className={`text-3xl font-black tabular-nums tracking-tighter ${
                      row.bold ? accentColorClass : row.color || ''
                    }`}
                  >
                    {row.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Market Context */}
          <div
            className={`${cardClass} md:col-span-6 border-none text-white overflow-hidden relative group bg-slate-900 shadow-xl shadow-slate-200 dark:bg-[#121212] dark:shadow-black/30`}
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 group-hover:rotate-12 transition-transform duration-1000">
              <MapPin className="w-60 h-60" fill="currentColor" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest opacity-40 mb-12">
              LOCATIONAL ANALYSIS
            </p>
            <h3 className="text-5xl font-black uppercase tracking-tighter mb-10 leading-none">
              04. MARKET <br />
              CONTEXT
            </h3>
            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                  VS Market Avg
                </p>
                <p
                  className={`text-4xl font-black tabular-nums tracking-tighter ${accentColorClass}`}
                >
                  +14%
                </p>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">
                  Rental Premium
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                  Local Cap Rate
                </p>
                <p className="text-4xl font-black tabular-nums tracking-tighter">
                  5.4%
                </p>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">
                  Sub-market avg
                </p>
              </div>
            </div>
          </div>

          {/* 5. Risk Assessment */}
          <div className={`${cardClass} md:col-span-6 border-red-500/20 group`}>
            <div className="flex justify-between items-start mb-12">
              <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                05. RISK <br />
                ASSESSMENT
              </h3>
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 transform group-hover:rotate-12 transition-transform">
                <AlertTriangle className="w-7 h-7" strokeWidth={3} />
              </div>
            </div>
            <div className="space-y-5">
              {[
                {
                  l: 'Vacancy Exposure',
                  v: 'Low Risk',
                  c: 'text-emerald-500',
                  p: 15,
                },
                {
                  l: 'Market Volatility',
                  v: 'Moderate',
                  c: 'text-amber-500',
                  p: 45,
                },
                {
                  l: 'Asset Concentration',
                  v: 'Optimized',
                  c: 'text-emerald-500',
                  p: 20,
                },
              ].map((r, i) => (
                <div
                  key={i}
                  className="p-5 rounded-3xl transition-colors bg-slate-50 border border-black/5 dark:bg-white/5 dark:border-white/5"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[11px] font-black uppercase tracking-widest opacity-50">
                      {r.l}
                    </span>
                    <span
                      className={`text-[11px] font-black uppercase tracking-widest ${r.c}`}
                    >
                      {r.v}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${r.c.replace('text', 'bg')} rounded-full opacity-60`}
                      style={{ width: `${100 - r.p}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Closing Sales Section */}
        <div className="p-20 md:p-32 rounded-[5rem] text-center relative overflow-hidden transition-all duration-700 bg-violet-600 text-white shadow-2xl shadow-violet-200 dark:bg-[#E8FF4D] dark:text-black dark:shadow-black/30">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%">
              <defs>
                <pattern
                  id="grid-analysis-last"
                  width="100"
                  height="100"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="50" cy="50" r="1.5" fill="currentColor" />
                </pattern>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="url(#grid-analysis-last)"
              />
            </svg>
          </div>
          <div className="relative z-10">
            <h2 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mb-12 leading-none">
              SCALE WITH <br />
              PRECISION.
            </h2>
            <p className="max-w-xl mx-auto text-xl font-bold uppercase tracking-tight opacity-80 mb-16 leading-relaxed">
              Unlock the operating system built for the next decade of real
              estate wealth.
            </p>
            <Link to="/sign-up">
              <Button className="px-20 py-8 rounded-full font-black uppercase tracking-widest text-sm transition-all hover:scale-110 shadow-2xl shadow-slate-200/50 bg-white text-violet-600 dark:bg-black dark:text-white dark:shadow-black/30">
                GET THE FULL ANALYSIS
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
