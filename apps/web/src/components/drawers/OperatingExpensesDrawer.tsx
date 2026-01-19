import { useEffect, useState } from 'react'
import { Drawer, ErrorCard, Input, Select } from '@axori/ui'
import { transformFormData } from '@axori/shared'
import { DrawerSectionTitle } from './DrawerSectionTitle'
import { useProperty, useUpdateProperty } from '@/hooks/api/useProperties'

interface OperatingExpensesDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  onSuccess?: () => void
}

export const OperatingExpensesDrawer = ({
  isOpen,
  onClose,
  propertyId,
  onSuccess,
}: OperatingExpensesDrawerProps) => {
  const updateProperty = useUpdateProperty()
  const { data: property } = useProperty(propertyId)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const operatingExpenses = property?.operatingExpenses

  // Form state - organized by category
  const [formData, setFormData] = useState({
    // Operating Rates (percentages as 0-100)
    vacancyRate: '',
    managementRate: '',
    maintenanceRate: '',
    capexRate: '',

    // Fixed Expenses (annual)
    propertyTaxAnnual: '',
    insuranceAnnual: '',

    // HOA
    hoaMonthly: '',
    hoaSpecialAssessment: '',
    hoaSpecialAssessmentDate: '',

    // Utilities (monthly)
    waterSewerMonthly: '',
    trashMonthly: '',
    electricMonthly: '',
    gasMonthly: '',
    internetMonthly: '',

    // Services (monthly)
    managementFlatFee: '',
    lawnCareMonthly: '',
    snowRemovalMonthly: '',
    pestControlMonthly: '',
    poolMaintenanceMonthly: '',
    alarmMonitoringMonthly: '',

    // Other
    otherExpensesMonthly: '',
    otherExpensesDescription: '',
  })

  // Helper to convert decimal rate (0.05) to percentage string (5)
  const rateToPercentage = (rate: string | null | undefined): string => {
    if (!rate) return ''
    const num = parseFloat(rate)
    return isNaN(num) ? '' : (num * 100).toString()
  }

  // Helper to convert percentage string (5) to decimal (0.05)
  const percentageToRate = (percentage: string): number | undefined => {
    if (!percentage) return undefined
    const num = Number(percentage)
    return isNaN(num) ? undefined : num / 100
  }

  // Populate form with existing operating expenses data
  useEffect(() => {
    if (operatingExpenses && isOpen) {
      setFormData({
        vacancyRate: rateToPercentage(operatingExpenses.vacancyRate),
        managementRate: rateToPercentage(operatingExpenses.managementRate),
        maintenanceRate: rateToPercentage(operatingExpenses.maintenanceRate),
        capexRate: rateToPercentage(operatingExpenses.capexRate),
        propertyTaxAnnual: operatingExpenses.propertyTaxAnnual || '',
        insuranceAnnual: operatingExpenses.insuranceAnnual || '',
        hoaMonthly: operatingExpenses.hoaMonthly || '',
        hoaSpecialAssessment: operatingExpenses.hoaSpecialAssessment || '',
        hoaSpecialAssessmentDate:
          operatingExpenses.hoaSpecialAssessmentDate || '',
        waterSewerMonthly: operatingExpenses.waterSewerMonthly || '',
        trashMonthly: operatingExpenses.trashMonthly || '',
        electricMonthly: operatingExpenses.electricMonthly || '',
        gasMonthly: operatingExpenses.gasMonthly || '',
        internetMonthly: operatingExpenses.internetMonthly || '',
        managementFlatFee: operatingExpenses.managementFlatFee || '',
        lawnCareMonthly: operatingExpenses.lawnCareMonthly || '',
        snowRemovalMonthly: operatingExpenses.snowRemovalMonthly || '',
        pestControlMonthly: operatingExpenses.pestControlMonthly || '',
        poolMaintenanceMonthly: operatingExpenses.poolMaintenanceMonthly || '',
        alarmMonitoringMonthly: operatingExpenses.alarmMonitoringMonthly || '',
        otherExpensesMonthly: operatingExpenses.otherExpensesMonthly || '',
        otherExpensesDescription:
          operatingExpenses.otherExpensesDescription || '',
      })
    } else if (isOpen) {
      // Reset form when opening
      setFormData({
        vacancyRate: '5',
        managementRate: '10',
        maintenanceRate: '5',
        capexRate: '5',
        propertyTaxAnnual: '',
        insuranceAnnual: '',
        hoaMonthly: '',
        hoaSpecialAssessment: '',
        hoaSpecialAssessmentDate: '',
        waterSewerMonthly: '',
        trashMonthly: '',
        electricMonthly: '',
        gasMonthly: '',
        internetMonthly: '',
        managementFlatFee: '',
        lawnCareMonthly: '',
        snowRemovalMonthly: '',
        pestControlMonthly: '',
        poolMaintenanceMonthly: '',
        alarmMonitoringMonthly: '',
        otherExpensesMonthly: '',
        otherExpensesDescription: '',
      })
    }
  }, [operatingExpenses, isOpen])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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

    try {
      // Transform form data - rates are handled separately
      const transformedData = transformFormData(
        {
          propertyTaxAnnual: formData.propertyTaxAnnual,
          insuranceAnnual: formData.insuranceAnnual,
          hoaMonthly: formData.hoaMonthly,
          hoaSpecialAssessment: formData.hoaSpecialAssessment,
          hoaSpecialAssessmentDate: formData.hoaSpecialAssessmentDate,
          waterSewerMonthly: formData.waterSewerMonthly,
          trashMonthly: formData.trashMonthly,
          electricMonthly: formData.electricMonthly,
          gasMonthly: formData.gasMonthly,
          internetMonthly: formData.internetMonthly,
          managementFlatFee: formData.managementFlatFee,
          lawnCareMonthly: formData.lawnCareMonthly,
          snowRemovalMonthly: formData.snowRemovalMonthly,
          pestControlMonthly: formData.pestControlMonthly,
          poolMaintenanceMonthly: formData.poolMaintenanceMonthly,
          alarmMonitoringMonthly: formData.alarmMonitoringMonthly,
          otherExpensesMonthly: formData.otherExpensesMonthly,
          otherExpensesDescription: formData.otherExpensesDescription,
        },
        {
          numericFields: [
            'propertyTaxAnnual',
            'insuranceAnnual',
            'hoaMonthly',
            'hoaSpecialAssessment',
            'waterSewerMonthly',
            'trashMonthly',
            'electricMonthly',
            'gasMonthly',
            'internetMonthly',
            'managementFlatFee',
            'lawnCareMonthly',
            'snowRemovalMonthly',
            'pestControlMonthly',
            'poolMaintenanceMonthly',
            'alarmMonitoringMonthly',
            'otherExpensesMonthly',
          ],
          dateFields: ['hoaSpecialAssessmentDate'],
          excludeEmpty: true,
        },
      )

      // Add rates - convert from percentages (0-100) to decimals (0-1)
      const operatingExpensesData: Record<string, unknown> = {
        ...transformedData,
      }

      if (formData.vacancyRate !== '') {
        operatingExpensesData.vacancyRate = percentageToRate(
          formData.vacancyRate,
        )
      }
      if (formData.managementRate !== '') {
        operatingExpensesData.managementRate = percentageToRate(
          formData.managementRate,
        )
      }
      if (formData.maintenanceRate !== '') {
        operatingExpensesData.maintenanceRate = percentageToRate(
          formData.maintenanceRate,
        )
      }
      if (formData.capexRate !== '') {
        operatingExpensesData.capexRate = percentageToRate(formData.capexRate)
      }

      await updateProperty.mutateAsync({
        id: propertyId,
        operatingExpenses: operatingExpensesData,
      } as any)

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error updating operating expenses:', error)
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to update operating expenses. Please try again.',
      })
    }
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Operating Expenses"
      subtitle="OPERATING CORE CONFIGURATION"
      width="lg"
      footer={
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={updateProperty.isPending}
            className="flex-1 py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] border transition-all hover:bg-slate-500/5 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/10 dark:text-white border-slate-200 text-slate-900"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={updateProperty.isPending}
            className="flex-[2] py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 dark:bg-[#E8FF4D] dark:text-black dark:shadow-xl dark:shadow-[#E8FF4D]/20 bg-violet-600 text-white shadow-xl shadow-violet-200"
          >
            {updateProperty.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Operating Rates Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Operating Rates" color="violet" />
          <p className="text-xs font-bold uppercase tracking-widest opacity-50 dark:opacity-60 text-slate-600 dark:text-slate-400">
            Percentage of gross income
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              variant="rounded"
              label="Vacancy Rate (%)"
              step="0.1"
              min="0"
              max="100"
              value={formData.vacancyRate}
              onChange={(e) => handleChange('vacancyRate', e.target.value)}
              placeholder="5.0"
              error={errors.vacancyRate}
            />
            <Input
              type="number"
              variant="rounded"
              label="Management Rate (%)"
              step="0.1"
              min="0"
              max="100"
              value={formData.managementRate}
              onChange={(e) => handleChange('managementRate', e.target.value)}
              placeholder="10.0"
              error={errors.managementRate}
            />
            <Input
              type="number"
              variant="rounded"
              label="Maintenance Rate (%)"
              step="0.1"
              min="0"
              max="100"
              value={formData.maintenanceRate}
              onChange={(e) => handleChange('maintenanceRate', e.target.value)}
              placeholder="5.0"
              error={errors.maintenanceRate}
            />
            <Input
              type="number"
              variant="rounded"
              label="CapEx Rate (%)"
              step="0.1"
              min="0"
              max="100"
              value={formData.capexRate}
              onChange={(e) => handleChange('capexRate', e.target.value)}
              placeholder="5.0"
              error={errors.capexRate}
            />
          </div>
        </section>

        {/* Fixed Expenses Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Fixed Expenses" color="emerald" />
          <p className="text-xs font-bold uppercase tracking-widest opacity-50 dark:opacity-60 text-slate-600 dark:text-slate-400">
            Annual amounts
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              variant="rounded"
              label="Property Tax (Annual)"
              step="0.01"
              min="0"
              value={formData.propertyTaxAnnual}
              onChange={(e) =>
                handleChange('propertyTaxAnnual', e.target.value)
              }
              placeholder="0.00"
              error={errors.propertyTaxAnnual}
            />
            <Input
              type="number"
              variant="rounded"
              label="Insurance (Annual)"
              step="0.01"
              min="0"
              value={formData.insuranceAnnual}
              onChange={(e) => handleChange('insuranceAnnual', e.target.value)}
              placeholder="0.00"
              error={errors.insuranceAnnual}
            />
          </div>
        </section>

        {/* HOA Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="HOA" color="indigo" />
          <p className="text-xs font-bold uppercase tracking-widest opacity-50 dark:opacity-60 text-slate-600 dark:text-slate-400">
            Monthly amounts
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              variant="rounded"
              label="HOA Monthly"
              step="0.01"
              min="0"
              value={formData.hoaMonthly}
              onChange={(e) => handleChange('hoaMonthly', e.target.value)}
              placeholder="0.00"
              error={errors.hoaMonthly}
            />
            <Input
              type="number"
              variant="rounded"
              label="Special Assessment"
              step="0.01"
              min="0"
              value={formData.hoaSpecialAssessment}
              onChange={(e) =>
                handleChange('hoaSpecialAssessment', e.target.value)
              }
              placeholder="0.00"
              error={errors.hoaSpecialAssessment}
            />
            <div className="col-span-full">
              <Input
                type="date"
                variant="rounded"
                label="Special Assessment Date"
                value={formData.hoaSpecialAssessmentDate}
                onChange={(e) =>
                  handleChange('hoaSpecialAssessmentDate', e.target.value)
                }
                error={errors.hoaSpecialAssessmentDate}
              />
            </div>
          </div>
        </section>

        {/* Utilities Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Utilities" color="amber" />
          <p className="text-xs font-bold uppercase tracking-widest opacity-50 dark:opacity-60 text-slate-600 dark:text-slate-400">
            Monthly amounts (if landlord-paid)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              variant="rounded"
              label="Water/Sewer"
              step="0.01"
              min="0"
              value={formData.waterSewerMonthly}
              onChange={(e) =>
                handleChange('waterSewerMonthly', e.target.value)
              }
              placeholder="0.00"
              error={errors.waterSewerMonthly}
            />
            <Input
              type="number"
              variant="rounded"
              label="Trash"
              step="0.01"
              min="0"
              value={formData.trashMonthly}
              onChange={(e) => handleChange('trashMonthly', e.target.value)}
              placeholder="0.00"
              error={errors.trashMonthly}
            />
            <Input
              type="number"
              variant="rounded"
              label="Electric"
              step="0.01"
              min="0"
              value={formData.electricMonthly}
              onChange={(e) => handleChange('electricMonthly', e.target.value)}
              placeholder="0.00"
              error={errors.electricMonthly}
            />
            <Input
              type="number"
              variant="rounded"
              label="Gas"
              step="0.01"
              min="0"
              value={formData.gasMonthly}
              onChange={(e) => handleChange('gasMonthly', e.target.value)}
              placeholder="0.00"
              error={errors.gasMonthly}
            />
            <Input
              type="number"
              variant="rounded"
              label="Internet"
              step="0.01"
              min="0"
              value={formData.internetMonthly}
              onChange={(e) => handleChange('internetMonthly', e.target.value)}
              placeholder="0.00"
              error={errors.internetMonthly}
            />
          </div>
        </section>

        {/* Services Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Services" color="slate" />
          <p className="text-xs font-bold uppercase tracking-widest opacity-50 dark:opacity-60 text-slate-600 dark:text-slate-400">
            Monthly amounts
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              variant="rounded"
              label="Management Flat Fee"
              step="0.01"
              min="0"
              value={formData.managementFlatFee}
              onChange={(e) =>
                handleChange('managementFlatFee', e.target.value)
              }
              placeholder="0.00"
              error={errors.managementFlatFee}
            />
            <Input
              type="number"
              variant="rounded"
              label="Lawn Care"
              step="0.01"
              min="0"
              value={formData.lawnCareMonthly}
              onChange={(e) => handleChange('lawnCareMonthly', e.target.value)}
              placeholder="0.00"
              error={errors.lawnCareMonthly}
            />
            <Input
              type="number"
              variant="rounded"
              label="Snow Removal"
              step="0.01"
              min="0"
              value={formData.snowRemovalMonthly}
              onChange={(e) =>
                handleChange('snowRemovalMonthly', e.target.value)
              }
              placeholder="0.00"
              error={errors.snowRemovalMonthly}
            />
            <Input
              type="number"
              variant="rounded"
              label="Pest Control"
              step="0.01"
              min="0"
              value={formData.pestControlMonthly}
              onChange={(e) =>
                handleChange('pestControlMonthly', e.target.value)
              }
              placeholder="0.00"
              error={errors.pestControlMonthly}
            />
            <Input
              type="number"
              variant="rounded"
              label="Pool Maintenance"
              step="0.01"
              min="0"
              value={formData.poolMaintenanceMonthly}
              onChange={(e) =>
                handleChange('poolMaintenanceMonthly', e.target.value)
              }
              placeholder="0.00"
              error={errors.poolMaintenanceMonthly}
            />
            <Input
              type="number"
              variant="rounded"
              label="Alarm Monitoring"
              step="0.01"
              min="0"
              value={formData.alarmMonitoringMonthly}
              onChange={(e) =>
                handleChange('alarmMonitoringMonthly', e.target.value)
              }
              placeholder="0.00"
              error={errors.alarmMonitoringMonthly}
            />
          </div>
        </section>

        {/* Other Expenses Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Other Expenses" color="violet" />
          <div className="space-y-4">
            <Input
              type="number"
              variant="rounded"
              label="Other Monthly Expenses"
              step="0.01"
              min="0"
              value={formData.otherExpensesMonthly}
              onChange={(e) =>
                handleChange('otherExpensesMonthly', e.target.value)
              }
              placeholder="0.00"
              error={errors.otherExpensesMonthly}
            />
            <Input
              type="text"
              variant="rounded"
              label="Description"
              value={formData.otherExpensesDescription}
              onChange={(e) =>
                handleChange('otherExpensesDescription', e.target.value)
              }
              placeholder="Describe other expenses"
              error={errors.otherExpensesDescription}
            />
          </div>
        </section>

        {/* Error Message */}
        {errors.submit && <ErrorCard message={errors.submit} />}
      </form>
    </Drawer>
  )
}
