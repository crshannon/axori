import { useEffect, useState } from 'react'
import { Drawer, ErrorCard, Input, Select } from '@axori/ui'
import { transformFormData } from '@axori/shared'
import { DrawerSectionTitle } from './DrawerSectionTitle'
import { useProperty, useUpdateProperty } from '@/hooks/api/useProperties'

interface RentalIncomeDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  onSuccess?: () => void
}

export const RentalIncomeDrawer = ({
  isOpen,
  onClose,
  propertyId,
  onSuccess,
}: RentalIncomeDrawerProps) => {
  const updateProperty = useUpdateProperty()
  const { data: property } = useProperty(propertyId)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const rentalIncome = property?.rentalIncome

  // Form state
  const [formData, setFormData] = useState({
    monthlyRent: '',
    rentSource: '',
    marketRentEstimate: '',
    leaseStartDate: '',
    leaseEndDate: '',
    otherIncomeMonthly: '',
    parkingIncomeMonthly: '',
    laundryIncomeMonthly: '',
    petRentMonthly: '',
    storageIncomeMonthly: '',
    utilityReimbursementMonthly: '',
  })

  // Populate form with existing rental income data
  useEffect(() => {
    if (rentalIncome && isOpen) {
      setFormData({
        monthlyRent: rentalIncome.monthlyRent || '',
        rentSource: rentalIncome.rentSource || '',
        marketRentEstimate: rentalIncome.marketRentEstimate || '',
        leaseStartDate: rentalIncome.leaseStartDate || '',
        leaseEndDate: rentalIncome.leaseEndDate || '',
        otherIncomeMonthly: rentalIncome.otherIncomeMonthly || '',
        parkingIncomeMonthly: rentalIncome.parkingIncomeMonthly || '',
        laundryIncomeMonthly: rentalIncome.laundryIncomeMonthly || '',
        petRentMonthly: rentalIncome.petRentMonthly || '',
        storageIncomeMonthly: rentalIncome.storageIncomeMonthly || '',
        utilityReimbursementMonthly:
          rentalIncome.utilityReimbursementMonthly || '',
      })
    } else if (isOpen) {
      // Reset form when opening
      setFormData({
        monthlyRent: '',
        rentSource: '',
        marketRentEstimate: '',
        leaseStartDate: '',
        leaseEndDate: '',
        otherIncomeMonthly: '',
        parkingIncomeMonthly: '',
        laundryIncomeMonthly: '',
        petRentMonthly: '',
        storageIncomeMonthly: '',
        utilityReimbursementMonthly: '',
      })
    }
  }, [rentalIncome, isOpen])

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
    if (!formData.monthlyRent || Number(formData.monthlyRent) <= 0) {
      validationErrors.monthlyRent = 'Monthly rent is required and must be greater than 0'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      // Transform form data - convert numeric fields and exclude empty values
      const transformedData = transformFormData(
        {
          monthlyRent: formData.monthlyRent,
          rentSource: formData.rentSource,
          marketRentEstimate: formData.marketRentEstimate,
          leaseStartDate: formData.leaseStartDate,
          leaseEndDate: formData.leaseEndDate,
          otherIncomeMonthly: formData.otherIncomeMonthly,
          parkingIncomeMonthly: formData.parkingIncomeMonthly,
          laundryIncomeMonthly: formData.laundryIncomeMonthly,
          petRentMonthly: formData.petRentMonthly,
          storageIncomeMonthly: formData.storageIncomeMonthly,
          utilityReimbursementMonthly: formData.utilityReimbursementMonthly,
        },
        {
          numericFields: [
            'monthlyRent',
            'marketRentEstimate',
            'otherIncomeMonthly',
            'parkingIncomeMonthly',
            'laundryIncomeMonthly',
            'petRentMonthly',
            'storageIncomeMonthly',
            'utilityReimbursementMonthly',
          ],
          dateFields: ['leaseStartDate', 'leaseEndDate'],
          excludeEmpty: true,
        },
      )

      // Ensure monthlyRent is always included (required field)
      if (!transformedData.monthlyRent) {
        transformedData.monthlyRent = formData.monthlyRent
      }

      await updateProperty.mutateAsync({
        id: propertyId,
        rentalIncome: transformedData,
      } as any)

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error updating rental income:', error)
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to update rental income. Please try again.',
      })
    }
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Rental Income"
      subtitle="REVENUE SOURCES"
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
        {/* Primary Rent Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Primary Rent" color="violet" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                type="text"
                variant="rounded"
                label="Monthly Rent ($)"
                value={formData.monthlyRent}
                onChange={(e) => handleChange('monthlyRent', e.target.value)}
                placeholder="0"
                error={errors.monthlyRent}
                required
              />
            </div>
            <div>
              <Select
                variant="rounded"
                label="Rent Source"
                value={formData.rentSource}
                onChange={(e) => handleChange('rentSource', e.target.value)}
                error={errors.rentSource}
              >
                <option value="">Select source</option>
                <option value="lease">Lease</option>
                <option value="estimate">Estimate</option>
                <option value="manual">Manual</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              variant="rounded"
              label="Market Rent Estimate ($)"
              value={formData.marketRentEstimate}
              onChange={(e) =>
                handleChange('marketRentEstimate', e.target.value)
              }
              placeholder="0"
              error={errors.marketRentEstimate}
            />
          </div>
        </section>

        {/* Lease Dates Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Lease Information" color="violet" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              variant="rounded"
              label="Lease Start Date"
              value={formData.leaseStartDate}
              onChange={(e) => handleChange('leaseStartDate', e.target.value)}
              error={errors.leaseStartDate}
            />
            <Input
              type="date"
              variant="rounded"
              label="Lease End Date"
              value={formData.leaseEndDate}
              onChange={(e) => handleChange('leaseEndDate', e.target.value)}
              error={errors.leaseEndDate}
            />
          </div>
        </section>

        {/* Other Income Sources Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Other Income Sources" color="violet" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              variant="rounded"
              label="Parking Income ($/month)"
              value={formData.parkingIncomeMonthly}
              onChange={(e) =>
                handleChange('parkingIncomeMonthly', e.target.value)
              }
              placeholder="0"
              error={errors.parkingIncomeMonthly}
            />
            <Input
              type="text"
              variant="rounded"
              label="Laundry Income ($/month)"
              value={formData.laundryIncomeMonthly}
              onChange={(e) =>
                handleChange('laundryIncomeMonthly', e.target.value)
              }
              placeholder="0"
              error={errors.laundryIncomeMonthly}
            />
            <Input
              type="text"
              variant="rounded"
              label="Pet Rent ($/month)"
              value={formData.petRentMonthly}
              onChange={(e) => handleChange('petRentMonthly', e.target.value)}
              placeholder="0"
              error={errors.petRentMonthly}
            />
            <Input
              type="text"
              variant="rounded"
              label="Storage Income ($/month)"
              value={formData.storageIncomeMonthly}
              onChange={(e) =>
                handleChange('storageIncomeMonthly', e.target.value)
              }
              placeholder="0"
              error={errors.storageIncomeMonthly}
            />
            <Input
              type="text"
              variant="rounded"
              label="Utility Reimbursement ($/month)"
              value={formData.utilityReimbursementMonthly}
              onChange={(e) =>
                handleChange('utilityReimbursementMonthly', e.target.value)
              }
              placeholder="0"
              error={errors.utilityReimbursementMonthly}
            />
            <Input
              type="text"
              variant="rounded"
              label="Other Income ($/month)"
              value={formData.otherIncomeMonthly}
              onChange={(e) =>
                handleChange('otherIncomeMonthly', e.target.value)
              }
              placeholder="0"
              error={errors.otherIncomeMonthly}
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
