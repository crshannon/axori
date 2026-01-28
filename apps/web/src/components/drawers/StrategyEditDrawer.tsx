import { useEffect, useState } from 'react'
import { Drawer, ErrorCard, Select, Input } from '@axori/ui'
import { DrawerSectionTitle } from './DrawerSectionTitle'
import { usePropertyStrategy, useSaveStrategy } from '@/hooks/api/useStrategy'
import {
  StrategySelector,
  StrategyVariantSelector,
} from '@/components/property-hub/property-details/strategy'
import type { PrimaryStrategy, ExitMethod, HoldPeriod } from '@axori/shared/src/validation'

interface StrategyEditDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
}

const EXIT_METHOD_OPTIONS: { value: ExitMethod; label: string }[] = [
  { value: 'hold_forever', label: 'Hold Forever' },
  { value: 'sell', label: 'Traditional Sale' },
  { value: '1031_exchange', label: '1031 Exchange' },
  { value: 'refinance_hold', label: 'Refinance & Hold' },
  { value: 'seller_finance', label: 'Seller Finance' },
  { value: 'convert_primary', label: 'Convert to Primary' },
  { value: 'gift_inherit', label: 'Gift/Inherit' },
  { value: 'undecided', label: 'Undecided' },
]

const HOLD_PERIOD_OPTIONS: { value: HoldPeriod; label: string }[] = [
  { value: 'indefinite', label: 'Indefinite' },
  { value: 'short', label: 'Short (< 2 years)' },
  { value: 'medium', label: 'Medium (2-5 years)' },
  { value: 'long', label: 'Long (5-10 years)' },
  { value: 'specific', label: 'Specific Year' },
]

export const StrategyEditDrawer = ({
  isOpen,
  onClose,
  propertyId,
}: StrategyEditDrawerProps) => {
  const { data } = usePropertyStrategy(propertyId)
  const saveStrategy = useSaveStrategy()

  const [formData, setFormData] = useState<{
    primaryStrategy: PrimaryStrategy | null
    strategyVariant: string | null
    exitMethod: ExitMethod | null
    holdPeriod: HoldPeriod | null
    targetExitYear: number | null
  }>({
    primaryStrategy: null,
    strategyVariant: null,
    exitMethod: null,
    holdPeriod: null,
    targetExitYear: null,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Sync form data when drawer opens or data changes
  useEffect(() => {
    if (isOpen && data?.strategy) {
      setFormData({
        primaryStrategy: data.strategy.primaryStrategy,
        strategyVariant: data.strategy.strategyVariant,
        exitMethod: data.strategy.exitMethod,
        holdPeriod: data.strategy.holdPeriod,
        targetExitYear: data.strategy.targetExitYear,
      })
      setErrors({})
    } else if (isOpen && !data?.strategy) {
      // Reset form for new strategy
      setFormData({
        primaryStrategy: null,
        strategyVariant: null,
        exitMethod: null,
        holdPeriod: null,
        targetExitYear: null,
      })
      setErrors({})
    }
  }, [isOpen, data?.strategy])

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    setErrors({})

    // Validate required fields
    if (!formData.primaryStrategy) {
      setErrors({ primaryStrategy: 'Please select an investment strategy' })
      return
    }

    try {
      await saveStrategy.mutateAsync({
        propertyId,
        primaryStrategy: formData.primaryStrategy,
        strategyVariant: formData.strategyVariant,
        exitMethod: formData.exitMethod,
        holdPeriod: formData.holdPeriod,
        targetExitYear: formData.targetExitYear,
      })
      onClose()
    } catch (error) {
      console.error('Error saving strategy:', error)
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to save strategy. Please try again.',
      })
    }
  }

  const isSaving = saveStrategy.isPending

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Investment Strategy"
      subtitle="STRATEGY CONFIGURATION"
      width="lg"
      footer={
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] border transition-all hover:bg-slate-500/5 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/10 dark:text-white border-slate-200 text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || !formData.primaryStrategy}
            className="flex-[2] py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 dark:bg-[#E8FF4D] dark:text-black dark:shadow-xl dark:shadow-[#E8FF4D]/20 bg-violet-600 text-white shadow-xl shadow-violet-200"
          >
            {isSaving ? 'Saving...' : 'Save Strategy'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Strategy Selection Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Investment Strategy" color="violet" />
          <StrategySelector
            selectedStrategy={formData.primaryStrategy}
            onSelect={(strategy) =>
              setFormData((prev) => ({
                ...prev,
                primaryStrategy: strategy,
                strategyVariant: null, // Reset variant when strategy changes
              }))
            }
            disabled={isSaving}
          />
          {errors.primaryStrategy && (
            <p className="text-sm text-rose-500 mt-2">{errors.primaryStrategy}</p>
          )}
        </section>

        {/* Variant Selection Section */}
        {formData.primaryStrategy && (
          <section className="space-y-6">
            <DrawerSectionTitle title="Strategy Variant" color="emerald" />
            <StrategyVariantSelector
              strategy={formData.primaryStrategy}
              selectedVariant={formData.strategyVariant}
              onSelect={(variant) =>
                setFormData((prev) => ({ ...prev, strategyVariant: variant }))
              }
              disabled={isSaving}
            />
          </section>
        )}

        {/* Exit Strategy Section */}
        {formData.primaryStrategy && (
          <section className="space-y-6">
            <DrawerSectionTitle title="Exit Strategy" color="indigo" />
            <div className="space-y-4">
              <Select
                variant="rounded"
                label="Exit Method"
                value={formData.exitMethod || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    exitMethod: (e.target.value as ExitMethod) || null,
                  }))
                }
                disabled={isSaving}
              >
                <option value="">Select exit method...</option>
                {EXIT_METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <Select
                variant="rounded"
                label="Hold Period"
                value={formData.holdPeriod || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    holdPeriod: (e.target.value as HoldPeriod) || null,
                    targetExitYear:
                      e.target.value !== 'specific' ? null : prev.targetExitYear,
                  }))
                }
                disabled={isSaving}
              >
                <option value="">Select hold period...</option>
                {HOLD_PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              {formData.holdPeriod === 'specific' && (
                <Input
                  type="number"
                  variant="rounded"
                  label="Target Exit Year"
                  value={formData.targetExitYear?.toString() || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      targetExitYear: e.target.value
                        ? parseInt(e.target.value, 10)
                        : null,
                    }))
                  }
                  placeholder="e.g., 2030"
                  min={new Date().getFullYear()}
                  max={2100}
                  disabled={isSaving}
                />
              )}
            </div>
          </section>
        )}

        {/* BRRRR Phase Note */}
        {formData.primaryStrategy === 'brrrr' && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
              BRRRR Phase Tracking: After saving, you can track your BRRRR
              progress through each phase (Buy, Rehab, Rent, Refinance, Repeat)
              from the Strategy tab.
            </p>
          </div>
        )}

        {/* Error Message */}
        {errors.submit && <ErrorCard message={errors.submit} />}
      </form>
    </Drawer>
  )
}
