import { Card, Overline, Typography } from '@axori/ui'
import { useNavigate } from '@tanstack/react-router'
import { MetricCard } from './components/MetricCard'
import {
  getMetricsDisplayConfig,
  usePropertyMetrics,
} from './hooks/usePropertyMetrics'
import { useProperty } from '@/hooks/api/useProperties'

interface PropertyMetricsProps {
  propertyId: string
}

export const PropertyMetrics = ({ propertyId }: PropertyMetricsProps) => {
  const navigate = useNavigate()
  const { data: property, isLoading } = useProperty(propertyId)
  const metrics = usePropertyMetrics(property)
  const metricsConfig = getMetricsDisplayConfig(metrics, propertyId)

  if (isLoading || !property) {
    return (
      <Card variant="rounded" className="lg:col-span-5">
        <div className="p-8">
          <div className="grid grid-cols-2 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-6 rounded-3xl bg-slate-200 dark:bg-white/5"
              />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="rounded" className="lg:col-span-5">
      <div className="p-8">
        <div className="grid grid-cols-2 gap-4">
          {metricsConfig.map((m) => (
            <MetricCard
              key={m.id}
              label={m.label}
              value={m.metric.value}
              format={m.format}
              sub={m.sub}
              status={m.metric.status}
              message={m.metric.message}
              route={m.route}
              onClick={
                m.metric.status !== 'success' && m.route
                  ? () => {
                      navigate({ to: m.route })
                    }
                  : undefined
              }
            />
          ))}
          <div className="col-span-2 pt-4 flex items-center justify-between border-t border-slate-200 dark:border-white/5 mt-2">
            <Overline className="text-[10px]">Portfolio IQ Match</Overline>
            <Typography
              variant="body-sm"
              className="text-sm font-black text-[#E8FF4D]"
            >
              High Confidence ✓
            </Typography>
          </div>
        </div>
      </div>
    </Card>
  )
}
