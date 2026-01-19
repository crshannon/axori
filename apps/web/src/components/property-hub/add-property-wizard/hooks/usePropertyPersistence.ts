import { useCallback, useState } from 'react'
import type { PropertyFormData } from '../types'
import {
  useCompleteProperty,
  useCreateProperty,
  useProperty,
  useUpdateProperty,
} from '@/hooks/api'
import { calculateMonthlyPrincipalInterest } from '@/utils/finances'

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
        // Map closingCosts to closingCostsTotal and convert to number for API schema
        acquisition: {
          purchaseDate: formData.purchaseDate || null,
          closingCostsTotal: formData.closingCosts
            ? parseFloat(formData.closingCosts.replace(/,/g, '')) || null
            : null,
          // Note: entityType and entityName are not in propertyAcquisition schema
          // They may be stored elsewhere or added in a future phase
        },

        // Loan data (Step 4: Financing)
        // Only create loan if we have required fields (loanAmount, interestRate, loanTerm, provider)
        loan: formData.loanAmount && formData.loanAmount.trim() &&
              formData.interestRate && formData.interestRate.trim() &&
              formData.loanTerm && formData.loanTerm.trim() &&
              formData.provider && formData.provider.trim() ? (() => {
          const originalLoanAmount = parseFloat(formData.loanAmount.replace(/,/g, '')) || 0
          const interestRate = parseFloat(formData.interestRate) || 0 // percentage 0-100
          const termMonths = parseInt(formData.loanTerm) * 12

          // Calculate monthly P&I payment using shared utility
          const monthlyPrincipalInterest = calculateMonthlyPrincipalInterest(
            originalLoanAmount,
            interestRate,
            termMonths,
          )

          return {
            loanType: (formData.loanType || 'conventional').toLowerCase(),
            originalLoanAmount,
            interestRate, // percentage as number (0-100)
            termMonths,
            currentBalance: originalLoanAmount, // Default to original amount for new loans
            lenderName: formData.provider.trim(),
            // Status and position (explicit defaults)
            status: 'active' as const,
            isPrimary: true,
            loanPosition: 1, // First loan for this property
            // Calculated payment fields
            monthlyPrincipalInterest, // Store calculated P&I
            totalMonthlyPayment: monthlyPrincipalInterest, // For new loans: P&I = total (no escrow/PMI yet)
            // Explicit defaults for clarity (database has defaults, but explicit is better)
            monthlyEscrow: 0,
            monthlyPmi: 0,
            monthlyMip: 0,
            paymentDueDay: 1,
          }
        })() : undefined,

        // Rental income data (Step 5: Revenue)
        // Convert rentAmount from comma-formatted string to numeric string for database
        rentalIncome: {
          monthlyRent: formData.rentAmount
            ? formData.rentAmount.replace(/,/g, '') // Remove commas for numeric database column
            : null,
          rentSource: formData.isRented === 'Yes' ? 'lease' : 'estimate',
          leaseStartDate: formData.leaseStart || null, // Lease start date
          leaseEndDate: formData.leaseEnd || null, // Lease expiration date
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
          // For updates, send all fields - the API route will destructure out normalized fields
          // The propertyUpdateSchema only validates core property fields after destructuring
          const updatePayload = {
            id: propertyId,
            // Core property fields (validated by propertyUpdateSchema after destructuring)
            address: saveData.address,
            city: saveData.city,
            state: saveData.state,
            zipCode: saveData.zipCode,
            latitude: saveData.latitude,
            longitude: saveData.longitude,
            mapboxPlaceId: saveData.mapboxPlaceId,
            fullAddress: saveData.fullAddress,
            // Normalized fields (destructured out by API route before propertyUpdateSchema validation)
            characteristics: saveData.characteristics,
            valuation: saveData.valuation,
            acquisition: saveData.acquisition,
            loan: saveData.loan,
            rentalIncome: saveData.rentalIncome,
            operatingExpenses: saveData.operatingExpenses,
            management: saveData.management,
          }
          await updateProperty.mutateAsync(updatePayload)
          return propertyId
        } else {
          const result = await createProperty.mutateAsync(saveData)
          const newPropertyId = result.property.id
          setPropertyId(newPropertyId)
          return newPropertyId
        }
      } catch (error: unknown) {
        // Error details are included in the error message from apiFetch
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

