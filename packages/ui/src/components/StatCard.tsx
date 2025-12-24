import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils/cn'
import { Caption, Label, Typography } from './Typography'

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  sub?: string
  subColor?: string
  icon?: ReactNode
  variant?: 'default' | 'compact'
  valueVariant?: 'h4' | 'h5' | 'h3' | 'h2'
}

export const StatCard = ({
  label,
  value,
  sub,
  subColor,
  icon,
  variant = 'default',
  valueVariant = 'h4',
  className,
  ...props
}: StatCardProps) => {
  const isCompact = variant === 'compact'

  return (
    <div
      className={cn(
        'rounded-[2rem] flex items-center gap-6 shadow-sm border transition-all',
        isCompact
          ? 'p-4 rounded-2xl dark:bg-white/5 bg-slate-50'
          : 'p-6 hover:shadow-md dark:bg-[#1A1A1A] dark:border-white/5 bg-white border-slate-100',
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="flex-shrink-0">{icon}</div>
      )}
      {!icon && !isCompact && (
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 dark:bg-white/5 dark:text-[#E8FF4D] bg-violet-50 text-violet-600">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 2v20M2 12h20" />
          </svg>
        </div>
      )}
      <div className="flex-grow">
        <Label
          size="sm"
          className={cn(
            isCompact ? 'mb-1.5' : 'mb-1',
            'dark:text-white/60 text-slate-400',
          )}
        >
          {label}
        </Label>
        <div className="flex items-baseline gap-2">
          <Typography
            variant={valueVariant}
            className={cn(
              isCompact && 'tracking-tighter tabular-nums',
              !isCompact && 'text-2xl',
              'dark:text-white text-slate-900',
            )}
          >
            {value}
          </Typography>
          {sub && (
            <Caption
              className={cn(
                subColor ||
                  'dark:text-white/60 text-slate-500',
              )}
            >
              {sub}
            </Caption>
          )}
        </div>
      </div>
    </div>
  )
}

