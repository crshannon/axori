import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@axori/ui";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import {
  Eye,
  Zap,
  Shield,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  Target,
} from "lucide-react";

export const Route = createFileRoute("/_public/about")({
  component: About,
});

/**
 * Value proposition items displayed in the "Why We Do It" section
 */
const VALUES = [
  {
    icon: Eye,
    title: "Transparency",
    desc: "No hidden biases. Just the numbers that matter for your specific strategy.",
    gradient: "from-violet-500 to-violet-600",
  },
  {
    icon: Zap,
    title: "Efficiency",
    desc: "AI doesn't sleep, so you can. We process leases while you're at the beach.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Sovereignty",
    desc: "Take back control of your time and your assets. Own the platform, own your future.",
    gradient: "from-emerald-500 to-teal-500",
  },
] as const;

/**
 * Stats displayed in the quirky data cards
 */
const STATS = [
  { value: "12k+", label: "Spreadsheets retired to the grave since launch." },
  { value: "47", label: "Countries with active users." },
  { value: "$2.4B", label: "Portfolio value managed on platform." },
] as const;

/**
 * About Page Component
 *
 * Tells the Axori story with a bento-grid layout,
 * animated backgrounds, and modern visual design.
 */
function About() {
  return (
    <PublicLayout>
      <main className="relative flex-grow pt-12 overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="about-grid"
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
            <rect width="100%" height="100%" fill="url(#about-grid)" />
          </svg>
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-40 left-1/4 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[120px] dark:bg-violet-500/10" />
        <div className="absolute bottom-40 right-1/4 w-[400px] h-[400px] bg-[#E8FF4D]/15 rounded-full blur-[100px] dark:bg-[#E8FF4D]/10" />
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] dark:bg-blue-500/5" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-6">
          {/* Header Hero */}
          <div className="mb-24 md:mb-32">
            {/* Badge */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-lg shadow-violet-500/5">
                <Sparkles className="w-4 h-4 text-violet-500 dark:text-[#E8FF4D]" />
                <span className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-[#E8FF4D]">
                  Our Story
                </span>
              </div>
            </div>

            <h1 className="text-[clamp(3rem,8vw,6rem)] leading-[0.9] tracking-[-0.04em] font-extrabold uppercase mb-8 transition-colors text-slate-900 dark:text-white">
              WE BUILT THE <br />
              <span className="text-violet-600 dark:text-[#E8FF4D]">EYE</span>{" "}
              IN THE SKY <br />
              FOR YOUR <span className="opacity-30">DIRT</span>.
            </h1>
            <p className="max-w-2xl text-xl text-slate-500 dark:text-white/50 font-medium leading-relaxed">
              Axori started when we realized most real estate "pro-formas" were
              just creative writing. We replaced gut feelings with cold, hard
              data.
            </p>
          </div>

          {/* Bento Grid Story */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-24 md:mb-32">
            {/* The Problem Card - Large */}
            <div className="md:col-span-8 p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] border transition-all duration-500 bg-slate-900 text-white border-slate-800 dark:bg-white dark:text-black dark:border-white/10 group hover:scale-[1.01]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-black/10 flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest opacity-50">
                  The Problem
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6 leading-tight">
                Spreadsheet
                <br />
                Blindness
              </h2>
              <p className="text-lg opacity-70 leading-relaxed max-w-xl">
                Most investors manage multi-million dollar portfolios using
                software built in the 90s or spreadsheets that break if you look
                at them wrong. We wanted something that actually thought like an
                analyst.
              </p>
              <div className="mt-10 flex gap-3">
                <div className="w-12 h-1 bg-current opacity-20 rounded-full"></div>
                <div className="w-12 h-1 rounded-full transition-colors duration-500 bg-violet-500 dark:bg-[#E8FF4D]"></div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="md:col-span-4 p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] border flex flex-col justify-between transition-all duration-500 bg-white border-slate-200 shadow-xl shadow-slate-200/50 dark:bg-[#141417] dark:border-white/10 dark:shadow-black/20 group hover:scale-[1.02]">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/40">
                QUIRKY DATA
              </span>
              <div>
                <span className="text-5xl md:text-6xl font-black tabular-nums tracking-tighter text-violet-600 dark:text-[#E8FF4D]">
                  {STATS[0].value}
                </span>
                <p className="text-xs font-bold uppercase tracking-widest mt-3 text-slate-500 dark:text-white/40">
                  {STATS[0].label}
                </p>
              </div>
            </div>

            {/* Image Card */}
            <div className="md:col-span-4 rounded-[2rem] md:rounded-[3rem] overflow-hidden min-h-[350px] md:min-h-[400px] relative group">
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800"
                className="absolute inset-0 w-full h-full object-cover grayscale transition-all duration-700 group-hover:scale-110 group-hover:grayscale-0"
                alt="Team Office"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-white/60" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                    Headquarters
                  </span>
                </div>
                <h3 className="text-white text-xl md:text-2xl font-black uppercase tracking-tighter">
                  99 WALL ST, NYC
                </h3>
              </div>
            </div>

            {/* Tagline Card */}
            <div className="md:col-span-4 p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] border flex flex-col justify-between transition-all duration-500 bg-gradient-to-br from-violet-600 to-violet-700 text-white border-violet-500 shadow-xl shadow-violet-200 dark:from-[#1a1a1f] dark:to-[#0f0f12] dark:border-white/10 dark:shadow-black/20 group hover:scale-[1.02]">
              <div className="flex gap-1.5 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full border-2 border-white/50 dark:border-white/30 transition-all ${
                      i === 2 ? "bg-white dark:bg-[#E8FF4D]" : ""
                    }`}
                  ></div>
                ))}
              </div>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none">
                Data is the <br />
                <span className="text-white/60 dark:text-[#E8FF4D]">
                  new location.
                </span>
              </h3>
            </div>

            {/* Vision Card */}
            <div className="md:col-span-4 p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] border flex flex-col justify-between transition-all duration-500 bg-white border-slate-200 shadow-sm dark:bg-[#141417] dark:border-white/10 group hover:scale-[1.02]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400 dark:text-white/40" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-white/40">
                  The Vision
                </p>
              </div>
              <p className="text-base md:text-lg font-bold leading-relaxed mt-6 text-slate-900 dark:text-white">
                To empower the next 1 million investors to build generational
                wealth without the "accidental landlord" headache.
              </p>
              <Link to="/#waitlist">
                <Button className="mt-8 w-full py-4 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90">
                  JOIN THE MISSION
                </Button>
              </Link>
            </div>
          </div>

          {/* The Why Section */}
          <section className="pb-24 md:pb-32">
            <div className="text-center mb-16">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-[#E8FF4D]">
                Our Principles
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-4 text-slate-900 dark:text-white">
                WHY WE DO IT
              </h2>
              <p className="text-slate-400 dark:text-white/40 font-medium italic text-lg">
                Because the top 1% shouldn't have all the fun.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {VALUES.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="text-center group p-8 rounded-[2rem] transition-all duration-500 hover:bg-white dark:hover:bg-white/5 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20"
                  >
                    <div
                      className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-8 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 bg-gradient-to-br ${item.gradient} shadow-lg`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-4 text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-white/50 leading-relaxed font-medium">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* CTA Section */}
          <section className="pb-24 md:pb-32">
            <div className="relative rounded-[2rem] md:rounded-[3rem] p-12 md:p-20 text-center overflow-hidden">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-[#0f0f12] dark:via-[#1a1a1f] dark:to-[#0f0f12]" />

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/20 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#E8FF4D]/10 rounded-full blur-[80px]" />

              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-[0.03]">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern
                      id="cta-grid"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="white"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#cta-grid)" />
                </svg>
              </div>

              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-6 text-white">
                  Ready to Join
                  <br />
                  <span className="text-violet-400 dark:text-[#E8FF4D]">
                    The Movement?
                  </span>
                </h2>
                <p className="text-lg text-white/60 mb-10 max-w-lg mx-auto font-medium">
                  Get early access to the platform that's changing how investors
                  think about real estate.
                </p>
                <Link to="/#waitlist">
                  <Button className="inline-flex items-center gap-3 px-10 py-5 rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 transition-all bg-white text-slate-900 hover:bg-slate-100 dark:bg-[#E8FF4D] dark:text-black dark:hover:bg-[#d4eb45]">
                    Get Early Access
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </PublicLayout>
  );
}
