import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@axori/ui'
import { ArrowRight } from 'lucide-react'
import PricingSection from '@/components/home/PricingSection'
import PropertyScoreSection from '@/components/home/PropertyScoreSection'
import { ComingSoonHero } from '@/components/home/ComingSoonHero'
import { ValueProposition } from '@/components/home/ValueProposition'
import { SocialProof } from '@/components/home/SocialProof'
import { PublicLayout } from '@/components/layouts/PublicLayout'
import { useComingSoonMode } from '@/hooks/useFeatureFlags'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const comingSoonMode = useComingSoonMode()

  // Coming Soon Mode - Simplified landing page with email capture
  if (comingSoonMode) {
    return (
      <PublicLayout>
        <ComingSoonHero />
        <ValueProposition />

        {/* Preview Section - Show a glimpse of what's coming */}
        <section className="relative w-full py-24 md:py-32 bg-white dark:bg-[#0F1115]">
          {/* Background effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-violet-500/5 via-transparent to-transparent dark:from-violet-500/5 dark:via-transparent dark:to-transparent" />

          <div className="relative mx-auto max-w-[1440px] px-4 md:px-6">
            <div className="text-center mb-16">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-[#E8FF4D]">
                Sneak Peek
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                Investment Analysis,{' '}
                <span className="text-violet-600 dark:text-[#E8FF4D]">
                  Reimagined
                </span>
              </h2>
              <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 dark:text-white/50">
                See exactly how we score properties across 5 critical dimensions.
                Every deal, analyzed like an institutional investor.
              </p>
            </div>

            {/* Show the property score section as a preview */}
            <PropertyScoreSection />
          </div>
        </section>

        {/* Social Proof */}
        <SocialProof />

        {/* Final CTA Section */}
        <section className="relative px-4 md:px-6 py-24 md:py-32 bg-slate-50 dark:bg-[#0a0a0c]">
          <div className="max-w-[1440px] mx-auto">
            <div className="relative rounded-[2rem] md:rounded-[3rem] p-12 md:p-20 lg:p-32 text-center overflow-hidden">
              {/* Background with gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-violet-700 to-violet-800 dark:from-[#1a1a1f] dark:via-[#141417] dark:to-[#0a0a0c]" />

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl dark:bg-[#E8FF4D]/5" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl dark:bg-violet-500/10" />

              {/* Grid pattern */}
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
                <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-white/10 dark:bg-[#E8FF4D]/10 border border-white/20 dark:border-[#E8FF4D]/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white dark:bg-[#E8FF4D] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white dark:bg-[#E8FF4D]"></span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-widest text-white dark:text-[#E8FF4D]">
                    Limited Early Access
                  </span>
                </div>

                <h2 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter mb-6 leading-[0.9] text-white dark:text-white">
                  Ready to Scale
                  <br />
                  <span className="text-white/50 dark:text-[#E8FF4D]">
                    Your Portfolio?
                  </span>
                </h2>
                <p className="text-lg md:text-xl mb-12 text-white/70 dark:text-white/50 max-w-xl mx-auto font-medium">
                  Join the waitlist now and get priority access, founder
                  pricing, and exclusive early investor perks.
                </p>
                <a
                  href="#waitlist"
                  className="inline-flex items-center gap-3 px-10 md:px-14 py-5 md:py-6 rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl bg-white text-violet-600 hover:bg-slate-50 dark:bg-[#E8FF4D] dark:text-black dark:hover:bg-[#d4eb45]"
                >
                  Join the Waitlist
                  <ArrowRight className="w-5 h-5" />
                </a>

                {/* Trust note */}
                <p className="mt-8 text-xs text-white/40 dark:text-white/30 font-medium">
                  2,400+ investors already waiting. No credit card required.
                </p>
              </div>
            </div>
          </div>
        </section>
      </PublicLayout>
    )
  }

  // Normal Mode - Full landing page (uses same hero with sign-up CTAs)
  return (
    <PublicLayout>
      {/* Hero - Same component with custom CTA slot */}
      <ComingSoonHero
        badgeText="Now Available"
        showWaitlistStats={false}
        ctaSlot={
          <>
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/sign-up">
                <Button className="px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-violet-200 bg-violet-600 text-white hover:bg-violet-700 dark:bg-[#E8FF4D] dark:text-black dark:hover:bg-[#d4eb45] dark:shadow-black/30">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button className="px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest hover:scale-105 transition-all bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10">
                  View Pricing
                </Button>
              </Link>
            </div>

            {/* Trust note */}
            <p className="mt-8 text-xs text-slate-400 dark:text-white/30 font-medium text-center">
              Free to start • No credit card required • 2,400+ investors
              already using Axori
            </p>
          </>
        }
      />

      {/* Value Proposition */}
      <ValueProposition />

      {/* Preview Section - Property Score */}
      <section className="relative w-full py-24 md:py-32 bg-white dark:bg-[#0F1115]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-violet-500/5 via-transparent to-transparent dark:from-violet-500/5 dark:via-transparent dark:to-transparent" />

        <div className="relative mx-auto max-w-[1440px] px-4 md:px-6">
          <div className="text-center mb-16">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-[#E8FF4D]">
              Intelligent Analysis
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
              Investment Analysis,{' '}
              <span className="text-violet-600 dark:text-[#E8FF4D]">
                Reimagined
              </span>
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 dark:text-white/50">
              See exactly how we score properties across 5 critical dimensions.
              Every deal, analyzed like an institutional investor.
            </p>
          </div>

          <PropertyScoreSection />
        </div>
      </section>

      {/* Social Proof */}
      <SocialProof />

      {/* Pricing Section */}
      <PricingSection />

      {/* Final CTA Section */}
      <section className="relative px-4 md:px-6 py-24 md:py-32 bg-slate-50 dark:bg-[#0a0a0c]">
        <div className="max-w-[1440px] mx-auto">
          <div className="relative rounded-[2rem] md:rounded-[3rem] p-12 md:p-20 lg:p-32 text-center overflow-hidden">
            {/* Background with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-violet-700 to-violet-800 dark:from-[#1a1a1f] dark:via-[#141417] dark:to-[#0a0a0c]" />

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl dark:bg-[#E8FF4D]/5" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl dark:bg-violet-500/10" />

            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern
                    id="final-cta-grid"
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
                <rect width="100%" height="100%" fill="url(#final-cta-grid)" />
              </svg>
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter mb-6 leading-[0.9] text-white dark:text-white">
                Ready to Scale
                <br />
                <span className="text-white/50 dark:text-[#E8FF4D]">
                  Your Portfolio?
                </span>
              </h2>
              <p className="text-lg md:text-xl mb-12 text-white/70 dark:text-white/50 max-w-xl mx-auto font-medium">
                Join thousands of investors who are building generational wealth
                with Axori's intelligent platform.
              </p>
              <Link to="/sign-up">
                <Button className="inline-flex items-center gap-3 px-10 md:px-14 py-5 md:py-6 rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl bg-white text-violet-600 hover:bg-slate-50 dark:bg-[#E8FF4D] dark:text-black dark:hover:bg-[#d4eb45]">
                  Start Building Wealth
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>

              {/* Trust note */}
              <p className="mt-8 text-xs text-white/40 dark:text-white/30 font-medium">
                Free to start • No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
