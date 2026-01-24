import type { Property } from '@/hooks/api/useProperties'

/**
 * Calculate property completeness score (0-100) based on data completeness
 */
export function getPropertyScore(p: Property): number {
  const checks = [
    p.valuation?.currentValue || p.acquisition?.currentValue,
    p.rentalIncome?.monthlyRent,
    p.operatingExpenses,
    p.acquisition?.purchaseDate,
    p.characteristics?.propertyType,
    p.loans?.some((l) => l.status === 'active'),
  ]
  const filled = checks.filter(Boolean).length
  return Math.round((filled / checks.length) * 100)
}

/**
 * Calculate monthly cash flow from rental income, expenses, and loan payments
 */
export function getPropertyCashFlow(p: Property): number {
  const monthlyRent = Number(p.rentalIncome?.monthlyRent || 0)
  const monthlyExpenses = 0 // Simplified - will be calculated when operatingExpenses interface is updated
  const activeLoan = p.loans?.find(
    (l) => l.status === 'active' && l.isPrimary,
  )
  const monthlyLoanPayment = activeLoan?.monthlyPrincipalInterest
    ? Number(activeLoan.monthlyPrincipalInterest)
    : 0
  return monthlyRent - monthlyExpenses - monthlyLoanPayment
}

/**
 * Format property value as currency (e.g., "$485k", "$1.2M")
 */
export function formatPropertyValue(value: number | null | undefined): string {
  if (!value) return '—'
  if (value >= 1000000) {
    const millions = value / 1000000
    return `$${millions.toFixed(1)}M`
  }
  if (value >= 1000) {
    const thousands = value / 1000
    return `$${Math.round(thousands)}k`
  }
  return `$${value.toLocaleString()}`
}

/**
 * Format cash flow with +/- prefix (e.g., "+$450", "-$120")
 */
export function formatCashFlow(value: number): string {
  const sign = value >= 0 ? '+' : ''
  const absValue = Math.abs(value)
  if (absValue >= 1000) {
    const thousands = absValue / 1000
    return `${sign}$${thousands.toFixed(1)}k`
  }
  return `${sign}$${Math.round(absValue)}`
}

/**
 * Get placeholder image URL for property
 * Can be enhanced later with actual property images
 */
export function getPropertyImage(_p: Property): string {
  return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=400'
}
