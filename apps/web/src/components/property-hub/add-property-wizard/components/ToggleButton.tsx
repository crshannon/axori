import type { ReactNode } from 'react'
import { cn } from '@/utils/helpers'

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
