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
        'flex items-center gap-6 rounded-4xl border shadow-sm transition-all',
        isCompact
          ? `
            rounded-2xl bg-slate-50 p-4
            dark:bg-white/5
          `
          : `
            border-slate-100 bg-white p-6
            hover:shadow-md
            dark:border-white/5 dark:bg-[#1A1A1A]
          `,
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="shrink-0">{icon}</div>
      )}
      {!icon && !isCompact && (
        <div className="
          flex size-12 shrink-0 items-center justify-center rounded-2xl
          bg-violet-50 text-violet-600
          dark:bg-white/5 dark:text-[#E8FF4D]
        ">
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
      <div className="grow">
        <Label
          size="sm"
          className={cn(
            isCompact ? 'mb-1.5' : 'mb-1',
            `
              text-slate-400
              dark:text-white/60
            `,
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
              `
                text-slate-900
                dark:text-white
              `,
            )}
          >
            {value}
          </Typography>
          {sub && (
            <Caption
              className={cn(
                subColor ||
                  `
                    text-slate-500
                    dark:text-white/60
                  `,
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

