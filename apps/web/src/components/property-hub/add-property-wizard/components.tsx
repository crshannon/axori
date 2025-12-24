import { Fragment } from 'react'
import { Caption, Heading, Label } from '@axori/ui'
import type { ReactNode } from 'react'
import { cn } from '@/utils/helpers'

// Form Label Component
export const FormLabel = ({ children, ...props }: { children: ReactNode }) => (
  <Label
    size="sm"
    className="mb-2 block ml-2 text-slate-500 dark:text-white/70"
    {...props}
  >
    {children}
  </Label>
)

// Toggle Button Component
interface ToggleButtonProps {
  id: string
  icon: ReactNode
  label: string
  isSelected: boolean
  onClick: () => void
}

export const ToggleButton = ({
  id,
  icon,
  label,
  isSelected,
  onClick,
}: ToggleButtonProps) => (
  <button
    key={id}
    onClick={onClick}
    className={cn(
      'flex-1 p-8 rounded-[2rem] border transition-all flex flex-col items-center gap-4 cursor-pointer',
      isSelected
        ? 'bg-violet-600 border-violet-600 text-white shadow-xl dark:bg-[#E8FF4D] dark:border-[#E8FF4D] dark:text-black dark:shadow-lg'
        : 'bg-white border-slate-200 hover:shadow-md dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10',
    )}
  >
    <div
      className={cn(
        isSelected
          ? 'text-white dark:text-black'
          : 'text-slate-900 dark:text-white',
      )}
    >
      {icon}
    </div>
    <span
      className={cn(
        'text-xs font-black uppercase tracking-widest',
        isSelected
          ? 'text-white dark:text-black'
          : 'text-slate-900 dark:text-white',
      )}
    >
      {label}
    </span>
  </button>
)

// Stepper Title Component
interface StepperTitleProps {
  title: string
  subtitle?: string
}

export const StepperTitle = ({ title, subtitle }: StepperTitleProps) => (
  <div className="text-center mb-12">
    <Heading level={3} className="mb-2 text-black dark:text-white">
      {title}
    </Heading>
    {subtitle && (
      <Caption className="text-slate-500 dark:text-white/70">
        {subtitle}
      </Caption>
    )}
  </div>
)

// Progress Header Component
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

// Shared input class
export const inputClass = cn(
  'w-full px-6 py-4 rounded-2xl text-sm font-bold border outline-none transition-all',
  'bg-slate-50 border-slate-200 focus:border-violet-300',
  'dark:bg-white/5 dark:border-white/5 dark:focus:border-[#E8FF4D]/30 dark:text-white dark:placeholder:text-white/30',
)

