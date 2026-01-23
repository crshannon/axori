import { useEffect, useState } from 'react'
import { Drawer, ErrorCard, Input } from '@axori/ui'
import { DrawerSectionTitle } from './DrawerSectionTitle'
import { usePropertySettings } from '@/hooks/api'

interface CalculationPresumptionsDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
}

export const CalculationPresumptionsDrawer = ({
  isOpen,
  onClose,
  propertyId,
}: CalculationPresumptionsDrawerProps) => {
  const {
    formData,
    updateField,
    saveSettings,
    isSaving,
    saveError,
  } = usePropertySettings(propertyId)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localFormData, setLocalFormData] = useState({
    vacancyRate: '',
    maintenanceRate: '',
    expenseInflation: '',
    capexSinking: '',
  })

  // Sync local form data when drawer opens or formData changes
  useEffect(() => {
    if (isOpen) {
      setLocalFormData({
        vacancyRate: formData.vacancyRate,
        maintenanceRate: formData.maintenanceRate,
        expenseInflation: formData.expenseInflation,
        capexSinking: formData.capexSinking,
      })
      setErrors({})
    }
  }, [isOpen, formData])

  const handleChange = (field: keyof typeof localFormData, value: string) => {
    setLocalFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    setErrors({})

    // Validate rates (should be valid numbers)
    const validationErrors: Record<string, string> = {}

    const validateRate = (field: string, value: string, fieldName: string) => {
      if (value && (isNaN(Number(value)) || Number(value) < 0)) {
        validationErrors[field] = `${fieldName} must be a valid positive number`
      }
    }

    validateRate('vacancyRate', localFormData.vacancyRate, 'Vacancy rate')
    validateRate('maintenanceRate', localFormData.maintenanceRate, 'Maintenance rate')
    validateRate('expenseInflation', localFormData.expenseInflation, 'Expense inflation')
    validateRate('capexSinking', localFormData.capexSinking, 'CapEx sinking')

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      // Update form data via hook
      Object.entries(localFormData).forEach(([key, value]) => {
        updateField(key as keyof typeof localFormData, value)
      })

      // Save settings
      await saveSettings()

      onClose()
    } catch (error) {
      console.error('Error saving calculation presumptions:', error)
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to save calculation presumptions. Please try again.',
      })
    }
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Calculation Presumptions"
      subtitle="FINANCIAL ASSUMPTIONS"
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
            disabled={isSaving}
            className="flex-[2] py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 dark:bg-[#E8FF4D] dark:text-black dark:shadow-xl dark:shadow-[#E8FF4D]/20 bg-violet-600 text-white shadow-xl shadow-violet-200"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Financial Presumptions Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Financial Presumptions" color="violet" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  type="text"
                  variant="rounded"
                  label="Vacancy Reserve (%)"
                  value={localFormData.vacancyRate}
                  onChange={(e) => handleChange('vacancyRate', e.target.value)}
                  placeholder="5.0"
                  error={errors.vacancyRate}
                />
                <p className="mt-2 text-[9px] font-bold uppercase tracking-widest opacity-40 dark:opacity-50 italic text-slate-600 dark:text-slate-400">
                  Calculated from Gross
                </p>
              </div>

              <div>
                <Input
                  type="text"
                  variant="rounded"
                  label="Maintenance Reserve (%)"
                  value={localFormData.maintenanceRate}
                  onChange={(e) => handleChange('maintenanceRate', e.target.value)}
                  placeholder="8.0"
                  error={errors.maintenanceRate}
                />
                <p className="mt-2 text-[9px] font-bold uppercase tracking-widest opacity-40 dark:opacity-50 italic text-slate-600 dark:text-slate-400">
                  Based on asset age
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  type="text"
                  variant="rounded"
                  label="Expense Inflation (%)"
                  value={localFormData.expenseInflation}
                  onChange={(e) => handleChange('expenseInflation', e.target.value)}
                  placeholder="3.0"
                  error={errors.expenseInflation}
                />
                <p className="mt-2 text-[9px] font-bold uppercase tracking-widest opacity-40 dark:opacity-50 italic text-slate-600 dark:text-slate-400">
                  Annual projection
                </p>
              </div>

              <div>
                <Input
                  type="text"
                  variant="rounded"
                  label="CapEx Sinking (%)"
                  value={localFormData.capexSinking}
                  onChange={(e) => handleChange('capexSinking', e.target.value)}
                  placeholder="5.0"
                  error={errors.capexSinking}
                />
                <p className="mt-2 text-[9px] font-bold uppercase tracking-widest opacity-40 dark:opacity-50 italic text-slate-600 dark:text-slate-400">
                  Target annual set-aside
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Error Message */}
        {(errors.submit || saveError) && (
          <ErrorCard
            message={
              errors.submit ||
              (saveError instanceof Error ? saveError.message : 'Failed to save')
            }
          />
        )}
      </form>
    </Drawer>
  )
}
