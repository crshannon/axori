import type { OnboardingFormData } from './types'

interface OnboardingSidebarProps {
  step: number
  totalSteps: number
  formData: Partial<OnboardingFormData>
  isDark: boolean
  onCancel: () => void
}

export function OnboardingSidebar({
  step,
  totalSteps,
  formData,
  isDark,
  onCancel,
}: OnboardingSidebarProps) {
  const getMotivation = () => {
    switch (step) {
      case 1:
        return formData.firstName
          ? "Great! Now, where are you on your journey?"
          : "First, let's locate you on the map."
      case 2:
        return 'Your persona dictates your risk appetite.'
      case 3:
        return 'Structure is the foundation of scale.'
      case 4:
        return 'Visibility of the target is half the battle.'
      case 5:
        return 'Finalizing your proprietary algorithm.'
      case 6:
        return 'Select your target markets.'
      default:
        return 'Initializing Axori Intel...'
    }
  }

  return (
    <aside
      className={`w-full md:w-[350px] lg:w-[450px] p-8 md:p-12 flex flex-col border-b md:border-b-0 md:border-r transition-all duration-500 relative overflow-hidden ${
        isDark ? 'bg-black border-white/5' : 'bg-white border-slate-200'
      }`}
    >
      {/* Sidebar Decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="grid-onboarding"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-onboarding)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 mb-16 group outline-none self-start"
        >
          <div
            className={`w-8 h-8 rounded flex items-center justify-center transition-all group-hover:rotate-12 ${
              isDark ? 'bg-white' : 'bg-slate-900'
            }`}
          >
            <span
              className={`font-black italic ${
                isDark ? 'text-black' : 'text-white'
              }`}
            >
              A
            </span>
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">
            AXORI
          </span>
        </button>

        <div className="mb-12">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">
            Progress Pipeline
          </p>
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-grow rounded-full transition-all duration-500 ${
                  s < step
                    ? isDark
                      ? 'bg-[#E8FF4D]'
                      : 'bg-violet-600'
                    : s === step
                      ? isDark
                        ? 'bg-[#E8FF4D] w-8'
                        : 'bg-violet-600 w-8'
                      : isDark
                        ? 'bg-white/10'
                        : 'bg-slate-200'
                }`}
              ></div>
            ))}
          </div>
        </div>

        <div className="space-y-6 flex-grow">
          <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-4">
            {getMotivation()}
          </h2>

          {/* Live Data Cards */}
          <div className="space-y-4">
            {formData.phase && (
              <div
                className={`p-5 rounded-3xl border animate-in slide-in-from-left-4 ${
                  isDark
                    ? 'bg-white/5 border-white/5'
                    : 'bg-slate-50 border-black/5'
                }`}
              >
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Phase
                </p>
                <p className="text-sm font-black uppercase">{formData.phase}</p>
              </div>
            )}
            {formData.freedomNumber && formData.freedomNumber > 0 && step >= 4 && (
              <div
                className={`p-5 rounded-3xl border animate-in slide-in-from-left-4 ${
                  isDark
                    ? 'bg-[#E8FF4D] text-black border-transparent'
                    : 'bg-violet-600 text-white border-transparent'
                }`}
              >
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">
                  Freedom Number
                </p>
                <p className="text-2xl font-black tabular-nums">
                  ${formData.freedomNumber.toLocaleString()}/mo
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto pt-8 border-t border-white/10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 leading-relaxed">
            Initializing secure institutional environment... <br />
            <span className="opacity-40 italic">
              Step {step} of {totalSteps}
            </span>
          </p>
        </div>
      </div>
    </aside>
  )
}

