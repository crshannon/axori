/**
 * Axori Suggestions Engine
 *
 * Analyzes property data to generate intelligent improvement suggestions.
 * Each rule evaluates specific criteria and produces actionable recommendations.
 */

export type SuggestionType =
  | 'rent'
  | 'refinance'
  | 'vacancy'
  | 'expense'
  | 'reserve'
  | 'tax'
  | 'lease'
  | 'document'
  | 'performance'

export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low'

export interface Suggestion {
  id: string
  type: SuggestionType
  priority: SuggestionPriority
  title: string
  description: string
  potentialImpact: string // e.g., "Save $200/month" or "Risk: $5,000 exposure"
  actionLabel: string // e.g., "Update Rent" or "Review Loan"
  actionDrawer?: string // Drawer to open on click
  propertyId?: string // For portfolio-level, which property this applies to
  propertyName?: string // Display name of the property
}

/**
 * Property data structure for suggestion evaluation
 */
export interface PropertyData {
  id: string
  name: string
  rentalIncome?: {
    monthlyRent?: string | null
    marketRentEstimate?: string | null
  } | null
  operatingExpenses?: {
    vacancyRate?: string | null
    propertyTaxAnnual?: string | null
    insuranceAnnual?: string | null
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
  acquisition?: {
    purchaseDate?: string | null
  } | null
  // Reserve tracking data (optional, from useReserveTracking)
  reserves?: {
    maintenance: { balance: number; monthlyAccrual: number }
    capex: { balance: number; monthlyAccrual: number }
  }
  // Cash flow data (optional, from useFinancialPulse)
  cashFlow?: {
    actualCashFlow: number | null
    projectedCashFlow: number | null
    consecutiveNegativeMonths?: number
  }
  // Bank allocation data (optional, from useBankAccountAllocations)
  bankAllocations?: {
    hasBankAccount: boolean
    balance: number
    maintenance: { target: number; funded: number; gap: number }
    capex: { target: number; funded: number; gap: number }
    lifeSupport: { target: number; funded: number; months: number | null }
    trueCashFlow: number
    lastSynced: Date | null
  }
  // Monthly expenses (for life support calculation)
  monthlyExpenses?: number
}

/**
 * Suggestion rule definition
 */
interface SuggestionRule {
  id: string
  name: string
  evaluate: (property: PropertyData) => Suggestion | null
}

/**
 * Built-in suggestion rules
 */
const suggestionRules: Array<SuggestionRule> = [
  // ============================================
  // RENT & INCOME RULES
  // ============================================
  {
    id: 'rent-below-market',
    name: 'Rent Below Market',
    evaluate: (property) => {
      const rent = property.rentalIncome?.monthlyRent
        ? parseFloat(property.rentalIncome.monthlyRent)
        : 0
      const market = property.rentalIncome?.marketRentEstimate
        ? parseFloat(property.rentalIncome.marketRentEstimate)
        : 0

      if (rent <= 0 || market <= 0) return null

      const ratio = rent / market
      if (ratio >= 0.9) return null // Within 10% of market

      const difference = market - rent
      const annualDifference = difference * 12

      return {
        id: `${property.id}-rent-below-market`,
        type: 'rent',
        priority: ratio < 0.8 ? 'high' : 'medium',
        title: 'Rent Below Market Rate',
        description: `Current rent of $${rent.toLocaleString()}/mo is ${((1 - ratio) * 100).toFixed(0)}% below market estimate of $${market.toLocaleString()}/mo.`,
        potentialImpact: `+$${annualDifference.toLocaleString()}/year`,
        actionLabel: 'Review Rent',
        actionDrawer: 'rental-income',
        propertyId: property.id,
        propertyName: property.name,
      }
    },
  },

  // ============================================
  // FINANCING RULES
  // ============================================
  {
    id: 'refinance-opportunity',
    name: 'Refinance Opportunity',
    evaluate: (property) => {
      const primaryLoan = property.loans?.find(
        (l) => l.isPrimary && l.status === 'active',
      )
      if (!primaryLoan) return null

      const rate = primaryLoan.interestRate
        ? parseFloat(primaryLoan.interestRate)
        : 0
      const balance = primaryLoan.currentBalance
        ? parseFloat(primaryLoan.currentBalance)
        : 0

      // Skip if balance too low or rate not significantly above current market
      // Using 7% as a threshold (assuming current market is around 6.25%)
      if (balance < 50000 || rate < 0.07) return null

      const currentMarketRate = 0.0625 // Approximate current market rate
      const rateDiff = rate - currentMarketRate

      if (rateDiff < 0.0075) return null // Less than 0.75% difference

      // Estimate monthly savings (rough approximation)
      const monthlySavings = (rateDiff * balance) / 12
      const annualSavings = monthlySavings * 12

      return {
        id: `${property.id}-refinance-opportunity`,
        type: 'refinance',
        priority: rateDiff > 0.015 ? 'high' : 'medium',
        title: 'Refinance Opportunity',
        description: `Current rate of ${(rate * 100).toFixed(2)}% is ${(rateDiff * 100).toFixed(2)}% above market. Balance: $${balance.toLocaleString()}.`,
        potentialImpact: `Save ~$${Math.round(annualSavings).toLocaleString()}/year`,
        actionLabel: 'Review Loan',
        actionDrawer: 'loan',
        propertyId: property.id,
        propertyName: property.name,
      }
    },
  },

  // ============================================
  // VACANCY & PERFORMANCE RULES
  // ============================================
  {
    id: 'high-vacancy-rate',
    name: 'High Vacancy Rate',
    evaluate: (property) => {
      const vacancyRate = property.operatingExpenses?.vacancyRate
        ? parseFloat(property.operatingExpenses.vacancyRate)
        : 0

      if (vacancyRate <= 0.08) return null // 8% or less is acceptable

      const rent = property.rentalIncome?.monthlyRent
        ? parseFloat(property.rentalIncome.monthlyRent)
        : 0
      const annualLoss = rent * 12 * vacancyRate

      return {
        id: `${property.id}-high-vacancy`,
        type: 'vacancy',
        priority: vacancyRate > 0.15 ? 'critical' : 'high',
        title: 'High Vacancy Rate',
        description: `Vacancy rate of ${(vacancyRate * 100).toFixed(0)}% exceeds typical market average of 5-8%.`,
        potentialImpact: `Risk: $${Math.round(annualLoss).toLocaleString()}/year lost`,
        actionLabel: 'Review Expenses',
        actionDrawer: 'operating-expenses',
        propertyId: property.id,
        propertyName: property.name,
      }
    },
  },
  {
    id: 'negative-cash-flow',
    name: 'Negative Cash Flow',
    evaluate: (property) => {
      if (!property.cashFlow) return null

      const { actualCashFlow, consecutiveNegativeMonths } = property.cashFlow

      // Only flag if actually negative and consistent
      if (
        actualCashFlow === null ||
        actualCashFlow >= 0 ||
        (consecutiveNegativeMonths && consecutiveNegativeMonths < 3)
      ) {
        return null
      }

      const monthsDesc = consecutiveNegativeMonths
        ? `${consecutiveNegativeMonths} consecutive months`
        : 'recent months'

      return {
        id: `${property.id}-negative-cash-flow`,
        type: 'performance',
        priority: 'critical',
        title: 'Negative Cash Flow',
        description: `Property has been cash flow negative for ${monthsDesc}. Monthly deficit: $${Math.abs(actualCashFlow).toLocaleString()}.`,
        potentialImpact: `Risk: $${Math.abs(Math.round(actualCashFlow * 12)).toLocaleString()}/year`,
        actionLabel: 'Review Financials',
        propertyId: property.id,
        propertyName: property.name,
      }
    },
  },

  // ============================================
  // RESERVE RULES
  // ============================================
  {
    id: 'reserve-depleted',
    name: 'Reserve Depletion Warning',
    evaluate: (property) => {
      if (!property.reserves) return null

      const { maintenance, capex } = property.reserves
      const totalBalance = maintenance.balance + capex.balance
      const totalMonthly = maintenance.monthlyAccrual + capex.monthlyAccrual

      // Warning if balance is less than 2 months of accrual
      if (totalBalance >= totalMonthly * 2) return null

      const category =
        maintenance.balance < 0 && capex.balance < 0
          ? 'both reserves'
          : maintenance.balance < 0
            ? 'maintenance reserves'
            : capex.balance < 0
              ? 'capex reserves'
              : 'reserves'

      return {
        id: `${property.id}-reserve-depleted`,
        type: 'reserve',
        priority: totalBalance < 0 ? 'critical' : 'high',
        title: 'Reserve Funds Low',
        description: `Your ${category} are ${totalBalance < 0 ? 'depleted' : 'running low'}. Current balance: $${Math.round(totalBalance).toLocaleString()}.`,
        potentialImpact: `Risk: Unexpected repair exposure`,
        actionLabel: 'Review Reserves',
        propertyId: property.id,
        propertyName: property.name,
      }
    },
  },

  // ============================================
  // BANK ALLOCATION RULES
  // ============================================
  {
    id: 'no-bank-account',
    name: 'No Bank Account Connected',
    evaluate: (property) => {
      // Only trigger if we have bank allocation data and no bank account
      if (property.bankAllocations === undefined) return null
      if (property.bankAllocations.hasBankAccount) return null

      return {
        id: `${property.id}-no-bank-account`,
        type: 'reserve',
        priority: 'medium',
        title: 'No Bank Account Connected',
        description: `Connect a bank account to track your actual cash reserves and set allocation targets.`,
        potentialImpact: `Better cash visibility`,
        actionLabel: 'Connect Bank',
        actionDrawer: 'connect-bank-account',
        propertyId: property.id,
        propertyName: property.name,
      }
    },
  },
  {
    id: 'under-funded-reserves',
    name: 'Under-Funded Reserves',
    evaluate: (property) => {
      if (!property.bankAllocations?.hasBankAccount || !property.reserves)
        return null

      const { maintenance, capex } = property.bankAllocations
      const projectedMaintenance = property.reserves.maintenance.balance
      const projectedCapex = property.reserves.capex.balance

      // Check if funded is less than 50% of projected
      const maintenanceUnderfunded =
        projectedMaintenance > 0 &&
        maintenance.funded < projectedMaintenance * 0.5
      const capexUnderfunded =
        projectedCapex > 0 && capex.funded < projectedCapex * 0.5

      if (!maintenanceUnderfunded && !capexUnderfunded) return null

      const category =
        maintenanceUnderfunded && capexUnderfunded
          ? 'both maintenance and CapEx'
          : maintenanceUnderfunded
            ? 'maintenance'
            : 'CapEx'

      const totalGap =
        (maintenanceUnderfunded
          ? projectedMaintenance - maintenance.funded
          : 0) + (capexUnderfunded ? projectedCapex - capex.funded : 0)

      return {
        id: `${property.id}-under-funded-reserves`,
        type: 'reserve',
        priority: 'high',
        title: 'Under-Funded Reserves',
        description: `Your ${category} reserves are funded at less than 50% of projected levels. Funding gap: $${Math.round(totalGap).toLocaleString()}.`,
        potentialImpact: `Risk: Unexpected expense exposure`,
        actionLabel: 'Adjust Allocations',
        actionDrawer: 'bank-allocation',
        propertyId: property.id,
        propertyName: property.name,
      }
    },
  },
  {
    id: 'low-life-support',
    name: 'Low Life Support Reserves',
    evaluate: (property) => {
      if (!property.bankAllocations?.hasBankAccount) return null

      const { lifeSupport } = property.bankAllocations
      const monthlyExpenses = property.monthlyExpenses || 0

      // If no monthly expenses data, check if life support months is set but low
      if (
        lifeSupport.months !== null &&
        lifeSupport.months < 1 &&
        lifeSupport.target > 0
      ) {
        return {
          id: `${property.id}-low-life-support`,
          type: 'reserve',
          priority: 'critical',
          title: 'Low Emergency Fund',
          description: `Your life support reserve covers less than 1 month of expenses. Consider increasing to 3-6 months.`,
          potentialImpact: `Risk: Vacancy exposure`,
          actionLabel: 'Increase Reserves',
          actionDrawer: 'bank-allocation',
          propertyId: property.id,
          propertyName: property.name,
        }
      }

      // If we have monthly expenses, check coverage
      if (monthlyExpenses > 0 && lifeSupport.funded < monthlyExpenses) {
        const monthsCovered = lifeSupport.funded / monthlyExpenses

        return {
          id: `${property.id}-low-life-support`,
          type: 'reserve',
          priority: monthsCovered < 1 ? 'critical' : 'high',
          title: 'Low Emergency Fund',
          description: `Your life support reserve of $${Math.round(lifeSupport.funded).toLocaleString()} covers only ${monthsCovered.toFixed(1)} months of expenses. Recommend 3-6 months.`,
          potentialImpact: `Risk: $${Math.round(monthlyExpenses * 3).toLocaleString()} exposure`,
          actionLabel: 'Increase Reserves',
          actionDrawer: 'bank-allocation',
          propertyId: property.id,
          propertyName: property.name,
        }
      }

      return null
    },
  },
  {
    id: 'bank-sync-stale',
    name: 'Bank Data Outdated',
    evaluate: (property) => {
      if (!property.bankAllocations?.hasBankAccount) return null
      if (!property.bankAllocations.lastSynced) return null

      const daysSinceSync = Math.floor(
        (Date.now() - new Date(property.bankAllocations.lastSynced).getTime()) /
          (1000 * 60 * 60 * 24),
      )

      if (daysSinceSync < 7) return null

      return {
        id: `${property.id}-bank-sync-stale`,
        type: 'reserve',
        priority: 'low',
        title: 'Bank Balance Outdated',
        description: `Your bank balance hasn't been updated in ${daysSinceSync} days. Update to ensure accurate allocation tracking.`,
        potentialImpact: `Accuracy improvement`,
        actionLabel: 'Update Balance',
        actionDrawer: 'bank-allocation',
        propertyId: property.id,
        propertyName: property.name,
      }
    },
  },

  // ============================================
  // TAX OPTIMIZATION RULES
  // ============================================
  {
    id: 'cost-segregation-opportunity',
    name: 'Cost Segregation Study',
    evaluate: (property) => {
      const value = property.valuation?.currentValue || 0

      // Only suggest for properties over $250k
      if (value < 250000) return null

      // Estimate tax savings (rough: ~5-15% of building value accelerated)
      const estimatedSavings = Math.round(value * 0.08 * 0.32) // 8% accelerated, 32% tax bracket

      return {
        id: `${property.id}-cost-seg`,
        type: 'tax',
        priority: value > 500000 ? 'medium' : 'low',
        title: 'Cost Segregation Opportunity',
        description: `Property value of $${value.toLocaleString()} may qualify for accelerated depreciation through a cost segregation study.`,
        potentialImpact: `Est. $${estimatedSavings.toLocaleString()} tax savings`,
        actionLabel: 'Learn More',
        propertyId: property.id,
        propertyName: property.name,
      }
    },
  },
]

/**
 * Evaluate all rules against a property and return applicable suggestions
 */
export function evaluateProperty(property: PropertyData): Array<Suggestion> {
  const suggestions: Array<Suggestion> = []

  for (const rule of suggestionRules) {
    try {
      const suggestion = rule.evaluate(property)
      if (suggestion) {
        suggestions.push(suggestion)
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error)
    }
  }

  // Sort by priority
  const priorityOrder: Record<SuggestionPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  return suggestions.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  )
}

/**
 * Evaluate all rules against multiple properties (for portfolio view)
 */
export function evaluatePortfolio(
  properties: Array<PropertyData>,
): Array<Suggestion> {
  const allSuggestions: Array<Suggestion> = []

  for (const property of properties) {
    const suggestions = evaluateProperty(property)
    allSuggestions.push(...suggestions)
  }

  // Sort by priority, then by property
  const priorityOrder: Record<SuggestionPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  return allSuggestions.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  )
}
