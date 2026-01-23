import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface DashboardCardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  variant?: 'default' | 'gradient'
  hover?: boolean
}

export const DashboardCard = ({
  className,
  children,
  variant = 'default',
  hover = false,
  ...props
}: DashboardCardProps) => {
  return (
    <div
      className={cn(
        'rounded-[2.5rem] border p-8 shadow-sm transition-all',
        variant === 'default' &&
          `
            border-slate-100 bg-white
            dark:border-white/5 dark:bg-[#1A1A1A]
          `,
        variant === 'gradient' &&
          `
            bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-xl
            shadow-violet-200
            dark:from-[#E8FF4D] dark:to-emerald-400 dark:text-black
            dark:shadow-[#E8FF4D]/10
          `,
        hover && 'hover:shadow-xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

