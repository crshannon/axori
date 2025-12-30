import { useEffect, useRef } from 'react'
import { cn } from '@axori/ui'

interface Milestone {
  id: number
  date: string
  impact?: string
  progress?: number
  unlock: string
  phase: 'Foundation' | 'Growth' | 'Freedom' | 'Legacy'
  title: string
  status: 'Current' | 'Completed' | 'Locked' | 'Target' | 'Goal'
  icon: string
}

// User defined 20 Milestones
const allMilestones: Array<Milestone> = [
  {
    id: 1,
    phase: 'Foundation',
    title: 'First Property Acquired',
    status: 'Completed',
    date: 'Sept 22',
    icon: '🏠',
    unlock: 'Leap taken',
  },
  {
    id: 2,
    phase: 'Foundation',
    title: 'Positive Cash Flow',
    status: 'Completed',
    date: 'Nov 22',
    icon: '💰',
    unlock: 'Income active',
  },
  {
    id: 3,
    phase: 'Foundation',
    title: 'Emergency Fund Secured',
    status: 'Completed',
    date: 'Jan 23',
    icon: '🛡️',
    unlock: 'Risk mitigated',
  },
  {
    id: 4,
    phase: 'Foundation',
    title: 'First Tax Year',
    status: 'Completed',
    date: 'Apr 23',
    icon: '📋',
    unlock: 'Schedule E Ready',
  },
  {
    id: 5,
    phase: 'Growth',
    title: '3 Properties Milestone',
    status: 'Completed',
    date: 'Oct 23',
    icon: '🏘️',
    unlock: 'Official Portfolio',
  },
  {
    id: 6,
    phase: 'Growth',
    title: '$1,000/Mo Passive',
    status: 'Completed',
    date: 'Jan 24',
    icon: '💵',
    unlock: 'Core Milestone',
  },
  {
    id: 7,
    phase: 'Growth',
    title: 'First Refinance/HELOC',
    status: 'Completed',
    date: 'Mar 24',
    icon: '⛽',
    unlock: 'Growth Fueled',
  },
  {
    id: 8,
    phase: 'Growth',
    title: 'All Assets Positive',
    status: 'Completed',
    date: 'Jun 24',
    icon: '✅',
    unlock: 'No Subsidies',
  },
  {
    id: 9,
    phase: 'Growth',
    title: '5 Properties Milestone',
    status: 'Current',
    date: 'Active',
    icon: '🏗️',
    progress: 78,
    unlock: 'Serious Territory',
  },
  {
    id: 10,
    phase: 'Growth',
    title: '$2,500/Mo Passive',
    status: 'Locked',
    date: 'Target Oct 24',
    icon: '🏦',
    unlock: 'Mortgage Covered',
  },
  {
    id: 11,
    phase: 'Growth',
    title: 'First Property Paid Off',
    status: 'Locked',
    date: '2025',
    icon: '🔓',
    unlock: '100% Equity',
  },
  {
    id: 12,
    phase: 'Growth',
    title: '$5,000/Mo Passive',
    status: 'Locked',
    date: '2026',
    icon: '🚀',
    unlock: 'Replacement Income',
  },
  {
    id: 13,
    phase: 'Growth',
    title: '10 Properties Milestone',
    status: 'Locked',
    date: '2027',
    icon: '🏢',
    unlock: 'Double Digits',
  },
  {
    id: 14,
    phase: 'Freedom',
    title: 'Net Worth $1M',
    status: 'Locked',
    date: '2028',
    icon: '💎',
    unlock: 'Millionaire Status',
  },
  {
    id: 15,
    phase: 'Freedom',
    title: '$10,000/Mo Passive',
    status: 'Locked',
    date: '2029',
    icon: '🎖️',
    unlock: 'Professional Salary',
  },
  {
    id: 16,
    phase: 'Freedom',
    title: '50% Properties Paid Off',
    status: 'Locked',
    date: '2030',
    icon: '🧱',
    unlock: 'Unshakeable',
  },
  {
    id: 17,
    phase: 'Freedom',
    title: 'Work Optional',
    status: 'Locked',
    date: '2031',
    icon: '🕊️',
    unlock: 'True Autonomy',
  },
  {
    id: 18,
    phase: 'Legacy',
    title: '$20,000/Mo Passive',
    status: 'Locked',
    date: 'Abundance',
    icon: '🌟',
    unlock: 'True Abundance',
  },
  {
    id: 19,
    phase: 'Legacy',
    title: 'All Properties Paid Off',
    status: 'Locked',
    date: 'Sustain',
    icon: '👑',
    unlock: 'Max Flow',
  },
  {
    id: 20,
    phase: 'Legacy',
    title: 'Financial Freedom',
    status: 'Locked',
    date: 'Legacy',
    icon: '🌍',
    unlock: 'Life Fully Funded',
  },
]

export const Milestones = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to the first current milestone on mount
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Find the first milestone with status "Current"
    const currentMilestone = allMilestones.find((m) => m.status === 'Current')
    if (!currentMilestone) return

    // Find the element with the matching data-milestone-id
    const currentElement = container.querySelector<HTMLElement>(
      `[data-milestone-id="${currentMilestone.id}"]`,
    )

    if (currentElement) {
      const containerRect = container.getBoundingClientRect()
      const elementRect = currentElement.getBoundingClientRect()

      // Calculate the scroll position to center the current milestone
      const scrollLeft =
        currentElement.offsetLeft -
        containerRect.width / 2 +
        elementRect.width / 2

      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      })
    }
  }, [])

  return (
    <div
      ref={scrollContainerRef}
      className="relative overflow-x-auto no-scrollbar pt-16 pb-2 cursor-grab active:cursor-grabbing"
    >
      {/* Horizontal Background Line */}
      <div className="absolute top-[144px] left-0 h-[3px] min-w-[4200px] bg-slate-500/10 dark:bg-white/5"></div>

      <div className="flex gap-24 min-w-max px-12 relative z-10">
        {allMilestones.map((m) => {
          const isFreedomGoal = m.title === 'Financial Freedom'
          const isCurrent = m.status === 'Current'
          const isCompleted = m.status === 'Completed'
          const isLocked = m.status === 'Locked'

          return (
            <div
              key={m.id}
              data-milestone-id={m.id}
              className={cn(
                'relative flex flex-col items-center text-center transition-all duration-700 w-52',
                isLocked ? 'opacity-30' : 'opacity-100',
                isCompleted && 'opacity-30',
              )}
            >
              {/* Phase Label */}
              <div className="absolute -top-12 whitespace-nowrap">
                <span
                  className={cn(
                    'text-[8px] font-black uppercase tracking-[0.3em]',
                    m.phase === 'Foundation' && 'text-blue-400',
                    m.phase === 'Growth' &&
                      'text-violet-600 dark:text-[#E8FF4D]',
                    m.phase === 'Freedom' && 'text-emerald-500',
                    m.phase === 'Legacy' && 'text-amber-500',
                  )}
                >
                  {m.phase}
                </span>
              </div>

              {/* Node Icon */}
              <div
                className={cn(
                  'w-16 h-16 rounded-[2rem] flex items-center justify-center text-2xl mb-8 border-2 transition-all duration-700 relative',
                  isCurrent &&
                    'bg-violet-600 border-violet-600 text-white shadow-2xl scale-110 dark:bg-[#E8FF4D] dark:border-white dark:text-black dark:shadow-[0_0_40px_rgba(232,255,77,0.3)]',
                  isCompleted &&
                    'bg-emerald-500 border-emerald-500 text-white dark:text-black',
                  isFreedomGoal &&
                    'bg-violet-900 border-white text-white shadow-2xl dark:bg-white dark:border-black dark:text-black',
                  !isCurrent &&
                    !isCompleted &&
                    !isFreedomGoal &&
                    'bg-white border-slate-200 text-slate-400 dark:bg-black dark:border-white/10 dark:text-white/40',
                )}
              >
                {isCompleted ? '✓' : m.icon}
              </div>

              <div className="space-y-1 mb-6 px-4">
                <h3
                  className={cn(
                    'text-xs font-black text-slate-900 dark:text-white/60 uppercase tracking-tight leading-tight',
                    isCurrent && 'text-violet-600 dark:text-[#E8FF4D]',
                  )}
                >
                  {m.title}
                </h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase">
                  {m.date}
                </p>
              </div>

              {/* Unlock Area */}
              <div
                className={cn(
                  'p-4 rounded-2xl w-full border transition-all duration-500',
                  isCurrent &&
                    'bg-violet-50 border-violet-100 shadow-sm dark:bg-white/10 dark:border-white/20',
                  !isCurrent &&
                    'bg-slate-50 border-transparent dark:bg-white/5',
                )}
              >
                <p className="text-[10px] font-black text-slate-500 dark:text-white uppercase mb-1">
                  Impact
                </p>
                <p
                  className={cn(
                    'text-[12px] font-black uppercase text-slate-500 dark:text-white tracking-widest',
                    isCurrent && 'text-violet-600 dark:text-[#E8FF4D]',
                  )}
                >
                  {m.unlock}
                </p>
              </div>

              {/* Progress track connector */}
              {m.progress && (
                <div className="absolute top-[72px] left-1/2 w-full -translate-x-1/2 h-1 pointer-events-none">
                  <div className="w-full h-1.5 bg-slate-500/20 dark:bg-slate-500/20 rounded-full absolute top-0 left-0"></div>
                  <div
                    className="relative z-10 h-1.5 rounded-full transition-all duration-1000 bg-violet-600 dark:bg-[#E8FF4D] box-shadow-[0_0_10px_rgba(232,255,77,0.3)] dark:box-shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                    style={{ width: `${m.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
