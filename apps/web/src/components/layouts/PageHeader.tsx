import { Caption, Heading } from '@axori/ui'
import { useUser } from '@clerk/clerk-react'
import type { ReactNode } from 'react'
import { useTheme } from '@/utils/providers/theme-provider'
import { cn } from '@/utils/helpers'

interface PageHeaderProps {
  title: string
  rightContent?: ReactNode
  variant?: 'default' | 'simple'
  className?: string
}

export const PageHeader = ({
  title,
  rightContent,
  variant = 'default',
  className,
}: PageHeaderProps) => {
  const { user } = useUser()
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'

  const headerClasses = cn(
    'px-8 flex items-center justify-between transition-all duration-500',
    variant === 'default'
      ? 'py-6 sticky top-0 z-40 backdrop-blur-xl border-b'
      : 'py-5 border-b',
    variant === 'default'
      ? isDark
        ? 'bg-black/60 border-white/5'
        : 'bg-white/80 border-slate-200 shadow-sm'
      : isDark
        ? 'bg-black border-white/5'
        : 'bg-white border-slate-200 shadow-sm',
    className,
  )

  return (
    <header className={headerClasses}>
      <div>
        <Heading
          level={3}
          className={cn(isDark ? 'text-white' : 'text-slate-900')}
        >
          {title}
        </Heading>
        <Caption
          className={cn('mt-1', isDark ? 'text-white/60' : 'text-slate-400')}
        >
          Good morning, {user?.firstName || 'Investor'}
        </Caption>
      </div>
      {rightContent && <div className="flex items-center gap-6">{rightContent}</div>}
    </header>
  )
}

