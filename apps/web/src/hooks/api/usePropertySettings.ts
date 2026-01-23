import { useCallback, useEffect, useState } from 'react'
import { propertyTypeValueToDatabaseFormat } from '@axori/shared'
import { useProperty, useUpdateProperty } from './useProperties'
import type { PropertyInsert } from '@axori/shared'

/**
 * Property Settings form state interface
 *
 * NOTE: This is a form-specific interface that combines data from multiple
 * database tables (properties, propertyCharacteristics, propertyAcquisition,
 * propertyOperatingExpenses) and includes display formatting. This manual
 * interface is acceptable because:
 * 1. It combines data from multiple sources
 * 2. It includes display formatting (e.g., formatted currency strings)
 * 3. It includes UI-only fields (e.g., notifications)
 *
 * For database types, always use inferred types from @axori/db.
 */
export interface PropertySettingsFormData {
  // Basic Info
  nickname: string
  propertyType: string

  // Address
  address: string
  city: string
  state: string
  zipCode: string

  // Tax & Currency
  taxJurisdiction: string
  currencyOverride: string

  // Acquisition Metadata
  purchasePrice: string
  closingDate: string
  yearBuilt: string

  // Asset DNA
  investmentStrategy: string

  // Calculation Presumptions
  vacancyRate: string
  maintenanceRate: string
  expenseInflation: string
  capexSinking: string

  // Notifications
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
  }
}

/**
 * Default form values
 */
const DEFAULT_FORM_DATA: PropertySettingsFormData = {
  nickname: '',
  propertyType: 'single-family',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  taxJurisdiction: '',
  currencyOverride: 'Portfolio Default (USD)',
  purchasePrice: '',
  closingDate: '',
  yearBuilt: '',
  investmentStrategy: 'yield-maximization',
  vacancyRate: '5.0',
  maintenanceRate: '8.0',
  expenseInflation: '3.0',
  capexSinking: '5.0',
  notifications: {
    email: true,
    sms: false,
    push: true,
  },
}

/**
 * Parse rate value (convert decimal to percentage display)
 */
function parseRate(value: string | null | undefined, defaultValue = ''): string {
  if (value === null || value === undefined) return defaultValue
  const num = parseFloat(value)
  if (isNaN(num)) return defaultValue
  // If stored as decimal (0.05), convert to percentage string (5.0)
  if (num < 1) {
    return (num * 100).toFixed(1)
  }
  return num.toFixed(1)
}

/**
 * Format rate for API (convert percentage to decimal)
 */
function formatRateForApi(value: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return '0'
  // Convert percentage to decimal for storage
  return (num / 100).toString()
}

/**
 * Hook for managing property settings form state
 * Provides form data, handlers, and save functionality
 */
export function usePropertySettings(propertyId: string | null | undefined) {
  // Fetch property data
  const {
    data: property,
    isLoading: isLoadingProperty,
    error: propertyError,
  } = useProperty(propertyId)

  // Update mutation
  const updateMutation = useUpdateProperty()

  // Form state
  const [formData, setFormData] = useState<PropertySettingsFormData>(DEFAULT_FORM_DATA)
  const [isDirty, setIsDirty] = useState(false)
  const [initialFormData, setInitialFormData] = useState<PropertySettingsFormData>(DEFAULT_FORM_DATA)

  // Populate form data when property loads
  useEffect(() => {
    if (property) {
      const newFormData: PropertySettingsFormData = {
        // Basic Info
        nickname: property.fullAddress || property.address || '',
        propertyType: property.characteristics?.propertyType?.toLowerCase().replace(/\s+/g, '-') || 'single-family',

        // Address
        address: property.address || '',
        city: property.city || '',
        state: property.state || '',
        zipCode: property.zipCode || '',

        // Tax & Currency (not in current schema, using defaults)
        taxJurisdiction: '',
        currencyOverride: 'Portfolio Default (USD)',

        // Acquisition Metadata
        purchasePrice: property.acquisition?.purchasePrice
          ? `$${Number(property.acquisition.purchasePrice).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
          : '',
        closingDate: property.acquisition?.purchaseDate || '',
        yearBuilt: property.characteristics?.yearBuilt?.toString() || '',

        // Asset DNA
        investmentStrategy: 'yield-maximization',

        // Calculation Presumptions
        vacancyRate: parseRate(property.operatingExpenses?.vacancyRate, '5.0'),
        maintenanceRate: parseRate(property.operatingExpenses?.maintenanceRate, '8.0'),
        expenseInflation: '3.0', // Not in current schema
        capexSinking: parseRate(property.operatingExpenses?.capexRate, '5.0'),

        // Notifications (not in current schema, using defaults)
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
      }

      setFormData(newFormData)
      setInitialFormData(newFormData)
      setIsDirty(false)
    }
  }, [property])

  // Update a single field
  const updateField = useCallback((
    field: keyof Omit<PropertySettingsFormData, 'notifications'>,
    value: string
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      return updated
    })
    setIsDirty(true)
  }, [])

  // Update notification setting
  const updateNotification = useCallback((
    notifType: keyof PropertySettingsFormData['notifications'],
    value: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [notifType]: value,
      },
    }))
    setIsDirty(true)
  }, [])

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setFormData(initialFormData)
    setIsDirty(false)
  }, [initialFormData])

  // Save form data to API
  // Accepts optional formData parameter to avoid closure stale data issue
  // When drawers update fields and immediately save, they can pass the updated data directly
  const saveSettings = useCallback(async (overrideFormData?: Partial<PropertySettingsFormData>) => {
    if (!propertyId) {
      throw new Error('Property ID is required')
    }

    // Use override data if provided, otherwise fall back to current formData
    // This allows drawers to pass their local form state directly, avoiding
    // the React state update batching issue where saveSettings reads stale closure data
    const dataToSave = overrideFormData
      ? { ...formData, ...overrideFormData }
      : formData

    // Parse purchase price (remove $ and commas)
    const purchasePriceRaw = dataToSave.purchasePrice.replace(/[$,]/g, '')
    const purchasePrice = purchasePriceRaw ? parseFloat(purchasePriceRaw) : undefined

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      id: propertyId,
      // Core property fields
      nickname: dataToSave.nickname,
      address: dataToSave.address,
      city: dataToSave.city,
      state: dataToSave.state,
      zipCode: dataToSave.zipCode,
    }

    // Characteristics
    const characteristics: Record<string, unknown> = {}
    if (dataToSave.propertyType) {
      // Convert type to database format using centralized function
      characteristics.propertyType = propertyTypeValueToDatabaseFormat(dataToSave.propertyType)
    }
    if (dataToSave.yearBuilt) {
      characteristics.yearBuilt = parseInt(dataToSave.yearBuilt, 10)
    }
    if (Object.keys(characteristics).length > 0) {
      updatePayload.characteristics = characteristics
    }

    // Acquisition
    const acquisition: Record<string, unknown> = {}
    if (purchasePrice) {
      acquisition.purchasePrice = purchasePrice
    }
    if (dataToSave.closingDate) {
      acquisition.purchaseDate = dataToSave.closingDate
    }
    if (Object.keys(acquisition).length > 0) {
      updatePayload.acquisition = acquisition
    }

    // Operating Expenses (calculation presumptions)
    const operatingExpenses: Record<string, unknown> = {}
    if (dataToSave.vacancyRate) {
      operatingExpenses.vacancyRate = formatRateForApi(dataToSave.vacancyRate)
    }
    if (dataToSave.maintenanceRate) {
      operatingExpenses.maintenanceRate = formatRateForApi(dataToSave.maintenanceRate)
    }
    if (dataToSave.capexSinking) {
      operatingExpenses.capexRate = formatRateForApi(dataToSave.capexSinking)
    }
    if (Object.keys(operatingExpenses).length > 0) {
      updatePayload.operatingExpenses = operatingExpenses
    }

    // Execute update
    // Note: updatePayload is typed as Record<string, unknown> to allow nested objects
    // The API expects a partial PropertyInsert with nested characteristics, acquisition, etc.
    await updateMutation.mutateAsync(updatePayload as Partial<PropertyInsert> & { id: string })

    // Update form state with saved data
    const finalFormData = overrideFormData ? dataToSave : formData
    setFormData(finalFormData)
    setInitialFormData(finalFormData)
    setIsDirty(false)
  }, [propertyId, formData, updateMutation])

  // Computed values
  const isLoading = isLoadingProperty
  const isSaving = updateMutation.isPending
  const saveError = updateMutation.error
  const hasError = !!propertyError || !!saveError

  return {
    // Data
    formData,
    property,

    // State
    isLoading,
    isSaving,
    isDirty,
    hasError,
    propertyError,
    saveError,

    // Actions
    updateField,
    updateNotification,
    resetForm,
    saveSettings,
  }
}

export type UsePropertySettingsReturn = ReturnType<typeof usePropertySettings>
