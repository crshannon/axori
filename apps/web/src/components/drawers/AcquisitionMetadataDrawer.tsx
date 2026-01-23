import { useEffect, useState } from 'react'
import { Drawer, ErrorCard, Input } from '@axori/ui'
import { DrawerSectionTitle } from './DrawerSectionTitle'
import { usePropertySettings } from '@/hooks/api'

interface AcquisitionMetadataDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
}

export const AcquisitionMetadataDrawer = ({
  isOpen,
  onClose,
  propertyId,
}: AcquisitionMetadataDrawerProps) => {
  const {
    formData,
    updateField,
    saveSettings,
    isSaving,
    saveError,
  } = usePropertySettings(propertyId)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localFormData, setLocalFormData] = useState({
    purchasePrice: '',
    closingDate: '',
    yearBuilt: '',
  })

  // Sync local form data when drawer opens or formData changes
  useEffect(() => {
    if (isOpen) {
      setLocalFormData({
        purchasePrice: formData.purchasePrice,
        closingDate: formData.closingDate,
        yearBuilt: formData.yearBuilt,
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

    // Validate year built if provided
    const validationErrors: Record<string, string> = {}
    if (localFormData.yearBuilt && isNaN(Number(localFormData.yearBuilt))) {
      validationErrors.yearBuilt = 'Year built must be a valid number'
    }
    if (
      localFormData.yearBuilt &&
      (Number(localFormData.yearBuilt) < 1800 ||
        Number(localFormData.yearBuilt) > new Date().getFullYear() + 1)
    ) {
      validationErrors.yearBuilt = 'Year built must be a valid year'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      // Update form data via hook (for UI state consistency)
      Object.entries(localFormData).forEach(([key, value]) => {
        updateField(key as keyof typeof localFormData, value)
      })

      // Save settings with local form data to avoid stale closure data
      // Pass localFormData directly to ensure we save the latest values
      await saveSettings(localFormData)

      onClose()
    } catch (error) {
      console.error('Error saving acquisition metadata:', error)
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to save acquisition metadata. Please try again.',
      })
    }
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Acquisition Metadata"
      subtitle="PURCHASE INFORMATION"
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
        {/* Acquisition Details Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Acquisition Details" color="violet" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                type="text"
                variant="rounded"
                label="Purchase Price ($)"
                value={localFormData.purchasePrice}
                onChange={(e) => handleChange('purchasePrice', e.target.value)}
                placeholder="$0"
                error={errors.purchasePrice}
              />
            </div>

            <div>
              <Input
                type="date"
                variant="rounded"
                label="Closing Date"
                value={localFormData.closingDate}
                onChange={(e) => handleChange('closingDate', e.target.value)}
                error={errors.closingDate}
              />
            </div>

            <div>
              <Input
                type="text"
                variant="rounded"
                label="Year Built"
                value={localFormData.yearBuilt}
                onChange={(e) => handleChange('yearBuilt', e.target.value)}
                placeholder="e.g., 2021"
                error={errors.yearBuilt}
              />
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
