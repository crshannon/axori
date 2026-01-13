import { Input, Select } from '@axori/ui'
import { FormLabel, StepperTitle } from '../components'
import type { StepProps } from '../types'

export const Step3Ownership = ({
  formData,
  setFormData,
  formatCurrency,
}: StepProps) => {
  return (
    <div className="w-full animate-in slide-in-from-right-8 duration-500">
      <StepperTitle
        title="Ownership Details"
        subtitle="Define the purchase structure"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <FormLabel>Purchase Date</FormLabel>
            <Input
              type="date"
              variant="rounded"
              value={formData.purchaseDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  purchaseDate: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-1">
            <FormLabel>Purchase Price ($)</FormLabel>
            <Input
              type="text"
              variant="rounded"
              value={formData.purchasePrice}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  purchasePrice: formatCurrency(e.target.value),
                })
              }
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <FormLabel>Closing Costs ($)</FormLabel>
            <Input
              type="text"
              variant="rounded"
              value={formData.closingCosts}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  closingCosts: formatCurrency(e.target.value),
                })
              }
              placeholder="0"
            />
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-1">
            <FormLabel>Current Estimated Value ($)</FormLabel>
            <Input
              type="text"
              variant="rounded"
              value={formData.currentValue}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  currentValue: formatCurrency(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-1">
            <FormLabel>Ownership Entity</FormLabel>
            <Select
              variant="rounded"
              value={formData.entityType}
              onChange={(e) =>
                setFormData({ ...formData, entityType: e.target.value })
              }
            >
              <option>Personal</option>
              <option>LLC</option>
              <option>Trust</option>
            </Select>
          </div>
          {(formData.entityType === 'LLC' ||
            formData.entityType === 'Trust') && (
            <div className="space-y-1 animate-in slide-in-from-top-4 duration-300">
              <FormLabel>{formData.entityType} Name</FormLabel>
              <Input
                type="text"
                variant="rounded"
                value={formData.entityName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    entityName: e.target.value,
                  })
                }
                placeholder={`Enter ${formData.entityType} name...`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
