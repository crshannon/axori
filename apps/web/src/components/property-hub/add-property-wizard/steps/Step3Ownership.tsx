import type { StepProps } from '../types'
import { FormLabel, StepperTitle, inputClass } from '../components'

export const Step3Ownership = ({ formData, setFormData, formatCurrency }: StepProps) => {
  return (
    <div className="w-full max-w-3xl animate-in slide-in-from-right-8 duration-500">
      <StepperTitle
        title="Ownership Details"
        subtitle="Define the purchase structure"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <FormLabel>Purchase Date</FormLabel>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  purchaseDate: e.target.value,
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <FormLabel>Purchase Price ($)</FormLabel>
            <input
              type="text"
              value={formData.purchasePrice}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  purchasePrice: formatCurrency(e.target.value),
                })
              }
              placeholder="0"
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <FormLabel>Closing Costs ($)</FormLabel>
            <input
              type="text"
              value={formData.closingCosts}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  closingCosts: formatCurrency(e.target.value),
                })
              }
              placeholder="0"
              className={inputClass}
            />
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-1">
            <FormLabel>Current Estimated Value ($)</FormLabel>
            <input
              type="text"
              value={formData.currentValue}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  currentValue: formatCurrency(e.target.value),
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <FormLabel>Ownership Entity</FormLabel>
            <select
              value={formData.entityType}
              onChange={(e) =>
                setFormData({ ...formData, entityType: e.target.value })
              }
              className={inputClass}
            >
              <option>Personal</option>
              <option>LLC</option>
              <option>Trust</option>
            </select>
          </div>
          {(formData.entityType === 'LLC' ||
            formData.entityType === 'Trust') && (
            <div className="space-y-1 animate-in slide-in-from-top-4 duration-300">
              <FormLabel>{formData.entityType} Name</FormLabel>
              <input
                type="text"
                value={formData.entityName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    entityName: e.target.value,
                  })
                }
                placeholder={`Enter ${formData.entityType} name...`}
                className={inputClass}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

