import { useEffect, useState } from 'react'
import { Drawer, ErrorCard, Input, Select } from '@axori/ui'
import { CURRENCY_OPTIONS, PROPERTY_TYPE_OPTIONS } from '@axori/shared'
import { DrawerSectionTitle } from './DrawerSectionTitle'
import { usePropertySettings } from '@/hooks/api'

interface AssetConfigurationDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
}

export const AssetConfigurationDrawer = ({
  isOpen,
  onClose,
  propertyId,
}: AssetConfigurationDrawerProps) => {
  const {
    formData,
    updateField,
    saveSettings,
    isSaving,
    saveError,
  } = usePropertySettings(propertyId)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localFormData, setLocalFormData] = useState({
    nickname: '',
    propertyType: 'single-family',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    taxJurisdiction: '',
    currencyOverride: 'Portfolio Default (USD)',
  })

  // Sync local form data when drawer opens or formData changes
  useEffect(() => {
    if (isOpen) {
      setLocalFormData({
        nickname: formData.nickname,
        propertyType: formData.propertyType,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        taxJurisdiction: formData.taxJurisdiction,
        currencyOverride: formData.currencyOverride,
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

    // Validate required fields
    const validationErrors: Record<string, string> = {}
    if (!localFormData.address.trim()) {
      validationErrors.address = 'Address is required'
    }
    if (!localFormData.city.trim()) {
      validationErrors.city = 'City is required'
    }
    if (!localFormData.state.trim()) {
      validationErrors.state = 'State is required'
    }
    if (!localFormData.zipCode.trim()) {
      validationErrors.zipCode = 'Zip code is required'
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
      console.error('Error saving asset configuration:', error)
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to save asset configuration. Please try again.',
      })
    }
  }

  // Use centralized constants for property types and currency options
  const propertyTypes = PROPERTY_TYPE_OPTIONS
  const currencyOptions = CURRENCY_OPTIONS

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Asset Configuration"
      subtitle="PROPERTY DETAILS"
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
        {/* Basic Information Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Basic Information" color="violet" />
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                variant="rounded"
                label="Property Nickname"
                value={localFormData.nickname}
                onChange={(e) => handleChange('nickname', e.target.value)}
                placeholder="e.g., The Golden Goose"
                error={errors.nickname}
              />
            </div>

            <div>
              <Select
                variant="rounded"
                label="Property Type"
                value={localFormData.propertyType}
                onChange={(e) => handleChange('propertyType', e.target.value)}
                error={errors.propertyType}
              >
                {propertyTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </section>

        {/* Address Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Address" color="emerald" />
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                variant="rounded"
                label="Street Address"
                required
                value={localFormData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="123 Main St"
                error={errors.address}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Input
                  type="text"
                  variant="rounded"
                  label="City"
                  required
                  value={localFormData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Austin"
                  error={errors.city}
                />
              </div>

              <div>
                <Input
                  type="text"
                  variant="rounded"
                  label="State / Region"
                  required
                  value={localFormData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="TX"
                  error={errors.state}
                />
              </div>

              <div>
                <Input
                  type="text"
                  variant="rounded"
                  label="Zip Code"
                  required
                  value={localFormData.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  placeholder="78701"
                  error={errors.zipCode}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Tax & Currency Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Tax & Currency" color="indigo" />
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                variant="rounded"
                label="Tax Jurisdiction"
                value={localFormData.taxJurisdiction}
                onChange={(e) => handleChange('taxJurisdiction', e.target.value)}
                placeholder="e.g., Travis County CAD"
                error={errors.taxJurisdiction}
              />
            </div>

            <div>
              <Select
                variant="rounded"
                label="Currency Override"
                value={localFormData.currencyOverride}
                onChange={(e) => handleChange('currencyOverride', e.target.value)}
                error={errors.currencyOverride}
                disabled
              >
                {currencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                USD only supported in initial offering
              </p>
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
