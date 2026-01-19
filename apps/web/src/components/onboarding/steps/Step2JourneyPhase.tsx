import type { OnboardingForm } from '../hooks/useOnboardingForm'
import type { OnboardingPhase } from '../types'

interface Step2JourneyPhaseProps {
  form: OnboardingForm
  onNext: () => void
  onBack?: () => void
  isDark: boolean
}

const phases: Array<OnboardingPhase> = ['Explorer', 'Starting', 'Building', 'Optimizing']

const phaseDescriptions: Record<OnboardingPhase, string> = {
  Explorer: 'Researching, no properties.',
  Starting: 'Actively looking to buy.',
  Building: 'Own 1-5 properties.',
  Optimizing: '5+ properties.',
}

export function Step2JourneyPhase({
  form,
  onNext,
  onBack,
  isDark,
}: Step2JourneyPhaseProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <h3 className="text-huge mb-12">Journey Phase</h3>
      <form.Field name="phase">
        {(field) => (
          <>
            <div className="grid grid-cols-1 gap-4">
              {phases.map((phase) => (
                <button
                  key={phase}
                  type="button"
                  onClick={() => {
                    field.handleChange(phase)
                    onNext()
                  }}
                  className={`p-8 rounded-[2rem] border flex items-center justify-between transition-all group ${
                    field.state.value === phase
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
                      {phase}
                    </h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                      {phaseDescriptions[phase]}
                    </p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                      field.state.value === phase
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
            {onBack && (
              <button
                onClick={onBack}
                className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity"
              >
                ← Go back to previous step
              </button>
            )}
          </>
        )}
      </form.Field>
    </div>
  )
}

