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
        'p-8 rounded-[2.5rem] shadow-sm border transition-all',
        variant === 'default' &&
          'dark:bg-[#1A1A1A] dark:border-white/5 bg-white border-slate-100',
        variant === 'gradient' &&
          'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-200 dark:from-[#E8FF4D] dark:to-emerald-400 dark:text-black dark:shadow-[#E8FF4D]/10',
        hover && 'hover:shadow-xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

