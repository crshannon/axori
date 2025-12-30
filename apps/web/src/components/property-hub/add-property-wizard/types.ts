import type { Dispatch, SetStateAction } from 'react'

/**
 * Property form data structure for the add property wizard
 *
 * Note: This interface is for form collection only. When saving to the database:
 * - `portfolioId` and `addedBy` come from context (not user input)
 * - Field names align with database schema (zipCode, propertyType)
 * - Mapbox fields (latitude, longitude, etc.) are populated from Step1Address
 *
 * Additional fields (beds, baths, sqft, etc.) may be stored in:
 * - Related property_detail or property_financials tables
 * - Or will be added to the properties table schema later
 */
export interface PropertyFormData {
  // Address fields (aligned with schema)
  address: string
  city: string
  state: string
  zipCode: string // Changed from 'zip' to match schema

  // Mapbox geocoding fields (optional, populated from Step1Address)
  latitude?: number | null
  longitude?: number | null
  mapboxPlaceId?: string | null
  fullAddress?: string | null

  // Property type (aligned with schema)
  propertyType: string // Changed from 'propType' to match schema

  // Additional property details (may be stored in related tables)
  beds: number
  baths: number
  sqft: number
  yearBuilt: number
  lotSize: number

  // Financial information
  purchaseDate: string
  purchasePrice: string
  closingCosts: string
  currentValue: string

  // Ownership structure
  entityType: string
  entityName: string

  // Financing details
  financeType: 'Cash' | 'Mortgage'
  loanType: string
  loanAmount: string
  interestRate: string
  loanTerm: string
  provider: string

  // Rental information
  isRented: string
  rentAmount: string
  leaseEnd: string
  tenantName: string

  // Management details
  mgmtType: 'Self-Managed' | 'Property Manager'
  pmCompany: string

  // Investment strategy
  strategy: string
}

export interface StepProps {
  formData: PropertyFormData
  setFormData: Dispatch<SetStateAction<PropertyFormData>>
  formatCurrency: (val: string) => string
  calculatePI?: () => string
}

