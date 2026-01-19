import { cn } from '@/utils/helpers'

interface IntelligenceSidebarProps {
  step: number
}

export const IntelligenceSidebar = ({ step }: IntelligenceSidebarProps) => {
  const getContextualIntel = () => {
    switch (step) {
      case 1:
        return {
          title: 'Public Record Crawling',
          desc: 'We use the address to initiate a secure handshake with municipal tax records and MLS historical data. This allows us to auto-populate 80% of your asset intelligence.',
          fact: "Did you know? Austin zip codes currently have a 12% higher 'Alpha' score than national averages due to tech corridor expansion.",
        }
      case 2:
        return {
          title: 'Structural DNA',
          desc: "Beds, baths, and square footage aren't just room counts—they are the primary variables in our rental comp algorithm.",
          fact: 'Upgrading a 2-bed to a 3-bed within the same square footage can boost Net Yield by an average of 1.4%.',
        }
      case 3:
        return {
          title: 'Asset Sovereignty',
          desc: "Holding assets in an LLC vs. Personal Title changes your 'Legal Radar' profile. Axori tracks jurisdiction-specific protection levels.",
          fact: 'Texas and Wyoming offer some of the strongest corporate veil protections for independent real estate investors.',
        }
      case 4:
        return {
          title: 'The Yield Lever',
          desc: 'Your debt service coverage ratio (DSCR) is the single biggest factor in your Cash Flow IQ. Even a 0.25% rate swing can delay your Freedom Goal by 18 months.',
          fact: 'Institutional buyers target a DSCR of 1.25x or higher to ensure the asset can survive market cycles.',
        }
      case 5:
        return {
          title: 'Operations vs. Wealth',
          desc: "Management type determines your 'Effort' dimension. Self-management maximizes yield but creates a 'Job' instead of an 'Investment'.",
          fact: 'Portfolio managers with 5+ units who use institutional-grade software (like Axori) save 15 hours per month on ops.',
        }
      case 6:
        return {
          title: 'Strategy Alignment',
          desc: "Selecting your thesis allows Axori's AI to prioritize the metrics that matter to you. A 'Cash Flow' focus ignores short-term equity dips.",
          fact: 'BRRRR strategies require the most frequent IQ refreshes due to the high velocity of capital recycling.',
        }
      default:
        return null
    }
  }
  const intel = getContextualIntel()

  return (
    <aside
      className={cn(
        'w-full lg:w-[450px] p-12 border-l transition-all duration-700 hidden xl:flex flex-col gap-12',
        'bg-slate-100/50 border-slate-200 shadow-inner',
        'dark:bg-black/40 dark:border-white/5',
      )}
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-1000">
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse`}
          ></div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
            The Axori Edge
          </span>
        </div>

        {intel && (
          <>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">
                {intel.title}
              </h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                "{intel.desc}"
              </p>
            </div>

            <div
              className={cn(
                'p-8 rounded-[3rem] border',
                'bg-white border-slate-200 shadow-sm',
                'dark:bg-white/5 dark:border-white/5',
              )}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/60 mb-3">
                Institutional Fact
              </p>
              <p className="text-sm font-bold leading-relaxed text-black dark:text-white">
                {intel.fact}
              </p>
            </div>
          </>
        )}

        <div className="pt-8 border-t border-slate-500/10">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">
            Frequently Asked
          </h4>
          <div className="space-y-4">
            {[
              'How do you fetch tax data?',
              'Is my entity name encrypted?',
              'What if I refinance later?',
            ].map((q) => (
              <button
                key={q}
                className="w-full text-left p-4 rounded-2xl text-[11px] font-bold border border-transparent hover:border-slate-500/20 hover:bg-slate-500/5 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto opacity-20">
        <p className="text-[8px] font-black uppercase tracking-[0.5em]">
          Asset Deployment Protocol V1.0.8
        </p>
      </div>
    </aside>
  )
}
