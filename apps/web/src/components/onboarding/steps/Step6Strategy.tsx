import type { OnboardingForm } from '../hooks/useOnboardingForm'
import type { OnboardingStrategy } from '../types'

interface Step6StrategyProps {
  form: OnboardingForm
  onComplete: (strategy: OnboardingStrategy) => void
  isDark: boolean
}

const strategies: Array<{
  id: OnboardingStrategy
  desc: string
  color: string
}> = [
  {
    id: 'Cash Flow',
    desc: 'Yield and monthly distributions above all.',
    color: 'bg-emerald-500',
  },
  {
    id: 'Appreciation',
    desc: 'Long-term equity growth in Tier 1 cities.',
    color: 'bg-sky-500',
  },
  {
    id: 'BRRRR',
    desc: 'Recycling capital through value-add force.',
    color: 'bg-amber-500',
  },
  {
    id: 'Hybrid',
    desc: 'Balanced approach combining cash flow and growth.',
    color: 'bg-purple-500',
  },
]

export function Step6Strategy({
  form,
  onComplete,
  isDark,
}: Step6StrategyProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <h3 className="text-huge mb-12">Strategy Focus</h3>
      <form.Field name="strategy">
        {(field) => (
          <div className="grid grid-cols-1 gap-4">
            {strategies.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  field.handleChange(s.id)
                  onComplete(s.id)
                }}
                className={`p-8 rounded-[2rem] border flex items-center justify-between transition-all group ${
                  field.state.value === s.id
                    ? isDark
                      ? 'bg-[#E8FF4D] text-black border-[#E8FF4D]'
                      : 'bg-violet-600 text-white border-violet-600 shadow-xl'
                    : isDark
                      ? 'bg-white/5 border-white/10 hover:bg-white/10'
                      : 'bg-white border-black/5 hover:border-slate-200 shadow-sm'
                }`}
              >
                <div className="text-left">
                  <h4 className="text-lg font-black uppercase tracking-tight">
                    {s.id}
                  </h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                    {s.desc}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                    field.state.value === s.id
                      ? 'border-current'
                      : 'border-current opacity-10'
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </form.Field>
    </div>
  )
}

