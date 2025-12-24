import { Body, Heading, Overline, Typography } from '@axori/ui'
import { cn } from '@/utils/helpers'
import { useTheme } from '@/utils/providers/theme-provider'

interface FreedomEngineProps {
  freedomNumber: number
  currentPassiveIncome: number
  projectedMonth: string
  gapToFreedom: number
  passiveCoverage: number
  freedomScore: number
  cardClass?: string
}

export const FreedomEngine = ({
  freedomNumber,
  currentPassiveIncome,
  projectedMonth,
  gapToFreedom,
  passiveCoverage,
  freedomScore,
  cardClass,
}: FreedomEngineProps) => {
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'

  const freedomProgress = Math.min(
    (currentPassiveIncome / freedomNumber) * 100,
    100,
  )

  return (
    <div
      className={cn(
        cardClass,
        'h-full relative overflow-hidden group p-8',
      )}
    >
      <div
        className={cn(
          'absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform duration-1000 group-hover:rotate-45 pointer-events-none',
          isDark ? 'text-white' : 'text-slate-900',
        )}
      >
        <svg
          width="200"
          height="200"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
        </svg>
      </div>

      <div className="flex flex-col justify-between h-full relative z-10">
        <div className="mb-12">
          <Heading
            level={3}
            className={cn(
              'text-2xl font-black uppercase tracking-tighter leading-none mb-4',
              isDark ? 'text-white' : 'text-slate-900',
            )}
          >
            Freedom Engine
          </Heading>
          <Body
            className={cn(
              'max-w-xl text-lg font-medium italic leading-relaxed',
              isDark ? 'text-white/60' : 'text-slate-500',
            )}
          >
            "You will hit your{' '}
            <strong className={isDark ? 'text-white' : 'text-slate-700'}>
              ${freedomNumber.toLocaleString()}/mo
            </strong>{' '}
            target in{' '}
            <strong className={isDark ? 'text-white' : 'text-slate-700'}>
              {projectedMonth}
            </strong>
            ."
          </Body>
        </div>

        <div className="space-y-8">
          <div
            className={cn(
              'relative h-16 w-full rounded-3xl overflow-hidden border',
              isDark
                ? 'bg-slate-500/5 border-slate-500/10'
                : 'bg-slate-500/5 border-slate-500/10',
            )}
          >
            <div
              className={cn(
                'absolute inset-y-0 left-0 transition-all duration-1000 ease-out flex items-center justify-end px-8',
                isDark
                  ? 'bg-gradient-to-r from-emerald-900 to-[#E8FF4D]'
                  : 'bg-gradient-to-r from-violet-200 to-violet-600',
              )}
              style={{ width: `${freedomProgress}%` }}
            >
              <Overline
                className={cn(
                  'text-[9px] font-black uppercase tracking-widest',
                  isDark ? 'text-black' : 'text-white',
                )}
              >
                Passive: ${currentPassiveIncome.toLocaleString()}
              </Overline>
            </div>
            <div className="absolute inset-y-0 right-0 opacity-20 flex items-center justify-end px-8">
              <Overline className="text-[9px] font-black uppercase tracking-widest">
                Goal: ${freedomNumber.toLocaleString()}
              </Overline>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              {
                l: 'Gap to Freedom',
                v: `$${gapToFreedom.toLocaleString()}`,
              },
              { l: 'Coverage', v: `${passiveCoverage.toFixed(1)}%` },
              { l: 'Freedom Score', v: `${freedomScore.toFixed(0)}/100` },
            ].map((stat) => (
              <div
                key={stat.l}
                className={cn(
                  'p-4 rounded-3xl',
                  isDark ? 'bg-white/5' : 'bg-slate-50',
                )}
              >
                <Overline
                  className={cn(
                    'text-[8px] font-black uppercase mb-1',
                    isDark ? 'text-white/60' : 'text-slate-500',
                  )}
                >
                  {stat.l}
                </Overline>
                <Typography
                  variant="h5"
                  className={cn(
                    'text-lg font-black tracking-tighter tabular-nums',
                    isDark ? 'text-white' : 'text-slate-900',
                  )}
                >
                  {stat.v}
                </Typography>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

