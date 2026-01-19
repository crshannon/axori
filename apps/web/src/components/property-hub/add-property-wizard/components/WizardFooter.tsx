import { cn } from '@/utils/helpers'

interface WizardFooterProps {
  step: number
  totalSteps: number
  isDisabled: boolean
  isSaving?: boolean
  onBack: () => void
  onNext: () => void
}

export const WizardFooter = ({
  step,
  totalSteps,
  isDisabled,
  isSaving = false,
  onBack,
  onNext,
}: WizardFooterProps) => {
  return (
    <div className="mt-20 pt-10 border-t border-slate-500/10 flex items-center justify-between">
      <button
        onClick={onBack}
        className={cn(
          "px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity",
          step === 1 ? "invisible" : ""
        )}
      >
        ← Back
      </button>
      <button
        onClick={onNext}
        disabled={isDisabled || isSaving}
        className={cn(
          'px-14 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3',
          isDisabled || isSaving
            ? 'opacity-20 cursor-not-allowed'
            : 'bg-violet-600 text-white shadow-xl shadow-violet-200 hover:scale-105 dark:bg-[#E8FF4D] dark:text-black dark:shadow-lg dark:shadow-[#E8FF4D]/20 cursor-pointer',
        )}
      >
        {isSaving && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {isSaving ? 'Saving...' : step === totalSteps ? 'Finalize Portfolio Sync' : 'Continue'}
      </button>
    </div>
  )
}
