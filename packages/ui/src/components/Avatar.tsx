import { HTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name?: string
  initial?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Avatar = ({
  name,
  initial,
  size = 'md',
  className,
  ...props
}: AvatarProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-16 h-16 text-xl',
  }

  // Extract initial from name if provided
  const displayInitial =
    initial ||
    (name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'IN')

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-black shadow-md transition-colors',
        sizeClasses[size],
        'dark:bg-[#1A1A1A] dark:border dark:border-white/10 dark:text-white',
        'bg-slate-200 border border-white text-slate-900',
        className,
      )}
      {...props}
    >
      {displayInitial}
    </div>
  )
}

