import { Heading, Overline, ProgressBar, Typography } from '@axori/ui'
import { cn } from '@/utils/helpers'
import { useTheme } from '@/utils/providers/theme-provider'

interface CapitalLockerProps {
  deployableCash: number
  nextBuyProgress: number
  cardClass?: string
}

export const CapitalLocker = ({
  deployableCash,
  nextBuyProgress,
  cardClass,
}: CapitalLockerProps) => {
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'

  return (
    <div
      className={cn(
        cardClass,
        'h-full flex flex-col bg-gradient-to-br from-transparent to-slate-500/5 p-8',
      )}
    >
      <div className="flex justify-between items-center mb-10">
        <Heading
          level={3}
          className={cn(
            'text-xl font-black uppercase tracking-tighter',
            isDark ? 'text-white' : 'text-slate-900',
          )}
        >
          Locker
        </Heading>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
      </div>

      <div className="space-y-10 flex-grow">
        <div>
          <Overline
            className={cn(
              'text-[10px] font-black uppercase tracking-widest mb-2',
              isDark ? 'text-white/60' : 'text-slate-500',
            )}
          >
            Deployable Cash
          </Overline>
          <Typography
            variant="h3"
            className={cn(
              'text-4xl font-black tabular-nums tracking-tighter',
              isDark ? 'text-[#E8FF4D]' : 'text-violet-600',
            )}
          >
            ${(deployableCash / 1000).toFixed(1)}k
          </Typography>
        </div>

        <div
          className={cn(
            'p-5 rounded-3xl border border-dashed bg-slate-500/5',
            isDark ? 'border-white/10' : 'border-slate-500/20',
          )}
        >
          <div
            className={cn(
              'flex justify-between text-[9px] font-black uppercase opacity-40 mb-3',
              isDark ? 'text-white' : 'text-slate-500',
            )}
          >
            <span>Next Target</span>
            <span>{nextBuyProgress.toFixed(0)}% Ready</span>
          </div>
          <ProgressBar value={nextBuyProgress} variant="simple" height="sm" />
        </div>
      </div>

      <div className="pt-6 border-t border-slate-500/10 flex justify-between">
        <Overline
          className={cn(
            'text-[9px] font-black uppercase',
            isDark ? 'text-white/60' : 'text-slate-500',
          )}
        >
          Reserves
        </Overline>
        <Overline className="text-[9px] font-black uppercase text-emerald-500">
          Fully Funded
        </Overline>
      </div>
    </div>
  )
}
