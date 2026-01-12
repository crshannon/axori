import { Overline, Typography, cn } from '@axori/ui'
import type { MetricStatus } from '../hooks/usePropertyMetrics'

export interface MetricCardProps {
  label: string
  value: number | null
  format: (val: number) => string
  sub: string
  status: MetricStatus
  message?: string
  route?: string
  onClick?: () => void
}

export const MetricCard = ({
  label,
  value,
  format,
  sub,
  status,
  message,
  onClick,
}: MetricCardProps) => {
  const hasData = value !== null

  // Determine styling based on status
  const getStatusStyles = (): string => {
    switch (status) {
      case 'success':
        return 'border-slate-100 dark:border-white/5'
      case 'warning':
        return 'bg-amber-500/5 border-2 border-dashed border-amber-500/40 hover:border-amber-500/60 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]'
      case 'incomplete':
        return 'bg-amber-500/5 border-2 border-dashed border-amber-500/30 hover:border-amber-500/50 shadow-[inset_0_0_20px_rgba(245,158,11,0.03)]'
      case 'error':
        return 'bg-red-500/5 border-2 border-dashed border-red-500/40 hover:border-red-500/60 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]'
      default:
        return 'border-slate-100 dark:border-white/5'
    }
  }

  const statusStyles = getStatusStyles()
  const isClickable =
    status === 'warning' || status === 'incomplete' || status === 'error'
  const cursorStyle = isClickable ? 'cursor-pointer' : 'cursor-default'

  return (
    <div
      className={cn(
        'p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border transition-all',
        statusStyles,
        cursorStyle,
      )}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable && onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between mb-2">
        <Overline>{label}</Overline>
        {status !== 'success' && (
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              status === 'warning' || status === 'incomplete'
                ? 'bg-amber-500'
                : 'bg-red-500',
            )}
            title={message || `${status} status`}
          />
        )}
      </div>

      <Typography
        variant="h3"
        className="text-2xl font-black tabular-nums tracking-tighter mb-1"
      >
        {hasData ? format(value) : 'N/A'}
      </Typography>

      {message ? (
        <Typography
          variant="caption"
          className={cn(
            'text-[8px] font-bold uppercase mt-1 block',
            status === 'warning' || status === 'incomplete'
              ? 'text-amber-600 dark:text-amber-400 opacity-90'
              : status === 'error'
                ? 'text-red-600 dark:text-red-400 opacity-90'
                : 'opacity-70',
          )}
        >
          {message}
        </Typography>
      ) : (
        <Typography
          variant="caption"
          className="text-[8px] font-bold uppercase opacity-70 mt-1"
        >
          {sub}
        </Typography>
      )}
    </div>
  )
}
