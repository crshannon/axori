import {
  BarChart3,
  Calculator,
  Shield,
  Zap,
  TrendingUp,
  PieChart,
  Building2,
  Wallet,
  LineChart,
} from "lucide-react";

/**
 * Value Proposition Section
 *
 * Showcases the key features and benefits of Axori for real estate investors
 * with a dynamic bento-grid layout and visual effects.
 */
export function ValueProposition() {
  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden bg-slate-50 dark:bg-[#0a0a0c]">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl dark:bg-violet-500/5" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#E8FF4D]/10 rounded-full blur-3xl dark:bg-[#E8FF4D]/5" />

      <div className="relative mx-auto max-w-[1440px] px-4 md:px-6">
        {/* Section Header */}
        <div className="mb-16 md:mb-20">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-[#E8FF4D]">
            The Full-Stack Platform
          </p>
          <h2 className="mb-6 text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-slate-900 dark:text-white max-w-3xl">
            Built for Real Estate{" "}
            <span className="text-violet-600 dark:text-[#E8FF4D]">
              Investors
            </span>
          </h2>
          <p className="max-w-2xl text-lg text-slate-600 dark:text-white/60">
            Run your portfolio with an integrated platform built to scale. From
            single properties to institutional portfolios.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Hero Card - Portfolio Analytics */}
          <div className="md:col-span-2 lg:col-span-2 group relative overflow-hidden rounded-3xl p-8 md:p-10 bg-gradient-to-br from-violet-600 to-violet-700 dark:from-violet-600 dark:to-violet-800">
            {/* Glow effect */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-all duration-700" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-400/30 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-1">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/10">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="mb-4 text-2xl md:text-3xl font-black text-white">
                  Portfolio Analytics
                </h3>
                <p className="text-white/80 text-lg leading-relaxed max-w-md">
                  See your entire portfolio at a glance. Track performance, cash
                  flow, and equity across all your properties in real-time.
                </p>
              </div>

              {/* Mini chart visualization */}
              <div className="flex-shrink-0 hidden md:block">
                <div className="relative w-48 h-32">
                  {/* Fake chart bars */}
                  <div className="absolute bottom-0 left-0 flex items-end gap-2 h-full w-full">
                    {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-white/30 rounded-t-sm transition-all duration-500 group-hover:bg-white/40"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                  {/* Trend line */}
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,70 Q20,60 35,55 T60,35 T100,15"
                      fill="none"
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Optimization */}
          <div className="group relative overflow-hidden rounded-3xl p-8 bg-white dark:bg-[#141417] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
            {/* Hover glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#E8FF4D]/0 group-hover:bg-[#E8FF4D]/20 rounded-full blur-3xl transition-all duration-500" />

            <div className="relative z-10">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8FF4D]/20 to-lime-500/10 dark:from-[#E8FF4D]/20 dark:to-[#E8FF4D]/5 border border-[#E8FF4D]/20">
                <Calculator className="h-7 w-7 text-lime-600 dark:text-[#E8FF4D]" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
                Tax Optimization
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-white/60">
                Built-in depreciation tracking, cost segregation tools, and tax
                shield calculations.
              </p>
            </div>
          </div>

          {/* Investment Scoring */}
          <div className="group relative overflow-hidden rounded-3xl p-8 bg-white dark:bg-[#141417] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/0 group-hover:bg-blue-500/10 rounded-full blur-3xl transition-all duration-500" />

            <div className="relative z-10">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20">
                <TrendingUp className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
                Investment Scoring
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-white/60">
                5-dimension scoring: Cash Flow, Equity, Risk, Tax Benefits, and
                Management Effort.
              </p>
            </div>
          </div>

          {/* Wealth Tracking - Wide card */}
          <div className="md:col-span-2 group relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-[#141417] dark:to-[#1a1a1f] border border-slate-700/50 dark:border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8FF4D]/5 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                  <Wallet className="h-6 w-6 text-[#E8FF4D]" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">
                  Freedom Number Tracking
                </h3>
                <p className="text-sm text-white/60 max-w-md">
                  Watch your path to financial independence. Set your freedom
                  number and track your progress with personalized milestones.
                </p>
              </div>

              {/* Progress visualization */}
              <div className="flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-white/40 uppercase tracking-wider">
                      Current
                    </p>
                    <p className="text-2xl font-black text-white tabular-nums">
                      $8.4K
                    </p>
                  </div>
                  <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-gradient-to-r from-[#E8FF4D] to-lime-400 rounded-full" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-white/40 uppercase tracking-wider">
                      Goal
                    </p>
                    <p className="text-2xl font-black text-[#E8FF4D] tabular-nums">
                      $12K
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Automation */}
          <div className="group relative overflow-hidden rounded-3xl p-8 bg-white dark:bg-[#141417] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/0 group-hover:bg-violet-500/10 rounded-full blur-3xl transition-all duration-500" />

            <div className="relative z-10">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/20">
                <Zap className="h-7 w-7 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
                Smart Automation
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-white/60">
                Connect property management software and bank accounts. We
                handle the data entry.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-16 md:mt-20 pt-16 border-t border-slate-200 dark:border-white/5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Building2 className="w-5 h-5 text-violet-500 dark:text-[#E8FF4D]" />
              </div>
              <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tabular-nums">
                50K+
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/40 mt-1">
                Properties Tracked
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <LineChart className="w-5 h-5 text-violet-500 dark:text-[#E8FF4D]" />
              </div>
              <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tabular-nums">
                $2.1B
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/40 mt-1">
                Assets Managed
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Shield className="w-5 h-5 text-violet-500 dark:text-[#E8FF4D]" />
              </div>
              <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tabular-nums">
                99.9%
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/40 mt-1">
                Uptime SLA
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <PieChart className="w-5 h-5 text-violet-500 dark:text-[#E8FF4D]" />
              </div>
              <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tabular-nums">
                18.4%
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/40 mt-1">
                Avg. ROI Boost
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
