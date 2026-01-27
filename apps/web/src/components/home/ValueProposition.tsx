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
  GraduationCap,
  Layers,
  Target,
  Globe,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
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
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl dark:bg-violet-500/5 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#E8FF4D]/10 rounded-full blur-3xl dark:bg-[#E8FF4D]/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl dark:bg-blue-500/3" />

      <div className="relative mx-auto max-w-[1440px] px-4 md:px-6">
        {/* Section Header */}
        <div className="mb-16 md:mb-20 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
              <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">
                The Full-Stack Platform
              </span>
            </div>
            <h2 className="mb-6 text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-slate-900 dark:text-white max-w-3xl leading-[0.95]">
              Built for Real Estate{" "}
              <span className="text-violet-600 dark:text-[#E8FF4D]">
                Investors
              </span>
            </h2>
            <p className="max-w-2xl text-lg text-slate-600 dark:text-white/50">
              Run your portfolio with an integrated platform built to scale. From
              single properties to institutional portfolios.
            </p>
          </div>

          {/* Quick feature list */}
          <div className="flex flex-wrap gap-3">
            {["Portfolio Tracking", "Tax Tools", "Learning Hub", "Analytics"].map(
              (feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-white/60"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {feature}
                </div>
              )
            )}
          </div>
        </div>

        {/* Bento Grid - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* Hero Card - Portfolio Analytics - Full width on large */}
          <div className="md:col-span-2 lg:col-span-2 lg:row-span-2 group relative overflow-hidden rounded-3xl p-8 md:p-10 bg-gradient-to-br from-violet-600 via-violet-700 to-violet-800 dark:from-violet-600 dark:to-violet-900">
            {/* Animated background elements */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-all duration-700" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-400/30 rounded-full blur-2xl" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-[#E8FF4D]/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="vp-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#vp-grid)" />
              </svg>
            </div>

            <div className="relative z-10 h-full flex flex-col">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-4 text-2xl md:text-3xl font-black text-white">
                Portfolio Analytics
              </h3>
              <p className="text-white/80 text-lg leading-relaxed max-w-md mb-8">
                See your entire portfolio at a glance. Track performance, cash
                flow, and equity across all your properties in real-time.
              </p>

              {/* Mini dashboard visualization */}
              <div className="mt-auto">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
                      Monthly Cash Flow
                    </span>
                    <span className="text-xs text-emerald-300 font-bold">+12.4%</span>
                  </div>
                  {/* Animated chart bars */}
                  <div className="flex items-end gap-1.5 h-20">
                    {[35, 50, 42, 65, 48, 75, 55, 85, 62, 90, 70, 95].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-white/30 rounded-t transition-all duration-500 group-hover:bg-white/50"
                        style={{
                          height: `${height}%`,
                          transitionDelay: `${i * 50}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Hub Card - NEW */}
          <div className="lg:col-span-2 group relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-all duration-500" />
            <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-[#E8FF4D]/20 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/10 group-hover:rotate-6 transition-transform duration-300">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-black text-white">
                  Learning Enabled
                </h3>
                <p className="text-sm text-white/80 max-w-sm">
                  Built-in educational content explains every metric, concept, and
                  strategy. Learn while you invest.
                </p>
              </div>

              {/* Learning badges */}
              <div className="flex flex-wrap gap-2">
                {["Cap Rates", "DSCR", "IRR", "NOI", "Cash-on-Cash"].map((topic, i) => (
                  <span
                    key={topic}
                    className="px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-sm border border-white/10 hover:bg-white/30 transition-colors cursor-pointer"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Tax Optimization */}
          <div className="group relative overflow-hidden rounded-3xl p-6 md:p-8 bg-white dark:bg-[#141417] border border-slate-200 dark:border-white/5 hover:border-[#E8FF4D]/50 dark:hover:border-[#E8FF4D]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#E8FF4D]/5">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#E8FF4D]/0 group-hover:bg-[#E8FF4D]/20 rounded-full blur-3xl transition-all duration-500" />

            <div className="relative z-10">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8FF4D]/20 to-lime-500/10 border border-[#E8FF4D]/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Calculator className="h-6 w-6 text-lime-600 dark:text-[#E8FF4D]" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                Tax Optimization
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-white/50">
                Depreciation tracking, cost segregation, and tax shield calculations.
              </p>

              {/* Hover reveal */}
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#E8FF4D] opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Explore tools</span>
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Investment Scoring */}
          <div className="group relative overflow-hidden rounded-3xl p-6 md:p-8 bg-white dark:bg-[#141417] border border-slate-200 dark:border-white/5 hover:border-blue-500/50 dark:hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/0 group-hover:bg-blue-500/10 rounded-full blur-3xl transition-all duration-500" />

            <div className="relative z-10">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                Investment Scoring
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-white/50">
                5-dimension scoring across cash flow, equity, risk, and more.
              </p>

              {/* Mini score visualization */}
              <div className="mt-4 flex gap-1">
                {[85, 72, 90, 68, 88].map((score, i) => (
                  <div key={i} className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500 group-hover:bg-blue-400"
                      style={{ width: `${score}%`, transitionDelay: `${i * 100}ms` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Wealth Tracking - Wide card */}
          <div className="md:col-span-2 group relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-[#141417] dark:via-[#1a1a1f] dark:to-[#141417] border border-slate-700/50 dark:border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8FF4D]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm group-hover:bg-[#E8FF4D]/20 transition-colors duration-300">
                  <Wallet className="h-6 w-6 text-[#E8FF4D]" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">
                  Freedom Number Tracking
                </h3>
                <p className="text-sm text-white/50 max-w-md">
                  Watch your path to financial independence with personalized
                  milestones and goal tracking.
                </p>
              </div>

              {/* Progress visualization - Enhanced */}
              <div className="flex-shrink-0 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                      Monthly
                    </p>
                    <p className="text-2xl font-black text-white tabular-nums">
                      $8.4K
                    </p>
                  </div>
                  <div className="flex-1 min-w-[100px]">
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className="w-[70%] h-full bg-gradient-to-r from-[#E8FF4D] to-lime-400 rounded-full relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                    <p className="text-[10px] text-white/30 mt-1 text-center">70% to goal</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
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
          <div className="group relative overflow-hidden rounded-3xl p-6 md:p-8 bg-white dark:bg-[#141417] border border-slate-200 dark:border-white/5 hover:border-violet-500/50 dark:hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/0 group-hover:bg-violet-500/10 rounded-full blur-3xl transition-all duration-500" />

            <div className="relative z-10">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                Smart Automation
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-white/50">
                Connect PM software and banks. We handle the data entry automatically.
              </p>

              {/* Connection indicators */}
              <div className="mt-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  3 integrations active
                </span>
              </div>
            </div>
          </div>

          {/* Multi-Entity Support - NEW */}
          <div className="group relative overflow-hidden rounded-3xl p-6 md:p-8 bg-white dark:bg-[#141417] border border-slate-200 dark:border-white/5 hover:border-orange-500/50 dark:hover:border-orange-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/0 group-hover:bg-orange-500/10 rounded-full blur-3xl transition-all duration-500" />

            <div className="relative z-10">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Layers className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                Multi-Entity
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-white/50">
                LLCs, trusts, personal holdings — all in one unified dashboard.
              </p>

              {/* Entity pills */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {["LLC", "Trust", "Personal"].map((type) => (
                  <span
                    key={type}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Market Intelligence - NEW */}
          <div className="lg:col-span-2 group relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-700 dark:to-purple-800">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-all duration-500" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#E8FF4D]/10 rounded-full blur-2xl" />

            {/* Animated dots background */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/10 group-hover:rotate-12 transition-transform duration-300">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-black text-white">
                  Market Intelligence
                </h3>
                <p className="text-sm text-white/80 max-w-sm">
                  Real-time market data, rent comparables, and neighborhood
                  analytics powered by institutional-grade sources.
                </p>
              </div>

              {/* Market metrics */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Markets", value: "150+" },
                  { label: "Data Points", value: "50M+" },
                  { label: "Updates", value: "Daily" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="text-center p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10"
                  >
                    <p className="text-lg font-black text-white">{stat.value}</p>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Deal Analyzer - NEW */}
          <div className="group relative overflow-hidden rounded-3xl p-6 md:p-8 bg-white dark:bg-[#141417] border border-slate-200 dark:border-white/5 hover:border-pink-500/50 dark:hover:border-pink-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/5">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-500/0 group-hover:bg-pink-500/10 rounded-full blur-3xl transition-all duration-500" />

            <div className="relative z-10">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                <Target className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                Deal Analyzer
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-white/50">
                Analyze any deal in seconds. Know if it meets your criteria instantly.
              </p>

              {/* Quick score */}
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-100 dark:bg-pink-500/10">
                <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
                  <span className="text-xs font-black text-white">A+</span>
                </div>
                <span className="text-xs font-bold text-pink-600 dark:text-pink-400">
                  Strong Buy Signal
                </span>
              </div>
            </div>
          </div>

          {/* Bank-Level Security - NEW */}
          <div className="group relative overflow-hidden rounded-3xl p-6 md:p-8 bg-white dark:bg-[#141417] border border-slate-200 dark:border-white/5 hover:border-emerald-500/50 dark:hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/0 group-hover:bg-emerald-500/10 rounded-full blur-3xl transition-all duration-500" />

            <div className="relative z-10">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                Bank-Level Security
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-white/50">
                SOC 2 compliant, 256-bit encryption, read-only bank connections.
              </p>

              {/* Security badges */}
              <div className="mt-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Verified Secure
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-16 md:mt-20 pt-16 border-t border-slate-200 dark:border-white/5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { icon: Building2, value: "50K+", label: "Properties Tracked" },
              { icon: LineChart, value: "$2.1B", label: "Assets Managed" },
              { icon: Shield, value: "99.9%", label: "Uptime SLA" },
              { icon: PieChart, value: "18.4%", label: "Avg. ROI Boost" },
            ].map((stat, i) => (
              <div key={stat.label} className="text-center group">
                <div className="flex items-center justify-center gap-1 mb-3">
                  <stat.icon className="w-5 h-5 text-violet-500 dark:text-[#E8FF4D] group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tabular-nums">
                  {stat.value}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/40 mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
