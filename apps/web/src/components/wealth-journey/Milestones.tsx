import { Heading, Overline } from '@axori/ui'
import { cn } from '@/utils/helpers'
import { useTheme } from '@/utils/providers/theme-provider'

interface Milestone {
  label: string
  date: string
  done: boolean
}

interface MilestonesProps {
  milestones: Milestone[]
  cardClass?: string
}

export const Milestones = ({ milestones, cardClass }: MilestonesProps) => {
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'

  return (
    <div className={cn(cardClass, 'h-full p-8')}>
      <Heading
        level={3}
        className={cn(
          'text-xl font-black uppercase tracking-tighter mb-8',
          isDark ? 'text-white' : 'text-slate-900',
        )}
      >
        Milestones
      </Heading>
      <div className="space-y-6 relative">
        <div
          className={cn(
            'absolute left-[11px] top-2 bottom-2 w-0.5',
            isDark ? 'bg-white/10' : 'bg-slate-500/10',
          )}
        ></div>
        {milestones.map((m) => (
          <div key={m.label} className="flex gap-4 relative z-10">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all',
                m.done
                  ? isDark
                    ? 'bg-[#E8FF4D] border-[#E8FF4D] text-black'
                    : 'bg-violet-600 border-violet-600 text-white'
                  : isDark
                    ? 'bg-black border-white/10'
                    : 'bg-white border-slate-200',
              )}
            >
              {m.done && (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <div className="flex-grow flex justify-between items-center">
              <Overline
                className={cn(
                  'text-[10px] font-black uppercase',
                  m.done ? '' : 'opacity-30',
                  isDark ? 'text-white' : 'text-slate-900',
                )}
              >
                {m.label}
              </Overline>
              <Overline
                className={cn(
                  'text-[9px] font-bold uppercase tracking-widest',
                  isDark ? 'text-white/60' : 'text-slate-500',
                )}
              >
                {m.date}
              </Overline>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

