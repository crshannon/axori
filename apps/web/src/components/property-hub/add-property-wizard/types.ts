import type { Dispatch, SetStateAction } from 'react'

export interface PropertyFormData {
  address: string
  city: string
  state: string
  zip: string
  propType: string
  beds: number
  baths: number
  sqft: number
  yearBuilt: number
  lotSize: number
  purchaseDate: string
  purchasePrice: string
  closingCosts: string
  currentValue: string
  entityType: string
  entityName: string
  financeType: 'Cash' | 'Mortgage'
  loanType: string
  loanAmount: string
  interestRate: string
  loanTerm: string
  provider: string
  isRented: string
  rentAmount: string
  leaseEnd: string
  tenantName: string
  mgmtType: 'Self-Managed' | 'Property Manager'
  pmCompany: string
  strategy: string
}

export interface StepProps {
  formData: PropertyFormData
  setFormData: Dispatch<SetStateAction<PropertyFormData>>
  formatCurrency: (val: string) => string
  calculatePI?: () => string
}

