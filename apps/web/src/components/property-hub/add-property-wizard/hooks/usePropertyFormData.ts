import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { PropertyFormData } from '../types'
import { apiFetch } from '@/lib/api/client'

interface RentcastData {
  bedrooms?: number
  bathrooms?: number
  squareFootage?: number
  lotSize?: number
  yearBuilt?: number
  propertyType?: string
}

interface UsePropertyFormDataProps {
  propertyId: string | null
  userId: string | null
  step: number
  existingProperty?: any
  existingPropertyId?: string
}

export const usePropertyFormData = ({
  propertyId,
  userId,
  step,
  existingProperty,
  existingPropertyId,
}: UsePropertyFormDataProps) => {
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<PropertyFormData>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: 'Single Family',
    beds: 3,
    baths: 2,
    sqft: 0,
    yearBuilt: 2010,
    lotSize: 5000,
    purchaseDate: '',
    purchasePrice: '',
    closingCosts: '',
    currentValue: '450,000',
    entityType: 'Personal',
    entityName: '',
    financeType: 'Mortgage',
    loanType: 'conventional', // Use lowercase enum value
    loanAmount: '',
    interestRate: '6.5',
    loanTerm: '30',
    provider: '',
    isRented: 'Yes',
    rentAmount: '2,500',
    leaseStart: '',
    leaseEnd: '',
    tenantName: '',
    mgmtType: 'Self-Managed',
    pmCompany: '',
    strategy: '',
  })

  const [rentcastData, setRentcastData] = useState<RentcastData | null>(null)
  const [addressSuggestions, setAddressSuggestions] = useState<Array<string>>(
    [],
  )
  const [isAddressSelected, setIsAddressSelected] = useState(false)

  // Load property data into form if resuming an existing property
  useEffect(() => {
    if (existingProperty && existingPropertyId) {
      // Extract nested data from normalized tables
      const characteristics = existingProperty.characteristics
      const valuation = existingProperty.valuation
      const acquisition = existingProperty.acquisition
      const rentalIncome = existingProperty.rentalIncome
      const operatingExpenses = existingProperty.operatingExpenses
      const management = existingProperty.management
      const activeLoan = existingProperty.loans?.[0] || null // Get first active loan from array

      setFormData((prev) => ({
        ...prev,
        // Core address fields from property table
        address: existingProperty.address || '',
        city: existingProperty.city || '',
        state: existingProperty.state || '',
        zipCode: existingProperty.zipCode || '',
        propertyType: existingProperty.propertyType || characteristics?.propertyType || 'Single Family',
        latitude: existingProperty.latitude
          ? parseFloat(existingProperty.latitude)
          : null,
        longitude: existingProperty.longitude
          ? parseFloat(existingProperty.longitude)
          : null,
        mapboxPlaceId: existingProperty.mapboxPlaceId || null,
        fullAddress: existingProperty.fullAddress || null,

        // Step 2: Physical characteristics
        beds: characteristics?.bedrooms ?? prev.beds,
        baths: characteristics?.bathrooms ?? prev.baths,
        sqft: characteristics?.squareFeet ?? prev.sqft,
        yearBuilt: characteristics?.yearBuilt ?? prev.yearBuilt,
        lotSize: characteristics?.lotSize ?? prev.lotSize,

        // Step 2: Valuation data
        purchasePrice: valuation?.purchasePrice?.toString() ?? prev.purchasePrice,
        currentValue: valuation?.currentMarketValue?.toString() ?? prev.currentValue,

        // Step 3: Acquisition data
        purchaseDate: acquisition?.purchaseDate ?? prev.purchaseDate,
        closingCosts: acquisition?.closingCosts?.toString() ?? prev.closingCosts,
        entityType: acquisition?.entityType ?? prev.entityType,
        entityName: acquisition?.entityName ?? prev.entityName,

        // Step 4: Loan data
        loanType: activeLoan?.loanType ?? prev.loanType,
        loanAmount: activeLoan?.loanAmount?.toString() ?? prev.loanAmount,
        interestRate: activeLoan?.interestRate?.toString() ?? prev.interestRate,
        loanTerm: activeLoan?.loanTerm?.toString() ?? prev.loanTerm,
        provider: activeLoan?.lenderName ?? prev.provider,
        financeType: activeLoan ? (activeLoan.loanType === 'cash' ? 'Cash' : 'Mortgage') : prev.financeType,

        // Step 5: Rental income
        isRented: rentalIncome?.rentSource === 'lease' ? 'Yes' : 'No',
        rentAmount: rentalIncome?.monthlyRent?.toString() ?? prev.rentAmount,
        leaseStart: rentalIncome?.leaseStartDate ?? prev.leaseStart,
        leaseEnd: rentalIncome?.leaseEndDate ?? prev.leaseEnd,

        // Step 5: Management (from property_management table)
        mgmtType: management?.isSelfManaged ? 'Self-Managed' : management?.companyName ? 'Property Manager' : prev.mgmtType,
        pmCompany: management?.companyName ?? prev.pmCompany,
      }))
      setIsAddressSelected(!!existingProperty.address)
    }
  }, [existingProperty, existingPropertyId])

  // Fetch and populate Rentcast data for steps > 1
  // NOTE: Only populate if user hasn't manually changed the values
  useEffect(() => {
    console.log('step', step)
    console.log('rentcastData', rentcastData, propertyId, userId)

    // If we're past step 1 and don't have rentcast data, fetch it
    if (step !== 1 && !rentcastData && propertyId && userId) {
      console.log('Step loaded without rentcast data, fetching...')

      queryClient
        .fetchQuery({
          queryKey: ['properties', propertyId, 'rentcast'],
          queryFn: async () => {
            return apiFetch<{
              data: any
              transformed?: any
              cached: boolean
              fetchedAt: string
            }>(`/api/properties/${propertyId}/rentcast-data`, {
              clerkId: userId,
            })
          },
        })
        .then((response) => {
          console.log('Fetched Rentcast data:', response)
          if (response.transformed?.propertyData) {
            setRentcastData(response.transformed.propertyData)
          } else if (response.transformed) {
            setRentcastData(response.transformed)
          }
        })
        .catch((error) => {
          console.error('Error fetching Rentcast data:', error)
        })
    }

    // If we have rentcast data, populate the form (for all steps except step 1)
    // ONLY populate if the form still has default values (user hasn't changed them)
    if (step > 1 && rentcastData) {
      console.log(
        `Step ${step} loaded, populating form with Rentcast data:`,
        rentcastData,
      )
      setFormData((prev) => {
        // Only use Rentcast data if form field is still at default value
        // This prevents overwriting user's manual changes on refresh
        const shouldUseBeds = prev.beds === 3 // Default value
        const shouldUseBaths = prev.baths === 2 // Default value
        const shouldUseSqft = prev.sqft === 0 // Default value
        const shouldUseLotSize = prev.lotSize === 5000 // Default value
        const shouldUseYearBuilt = prev.yearBuilt === 2010 // Default value
        const shouldUsePropertyType = prev.propertyType === 'Single Family' // Default value

        return {
          ...prev,
          beds: shouldUseBeds && rentcastData.bedrooms ? rentcastData.bedrooms : prev.beds,
          baths: shouldUseBaths && rentcastData.bathrooms ? rentcastData.bathrooms : prev.baths,
          sqft: shouldUseSqft && rentcastData.squareFootage ? rentcastData.squareFootage : prev.sqft,
          lotSize: shouldUseLotSize && rentcastData.lotSize ? rentcastData.lotSize : prev.lotSize,
          yearBuilt: shouldUseYearBuilt && rentcastData.yearBuilt ? rentcastData.yearBuilt : prev.yearBuilt,
          propertyType: shouldUsePropertyType && rentcastData.propertyType ? rentcastData.propertyType : prev.propertyType,
        }
      })
    }
  }, [step, rentcastData, propertyId, userId, queryClient])

  // Handle address selection from Mapbox
  const handleAddressSelected = useCallback(
    (addressData: {
      address: string
      city: string
      state: string
      zipCode: string
      latitude: number | null
      longitude: number | null
      mapboxPlaceId: string
      fullAddress: string
      rawMapboxFeature: any
    }) => {
      setFormData((prev) => ({
        ...prev,
        mapboxRawData: addressData.rawMapboxFeature,
      }))
    },
    [],
  )

  // Fetch Rentcast data after Step 1
  const fetchRentcastData = useCallback(
    async (targetPropertyId: string) => {
      if (!userId) return null

      try {
        const rentcastResponse = await queryClient.fetchQuery({
          queryKey: ['properties', targetPropertyId, 'rentcast'],
          queryFn: async () => {
            return apiFetch<{
              data: any
              transformed?: {
                propertyData: {
                  bedrooms?: number
                  bathrooms?: number
                  squareFootage?: number
                  lotSize?: number
                  yearBuilt?: number
                  propertyType?: string
                }
              }
              cached: boolean
              fetchedAt: string
            }>(`/api/properties/${propertyId}/rentcast-data`, {
              clerkId: userId,
            })
          },
        })

        console.log('Rentcast Response:', rentcastResponse)
        console.log('Has transformed?', !!rentcastResponse.transformed)
        console.log('Response keys:', Object.keys(rentcastResponse))

        // Store Rentcast data for later use in Step 2+
        if (rentcastResponse.transformed?.propertyData) {
          const { propertyData } = rentcastResponse.transformed
          console.log('Storing Rentcast property data:', propertyData)
          setRentcastData(propertyData)
          return propertyData
        } else if (rentcastResponse.transformed) {
          console.log(
            'Storing transformed data directly:',
            rentcastResponse.transformed,
          )
          setRentcastData(rentcastResponse.transformed as any)
          return rentcastResponse.transformed
        } else {
          console.log('No transformed property data found in response')
          console.log(
            'Full response structure:',
            JSON.stringify(rentcastResponse, null, 2),
          )
          return null
        }
      } catch (error) {
        console.error('Error fetching Rentcast data:', error)
        return null
      }
    },
    [userId, queryClient],
  )

  // Reset form for new property
  const resetForm = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      address: '',
      city: '',
      state: '',
      zipCode: '',
      strategy: '',
      latitude: null,
      longitude: null,
      mapboxPlaceId: null,
      fullAddress: null,
      mapboxRawData: null,
    }))
    setIsAddressSelected(false)
    setRentcastData(null)
  }, [])

  const formatCurrency = useCallback((val: string) => {
    const numeric = val.replace(/\D/g, '')
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }, [])

  return {
    formData,
    setFormData,
    rentcastData,
    addressSuggestions,
    setAddressSuggestions,
    isAddressSelected,
    setIsAddressSelected,
    handleAddressSelected,
    fetchRentcastData,
    resetForm,
    formatCurrency,
  }
}

