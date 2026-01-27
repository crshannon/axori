import type { OnboardingForm } from '../hooks/useOnboardingForm'

interface Step5FreedomNumberProps {
  form: OnboardingForm
  onNext: () => void
  isDark: boolean
}

export function Step5FreedomNumber({
  form,
  onNext,
  isDark,
}: Step5FreedomNumberProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <h3 className="text-huge mb-4">Financial Goal</h3>
      <p className="text-xl text-slate-400 font-medium mb-16 italic">
        What is your monthly "Freedom Number"?
      </p>

      <form.Field name="freedomNumber">
        {(field) => (
          <div
            className={`p-16 rounded-[4rem] border transition-colors ${
              isDark
                ? 'bg-[#1A1A1A] border-white/5'
                : 'bg-white border-black/5 shadow-2xl'
            }`}
          >
            <div className="flex justify-between items-end mb-12">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                Monthly Target
              </span>
              <span
                className={`text-6xl font-black tabular-nums tracking-tighter ${
                  isDark ? 'text-[#E8FF4D]' : 'text-violet-600'
                }`}
              >
                ${field.state.value.toLocaleString()}
              </span>
            </div>

            <input
              type="range"
              min="1000"
              max="50000"
              step="500"
              value={field.state.value}
              onChange={(e) => field.handleChange(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-500/10 rounded-full appearance-none cursor-pointer accent-current mb-16"
            />

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() =>
                  field.handleChange(Math.max(1000, field.state.value - 1000))
                }
                className={`p-4 rounded-2xl border font-black uppercase text-xs ${
                  isDark
                    ? 'border-white/10 hover:bg-white/5'
                    : 'border-black/5 hover:bg-slate-50'
                }`}
              >
                Decrease
              </button>
              <button
                type="button"
                onClick={() =>
                  field.handleChange(Math.min(100000, field.state.value + 1000))
                }
                className={`p-4 rounded-2xl border font-black uppercase text-xs ${
                  isDark
                    ? 'border-white/10 hover:bg-white/5'
                    : 'border-black/5 hover:bg-slate-50'
                }`}
              >
                Increase
              </button>
            </div>

            <button
              type="button"
              onClick={onNext}
              className={`w-full mt-12 py-6 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${
                isDark ? 'bg-white text-black' : 'bg-slate-900 text-white'
              }`}
            >
              Set Target
            </button>
          </div>
        )}
      </form.Field>
    </div>
  )
}
