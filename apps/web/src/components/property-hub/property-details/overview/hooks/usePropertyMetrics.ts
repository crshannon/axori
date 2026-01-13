import type { Property } from '@/hooks/api/useProperties'

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
          format: (val: number) => `${val >= 0 ? '+' : ''}$${val.toLocaleString()}`,
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

  // Get current value (from acquisition or valuation)
  const currentValue =
    property.acquisition?.currentValue ||
    property.valuation?.currentValue ||
    null

  // Get purchase price (for equity calculation)
  const purchasePrice = property.acquisition?.purchasePrice || null

  // Calculate total loan amount from active primary loans
  const activeLoan = property.loans?.find(
    (loan) => loan.status === 'active' && loan.isPrimary,
  )
  const totalLoanAmount = activeLoan?.originalLoanAmount
    ? Number(activeLoan.originalLoanAmount)
    : 0

  // Calculate equity (current value - loan balance, or purchase price - loan amount if no current value)
  let equity: MetricWithStatus
  if (currentValue !== null) {
    equity = {
      value: currentValue - totalLoanAmount,
      status: 'success',
    }
  } else if (purchasePrice !== null) {
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

  // Get monthly rent
  const monthlyRent = property.rentalIncome?.monthlyBaseRent
    ? Number(property.rentalIncome.monthlyBaseRent)
    : 0

  // Calculate monthly operating expenses
  // Note: operatingExpenses type is currently {} in the interface
  // For now, we'll compute with 0 expenses if not available
  // TODO: Update Property interface with full operatingExpenses type
  const monthlyExpenses = 0 // Will be calculated when operatingExpenses interface is updated
  // TODO: Check hasOperatingExpenses when operatingExpenses interface is updated

  // Calculate monthly loan payment
  const monthlyLoanPayment = activeLoan?.monthlyPrincipalInterest
    ? Number(activeLoan.monthlyPrincipalInterest)
    : activeLoan?.interestRate && totalLoanAmount > 0 && activeLoan.termMonths
      ? (Number(activeLoan.interestRate) / 100 / 12) * totalLoanAmount +
        totalLoanAmount / Number(activeLoan.termMonths)
      : 0

  // Calculate monthly cash flow
  const monthlyCashFlowValue = monthlyRent - monthlyExpenses - monthlyLoanPayment

  // Determine cash flow status
  let monthlyCashFlow: MetricWithStatus
  if (monthlyRent === 0) {
    monthlyCashFlow = {
      value: monthlyCashFlowValue,
      status: 'warning',
      message: 'Monthly rent not set',
    }
  } else {
    // hasOperatingExpenses is always false (hardcoded), so always incomplete for now
    monthlyCashFlow = {
      value: monthlyCashFlowValue,
      status: 'incomplete',
      message: 'Operating expenses not configured',
    }
  }

  // Calculate annual NOI (Net Operating Income)
  const annualNOI = (monthlyRent - monthlyExpenses) * 12

  // Calculate cap rate (NOI / Current Value * 100)
  let capRate: MetricWithStatus
  if (!currentValue || currentValue <= 0) {
    capRate = {
      value: null,
      status: 'warning',
      message: 'Requires current property value',
    }
  } else if (monthlyRent === 0) {
    capRate = {
      value: null,
      status: 'warning',
      message: 'Requires rental income data',
    }
  } else {
    // hasOperatingExpenses is always false (hardcoded), so always incomplete for now
    capRate = {
      value: (annualNOI / currentValue) * 100,
      status: 'incomplete',
      message: 'Operating expenses not configured',
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
      status: totalLoanAmount === 0 ? 'success' : 'success',
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
      route: getRoutePath('financials'), // Purchase price, current value in Financials tab
    },
    {
      id: 'monthlyCashFlow',
      label: 'Cash Flow',
      metric: metrics.monthlyCashFlow,
      format: (val: number) => `${val >= 0 ? '+' : ''}$${val.toLocaleString()}`,
      sub: 'Net Monthly',
      route: getRoutePath('financials'), // Rental income, operating expenses in Financials tab
    },
    {
      id: 'capRate',
      label: 'Cap Rate',
      metric: metrics.capRate,
      format: (val: number) => `${val.toFixed(1)}%`,
      sub: 'Current Yield',
      route: getRoutePath('financials'), // Current value, rental income in Financials tab
    },
    {
      id: 'ltv',
      label: 'LTV',
      metric: metrics.ltv,
      format: (val: number) => `${val.toFixed(1)}%`,
      sub: 'Debt/Value',
      route: getRoutePath('financials'), // Current value, loan data in Financials tab
    },
  ]

  return {
    metrics,
    displayConfig,
  }
}
