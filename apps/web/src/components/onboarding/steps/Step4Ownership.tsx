import type { OnboardingForm } from '../hooks/useOnboardingForm'

interface Step4OwnershipProps {
  form: OnboardingForm
  onNext: () => void
  isDark: boolean
}

export function Step4Ownership({
  form,
  onNext,
  isDark,
}: Step4OwnershipProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <h3 className="text-huge mb-12">Ownership Structure</h3>
      <form.Field name="ownership">
        {(field) => (
          <div
            className={`p-16 rounded-[4rem] border flex flex-col items-center gap-12 text-center transition-colors ${
              isDark
                ? 'bg-[#1A1A1A] border-white/5'
                : 'bg-white border-black/5 shadow-2xl'
            }`}
          >
            <div className="flex bg-slate-500/10 p-2 rounded-3xl w-full max-w-sm">
              <button
                type="button"
                onClick={() => field.handleChange('Personal')}
                className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  field.state.value === 'Personal'
                    ? isDark
                      ? 'bg-white text-black'
                      : 'bg-slate-900 text-white'
                    : 'opacity-40'
                }`}
              >
                Personal
              </button>
              <button
                type="button"
                onClick={() => field.handleChange('LLC')}
                className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  field.state.value === 'LLC'
                    ? isDark
                      ? 'bg-white text-black'
                      : 'bg-slate-900 text-white'
                    : 'opacity-40'
                }`}
              >
                Legal Entity (LLC)
              </button>
            </div>
            <p className="text-sm font-medium opacity-50 max-w-sm">
              This helps us customize your tax reports and legal climate
              notifications.
            </p>
            <button
              type="button"
              onClick={onNext}
              className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${
                isDark
                  ? 'bg-[#E8FF4D] text-black shadow-lg shadow-[#E8FF4D]/20'
                  : 'bg-violet-600 text-white shadow-xl shadow-violet-200'
              }`}
            >
              Confirm Structure
            </button>
          </div>
        )}
      </form.Field>
    </div>
  )
}

