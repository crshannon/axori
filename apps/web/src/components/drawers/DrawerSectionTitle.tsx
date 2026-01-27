import { Typography } from '@axori/ui'
import { cn } from '@/utils/helpers/cn'

interface DrawerSectionTitleProps {
  title: string
  /** Color variant for the separator bar */
  color?: 'violet' | 'emerald' | 'indigo' | 'amber' | 'slate'
  className?: string
}

const colorClasses = {
  violet: 'bg-violet-600',
  emerald: 'bg-emerald-500',
  indigo: 'bg-indigo-500',
  amber: 'bg-amber-500',
  slate: 'bg-slate-500',
}

export const DrawerSectionTitle = ({
  title,
  color = 'violet',
  className,
}: DrawerSectionTitleProps) => {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className={cn('w-8 h-1', colorClasses[color])} />
      <Typography variant="h5" className="dark:text-white">
        {title}
      </Typography>
    </div>
  )
}
