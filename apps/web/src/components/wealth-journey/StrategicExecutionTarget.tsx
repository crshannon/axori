import { Heading, Overline, Typography } from '@axori/ui'
import { cn } from '@/utils/helpers'
import { useTheme } from '@/utils/providers/theme-provider'

interface StrategicExecutionTargetProps {
  readinessScore: number
  onExecute: () => void
  cardClass?: string
}

export const StrategicExecutionTarget = ({
  readinessScore,
  onExecute,
  cardClass,
}: StrategicExecutionTargetProps) => {
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'

  return (
    <div
      className={cn(
        cardClass,
        'flex flex-col lg:flex-row items-center justify-between gap-12 bg-gradient-to-r',
        isDark
          ? 'from-[#E8FF4D] to-emerald-400 text-black shadow-xl shadow-[#E8FF4D]/10'
          : 'from-violet-600 to-indigo-600 text-white shadow-2xl shadow-violet-200',
      )}
    >
      <div className="flex items-center gap-8 p-8">
        <div
          className={cn(
            'relative w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-3xl font-black',
            isDark ? 'bg-black text-white' : 'bg-white text-violet-600',
          )}
        >
          {readinessScore.toFixed(0)}
          <span
            className={cn(
              'absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 animate-pulse',
              isDark
                ? 'bg-emerald-500 border-black'
                : 'bg-[#E8FF4D] border-white',
            )}
          ></span>
        </div>
        <div>
          <Heading
            level={3}
            className="text-2xl font-black uppercase tracking-tighter text-current"
          >
            Strategic Execution Target
          </Heading>
          <Overline className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-70 text-current">
            Ready Score: Optimal • Recommended Focus: Austin-San Marcos Corridor
          </Overline>
        </div>
      </div>

      <div className="hidden xl:flex gap-12 items-center px-12 border-x border-current opacity-60">
        <div className="text-center">
          <Overline className="text-[9px] font-black uppercase text-current">
            Min Yield
          </Overline>
          <Typography variant="h4" className="text-xl font-black text-current">
            &gt; 6.5%
          </Typography>
        </div>
        <div className="text-center">
          <Overline className="text-[9px] font-black uppercase text-current">
            Unit Count
          </Overline>
          <Typography variant="h4" className="text-xl font-black text-current">
            2-4 Units
          </Typography>
        </div>
      </div>

      <button
        onClick={onExecute}
        className={cn(
          'px-12 py-6 rounded-full font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl m-8 lg:m-0 lg:mr-6',
          isDark ? 'bg-black text-white' : 'bg-white text-violet-600',
        )}
      >
        Execute Search
      </button>
    </div>
  )
}
