import type { Property } from '@/hooks/api/useProperties'

export interface MissingField {
  label: string
  route: string
  category: string
}

export interface PropertyCompleteness {
  score: number // 0-100
  completeness: number // 0-100 percentage
  missingFields: Array<MissingField>
  fidelityLevel: 'low' | 'medium' | 'high'
}

/**
 * Calculate property data completeness and identify missing fields
 * @param property - Property object with nested data
 * @param propertyId - Property ID for generating routes
 * @returns Completeness data with score, percentage, missing fields, and fidelity level
 */
export function usePropertyCompleteness(
  property: Property | undefined | null,
  propertyId?: string,
): PropertyCompleteness {
  if (!property || !propertyId) {
    return {
      score: 0,
      completeness: 0,
      missingFields: [],
      fidelityLevel: 'low',
    }
  }

  const getRoute = (pathSegment: string) => {
    return pathSegment
      ? `/property-hub/${propertyId}/${pathSegment}`
      : `/property-hub/${propertyId}`
  }

  const missingFields: Array<MissingField> = []

  // Core property fields (Overview/Acquisition)
  if (!property.acquisition?.purchasePrice && !property.valuation?.currentValue) {
    missingFields.push({
      label: 'Purchase Price or Current Value',
      route: getRoute('financials'),
      category: 'Acquisition',
    })
  }

  if (!property.acquisition?.purchaseDate) {
    missingFields.push({
      label: 'Purchase Date',
      route: getRoute('financials'),
      category: 'Acquisition',
    })
  }

  // Property characteristics
  if (!property.characteristics?.propertyType) {
    missingFields.push({
      label: 'Property Type',
      route: getRoute(''),
      category: 'Characteristics',
    })
  }

  if (!property.characteristics?.bedrooms && property.characteristics?.bedrooms !== 0) {
    missingFields.push({
      label: 'Bedrooms',
      route: getRoute(''),
      category: 'Characteristics',
    })
  }

  if (!property.characteristics?.bathrooms && property.characteristics?.bathrooms !== 0) {
    missingFields.push({
      label: 'Bathrooms',
      route: getRoute(''),
      category: 'Characteristics',
    })
  }

  if (!property.characteristics?.squareFeet) {
    missingFields.push({
      label: 'Square Feet',
      route: getRoute(''),
      category: 'Characteristics',
    })
  }

  // Rental income
  if (!property.rentalIncome?.monthlyRent) {
    missingFields.push({
      label: 'Monthly Rent',
      route: getRoute('financials'),
      category: 'Rental Income',
    })
  }

  // Operating expenses
  if (!property.operatingExpenses) {
    missingFields.push({
      label: 'Operating Expenses',
      route: getRoute('financials'),
      category: 'Expenses',
    })
  } else {
    const expenses = property.operatingExpenses
    if (
      typeof expenses === 'object' &&
      !expenses.propertyTaxAnnual &&
      !expenses.insuranceAnnual
    ) {
      missingFields.push({
        label: 'Property Tax or Insurance',
        route: getRoute('financials'),
        category: 'Expenses',
      })
    }
  }

  // Management
  if (!property.management) {
    missingFields.push({
      label: 'Management Type',
      route: getRoute('management'),
      category: 'Management',
    })
  } else if (!property.management.isSelfManaged && !property.management.companyName) {
    missingFields.push({
      label: 'Management Company',
      route: getRoute('management'),
      category: 'Management',
    })
  }

  // Loans
  const activeLoan = property.loans?.find(
    (loan) => loan.status === 'active' && loan.isPrimary,
  )
  if (activeLoan) {
    if (!activeLoan.originalLoanAmount) {
      missingFields.push({
        label: 'Loan Amount',
        route: getRoute('financials'),
        category: 'Financing',
      })
    }
    if (!activeLoan.interestRate) {
      missingFields.push({
        label: 'Interest Rate',
        route: getRoute('financials'),
        category: 'Financing',
      })
    }
    if (!activeLoan.termMonths) {
      missingFields.push({
        label: 'Loan Term',
        route: getRoute('financials'),
        category: 'Financing',
      })
    }
  }

  // Calculate completeness score
  // Total possible fields to check (adjust based on your requirements)
  const totalFields = 12 // Approximate number of critical fields
  const filledFields = totalFields - missingFields.length
  const completeness = Math.round((filledFields / totalFields) * 100)

  // Calculate IQ Score (similar to completeness but may have different weighting)
  const score = completeness

  // Determine fidelity level
  let fidelityLevel: 'low' | 'medium' | 'high'
  if (completeness >= 85) {
    fidelityLevel = 'high'
  } else if (completeness >= 60) {
    fidelityLevel = 'medium'
  } else {
    fidelityLevel = 'low'
  }

  return {
    score,
    completeness,
    missingFields,
    fidelityLevel,
  }
}

