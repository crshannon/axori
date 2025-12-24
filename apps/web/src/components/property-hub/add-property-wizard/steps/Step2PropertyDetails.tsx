import type { StepProps } from '../types'
import { FormLabel, StepperTitle, inputClass } from '../components'

export const Step2PropertyDetails = ({
  formData,
  setFormData,
}: StepProps) => {
  return (
    <div className="w-full max-w-3xl animate-in slide-in-from-right-8 duration-500">
      <StepperTitle
        title="Property Details"
        subtitle="Data auto-populated from public records"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <FormLabel>Property Type</FormLabel>
          <select
            value={formData.propType}
            onChange={(e) =>
              setFormData({ ...formData, propType: e.target.value })
            }
            className={inputClass}
          >
            <option>Single Family</option>
            <option>Multi-Family</option>
            <option>Condo</option>
            <option>Townhouse</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <FormLabel>Beds</FormLabel>
            <input
              type="number"
              value={formData.beds}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  beds: parseInt(e.target.value),
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <FormLabel>Baths</FormLabel>
            <input
              type="number"
              value={formData.baths}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  baths: parseFloat(e.target.value),
                })
              }
              step="0.5"
              className={inputClass}
            />
          </div>
        </div>
        <div className="space-y-1">
          <FormLabel>Square Footage</FormLabel>
          <input
            type="text"
            value={formData.sqft}
            onChange={(e) =>
              setFormData({
                ...formData,
                sqft: parseInt(e.target.value.replace(/,/g, '')),
              })
            }
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <FormLabel>Year Built</FormLabel>
          <input
            type="number"
            value={formData.yearBuilt}
            onChange={(e) =>
              setFormData({
                ...formData,
                yearBuilt: parseInt(e.target.value),
              })
            }
            className={inputClass}
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <FormLabel>Lot Size (Sq Ft)</FormLabel>
          <input
            type="text"
            value={formData.lotSize}
            onChange={(e) =>
              setFormData({
                ...formData,
                lotSize: parseInt(e.target.value.replace(/,/g, '')),
              })
            }
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )
}

