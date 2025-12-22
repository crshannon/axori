import type { OnboardingForm } from '../hooks/useOnboardingForm'
import type { OnboardingPhase } from '../types'

interface Step2JourneyPhaseProps {
  form: OnboardingForm
  onNext: () => void
  isDark: boolean
}

const phases: OnboardingPhase[] = ['Explorer', 'Starting', 'Building', 'Optimizing']

const phaseDescriptions: Record<OnboardingPhase, string> = {
  Explorer: 'Researching, no properties.',
  Starting: 'Actively looking to buy.',
  Building: 'Own 1-5 properties.',
  Optimizing: '5+ properties.',
}

export function Step2JourneyPhase({
  form,
  onNext,
  isDark,
}: Step2JourneyPhaseProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <h3 className="text-huge mb-12">Journey Phase</h3>
      <form.Field name="phase">
        {(field) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {phases.map((phase) => (
              <button
                key={phase}
                type="button"
                onClick={() => {
                  field.handleChange(phase)
                  onNext()
                }}
                className={`p-10 rounded-[2.5rem] border text-left transition-all group ${
                  field.state.value === phase
                    ? isDark
                      ? 'bg-white text-black border-white'
                      : 'bg-slate-900 text-white border-slate-900 shadow-2xl'
                    : isDark
                      ? 'bg-transparent border-white/10 hover:border-white/30'
                      : 'bg-white border-black/5 hover:border-violet-300 hover:shadow-xl'
                }`}
              >
                <h4 className="text-xl font-black uppercase mb-2">{phase}</h4>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                  {phaseDescriptions[phase]}
                </p>
              </button>
            ))}
          </div>
        )}
      </form.Field>
    </div>
  )
}

