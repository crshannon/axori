import { useEffect, useState } from 'react'
import { Drawer, ErrorCard, Input, Select } from '@axori/ui'
import { transformFormData } from '@axori/shared'
import { DrawerSectionTitle } from './DrawerSectionTitle'
import { useProperty, useUpdateProperty } from '@/hooks/api/useProperties'

interface ValuationDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  onSuccess?: () => void
}

export const ValuationDrawer = ({
  isOpen,
  onClose,
  propertyId,
  onSuccess,
}: ValuationDrawerProps) => {
  const updateProperty = useUpdateProperty()
  const { data: property } = useProperty(propertyId)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const valuation = property?.valuation

  // Form state
  const [formData, setFormData] = useState({
    currentValue: '',
    currentValueSource: '',
    currentValueDate: '',
    taxAssessedValue: '',
    taxAssessedYear: '',
    lastAppraisalValue: '',
    lastAppraisalDate: '',
    insuranceReplacementValue: '',
  })

  // Populate form with existing valuation data
  useEffect(() => {
    if (valuation && isOpen) {
      setFormData({
        currentValue: valuation.currentValue || '',
        currentValueSource: valuation.currentValueSource || '',
        currentValueDate: valuation.currentValueDate || '',
        taxAssessedValue: valuation.taxAssessedValue || '',
        taxAssessedYear: valuation.taxAssessedYear?.toString() || '',
        lastAppraisalValue: valuation.lastAppraisalValue || '',
        lastAppraisalDate: valuation.lastAppraisalDate || '',
        insuranceReplacementValue: valuation.insuranceReplacementValue || '',
      })
    } else if (isOpen) {
      // Reset form when opening
      setFormData({
        currentValue: '',
        currentValueSource: '',
        currentValueDate: '',
        taxAssessedValue: '',
        taxAssessedYear: '',
        lastAppraisalValue: '',
        lastAppraisalDate: '',
        insuranceReplacementValue: '',
      })
    }
  }, [valuation, isOpen])

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

    // Validate required fields
    const validationErrors: Record<string, string> = {}
    if (!formData.currentValue || Number(formData.currentValue) <= 0) {
      validationErrors.currentValue =
        'Current value is required and must be greater than 0'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      // Transform form data - convert numeric fields and exclude empty values
      const transformedData = transformFormData(
        {
          currentValue: formData.currentValue,
          currentValueSource: formData.currentValueSource,
          currentValueDate: formData.currentValueDate,
          taxAssessedValue: formData.taxAssessedValue,
          taxAssessedYear: formData.taxAssessedYear,
          lastAppraisalValue: formData.lastAppraisalValue,
          lastAppraisalDate: formData.lastAppraisalDate,
          insuranceReplacementValue: formData.insuranceReplacementValue,
        },
        {
          numericFields: [
            'currentValue',
            'taxAssessedValue',
            'lastAppraisalValue',
            'insuranceReplacementValue',
          ],
          dateFields: ['currentValueDate', 'lastAppraisalDate'],
          excludeEmpty: true,
        },
      )

      // Convert taxAssessedYear to integer if provided
      if (formData.taxAssessedYear) {
        const year = Number(formData.taxAssessedYear)
        if (!isNaN(year)) {
          transformedData.taxAssessedYear = year
        }
      }

      // Ensure currentValue is always included (required field)
      if (!transformedData.currentValue) {
        transformedData.currentValue = formData.currentValue
      }

      await updateProperty.mutateAsync({
        id: propertyId,
        valuation: transformedData,
      } as any)

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error updating valuation:', error)
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to update valuation. Please try again.',
      })
    }
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Property Valuation"
      subtitle="CURRENT VALUE & ASSESSMENT"
      width="lg"
      footer={
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={updateProperty.isPending}
            className="flex-1 py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] border transition-all hover:bg-slate-500/5 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/10 dark:text-white border-slate-200 text-slate-900"
          >
            Cancel
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
        {/* Current Value Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Current Value" color="violet" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                type="text"
                variant="rounded"
                label="Current Value ($)"
                value={formData.currentValue}
                onChange={(e) => handleChange('currentValue', e.target.value)}
                placeholder="0"
                error={errors.currentValue}
                required
              />
            </div>
            <div>
              <Select
                variant="rounded"
                label="Value Source"
                value={formData.currentValueSource}
                onChange={(e) =>
                  handleChange('currentValueSource', e.target.value)
                }
                error={errors.currentValueSource}
              >
                <option value="">Select source</option>
                <option value="estimate">Estimate</option>
                <option value="manual">Manual</option>
                <option value="appraisal">Appraisal</option>
                <option value="tax">Tax Assessment</option>
                <option value="purchase">Purchase Price</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              variant="rounded"
              label="Value Date"
              value={formData.currentValueDate}
              onChange={(e) => handleChange('currentValueDate', e.target.value)}
              error={errors.currentValueDate}
            />
          </div>
        </section>

        {/* Tax Assessment Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Tax Assessment" color="violet" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              variant="rounded"
              label="Tax Assessed Value ($)"
              value={formData.taxAssessedValue}
              onChange={(e) => handleChange('taxAssessedValue', e.target.value)}
              placeholder="0"
              error={errors.taxAssessedValue}
            />
            <Input
              type="text"
              variant="rounded"
              label="Tax Assessed Year"
              value={formData.taxAssessedYear}
              onChange={(e) => handleChange('taxAssessedYear', e.target.value)}
              placeholder="2024"
              error={errors.taxAssessedYear}
            />
          </div>
        </section>

        {/* Appraisal Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Appraisal Information" color="violet" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              variant="rounded"
              label="Last Appraisal Value ($)"
              value={formData.lastAppraisalValue}
              onChange={(e) =>
                handleChange('lastAppraisalValue', e.target.value)
              }
              placeholder="0"
              error={errors.lastAppraisalValue}
            />
            <Input
              type="date"
              variant="rounded"
              label="Last Appraisal Date"
              value={formData.lastAppraisalDate}
              onChange={(e) =>
                handleChange('lastAppraisalDate', e.target.value)
              }
              error={errors.lastAppraisalDate}
            />
          </div>
        </section>

        {/* Insurance Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Insurance" color="violet" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              variant="rounded"
              label="Insurance Replacement Value ($)"
              value={formData.insuranceReplacementValue}
              onChange={(e) =>
                handleChange('insuranceReplacementValue', e.target.value)
              }
              placeholder="0"
              error={errors.insuranceReplacementValue}
            />
          </div>
        </section>

        {/* Error Message */}
        {(errors.submit || updateProperty.error) && (
          <ErrorCard
            message={
              errors.submit ||
              (updateProperty.error instanceof Error
                ? updateProperty.error.message
                : 'Failed to save')
            }
          />
        )}
      </form>
    </Drawer>
  )
}
