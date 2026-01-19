import { Input, Select } from '@axori/ui'
import { FormLabel, StepperTitle } from '../components'
import type { StepProps } from '../types'

export const Step2PropertyDetails = ({ formData, setFormData }: StepProps) => {
  return (
    <div className="w-full animate-in slide-in-from-right-8 duration-500">
      <StepperTitle
        title="Property Details"
        subtitle="Data auto-populated from public records"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <FormLabel>Property Type</FormLabel>
          <Select
            variant="rounded"
            value={formData.propertyType}
            onChange={(e) =>
              setFormData({ ...formData, propertyType: e.target.value })
            }
          >
            <option>Single Family</option>
            <option>Multi-Family</option>
            <option>Condo</option>
            <option>Townhouse</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <FormLabel>Beds</FormLabel>
            <Input
              type="number"
              variant="rounded"
              value={formData.beds}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  beds: parseInt(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-1">
            <FormLabel>Baths</FormLabel>
            <Input
              type="number"
              variant="rounded"
              value={formData.baths}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  baths: parseFloat(e.target.value),
                })
              }
              step="0.5"
            />
          </div>
        </div>
        <div className="space-y-1">
          <FormLabel>Square Footage</FormLabel>
          <Input
            type="text"
            variant="rounded"
            value={formData.sqft}
            onChange={(e) =>
              setFormData({
                ...formData,
                sqft: parseInt(e.target.value.replace(/,/g, '')),
              })
            }
          />
        </div>
        <div className="space-y-1">
          <FormLabel>Year Built</FormLabel>
          <Input
            type="number"
            variant="rounded"
            value={formData.yearBuilt}
            onChange={(e) =>
              setFormData({
                ...formData,
                yearBuilt: parseInt(e.target.value),
              })
            }
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <FormLabel>Lot Size (Sq Ft)</FormLabel>
          <Input
            type="text"
            variant="rounded"
            value={formData.lotSize}
            onChange={(e) =>
              setFormData({
                ...formData,
                lotSize: parseInt(e.target.value.replace(/,/g, '')),
              })
            }
          />
        </div>
      </div>
    </div>
  )
}
