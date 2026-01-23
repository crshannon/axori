import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils/cn'
import { Overline } from './Typography'

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  variant?: 'success' | 'warning' | 'info' | 'default'
}

export const StatusBadge = ({
  children,
  variant = 'default',
  className,
  ...props
}: StatusBadgeProps) => {
  const variantClasses = {
    default:
      'dark:border-[#E8FF4D]/20 dark:text-[#E8FF4D] border-violet-100 text-violet-600',
    success: 'bg-emerald-500/10 text-emerald-500 border-0',
    warning: 'bg-amber-500/10 text-amber-500 border-0',
    info: 'bg-blue-500/10 text-blue-500 border-0',
  }

  return (
    <span
      className={cn(
        'rounded-full border-2 px-3 py-1.5',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <Overline>{children}</Overline>
    </span>
  )
}

