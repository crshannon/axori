import { Body, Card, Heading, Overline } from '@axori/ui'
import { ChevronRight } from 'lucide-react'
import { useTheme } from '@/utils/providers/theme-provider'
import { cn } from '@/utils/helpers'

const alerts = [
  {
    type: 'lease',
    msg: 'Lease expiring in 30 days: Maple Duplex',
    priority: 'High',
    color: 'text-amber-500',
  },
  {
    type: 'performance',
    msg: 'Negative cash flow detected: Tech Ridge Quad',
    priority: 'Critical',
    color: 'text-red-500',
  },
  {
    type: 'document',
    msg: 'Missing Insurance Policy: The Lake House',
    priority: 'Med',
    color: 'text-sky-500',
  },
  {
    type: 'document',
    msg: 'Annual inspection due next month: Riverside Condo',
    priority: 'Low',
    color: 'text-slate-400',
  },
]

export const StrategicAlerts = () => {
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'

  return (
    <section
      className={cn(
        'p-8 rounded-3xl border',
        isDark
          ? 'bg-white/5 border-white/10'
          : 'bg-slate-50 border-slate-200',
      )}
    >
      <div className="flex items-center gap-4 mb-8">
        <div
          className={cn('w-8 h-1', isDark ? 'bg-white/20' : 'bg-slate-300')}
        ></div>
        <Heading
          level={3}
          className={cn(
            'text-xl font-black uppercase tracking-tighter',
            isDark ? 'text-white' : 'text-slate-900',
          )}
        >
          Strategic Alerts
        </Heading>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {alerts.map((alert, i) => (
          <Card
            key={i}
            variant="rounded"
            padding="sm"
            radius="lg"
            className={cn(
              'flex items-center justify-between gap-4 group cursor-pointer transition-all',
              isDark
                ? 'hover:bg-white/10 border-white/10'
                : 'hover:bg-white border-slate-200 hover:shadow-md',
            )}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
                  isDark ? 'bg-white/10' : 'bg-slate-100',
                )}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={alert.color}
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <Overline
                  className={cn(
                    'mb-2',
                    alert.color,
                    isDark ? 'opacity-80' : '',
                  )}
                >
                  {alert.priority} Priority
                </Overline>
                <Body
                  weight="black"
                  transform="uppercase"
                  className={cn(
                    'text-sm tracking-tight leading-snug',
                    isDark ? 'text-white' : 'text-slate-900',
                  )}
                >
                  {alert.msg}
                </Body>
              </div>
            </div>
            <ChevronRight
              size={20}
              className={cn(
                'shrink-0 transition-transform group-hover:translate-x-1',
                isDark ? 'text-white/40' : 'text-slate-400',
              )}
            />
          </Card>
        ))}
      </div>
    </section>
  )
}
