import React from 'react'
import {
  ArrowRight,
  Banknote,
  Calculator,
  Clock,
  Shield,
  TrendingUp,
} from 'lucide-react'

const PropertyScoreSection: React.FC = () => {
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
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Side - Visual Journey Graphic */}
          <div className="relative min-h-[500px] md:min-h-[600px] order-2 lg:order-1">
            {/* Flowing SVG Path */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 500 600"
              fill="none"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Main flowing path */}
              <path
                d="M250 50
                   Q350 80 320 150
                   Q280 220 180 200
                   Q80 180 100 280
                   Q120 380 220 360
                   Q320 340 380 420
                   Q440 500 320 550"
                stroke="url(#flow-gradient)"
                strokeWidth="2"
                strokeDasharray="6 6"
                fill="none"
                className="opacity-40"
              />
              {/* Glow path */}
              <path
                d="M250 50
                   Q350 80 320 150
                   Q280 220 180 200
                   Q80 180 100 280
                   Q120 380 220 360
                   Q320 340 380 420
                   Q440 500 320 550"
                stroke="url(#flow-gradient)"
                strokeWidth="8"
                fill="none"
                className="opacity-10 blur-sm"
              />
              <defs>
                <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="50%" stopColor="#E8FF4D" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Floating Cards positioned along the path */}

            {/* Cash Flow Card - Top */}
            <div className="absolute top-[5%] left-[35%] transform -translate-x-1/2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Banknote className="w-6 h-6 text-white" />
                </div>
                <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 dark:border-white/10 shadow-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-1">
                    Cash Flow
                  </p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    92
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-white/50 mt-1">
                    Monthly income after costs
                  </p>
                </div>
              </div>
            </div>

            {/* Equity Card - Upper Right */}
            <div className="absolute top-[20%] right-[5%]">
              <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 dark:border-white/10 shadow-xl max-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">
                    Equity
                  </span>
                </div>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                  84
                </p>
                <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
                  Long-term wealth building potential
                </p>
              </div>
            </div>

            {/* Risk Card - Middle Left */}
            <div className="absolute top-[35%] left-[2%]">
              <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 dark:border-white/10 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                      Risk Assessment
                    </p>
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                      75
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-white/50 mt-2">
                  Portfolio protection score based on stability metrics
                </p>
              </div>
            </div>

            {/* Tax Card - Middle Right */}
            <div className="absolute top-[55%] right-[8%]">
              <div className="flex items-center gap-3">
                <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 dark:border-white/10 shadow-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-1">
                    Tax Benefits
                  </p>
                  <p className="text-2xl font-black text-violet-600 dark:text-[#E8FF4D] tabular-nums">
                    98
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
                    Maximum deduction potential
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 dark:from-[#E8FF4D] dark:to-lime-400 flex items-center justify-center shadow-lg shadow-violet-500/20 dark:shadow-[#E8FF4D]/20">
                  <Calculator className="w-5 h-5 text-white dark:text-black" />
                </div>
              </div>
            </div>

            {/* Effort Card - Bottom */}
            <div className="absolute bottom-[8%] left-[30%]">
              <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 dark:border-white/10 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                      Management Effort
                    </p>
                    <p className="text-xl font-black text-pink-600 dark:text-pink-400 tabular-nums">
                      62
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-white/50 mt-2">
                  Hours required relative to portfolio size
                </p>
              </div>
            </div>

            {/* Center Score Gauge - Small */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-white dark:bg-[#141417] rounded-3xl p-6 border border-slate-200/50 dark:border-white/10 shadow-2xl">
                <div className="w-32 h-32 relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-slate-200 dark:text-white/10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="url(#gauge-gradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${82 * 2.51} 251`}
                    />
                    <defs>
                      <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#E8FF4D" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                      82
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                      Score
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative dots */}
            <div className="absolute top-[15%] left-[60%] w-2 h-2 rounded-full bg-violet-500 dark:bg-[#E8FF4D] animate-pulse" />
            <div className="absolute top-[45%] left-[25%] w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-[70%] right-[25%] w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Right Side - Content */}
          <div className="relative order-1 lg:order-2">
            <div className="mb-8">
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
              <p className="text-base md:text-lg text-slate-500 dark:text-white/50 font-medium leading-relaxed max-w-md mb-8">
                Stop guessing. Start knowing. Our proprietary score analyzes
                10,000+ data points per asset to give you absolute clarity on
                every investment decision.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-4 mb-10">
              {[
                { label: "5 Dimensions", desc: "Cash Flow, Equity, Risk, Tax, Effort" },
                { label: "10,000+ Data Points", desc: "Institutional-grade analysis" },
                { label: "Real-time Updates", desc: "Market conditions change, so do scores" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/10"
                >
                  <div className="w-2 h-2 rounded-full bg-violet-500 dark:bg-[#E8FF4D] mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-white/50">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href="#waitlist"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold uppercase tracking-wider text-sm bg-violet-600 text-white hover:bg-violet-700 dark:bg-[#E8FF4D] dark:text-black dark:hover:bg-[#d4eb45] transition-all hover:scale-105 shadow-lg shadow-violet-500/20 dark:shadow-[#E8FF4D]/20"
            >
              See It In Action
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PropertyScoreSection
