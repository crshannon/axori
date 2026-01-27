import { useMemo } from 'react'
import { useReserveTracking } from './useReserveTracking'
import { useFinancialPulse } from './useFinancialPulse'
import type {
  PropertyData,
  Suggestion,
} from '@/services/suggestions/suggestionEngine'
import { useProperty } from '@/hooks/api/useProperties'
import { useBankAccountAllocations } from '@/hooks/api/useBankAccounts'
import { evaluateProperty } from '@/services/suggestions/suggestionEngine'

interface UseSuggestionsResult {
  suggestions: Array<Suggestion>
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  totalCount: number
  isLoading: boolean
}

/**
 * Hook to generate intelligent suggestions for a single property
 *
 * Evaluates the property against suggestion rules and returns
 * actionable recommendations sorted by priority.
 *
 * @param propertyId - The property ID to evaluate
 */
export function useSuggestions(propertyId: string): UseSuggestionsResult {
  const { data: property, isLoading: propertyLoading } = useProperty(propertyId)
  const reserves = useReserveTracking(propertyId)
  const cashFlow = useFinancialPulse(propertyId)
  const allocations = useBankAccountAllocations(propertyId)

  const result = useMemo(() => {
    if (!property) {
      return {
        suggestions: [],
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        totalCount: 0,
      }
    }

    // Build property data for evaluation
    const propertyData: PropertyData = {
      id: property.id,
      name: property.address || `Property ${property.id.slice(0, 8)}`,
      rentalIncome: property.rentalIncome,
      operatingExpenses: property.operatingExpenses,
      loans: property.loans,
      valuation: property.valuation,
      acquisition: property.acquisition,
      reserves: reserves.hasData
        ? {
            maintenance: {
              balance: reserves.maintenance.balance,
              monthlyAccrual: reserves.maintenance.monthlyAccrual,
            },
            capex: {
              balance: reserves.capex.balance,
              monthlyAccrual: reserves.capex.monthlyAccrual,
            },
          }
        : undefined,
      cashFlow: {
        actualCashFlow: cashFlow.actualCashFlow,
        projectedCashFlow: cashFlow.projectedCashFlow,
        // TODO: Add consecutive negative months tracking
        consecutiveNegativeMonths: undefined,
      },
      // Bank allocation data for under-funding suggestions
      bankAllocations: {
        hasBankAccount: allocations.hasBankAccount,
        balance: allocations.balance,
        maintenance: allocations.maintenance,
        capex: allocations.capex,
        lifeSupport: allocations.lifeSupport,
        trueCashFlow: allocations.trueCashFlow,
        lastSynced: allocations.lastSynced,
      },
      // Monthly expenses (fixed expenses + debt service) for life support comparison
      monthlyExpenses:
        (cashFlow.totalFixedExpenses || 0) + (cashFlow.totalDebtService || 0),
    }

    // Evaluate all rules
    const suggestions = evaluateProperty(propertyData)

    // Count by priority
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    suggestions.forEach((s) => {
      counts[s.priority]++
    })

    return {
      suggestions,
      criticalCount: counts.critical,
      highCount: counts.high,
      mediumCount: counts.medium,
      lowCount: counts.low,
      totalCount: suggestions.length,
    }
  }, [property, reserves, cashFlow, allocations])

  return {
    ...result,
    isLoading: propertyLoading,
  }
}

/**
 * Type for property list item (minimal data for portfolio evaluation)
 */
interface PropertyListItem {
  id: string
  name?: string | null
  address?: {
    street?: string | null
  } | null
  rentalIncome?: {
    monthlyRent?: string | null
    marketRentEstimate?: string | null
  } | null
  operatingExpenses?: {
    vacancyRate?: string | null
  } | null
  loans?: Array<{
    isPrimary?: boolean | null
    status?: string | null
    interestRate?: string | null
    currentBalance?: string | null
  }> | null
  valuation?: {
    currentValue?: number | null
  } | null
}

/**
 * Hook to generate suggestions across a portfolio of properties
 *
 * Note: This is a simpler version that doesn't fetch reserve/cashflow data
 * for each property (would be expensive). Instead, it evaluates based on
 * the basic property data provided.
 *
 * @param properties - Array of property data from a list query
 */
export function usePortfolioSuggestions(
  properties: Array<PropertyListItem>,
): UseSuggestionsResult {
  const result = useMemo(() => {
    if (properties.length === 0) {
      return {
        suggestions: [],
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        totalCount: 0,
      }
    }

    const allSuggestions: Array<Suggestion> = []

    // Evaluate each property
    properties.forEach((property) => {
      const propertyData: PropertyData = {
        id: property.id,
        name:
          property.name ||
          property.address?.street ||
          `Property ${property.id.slice(0, 8)}`,
        rentalIncome: property.rentalIncome,
        operatingExpenses: property.operatingExpenses,
        loans: property.loans,
        valuation: property.valuation,
        // Note: reserves and cashFlow not available in portfolio view
      }

      const suggestions = evaluateProperty(propertyData)
      allSuggestions.push(...suggestions)
    })

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    allSuggestions.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    )

    // Count by priority
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    allSuggestions.forEach((s) => {
      counts[s.priority]++
    })

    return {
      suggestions: allSuggestions,
      criticalCount: counts.critical,
      highCount: counts.high,
      mediumCount: counts.medium,
      lowCount: counts.low,
      totalCount: allSuggestions.length,
    }
  }, [properties])

  return {
    ...result,
    isLoading: false,
  }
}
