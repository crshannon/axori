import { Fragment } from 'react'
import { cn } from '@/utils/helpers'

interface ProgressHeaderProps {
  step: number
  totalSteps: number
}

export const ProgressHeader = ({ step, totalSteps }: ProgressHeaderProps) => (
  <div className="flex items-center justify-center gap-2 mb-12">
    {Array.from({ length: totalSteps }).map((_, i) => (
      <Fragment key={i}>
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all',
            step > i + 1
              ? 'bg-violet-600 border-violet-600 text-white dark:bg-[#E8FF4D] dark:border-[#E8FF4D] dark:text-black'
              : step === i + 1
                ? 'border-violet-600 text-violet-600 dark:border-[#E8FF4D] dark:text-[#E8FF4D]'
                : 'border-slate-200 text-slate-300 dark:border-white/10 dark:text-white/20',
          )}
        >
          {step > i + 1 ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <span className="text-[10px] font-black">{i + 1}</span>
          )}
        </div>
        {i < totalSteps - 1 && (
          <div
            className={cn(
              'w-8 h-0.5 rounded-full',
              step > i + 1
                ? 'bg-violet-600 dark:bg-[#E8FF4D]'
                : 'bg-slate-200 dark:bg-white/10',
            )}
          ></div>
        )}
      </Fragment>
    ))}
  </div>
)

