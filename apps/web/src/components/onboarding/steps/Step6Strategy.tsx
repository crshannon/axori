import type { OnboardingForm } from '../hooks/useOnboardingForm'
import type { OnboardingStrategy } from '../types'

interface Step6StrategyProps {
  form: OnboardingForm
  onComplete: () => void
  onBack: () => void
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
]

export function Step6Strategy({
  form,
  onComplete,
  onBack,
  isDark,
}: Step6StrategyProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <h3 className="text-huge mb-12">Strategy Focus</h3>
      <form.Field name="strategy">
        {(field) => (
          <>
            <div className="grid grid-cols-1 gap-6 mb-12">
              {strategies.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => field.handleChange(s.id)}
                  className={`p-10 rounded-[2.5rem] border text-left transition-all relative overflow-hidden group ${
                    field.state.value === s.id
                      ? isDark
                        ? 'bg-white text-black border-white shadow-2xl'
                        : 'bg-slate-900 text-white border-slate-900 shadow-2xl'
                      : isDark
                        ? 'bg-white/5 border-white/5'
                        : 'bg-white border-black/5 shadow-sm'
                  }`}
                >
                  <div
                    className={`absolute top-0 right-0 h-full w-1.5 ${s.color}`}
                  ></div>
                  <h4 className="text-2xl font-black uppercase mb-2">
                    {s.id}
                  </h4>
                  <p className="text-sm font-medium opacity-60">{s.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onBack}
                className={`flex-1 py-6 rounded-3xl font-black text-xs uppercase tracking-widest border ${
                  isDark
                    ? 'border-white/10 text-white/40'
                    : 'border-black/10 text-slate-400'
                }`}
              >
                Back
              </button>
              <button
                type="button"
                disabled={!field.state.value}
                onClick={onComplete}
                className={`flex-[2] py-6 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${
                  field.state.value
                    ? isDark
                      ? 'bg-[#E8FF4D] text-black shadow-lg shadow-[#E8FF4D]/30 hover:scale-105'
                      : 'bg-violet-600 text-white shadow-xl shadow-violet-200 hover:scale-105'
                    : 'opacity-20 cursor-not-allowed'
                }`}
              >
                Finalize Intelligence
              </button>
            </div>
          </>
        )}
      </form.Field>
    </div>
  )
}

