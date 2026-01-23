import { Card, IconButton } from '@axori/ui'
import { Pencil } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { LearningHubButton } from '../financials/LearningHubButton'
import { getCalculationPresumptionsSnippets } from '@/data/learning-hub/settings-snippets'
import { usePropertySettings, usePropertyPermissions } from '@/hooks/api'
import { ReadOnlyBanner } from '@/components/property-hub/ReadOnlyBanner'

interface CalculationPresumptionsProps {
  propertyId: string
}

/**
 * CalculationPresumptions component - Displays financial calculation assumptions
 * Shows: vacancy rate, maintenance rate, expense inflation, CapEx sinking
 */
export const CalculationPresumptions = ({
  propertyId,
}: CalculationPresumptionsProps) => {
  const navigate = useNavigate()
  const { formData, isLoading } = usePropertySettings(propertyId)
  const { canEdit, isReadOnly } = usePropertyPermissions(propertyId)

  const handleOpenDrawer = () => {
    navigate({
      to: '/property-hub/$propertyId/settings',
      params: { propertyId },
      search: {
        drawer: 'presumptions',
      },
    })
  }

  if (isLoading) {
    return (
      <Card variant="rounded" padding="lg" radius="xl">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="h-8 w-32 bg-slate-200 dark:bg-white/5 rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card variant="rounded" padding="lg" radius="xl">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-black uppercase tracking-tighter">
          Calculation Presumptions
        </h3>
        <div className="flex items-center gap-3">
          <LearningHubButton
            snippets={getCalculationPresumptionsSnippets()}
            title="Calculation Presumptions Learning Hub"
            subtitle="Financial assumptions and reserves"
            componentKey="calculation-presumptions"
          />
          {isReadOnly && <ReadOnlyBanner variant="badge" />}
          {canEdit && (
            <IconButton
              icon={Pencil}
              size="sm"
              variant="ghost"
              shape="rounded"
              onClick={handleOpenDrawer}
              aria-label="Edit calculation presumptions"
            />
          )}
        </div>
      </div>
      <div className="space-y-6">
        {[
          {
            field: 'vacancyRate' as const,
            label: 'Vacancy Reserve',
            desc: 'Calculated from Gross',
            suffix: '%',
          },
          {
            field: 'maintenanceRate' as const,
            label: 'Maintenance Reserve',
            desc: 'Based on asset age',
            suffix: '%',
          },
          {
            field: 'expenseInflation' as const,
            label: 'Expense Inflation',
            desc: 'Annual projection',
            suffix: '%',
          },
          {
            field: 'capexSinking' as const,
            label: 'CapEx Sinking',
            desc: 'Target annual set-aside',
            suffix: '%',
          },
        ].map((item) => (
          <div
            key={item.field}
            className="flex justify-between items-end border-b border-slate-500/10 pb-4 dark:border-white/5"
          >
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500">
                {item.label}
              </p>
              <p className="text-[8px] font-bold opacity-30 uppercase">
                {item.desc}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-black text-sm text-slate-900 dark:text-white">
                {formData[item.field] || '—'}
              </span>
              {item.suffix && (
                <span className="font-black text-sm opacity-40">
                  {item.suffix}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
