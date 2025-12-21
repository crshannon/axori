import React, { useState } from 'react'
import PropertyScoreGauge from './PropertyScoreGauge'

export enum ScoreDimension {
  CashFlow = 'Cash Flow',
  Equity = 'Equity',
  Risk = 'Risk',
  Tax = 'Tax',
  Effort = 'Effort',
}

const PropertyScoreSection: React.FC = () => {
  const [activeDimension, setActiveDimension] = useState<ScoreDimension>(
    ScoreDimension.CashFlow,
  )

  const dimensions = [
    {
      name: ScoreDimension.CashFlow,
      val: 92,
      desc: 'Direct rental yield minus all expenses including maintenance reserves.',
    },
    {
      name: ScoreDimension.Equity,
      val: 84,
      desc: 'Market appreciation potential based on local development and zip-code growth.',
    },
    {
      name: ScoreDimension.Risk,
      val: 75,
      desc: 'Evaluation of neighborhood stability, vacancy rates, and structural age.',
    },
    {
      name: ScoreDimension.Tax,
      val: 98,
      desc: 'Optimizing depreciation, cost segregation potential, and local tax benefits.',
    },
    {
      name: ScoreDimension.Effort,
      val: 62,
      desc: 'Quantifying the hours required to manage relative to portfolio size.',
    },
  ]

  return (
    <section
      id="score"
      className="py-24 transition-colors duration-500 relative overflow-hidden bg-slate-100 dark:bg-[#1A1A1A]"
    >
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="rounded-[3rem] p-12 lg:p-20 flex flex-col items-center border shadow-2xl shadow-slate-200/50 relative overflow-hidden transition-colors duration-500 bg-white border-black/5 dark:bg-black dark:border-white/10 dark:shadow-black/30">
              <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[100px] transition-colors duration-500 bg-violet-500/10 dark:bg-emerald-500/10"></div>

              <div className="score-glow">
                <PropertyScoreGauge score={82} />
              </div>

              <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full relative z-10">
                {dimensions.map((d) => {
                  const isHigh = d.val > 80
                  const isActive = activeDimension === d.name

                  return (
                    <button
                      key={d.name}
                      onMouseEnter={() => setActiveDimension(d.name)}
                      className={`group text-left p-6 rounded-3xl border transition-all duration-300 ${
                        isActive
                          ? 'bg-violet-600 border-violet-600 text-white shadow-xl shadow-violet-200 dark:bg-white dark:border-white dark:text-black dark:shadow-2xl dark:shadow-black/30'
                          : 'bg-slate-50 border-black/5 text-slate-900 hover:border-black/20 dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:border-white/30'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                          {d.name}
                        </span>
                        <span
                          className={`text-xs font-black transition-colors ${
                            isActive
                              ? 'text-white dark:text-black'
                              : isHigh
                                ? 'text-violet-600 dark:text-[#E8FF4D]'
                                : 'text-amber-500'
                          }`}
                        >
                          {d.val}
                        </span>
                      </div>
                      <div
                        className={`w-full h-1 rounded-full overflow-hidden ${
                          isActive
                            ? 'opacity-20 bg-current'
                            : 'bg-black/10 dark:bg-white/10'
                        }`}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isActive
                              ? 'bg-white dark:bg-black'
                              : isHigh
                                ? 'bg-violet-500 dark:bg-[#E8FF4D]'
                                : 'bg-amber-500'
                          }`}
                          style={{ width: `${d.val}%` }}
                        ></div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-16">
              <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-[0.9] uppercase transition-colors text-slate-900 dark:text-white">
                THE IQ OF
                <br />
                <span className="transition-all duration-500 bg-violet-600 text-white px-4 py-1 rounded-xl shadow-lg shadow-violet-200 inline-block mt-2 dark:bg-transparent dark:text-[#E8FF4D] dark:shadow-none">
                  MODERN
                </span>
                <br />
                INVESTING.
              </h2>
              <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-lg">
                Stop guessing. Start knowing. Our proprietary score analyzes
                10,000+ data points per asset to give you absolute clarity.
              </p>
            </div>

            <div className="space-y-12 relative">
              {dimensions.map((d) => (
                <div
                  key={d.name}
                  className={`relative pl-12 transition-all duration-500 ${
                    activeDimension === d.name
                      ? 'opacity-100 translate-x-4'
                      : 'opacity-20 blur-[1px]'
                  }`}
                >
                  <div
                    className={`absolute left-0 top-1.5 w-6 h-1 rounded-full transition-all duration-500 ${
                      activeDimension === d.name
                        ? 'bg-violet-600 w-10 shadow-[0_0_15px_rgba(139,92,246,0.5)] dark:bg-[#E8FF4D] dark:shadow-[0_0_15px_rgba(232,255,77,0.5)]'
                        : 'bg-slate-900/20 dark:bg-white/20'
                    }`}
                  ></div>
                  <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter transition-colors text-slate-900 dark:text-white">
                    {d.name}
                  </h3>
                  <p className="text-slate-400 font-medium leading-relaxed text-sm max-w-sm">
                    {d.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PropertyScoreSection
