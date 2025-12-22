import type { OnboardingForm } from '../hooks/useOnboardingForm'
import type { OnboardingPersona } from '../types'

interface Step3PersonaProps {
  form: OnboardingForm
  onNext: () => void
  isDark: boolean
}

const personas: Array<{ id: OnboardingPersona; desc: string }> = [
  {
    id: 'House Hacker',
    desc: 'Living for free while building equity.',
  },
  {
    id: 'Accidental Landlord',
    desc: "Started as a home, now it's a business.",
  },
  {
    id: 'Aggressive Grower',
    desc: 'Maximum scale, maximum leverage.',
  },
  {
    id: 'Passive Income Seeker',
    desc: 'Yield above all else.',
  },
  {
    id: 'Value-Add Investor',
    desc: 'Forcing appreciation through sweat.',
  },
]

export function Step3Persona({ form, onNext, isDark }: Step3PersonaProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <h3 className="text-huge mb-12">Investor Persona</h3>
      <form.Field name="persona">
        {(field) => (
          <div className="grid grid-cols-1 gap-4">
            {personas.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  field.handleChange(p.id)
                  onNext()
                }}
                className={`p-8 rounded-[2rem] border flex items-center justify-between transition-all group ${
                  field.state.value === p.id
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
                    {p.id}
                  </h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                    {p.desc}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                    field.state.value === p.id
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

