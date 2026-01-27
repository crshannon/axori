import React, { useState } from 'react'
import PropertyScoreGauge from './PropertyScoreGauge'
import {
  Banknote,
  TrendingUp,
  Shield,
  Calculator,
  Clock,
} from 'lucide-react'

export enum ScoreDimension {
  CashFlow = 'Cash Flow',
  Equity = 'Equity',
  Risk = 'Risk',
  Tax = 'Tax',
  Effort = 'Effort',
}

const dimensionIcons = {
  [ScoreDimension.CashFlow]: Banknote,
  [ScoreDimension.Equity]: TrendingUp,
  [ScoreDimension.Risk]: Shield,
  [ScoreDimension.Tax]: Calculator,
  [ScoreDimension.Effort]: Clock,
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
      highlight: 'Monthly income after all costs',
    },
    {
      name: ScoreDimension.Equity,
      val: 84,
      desc: 'Market appreciation potential based on local development and zip-code growth.',
      highlight: 'Long-term wealth building',
    },
    {
      name: ScoreDimension.Risk,
      val: 75,
      desc: 'Evaluation of neighborhood stability, vacancy rates, and structural age.',
      highlight: 'Portfolio protection score',
    },
    {
      name: ScoreDimension.Tax,
      val: 98,
      desc: 'Optimizing depreciation, cost segregation potential, and local tax benefits.',
      highlight: 'Maximum deduction potential',
    },
    {
      name: ScoreDimension.Effort,
      val: 62,
      desc: 'Quantifying the hours required to manage relative to portfolio size.',
      highlight: 'Time investment required',
    },
  ]

  return (
    <section
      id="score"
      className="py-24 md:py-32 transition-colors duration-500 relative overflow-hidden bg-slate-100 dark:bg-[#0F1115]"
    >
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="score-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#score-grid)" />
        </svg>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-6 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Side - Score Gauge */}
          <div className="relative order-2 lg:order-1">
            <div className="rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 lg:p-16 flex flex-col items-center border shadow-2xl shadow-slate-200/50 relative overflow-hidden transition-colors duration-500 bg-white border-black/5 dark:bg-[#141417] dark:border-white/5 dark:shadow-black/30">
              {/* Glow effect */}
              <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[100px] transition-colors duration-500 bg-violet-500/10 dark:bg-violet-500/5"></div>
              <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-[80px] bg-[#E8FF4D]/10 dark:bg-[#E8FF4D]/5"></div>

              <div className="score-glow relative z-10">
                <PropertyScoreGauge score={82} />
              </div>

              <div className="mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full relative z-10">
                {dimensions.map((d) => {
                  const isHigh = d.val > 80
                  const isActive = activeDimension === d.name
                  const Icon = dimensionIcons[d.name]

                  return (
                    <button
                      key={d.name}
                      onMouseEnter={() => setActiveDimension(d.name)}
                      className={`group text-left p-4 md:p-5 rounded-2xl border transition-all duration-300 ${
                        isActive
                          ? 'bg-violet-600 border-violet-600 text-white shadow-xl shadow-violet-200/50 dark:bg-[#E8FF4D] dark:border-[#E8FF4D] dark:text-black dark:shadow-[#E8FF4D]/20'
                          : 'bg-slate-50 border-black/5 text-slate-900 hover:border-black/20 dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isActive ? '' : 'opacity-50'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                            {d.name}
                          </span>
                        </div>
                        <span
                          className={`text-sm font-black transition-colors ${
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
                        className={`w-full h-1.5 rounded-full overflow-hidden ${
                          isActive
                            ? 'bg-white/20 dark:bg-black/20'
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

          {/* Right Side - Journey Style Layout */}
          <div className="relative order-1 lg:order-2">
            {/* Header */}
            <div className="mb-12 md:mb-16">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-[#E8FF4D]">
                Investment Intelligence
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tighter leading-[0.9] uppercase transition-colors text-slate-900 dark:text-white">
                THE IQ OF
                <br />
                <span className="text-violet-600 dark:text-[#E8FF4D]">
                  MODERN
                </span>
                <br />
                INVESTING.
              </h2>
              <p className="text-base md:text-lg text-slate-500 dark:text-white/50 font-medium leading-relaxed max-w-md">
                Stop guessing. Start knowing. Our proprietary score analyzes
                10,000+ data points per asset to give you absolute clarity.
              </p>
            </div>

            {/* Journey Path with Cards */}
            <div className="relative">
              {/* Flowing SVG Path */}
              <svg
                className="absolute left-6 top-0 h-full w-20 hidden md:block"
                viewBox="0 0 80 500"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M40 0 Q60 50 40 100 Q20 150 40 200 Q60 250 40 300 Q20 350 40 400 Q60 450 40 500"
                  stroke="url(#journey-gradient)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  fill="none"
                  className="opacity-30"
                />
                <defs>
                  <linearGradient id="journey-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="50%" stopColor="#E8FF4D" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Dimension Cards */}
              <div className="space-y-4 md:space-y-5">
                {dimensions.map((d, index) => {
                  const isActive = activeDimension === d.name
                  const Icon = dimensionIcons[d.name]

                  return (
                    <div
                      key={d.name}
                      onMouseEnter={() => setActiveDimension(d.name)}
                      className={`relative md:ml-16 transition-all duration-500 cursor-pointer ${
                        isActive
                          ? 'opacity-100 translate-x-2'
                          : 'opacity-40 hover:opacity-70'
                      }`}
                    >
                      {/* Icon on the path */}
                      <div
                        className={`absolute -left-16 top-1/2 -translate-y-1/2 hidden md:flex w-10 h-10 rounded-xl items-center justify-center transition-all duration-300 ${
                          isActive
                            ? 'bg-violet-600 dark:bg-[#E8FF4D] shadow-lg shadow-violet-500/30 dark:shadow-[#E8FF4D]/30 scale-110'
                            : 'bg-slate-200 dark:bg-white/10'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 transition-colors ${
                            isActive
                              ? 'text-white dark:text-black'
                              : 'text-slate-500 dark:text-white/50'
                          }`}
                        />
                      </div>

                      {/* Card */}
                      <div
                        className={`p-5 md:p-6 rounded-2xl border transition-all duration-300 ${
                          isActive
                            ? 'bg-white dark:bg-white/5 border-violet-200 dark:border-[#E8FF4D]/20 shadow-lg shadow-violet-100 dark:shadow-none'
                            : 'bg-transparent border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Mobile icon */}
                          <div
                            className={`md:hidden flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              isActive
                                ? 'bg-violet-600 dark:bg-[#E8FF4D]'
                                : 'bg-slate-100 dark:bg-white/10'
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 transition-colors ${
                                isActive
                                  ? 'text-white dark:text-black'
                                  : 'text-slate-500 dark:text-white/50'
                              }`}
                            />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3
                                className={`text-lg font-black uppercase tracking-tight transition-colors ${
                                  isActive
                                    ? 'text-slate-900 dark:text-white'
                                    : 'text-slate-600 dark:text-white/70'
                                }`}
                              >
                                {d.name}
                              </h3>
                              <span
                                className={`text-2xl font-black tabular-nums transition-colors ${
                                  isActive
                                    ? d.val > 80
                                      ? 'text-violet-600 dark:text-[#E8FF4D]'
                                      : 'text-amber-500'
                                    : 'text-slate-400 dark:text-white/30'
                                }`}
                              >
                                {d.val}
                              </span>
                            </div>
                            <p
                              className={`text-sm leading-relaxed mb-3 transition-colors ${
                                isActive
                                  ? 'text-slate-600 dark:text-white/60'
                                  : 'text-slate-400 dark:text-white/40'
                              }`}
                            >
                              {d.desc}
                            </p>
                            {isActive && (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-[#E8FF4D]/10 text-violet-700 dark:text-[#E8FF4D] text-xs font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                {d.highlight}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PropertyScoreSection
