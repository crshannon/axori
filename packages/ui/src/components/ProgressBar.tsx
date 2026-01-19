import { HTMLAttributes } from 'react'
import { cn } from '../utils/cn'
import { Overline } from './Typography'

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number // 0-100
  variant?: 'default' | 'gradient' | 'simple'
  height?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  targetLabel?: string
  showTarget?: boolean
}

export const ProgressBar = ({
  value,
  variant = 'default',
  height = 'md',
  showLabel = false,
  label,
  targetLabel,
  showTarget = false,
  className,
  ...props
}: ProgressBarProps) => {
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-4',
    lg: 'h-12',
  }

  const progressValue = Math.min(Math.max(value, 0), 100)

  return (
    <div
      className={cn(
        'relative w-full rounded-full overflow-hidden',
        heightClasses[height],
        variant === 'default' && 'dark:bg-black/20 bg-slate-200 border border-slate-500/10',
        variant === 'simple' && 'dark:bg-slate-500/10 bg-slate-200',
        className,
      )}
      {...props}
    >
      {/* Progress Fill */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 transition-all duration-1000 ease-out flex items-center',
          variant === 'default' &&
            'dark:bg-[#E8FF4D] bg-violet-600 rounded-full',
          variant === 'gradient' &&
            'dark:bg-gradient-to-r dark:from-emerald-900 dark:to-[#E8FF4D] bg-gradient-to-r from-violet-200 to-violet-600 rounded-full',
          variant === 'simple' &&
            'dark:bg-white bg-slate-900 rounded-full',
          showLabel && height === 'lg' && 'justify-end px-4',
        )}
        style={{ width: `${progressValue}%` }}
      >
        {showLabel && label && height === 'lg' && (
          <Overline
            className={cn(
              'uppercase tracking-widest text-[8px]',
              variant === 'gradient' || variant === 'default'
                ? 'dark:text-black text-white'
                : 'dark:text-white text-slate-900',
            )}
          >
            {label}
          </Overline>
        )}
      </div>

      {/* Target Marker */}
      {showTarget && targetLabel && (
        <div className="absolute inset-y-0 right-0 border-l-2 border-dashed border-slate-400 opacity-20 flex items-center justify-end px-4">
          <Overline className="uppercase tracking-widest text-[8px] dark:text-white text-slate-900">
            {targetLabel}
          </Overline>
        </div>
      )}
    </div>
  )
}

