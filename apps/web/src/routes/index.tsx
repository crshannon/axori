import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@axori/ui'
import PricingSection from '@/components/home/PricingSection'
import PropertyScoreSection from '@/components/home/PropertyScoreSection'
import { Hero } from '@/components/home/Hero'
import { PublicLayout } from '@/components/layouts/PublicLayout'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <PublicLayout>
      <Hero />
      <div className="max-w-[1440px] mx-auto px-4 py-32 text-center">
        <h2 className="text-4xl md:text-8xl font-black uppercase tracking-tighter mb-8 leading-[0.85] transition-colors text-slate-900 dark:text-white">
          The Tools of <span className="opacity-30">Institutions</span>
          <br />
          Now in Your{' '}
          <span className="inline-block px-8 py-3 rounded-[2rem] transform -rotate-1 transition-all duration-500 hover:rotate-0 bg-violet-600 text-white shadow-2xl shadow-violet-200 dark:bg-slate-900 dark:text-[#E8FF4D] dark:shadow-black/30">
            Pocket
          </span>
          .
        </h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mt-12 max-w-xl mx-auto opacity-60">
          Axori is the first real estate platform that prioritizes your
          "Investment DNA" over generic market data.
        </p>
      </div>
      <PropertyScoreSection />
      <PricingSection />
      <section className="px-6 py-32 max-w-[1440px] mx-auto">
        <div className="rounded-[4rem] p-16 md:p-32 text-center shadow-2xl shadow-violet-200 relative overflow-hidden transition-all duration-700 bg-violet-600 text-white dark:bg-[#E8FF4D] dark:text-black dark:shadow-black/30">
          <div className="relative z-10">
            <h2 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mb-10 leading-none">
              TIME TO
              <br />
              SCALE UP.
            </h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                onClick={() => {}}
                className="px-16 py-7 rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-2xl shadow-slate-200/50 bg-white text-violet-600 dark:bg-black dark:text-white dark:shadow-black/30"
              >
                ACTIVATE AXORI INTEL
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
