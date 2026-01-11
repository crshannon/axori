import { useCallback, useState } from 'react'
import type { PropertyFormData } from '../types'
import {
  useCompleteProperty,
  useCreateProperty,
  useProperty,
  useUpdateProperty,
} from '@/hooks/api'

interface UsePropertyPersistenceProps {
  existingPropertyId?: string
  userId: string | null
  portfolioId: string | null
}

export const usePropertyPersistence = ({
  existingPropertyId,
  userId,
  portfolioId,
}: UsePropertyPersistenceProps) => {
  const [propertyId, setPropertyId] = useState<string | null>(existingPropertyId || null)

  const { data: existingProperty } = useProperty(existingPropertyId || null)
  const createProperty = useCreateProperty()
  const updateProperty = useUpdateProperty()
  const completeProperty = useCompleteProperty()

  const isSaving = createProperty.isPending || updateProperty.isPending

  // Save or update property - accepts formData and isAddressSelected as parameters
  const saveProperty = useCallback(
    async (
      formData: PropertyFormData,
      isAddressSelected: boolean,
    ): Promise<string | null> => {
      if (!userId || !portfolioId || !isAddressSelected) return null

      // Structure data for normalized tables
      const saveData = {
        // Core property data
        portfolioId,
        userId, // Required for user isolation
        addedBy: userId,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        latitude: formData.latitude?.toString() || null,
        longitude: formData.longitude?.toString() || null,
        mapboxPlaceId: formData.mapboxPlaceId || null,
        fullAddress: formData.fullAddress || null,
        mapboxData: formData.mapboxRawData
          ? typeof formData.mapboxRawData === 'string'
            ? formData.mapboxRawData
            : JSON.stringify(formData.mapboxRawData)
          : null,

        // Normalized table data (Step 2: Physical characteristics)
        characteristics: {
        propertyType: formData.propertyType || null,
          bedrooms: formData.beds || null,
          bathrooms: formData.baths || null,
          squareFeet: formData.sqft || null,
          yearBuilt: formData.yearBuilt || null,
          lotSize: formData.lotSize || null,
        },

        // Valuation data (Step 2: Financial snapshot)
        valuation: {
          purchasePrice: formData.purchasePrice || null,
          currentMarketValue: formData.currentValue || null,
        },

        // Acquisition data (Step 3: Purchase info)
        acquisition: {
          purchaseDate: formData.purchaseDate || null,
          closingCosts: formData.closingCosts || null,
          entityType: formData.entityType || null,
          entityName: formData.entityName || null,
        },

        // Loan data (Step 4: Financing)
        loan: formData.loanAmount ? {
          loanType: formData.loanType || 'conventional',
          loanAmount: formData.loanAmount || null,
          interestRate: formData.interestRate || null,
          loanTerm: formData.loanTerm || null,
          lenderName: formData.provider || null,
          rateType: 'fixed' as const,
          status: 'active' as const,
          isPrimary: true,
        } : undefined,

        // Rental income data (Step 5: Revenue)
        rentalIncome: {
          isRented: formData.isRented === 'Yes',
          monthlyBaseRent: formData.rentAmount || null,
          leaseEndDate: formData.leaseEnd || null,
        },

        // Operating expenses (Step 5: Operations) - no management data here
        operatingExpenses: {},

        // Property management (Step 5: Management)
        management: {
          isSelfManaged: formData.mgmtType === 'Self-Managed',
          companyName: formData.mgmtType === 'Property Manager' ? formData.pmCompany || null : null,
        },
      }

      try {
        if (propertyId) {
          await updateProperty.mutateAsync({
            id: propertyId,
            ...saveData,
          })
          return propertyId
        } else {
          const result = await createProperty.mutateAsync(saveData)
          const newPropertyId = result.property.id
          setPropertyId(newPropertyId)
          return newPropertyId
        }
      } catch (error) {
        console.error('Error saving property:', error)
        return null
      }
    },
    [userId, portfolioId, propertyId, createProperty, updateProperty],
  )

  // Mark property as complete (final step) - accepts formData and isAddressSelected as parameters
  const completePropertyWizard = useCallback(
    async (
      formData: PropertyFormData,
      isAddressSelected: boolean,
    ): Promise<boolean> => {
      if (!userId || !portfolioId) {
        console.error('Missing user or portfolio')
        return false
      }

      // If no property exists, create one first
      let finalPropertyId = propertyId
      if (!finalPropertyId && isAddressSelected) {
        finalPropertyId = await saveProperty(formData, isAddressSelected)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (finalPropertyId) {
        try {
          // No need to update propertyType here - it's in characteristics table now
          await completeProperty.mutateAsync(finalPropertyId)
          return true
        } catch (error) {
          console.error('Error completing property:', error)
          return false
        }
      } else {
        console.error('No property to complete')
        return false
      }
    },
    [userId, portfolioId, propertyId, saveProperty, completeProperty],
  )

  return {
    propertyId,
    setPropertyId,
    existingProperty,
    isSaving,
    saveProperty,
    completePropertyWizard,
  }
}

