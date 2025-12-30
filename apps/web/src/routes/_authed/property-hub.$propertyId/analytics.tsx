import { createFileRoute } from '@tanstack/react-router'
import { BarChart3, DollarSign, TrendingUp } from 'lucide-react'
import { Body, Caption, Heading, Overline, Typography } from '@axori/ui'
import { cn } from '@/utils/helpers'

export const Route = createFileRoute(
  '/_authed/property-hub/$propertyId/analytics',
)({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { propertyId } = Route.useParams()

  const cardClass = cn(
    'p-10 rounded-[3.5rem] border transition-all duration-500',
    'bg-white border-slate-200 shadow-sm',
    'dark:bg-[#1A1A1A] dark:border-white/5',
  )

  return (
    <div className="p-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-12">
        <Heading
          level={2}
          className="text-3xl font-black uppercase tracking-tighter mb-4"
        >
          Analytics
        </Heading>
        <Body className="text-slate-500 dark:text-white/70">
          Performance metrics and trends for {propertyId}
        </Body>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          {
            label: 'Total Return',
            value: '24.5%',
            change: '+3.2%',
            icon: TrendingUp,
          },
          {
            label: 'Cash Flow',
            value: '$12,450',
            change: '+$1,200',
            icon: DollarSign,
          },
          { label: 'Occupancy', value: '98%', change: '+2%', icon: BarChart3 },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <Overline className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/70">
                  {stat.label}
                </Overline>
                <Icon
                  size={20}
                  className="text-violet-600 dark:text-[#E8FF4D]"
                />
              </div>
              <Typography
                variant="h1"
                className="text-4xl font-black tabular-nums tracking-tighter mb-2"
              >
                {stat.value}
              </Typography>
              <Caption className="text-emerald-500 font-black">
                {stat.change} vs last period
              </Caption>
            </div>
          )
        })}
      </div>

      <div className={cardClass}>
        <Heading
          level={3}
          className="text-2xl font-black uppercase tracking-tighter mb-8"
        >
          Performance Trends
        </Heading>
        <div
          className={cn(
            'h-64 w-full rounded-3xl border border-dashed flex items-center justify-center',
            'border-slate-200',
            'dark:border-white/10',
          )}
        >
          <Body className="text-slate-400 dark:text-white/40">
            Chart visualization coming soon
          </Body>
        </div>
      </div>
    </div>
  )
}
