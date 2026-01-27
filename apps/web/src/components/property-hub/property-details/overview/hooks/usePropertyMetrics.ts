import type { Property } from '@/hooks/api/useProperties'
import {
  calculateCapExReserve,
  calculateCashFlow,
  calculateGrossIncome,
  calculateNOI,
  calculateTotalDebtService,
  calculateTotalFixedExpenses,
} from '@/utils/finances'

export type MetricStatus = 'success' | 'warning' | 'error' | 'incomplete'

export interface MetricWithStatus {
  value: number | null
  status: MetricStatus
  message?: string
}

export interface PropertyMetrics {
  equity: MetricWithStatus
  monthlyCashFlow: MetricWithStatus
  capRate: MetricWithStatus
  ltv: MetricWithStatus
}

export interface MetricDisplayConfig {
  id: 'equity' | 'monthlyCashFlow' | 'capRate' | 'ltv'
  label: string
  metric: MetricWithStatus
  format: (val: number) => string
  sub: string
  /** Route path segment for the tab where this data can be entered (e.g., 'financials', 'overview') */
  route: string
}

export interface UsePropertyMetricsReturn {
  metrics: PropertyMetrics
  displayConfig: Array<MetricDisplayConfig>
}

/**
 * Calculate property metrics from property data with status information
 * Returns both the raw metrics and display configuration ready for rendering
 * @param property - Property object with nested data
 * @param propertyId - Optional property ID for generating routes
 * @returns Object containing metrics and display configuration array
 */
export function usePropertyMetrics(
  property: Property | undefined | null,
  propertyId?: string,
): UsePropertyMetricsReturn {
  // Helper to build full route path
  const getRoutePath = (pathSegment: string) => {
    if (!propertyId) return pathSegment
    return pathSegment
      ? `/property-hub/${propertyId}/${pathSegment}`
      : `/property-hub/${propertyId}`
  }

  if (!property) {
    const emptyMetrics: PropertyMetrics = {
      equity: {
        value: null,
        status: 'error',
        message: 'Property data not available',
      },
      monthlyCashFlow: {
        value: 0,
        status: 'error',
        message: 'Property data not available',
      },
      capRate: {
        value: null,
        status: 'error',
        message: 'Property data not available',
      },
      ltv: {
        value: null,
        status: 'error',
        message: 'Property data not available',
      },
    }

    return {
      metrics: emptyMetrics,
      displayConfig: [
        {
          id: 'equity',
          label: 'Equity',
          metric: emptyMetrics.equity,
          format: (val: number) => `$${val.toLocaleString()}`,
          sub: 'Unrealized Gain',
          route: getRoutePath('financials'),
        },
        {
          id: 'monthlyCashFlow',
          label: 'Cash Flow',
          metric: emptyMetrics.monthlyCashFlow,
          format: (val: number) =>
            `${val >= 0 ? '+' : ''}$${val.toLocaleString()}`,
          sub: 'Net Monthly',
          route: getRoutePath('financials'),
        },
        {
          id: 'capRate',
          label: 'Cap Rate',
          metric: emptyMetrics.capRate,
          format: (val: number) => `${val.toFixed(1)}%`,
          sub: 'Current Yield',
          route: getRoutePath('financials'),
        },
        {
          id: 'ltv',
          label: 'LTV',
          metric: emptyMetrics.ltv,
          format: (val: number) => `${val.toFixed(1)}%`,
          sub: 'Debt/Value',
          route: getRoutePath('financials'),
        },
      ],
    }
  }

  // Get current value (prefer valuation, fallback to acquisition)
  const currentValue =
    property.valuation?.currentValue ??
    property.acquisition?.currentValue ??
    null

  // Get purchase price (for equity calculation)
  const purchasePrice = property.acquisition?.purchasePrice ?? null

  // Calculate total loan amount from active loans
  const loans = property.loans ?? []
  const activeLoans = loans.filter((loan) => loan.status === 'active')
  const totalLoanAmount = activeLoans.reduce((sum, loan) => {
    return sum + (loan.currentBalance ? Number(loan.currentBalance) : 0)
  }, 0)

  // Calculate equity (current value - loan balance)
  let equity: MetricWithStatus
  if (currentValue !== null && currentValue > 0) {
    equity = {
      value: currentValue - totalLoanAmount,
      status: 'success',
    }
  } else if (purchasePrice !== null && purchasePrice > 0) {
    equity = {
      value: purchasePrice - totalLoanAmount,
      status: 'incomplete',
      message: 'Using purchase price (current value unavailable)',
    }
  } else {
    equity = {
      value: null,
      status: 'warning',
      message: 'Requires purchase price or current value',
    }
  }

  // Calculate gross income using shared utility
  const transactions = property.transactions ?? []
  const grossIncome = calculateGrossIncome(property.rentalIncome, transactions)

  // Check if we have rental income configured
  const hasRentalIncome = grossIncome > 0

  // Calculate operating expenses using shared utility
  const operatingExpenses = calculateTotalFixedExpenses(
    property.operatingExpenses,
    transactions,
    grossIncome,
  )

  // Check if operating expenses are configured
  const hasOperatingExpenses =
    operatingExpenses > 0 ||
    !!(
      property.operatingExpenses?.propertyTaxAnnual ||
      property.operatingExpenses?.insuranceAnnual
    )

  // Calculate CapEx reserve
  const capexReserve = calculateCapExReserve(
    grossIncome,
    property.operatingExpenses?.capexRate,
  )

  // Calculate NOI
  const noi = calculateNOI(grossIncome, operatingExpenses, capexReserve)

  // Calculate debt service
  const debtService = calculateTotalDebtService(loans)

  // Calculate cash flow
  const monthlyCashFlowValue = calculateCashFlow(noi, debtService)

  // Determine cash flow status
  let monthlyCashFlow: MetricWithStatus
  if (!hasRentalIncome) {
    monthlyCashFlow = {
      value: monthlyCashFlowValue,
      status: 'warning',
      message: 'Monthly rent not set',
    }
  } else if (!hasOperatingExpenses) {
    monthlyCashFlow = {
      value: monthlyCashFlowValue,
      status: 'incomplete',
      message: 'Operating expenses not configured',
    }
  } else {
    monthlyCashFlow = {
      value: monthlyCashFlowValue,
      status: 'success',
    }
  }

  // Calculate annual NOI for cap rate
  const annualNOI = noi * 12

  // Calculate cap rate (NOI / Current Value * 100)
  let capRate: MetricWithStatus
  if (!currentValue || currentValue <= 0) {
    capRate = {
      value: null,
      status: 'warning',
      message: 'Requires current property value',
    }
  } else if (!hasRentalIncome) {
    capRate = {
      value: null,
      status: 'warning',
      message: 'Requires rental income data',
    }
  } else if (!hasOperatingExpenses) {
    capRate = {
      value: (annualNOI / currentValue) * 100,
      status: 'incomplete',
      message: 'Operating expenses not configured',
    }
  } else {
    capRate = {
      value: (annualNOI / currentValue) * 100,
      status: 'success',
    }
  }

  // Calculate LTV (Loan-to-Value: Loan Amount / Current Value * 100)
  let ltv: MetricWithStatus
  if (!currentValue || currentValue <= 0) {
    ltv = {
      value: null,
      status: 'warning',
      message: 'Requires current property value',
    }
  } else {
    ltv = {
      value: (totalLoanAmount / currentValue) * 100,
      status: 'success',
      message: totalLoanAmount === 0 ? 'No active loans' : undefined,
    }
  }

  const metrics: PropertyMetrics = {
    equity,
    monthlyCashFlow,
    capRate,
    ltv,
  }

  const displayConfig: Array<MetricDisplayConfig> = [
    {
      id: 'equity',
      label: 'Equity',
      metric: metrics.equity,
      format: (val: number) => `$${val.toLocaleString()}`,
      sub: 'Unrealized Gain',
      route: getRoutePath('financials'),
    },
    {
      id: 'monthlyCashFlow',
      label: 'Cash Flow',
      metric: metrics.monthlyCashFlow,
      format: (val: number) => `${val >= 0 ? '+' : ''}$${val.toLocaleString()}`,
      sub: 'Net Monthly',
      route: getRoutePath('financials'),
    },
    {
      id: 'capRate',
      label: 'Cap Rate',
      metric: metrics.capRate,
      format: (val: number) => `${val.toFixed(1)}%`,
      sub: 'Current Yield',
      route: getRoutePath('financials'),
    },
    {
      id: 'ltv',
      label: 'LTV',
      metric: metrics.ltv,
      format: (val: number) => `${val.toFixed(1)}%`,
      sub: 'Debt/Value',
      route: getRoutePath('financials'),
    },
  ]

  return {
    metrics,
    displayConfig,
  }
}
