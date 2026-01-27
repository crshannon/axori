import { cn } from '@/utils/helpers'

interface PropertyScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const PropertyScoreGauge = ({
  score,
  size = 'md',
  className,
}: PropertyScoreGaugeProps) => {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-40 h-40',
    lg: 'w-56 h-56',
  }

  const textSizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  }

  const strokeWidth = size === 'lg' ? 8 : size === 'md' ? 6 : 4
  const radius = size === 'lg' ? 100 : size === 'md' ? 80 : 60
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getScoreColor = (s: number) => {
    if (s >= 90) return 'stroke-emerald-500'
    if (s >= 75) return 'stroke-violet-600 dark:stroke-[#E8FF4D]'
    if (s >= 60) return 'stroke-amber-500'
    return 'stroke-red-500'
  }

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <svg
        className={cn('transform -rotate-90', sizeClasses[size])}
        viewBox={`0 0 ${(radius + strokeWidth) * 2} ${(radius + strokeWidth) * 2}`}
      >
        {/* Background circle */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-white/10"
        />
        {/* Score circle */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            'transition-all duration-1000 ease-out',
            getScoreColor(score),
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            'font-black tabular-nums tracking-tighter',
            textSizeClasses[size],
            'text-black dark:text-white',
          )}
        >
          {score}
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/70 mt-1">
          IQ Score
        </span>
      </div>
    </div>
  )
}
