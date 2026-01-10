import { X } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface PropertyHeaderProps {
  step: number
  totalSteps: number
  onCancel: () => void
}

const getStepTitle = (step: number) => {
  switch(step) {
    case 1: return "Coordinate Acquisition"
    case 2: return "Structural DNA"
    case 3: return "Sovereignty Status"
    case 4: return "Debt Architecture"
    case 5: return "Operating Integrity"
    case 6: return "Strategy Alignment"
    default: return "Deployment Pipeline"
  }
}

export const PropertyHeader = ({
  step,
  totalSteps,
  onCancel,
}: PropertyHeaderProps) => (
  <header
    className={cn(
      'px-12 py-8 flex items-center justify-between transition-all duration-500 sticky top-0 z-40 backdrop-blur-xl border-b',
      'bg-white/90 border-slate-200 dark:bg-black/60 dark:border-white/5',
    )}
  >
    <div className="flex items-center gap-6">
      <button
        onClick={onCancel}
        className="p-4 rounded-2xl transition-all bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-900 dark:hover:text-white"
        aria-label="Cancel and return to property hub"
      >
        <X size={20} strokeWidth={3} />
      </button>
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tighter leading-none text-black dark:text-white">
          Deployment Pipeline
        </h1>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">
          Phase {step} of {totalSteps}: {getStepTitle(step)}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1 rounded-full transition-all duration-500',
            i + 1 <= step
              ? 'bg-violet-600 dark:bg-[#E8FF4D] w-8'
              : 'w-3 bg-slate-500/20',
          )}
        ></div>
      ))}
    </div>
  </header>
)
