import { EmailCaptureForm } from "./EmailCaptureForm";
import { Sparkles, TrendingUp, Building2, DollarSign, PieChart } from "lucide-react";

/**
 * Coming Soon Hero Component
 *
 * The main hero section for the soft-launch landing page.
 * Features animated background, floating data visualizations,
 * and email capture form.
 */
export function ComingSoonHero() {
  return (
    <section className="relative w-full min-h-[90vh] overflow-hidden bg-slate-50 dark:bg-[#0a0a0c]">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="hero-grid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[120px] dark:bg-violet-500/10 animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-[#E8FF4D]/15 rounded-full blur-[100px] dark:bg-[#E8FF4D]/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] dark:bg-blue-500/5" />

      {/* Floating Data Cards - Left Side */}
      <div className="absolute left-8 top-1/3 hidden lg:block animate-float-slow">
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                Monthly Cash Flow
              </p>
              <p className="text-lg font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                +$8,420
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-16 top-2/3 hidden lg:block animate-float-medium">
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                Properties
              </p>
              <p className="text-lg font-black tabular-nums text-slate-900 dark:text-white">
                12 Units
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Data Cards - Right Side */}
      <div className="absolute right-8 top-1/4 hidden lg:block animate-float-medium">
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8FF4D] to-lime-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-black" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                Portfolio Value
              </p>
              <p className="text-lg font-black tabular-nums text-slate-900 dark:text-white">
                $2.4M
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-20 top-[55%] hidden lg:block animate-float-slow">
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <PieChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                Cap Rate
              </p>
              <p className="text-lg font-black tabular-nums text-blue-600 dark:text-blue-400">
                7.2%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-[1440px] px-4 md:px-6 pt-20 md:pt-32 pb-24 md:pb-40">
        <div className="flex flex-col items-center text-center">
          {/* Coming Soon Badge */}
          <div className="mb-8 group">
            <div
              className="
                relative inline-flex items-center gap-2 rounded-full px-5 py-2.5
                bg-white dark:bg-white/5
                border border-slate-200 dark:border-white/10
                shadow-lg shadow-violet-500/5 dark:shadow-[#E8FF4D]/5
                transition-all duration-300
                hover:border-violet-300 dark:hover:border-[#E8FF4D]/30
              "
            >
              {/* Animated ring */}
              <span className="absolute inset-0 rounded-full border-2 border-violet-400/50 dark:border-[#E8FF4D]/30 animate-ping opacity-20" />

              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 dark:bg-[#E8FF4D] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500 dark:bg-[#E8FF4D]"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-[#E8FF4D]">
                Coming Soon
              </span>
              <Sparkles className="h-3.5 w-3.5 text-violet-500 dark:text-[#E8FF4D]" />
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="mb-8 text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
            <span className="block text-slate-900 dark:text-white">
              Own Your
            </span>
            <span className="block bg-gradient-to-r from-violet-600 via-violet-500 to-violet-600 dark:from-[#E8FF4D] dark:via-lime-300 dark:to-[#E8FF4D] bg-clip-text text-transparent">
              Wealth
            </span>
            <span className="block text-slate-400 dark:text-white/30 text-3xl md:text-4xl lg:text-5xl mt-2">
              Not Just Assets
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mb-12 max-w-xl text-lg md:text-xl text-slate-600 dark:text-white/50 leading-relaxed font-medium">
            The operating system for real estate investors.
            <span className="block mt-1 text-slate-500 dark:text-white/40">
              Institutional-grade analytics. Personal insights. One platform.
            </span>
          </p>

          {/* Email Capture Form */}
          <div className="w-full max-w-lg">
            <EmailCaptureForm source="hero" variant="hero" />

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2 text-slate-500 dark:text-white/40">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="font-semibold">Bank-level security</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-white/40">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">Early access priority</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-white/40">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="font-semibold">No spam, ever</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom stats ticker */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6 py-4">
          <div className="flex items-center justify-center gap-8 md:gap-16 text-sm overflow-x-auto">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-slate-400 dark:text-white/30 font-medium">Waitlist</span>
              <span className="font-black tabular-nums text-slate-900 dark:text-white">2,400+</span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-slate-400 dark:text-white/30 font-medium">Beta Users</span>
              <span className="font-black tabular-nums text-slate-900 dark:text-white">127</span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-slate-400 dark:text-white/30 font-medium">Launch</span>
              <span className="font-black text-violet-600 dark:text-[#E8FF4D]">Q1 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-2deg); }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
