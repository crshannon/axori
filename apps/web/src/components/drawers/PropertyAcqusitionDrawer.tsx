import { useEffect, useState } from 'react'
import { Drawer, Input, Select } from '@axori/ui'
import { transformFormData } from '@axori/shared'
import { DrawerSectionTitle } from './DrawerSectionTitle'
import { useProperty, useUpdateProperty } from '@/hooks/api/useProperties'

interface PropertyAcquisitionDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  onSuccess?: () => void
}

const acquisitionMethods = [
  { value: 'traditional', label: 'Traditional' },
  { value: 'brrrr', label: 'BRRRR' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'auction', label: 'Auction' },
  { value: 'seller_finance', label: 'Seller Finance' },
  { value: 'subject_to', label: 'Subject To' },
  { value: '1031_exchange', label: '1031 Exchange' },
  { value: 'inherited', label: 'Inherited' },
  { value: 'gift', label: 'Gift' },
]

const downPaymentSources = [
  { value: 'savings', label: 'Savings' },
  { value: 'heloc', label: 'HELOC' },
  { value: 'gift', label: 'Gift' },
  { value: '401k', label: '401k' },
  { value: 'seller_second', label: 'Seller Second' },
  { value: 'other', label: 'Other' },
]

export const PropertyAcquisitionDrawer = ({
  isOpen,
  onClose,
  propertyId,
  onSuccess,
}: PropertyAcquisitionDrawerProps) => {
  const updateProperty = useUpdateProperty()
  const { data: property } = useProperty(propertyId)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const acquisition = property?.acquisition

  // Form state
  const [formData, setFormData] = useState({
    purchasePrice: '',
    purchaseDate: '',
    acquisitionMethod: '',
    closingCostsTotal: '',
    downPaymentAmount: '',
    downPaymentSource: '',
    earnestMoney: '',
    sellerCredits: '',
    buyerAgentCommission: '',
  })

  // Populate form with existing acquisition data
  useEffect(() => {
    if (acquisition && isOpen) {
      setFormData({
        purchasePrice: acquisition.purchasePrice?.toString() || '',
        purchaseDate: acquisition.purchaseDate || '',
        acquisitionMethod: (acquisition as any)?.acquisitionMethod || '',
        closingCostsTotal: acquisition.closingCosts?.toString() || '',
        downPaymentAmount:
          (acquisition as any)?.downPaymentAmount?.toString() || '',
        downPaymentSource: (acquisition as any)?.downPaymentSource || '',
        earnestMoney: (acquisition as any)?.earnestMoney?.toString() || '',
        sellerCredits: (acquisition as any)?.sellerCredits?.toString() || '',
        buyerAgentCommission:
          (acquisition as any)?.buyerAgentCommission?.toString() || '',
      })
    } else if (isOpen) {
      // Reset form when opening
      setFormData({
        purchasePrice: '',
        purchaseDate: '',
        acquisitionMethod: '',
        closingCostsTotal: '',
        downPaymentAmount: '',
        downPaymentSource: '',
        earnestMoney: '',
        sellerCredits: '',
        buyerAgentCommission: '',
      })
    }
  }, [acquisition, isOpen])

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
      // Prepare acquisition data - API expects this structure
      // Transform form data: convert numeric fields and exclude empty values
      const acquisitionData = transformFormData(
        {
          purchasePrice: formData.purchasePrice,
          purchaseDate: formData.purchaseDate,
          acquisitionMethod: formData.acquisitionMethod,
          closingCostsTotal: formData.closingCostsTotal,
          downPaymentAmount: formData.downPaymentAmount,
          downPaymentSource: formData.downPaymentSource,
          earnestMoney: formData.earnestMoney,
          sellerCredits: formData.sellerCredits,
          buyerAgentCommission: formData.buyerAgentCommission,
        },
        {
          numericFields: [
            'purchasePrice',
            'closingCostsTotal',
            'downPaymentAmount',
            'earnestMoney',
            'sellerCredits',
            'buyerAgentCommission',
          ],
          dateFields: ['purchaseDate'],
          excludeEmpty: true,
        },
      )

      await updateProperty.mutateAsync({
        id: propertyId,
        acquisition: acquisitionData,
      } as any)

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error updating acquisition data:', error)
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to update acquisition data. Please try again.',
      })
    }
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Purchase Details"
      subtitle="ACQUISITION INTEL"
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
        {/* Purchase Logistics Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Purchase Logistics" color="violet" />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              variant="rounded"
              label="Purchase Price"
              step="0.01"
              min="0"
              value={formData.purchasePrice}
              onChange={(e) => handleChange('purchasePrice', e.target.value)}
              placeholder="0.00"
              error={errors.purchasePrice}
            />
            <Input
              type="date"
              variant="rounded"
              label="Purchase Date"
              value={formData.purchaseDate}
              onChange={(e) => handleChange('purchaseDate', e.target.value)}
              error={errors.purchaseDate}
            />
            <div className="col-span-full">
              <Select
                variant="rounded"
                label="Acquisition Method"
                value={formData.acquisitionMethod}
                onChange={(e) =>
                  handleChange('acquisitionMethod', e.target.value)
                }
                error={errors.acquisitionMethod}
              >
                <option value="">Select method</option>
                {acquisitionMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </section>

        {/* Closing Ledger Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Closing Ledger" color="emerald" />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              variant="rounded"
              label="Down Payment"
              step="0.01"
              min="0"
              value={formData.downPaymentAmount}
              onChange={(e) =>
                handleChange('downPaymentAmount', e.target.value)
              }
              placeholder="0.00"
              error={errors.downPaymentAmount}
            />
            <Select
              variant="rounded"
              label="DP Funding Source"
              value={formData.downPaymentSource}
              onChange={(e) =>
                handleChange('downPaymentSource', e.target.value)
              }
              error={errors.downPaymentSource}
            >
              <option value="">Select source</option>
              {downPaymentSources.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              variant="rounded"
              label="Closing Costs Total"
              step="0.01"
              min="0"
              value={formData.closingCostsTotal}
              onChange={(e) =>
                handleChange('closingCostsTotal', e.target.value)
              }
              placeholder="0.00"
              error={errors.closingCostsTotal}
            />
            <Input
              type="number"
              variant="rounded"
              label="Earnest Money Deposit"
              step="0.01"
              min="0"
              value={formData.earnestMoney}
              onChange={(e) => handleChange('earnestMoney', e.target.value)}
              placeholder="0.00"
              error={errors.earnestMoney}
            />
            <Input
              type="number"
              variant="rounded"
              label="Seller Credits"
              step="0.01"
              min="0"
              value={formData.sellerCredits}
              onChange={(e) => handleChange('sellerCredits', e.target.value)}
              placeholder="0.00"
              error={errors.sellerCredits}
            />
            <Input
              type="number"
              variant="rounded"
              label="Buyer Agent Commission"
              step="0.01"
              min="0"
              value={formData.buyerAgentCommission}
              onChange={(e) =>
                handleChange('buyerAgentCommission', e.target.value)
              }
              placeholder="0.00"
              error={errors.buyerAgentCommission}
            />
          </div>
        </section>

        {/* Error Message */}
        {errors.submit && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6">
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              {errors.submit}
            </p>
          </div>
        )}
      </form>
    </Drawer>
  )
}
