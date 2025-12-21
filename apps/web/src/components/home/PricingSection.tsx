import React from 'react'
import { Button } from '@axori/ui'
import { cn } from '@/utils/helpers'

const PricingSection: React.FC = () => {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'For explorers testing the waters with a single property.',
      features: [
        '1 Property Profile',
        'Basic Score Breakdown',
        'Manual Data Entry',
        'Limited Storage',
      ],
      cta: 'Get Started',
      recommended: false,
    },
    {
      name: 'Pro',
      price: '$24',
      description: 'Perfect for active investors managing 2-5 units.',
      features: [
        'Up to 5 Properties',
        'Full IQ Suite',
        'AI Document Proc.',
        'Basic Legal alerts',
        'CPA Export Tools',
      ],
      cta: 'Go Pro',
      recommended: true,
    },
    {
      name: 'Portfolio',
      price: '$49',
      description: 'The OS for growing portfolios of 6-20 units.',
      features: [
        'Unlimited Properties',
        'Priority AI Processing',
        'Advanced Legal Intel',
        'Dedicated Support',
        'Custom Reporting',
      ],
      cta: 'Start Scaling',
      recommended: false,
    },
    {
      name: 'Enterprise',
      price: '$99',
      description: 'Institutional scale for management groups.',
      features: [
        'White-labeled Reporting',
        'Multi-user Access',
        'API Integrations',
        'Concierge Setup',
      ],
      cta: 'Contact Sales',
      recommended: false,
    },
  ]

  return (
    <section
      id="pricing"
      className="py-32 relative transition-colors duration-500 bg-slate-100 dark:bg-[#121212]"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-4xl lg:text-7xl font-black mb-6 tracking-tighter uppercase transition-colors text-slate-900 dark:text-white">
            Scale your wealth.
          </h2>
          <p className="text-lg text-slate-500 font-medium italic">
            Clear, transparent pricing for every stage of your investment
            journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p, i) => (
            <div
              key={i}
              className={cn(
                'group relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500',
                p.recommended
                  ? 'bg-white border-violet-600 shadow-2xl shadow-slate-200/50 scale-[1.05] z-10 dark:bg-[#1A1A1A] dark:border-[#E8FF4D] dark:shadow-black/20'
                  : 'bg-white border-black/5 hover:bg-slate-50 hover:shadow-xl dark:bg-white/5 dark:border-white/10 dark:hover:shadow-black/20',
              )}
            >
              {p.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.2em] px-6 py-2.5 rounded-full shadow-lg shadow-violet-200 transition-colors bg-violet-600 text-white dark:bg-[#E8FF4D] dark:text-black dark:shadow-black/30">
                  Recommended
                </div>
              )}

              <div className="mb-10">
                <h3
                  className={cn(
                    'text-xl font-black mb-4 uppercase tracking-tighter transition-colors',
                    p.recommended
                      ? 'text-violet-600 dark:text-[#E8FF4D]'
                      : 'text-slate-400 dark:text-slate-500',
                  )}
                >
                  {p.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-black tracking-tighter transition-colors text-slate-900 dark:text-white">
                    {p.price}
                  </span>
                  <span className="text-slate-500 font-bold text-xs">/mo</span>
                </div>
                <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase tracking-widest opacity-80">
                  {p.description}
                </p>
              </div>

              <div className="flex-grow space-y-4 mb-12">
                {p.features.map((f, fi) => (
                  <div key={fi} className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center transition-colors',
                        p.recommended
                          ? 'bg-violet-100 text-violet-600 dark:bg-[#E8FF4D]/20 dark:text-[#E8FF4D]'
                          : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500',
                      )}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold tracking-tight transition-colors text-slate-700 dark:text-slate-300">
                      {f}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                className={cn(
                  'w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all transform active:scale-95 shadow-lg',
                  p.recommended
                    ? 'bg-violet-600 text-white hover:bg-violet-700 hover:scale-105 shadow-violet-200 dark:bg-[#E8FF4D] dark:text-black dark:hover:scale-105 dark:shadow-black/30'
                    : 'bg-white border-2 border-slate-200 text-slate-900 hover:border-violet-600 hover:text-violet-600 dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white dark:hover:text-black dark:shadow-black/20',
                )}
              >
                {p.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PricingSection
