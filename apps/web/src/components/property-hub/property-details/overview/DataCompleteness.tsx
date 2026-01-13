import { Card, Heading, Overline, ProgressBar, Typography } from '@axori/ui'
import { useNavigate } from '@tanstack/react-router'
import { usePropertyCompleteness } from './hooks/usePropertyCompleteness'
import { useProperty } from '@/hooks/api/useProperties'
import { PropertyScoreGauge } from '@/components/property-hub/PropertyScoreGauge'

interface DataCompletenessProps {
  propertyId: string
}

export const DataCompleteness = ({ propertyId }: DataCompletenessProps) => {
  const navigate = useNavigate()
  const { data: property, isLoading } = useProperty(propertyId)
  const { score, completeness, missingFields, fidelityLevel } =
    usePropertyCompleteness(property, propertyId)

  if (isLoading || !property) {
    return (
      <Card variant="rounded">
        <div className="p-8 animate-pulse">
          <div className="flex justify-between items-center mb-10">
            <div className="h-6 w-32 bg-slate-200 dark:bg-white/5 rounded" />
            <div className="h-4 w-24 bg-slate-200 dark:bg-white/5 rounded" />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-32 h-32 bg-slate-200 dark:bg-white/5 rounded-full" />
            <div className="flex-grow w-full space-y-6">
              <div className="h-4 bg-slate-200 dark:bg-white/5 rounded" />
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-white/5 rounded" />
                <div className="h-3 bg-slate-200 dark:bg-white/5 rounded" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  const getFidelityLabel = () => {
    switch (fidelityLevel) {
      case 'high':
        return 'High Fidelity'
      case 'medium':
        return 'Medium Fidelity'
      case 'low':
        return 'Low Fidelity'
      default:
        return 'Low Fidelity'
    }
  }

  return (
    <Card variant="rounded">
      <div className="p-8">
        <div className="flex justify-between items-center mb-10">
          <Heading level={5} className="text-lg">
            Asset Fidelity
          </Heading>
          <Overline className="text-[10px] opacity-40">
            Data Audit Protocol
          </Overline>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10">
          {/* Score Gauge */}
          <div className="shrink-0 flex flex-col items-center">
            <PropertyScoreGauge score={score} size="sm" />
            <div className="mt-4 text-center">
              <Typography
                variant="caption"
                className="text-[9px] font-black uppercase tracking-widest text-[#E8FF4D] dark:text-[#E8FF4D]"
              >
                {getFidelityLabel()}
              </Typography>
            </div>
          </div>

          {/* Completeness Details */}
          <div className="flex-grow w-full space-y-6">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <Overline className="text-[10px] opacity-40">
                  Completeness
                </Overline>
                <Typography
                  variant="h4"
                  className="text-xl font-black tabular-nums text-[#E8FF4D] dark:text-[#E8FF4D]"
                >
                  {completeness}%
                </Typography>
              </div>
              <ProgressBar
                value={completeness}
                variant="default"
                height="sm"
                className="bg-slate-500/10 dark:bg-slate-500/10"
              />
            </div>

            {/* Missing Fields */}
            {missingFields.length > 0 ? (
              <div className="space-y-3">
                <Overline className="text-[9px] opacity-40">
                  Missing for 100% Clarity:
                </Overline>
                <ul className="space-y-2">
                  {missingFields.map((field, index) => (
                    <li
                      key={`${field.label}-${index}`}
                      className="flex items-center gap-3 group cursor-pointer"
                      onClick={() => navigate({ to: field.route })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          navigate({ to: field.route })
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                      <Typography
                        variant="caption"
                        className="text-[10px] font-bold opacity-60 group-hover:opacity-100 group-hover:underline transition-all text-amber-600 dark:text-amber-500/80"
                      >
                        {field.label}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-3">
                <Overline className="text-[9px] opacity-40">
                  Data Status:
                </Overline>
                <Typography
                  variant="body-sm"
                  className="text-[10px] font-bold text-green-600 dark:text-green-400"
                >
                  All critical fields complete ✓
                </Typography>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
