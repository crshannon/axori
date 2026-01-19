import { Heading, Overline, Typography } from '@axori/ui'
import { cn } from '@/utils/helpers'
import { useTheme } from '@/utils/providers/theme-provider'

interface TrajectoryProps {
  projectionView: 'Conservative' | 'Aggressive'
  onViewChange: (view: 'Conservative' | 'Aggressive') => void
  cardClass?: string
}

export const Trajectory = ({
  projectionView,
  onViewChange,
  cardClass,
}: TrajectoryProps) => {
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'

  return (
    <div className={cn(cardClass, 'h-full flex flex-col p-6')}>
      <div className="flex justify-between items-center mb-8">
        <Heading
          level={3}
          className={cn(
            'text-xl font-black uppercase tracking-tighter',
            isDark ? 'text-white' : 'text-slate-900',
          )}
        >
          Trajectory
        </Heading>
        <div className="flex p-1 rounded-xl bg-slate-500/10">
          {(['C', 'A'] as const).map((v) => (
            <button
              key={v}
              onClick={() =>
                onViewChange(v === 'C' ? 'Conservative' : 'Aggressive')
              }
              className={cn(
                'w-8 h-8 rounded-lg text-[10px] font-black transition-all',
                projectionView.startsWith(v)
                  ? isDark
                    ? 'bg-white text-black'
                    : 'bg-slate-900 text-white'
                  : 'opacity-40 hover:opacity-100',
                isDark ? 'text-white' : 'text-slate-900',
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-grow flex items-end gap-1.5 px-2">
        {[40, 45, 52, 60, 75, 90, 100].map((p, i) => (
          <div
            key={i}
            className="flex-grow flex flex-col justify-end gap-1 relative group/bar"
          >
            <div
              className={cn(
                'w-full rounded-t-md transition-all duration-700 opacity-60 group-hover/bar:opacity-100',
                isDark ? 'bg-[#E8FF4D]' : 'bg-violet-600',
              )}
              style={{ height: `${p}%` }}
            ></div>
            <div
              className={cn(
                'absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black opacity-20',
                isDark ? 'text-white' : 'text-slate-400',
              )}
            >
              '{24 + i}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-slate-500/10">
        <div className="flex justify-between items-center">
          <Overline
            className={cn(
              'text-[9px] font-black uppercase',
              isDark ? 'text-white/60' : 'text-slate-500',
            )}
          >
            2031 Equity
          </Overline>
          <Typography
            variant="h4"
            className={cn(
              'text-xl font-black tracking-tighter',
              isDark ? 'text-white' : 'text-slate-900',
            )}
          >
            $2.44M
          </Typography>
        </div>
      </div>
    </div>
  )
}

