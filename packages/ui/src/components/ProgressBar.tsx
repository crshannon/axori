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
        'relative w-full overflow-hidden rounded-full',
        heightClasses[height],
        variant === 'default' && `
          border border-slate-500/10 bg-slate-200
          dark:bg-black/20
        `,
        variant === 'simple' && `
          bg-slate-200
          dark:bg-slate-500/10
        `,
        className,
      )}
      {...props}
    >
      {/* Progress Fill */}
      <div
        className={cn(
          `
            absolute inset-y-0 left-0 flex items-center transition-all
            duration-1000 ease-out
          `,
          variant === 'default' &&
            `
              rounded-full bg-violet-600
              dark:bg-[#E8FF4D]
            `,
          variant === 'gradient' &&
            `
              rounded-full bg-linear-to-r from-violet-200 to-violet-600
              dark:bg-linear-to-r dark:from-emerald-900 dark:to-[#E8FF4D]
            `,
          variant === 'simple' &&
            `
              rounded-full bg-slate-900
              dark:bg-white
            `,
          showLabel && height === 'lg' && 'justify-end px-4',
        )}
        style={{ width: `${progressValue}%` }}
      >
        {showLabel && label && height === 'lg' && (
          <Overline
            className={cn(
              'text-[8px] tracking-widest uppercase',
              variant === 'gradient' || variant === 'default'
                ? `
                  text-white
                  dark:text-black
                `
                : `
                  text-slate-900
                  dark:text-white
                `,
            )}
          >
            {label}
          </Overline>
        )}
      </div>

      {/* Target Marker */}
      {showTarget && targetLabel && (
        <div className="
          absolute inset-y-0 right-0 flex items-center justify-end border-l-2
          border-dashed border-slate-400 px-4 opacity-20
        ">
          <Overline className="
            text-[8px] tracking-widest text-slate-900 uppercase
            dark:text-white
          ">
            {targetLabel}
          </Overline>
        </div>
      )}
    </div>
  )
}

