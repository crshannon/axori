/**
 * Learning Hub - Financial Dashboard Learning Snippets
 *
 * These snippets provide contextual learning content for financials components:
 * - EquityVelocity
 * - ReserveTracker
 * - Liquidity
 * - FinancialPulse
 */

import type { LearningSnippet } from './types'

// =============================================================================
// EQUITY VELOCITY SNIPPETS
// =============================================================================

export const portfolioStakeSnippet: LearningSnippet = {
  id: 'portfolio-stake',
  title: 'Understanding Portfolio Stake',
  category: 'Equity',
  context: 'general',
  content:
    'Portfolio stake represents your total equity investment in the property, including down payment and any principal paid down. This is the capital you have at risk and the foundation for calculating your returns.',
}

export const roiCalculationSnippet: LearningSnippet = {
  id: 'roi-calculation',
  title: 'ROI Calculation',
  category: 'Equity',
  context: 'general',
  content:
    'Return on Investment (ROI) measures your annual return relative to your invested capital. Cash-on-cash ROI = (Annual Cash Flow / Total Investment) × 100. Higher ROI indicates more efficient use of your capital.',
}

export const calculatedBasisSnippet: LearningSnippet = {
  id: 'calculated-basis',
  title: 'Calculated Basis Explained',
  category: 'Equity',
  context: 'general',
  content:
    'Your calculated basis includes the purchase price plus closing costs and improvements. This affects depreciation calculations and capital gains when you sell. Tracking this accurately is essential for tax planning.',
}

export function getEquityVelocitySnippets(): Array<LearningSnippet> {
  return [portfolioStakeSnippet, roiCalculationSnippet, calculatedBasisSnippet]
}

// =============================================================================
// RESERVE TRACKER SNIPPETS
// =============================================================================

export const maintenanceReserveSnippet: LearningSnippet = {
  id: 'maintenance-reserve',
  title: 'Maintenance Reserves',
  category: 'Reserves',
  context: 'general',
  content:
    'Maintenance reserves cover routine repairs and upkeep—plumbing, electrical, appliances, and minor fixes. The standard is 1-2% of property value annually, or $100-200/month for most single-family properties.',
}

export const capexReserveSnippet: LearningSnippet = {
  id: 'capex-reserve-tracker',
  title: 'CapEx Reserves',
  category: 'Reserves',
  context: 'general',
  content:
    'Capital expenditure (CapEx) reserves are for major replacements: roof (15-25 years), HVAC (15-20 years), water heater (10-15 years). Budget $200-400/month to avoid surprise expenses when these items fail.',
}

export const liquidityBufferSnippet: LearningSnippet = {
  id: 'liquidity-buffer',
  title: 'Liquidity Buffer',
  category: 'Reserves',
  context: 'general',
  content:
    'Your liquidity buffer is the combined total of all reserves. A healthy buffer equals 3-6 months of operating expenses. This protects against vacancies, unexpected repairs, and economic downturns.',
}

export function getReserveTrackerSnippets(): Array<LearningSnippet> {
  return [
    maintenanceReserveSnippet,
    capexReserveSnippet,
    liquidityBufferSnippet,
  ]
}

// =============================================================================
// LIQUIDITY SNIPPETS
// =============================================================================

export const portfolioCashSnippet: LearningSnippet = {
  id: 'portfolio-cash',
  title: 'Portfolio Cash Position',
  category: 'Liquidity',
  context: 'general',
  content:
    'Portfolio cash represents your immediately available funds for this property. This includes checking account balances minus any allocated reserves. Strong cash position enables quick action on opportunities or emergencies.',
}

export const liquidAvailableSnippet: LearningSnippet = {
  id: 'liquid-available',
  title: 'Liquid Available',
  category: 'Liquidity',
  context: 'general',
  content:
    'Liquid available is your total accessible capital: cash plus undrawn credit lines (HELOC). This represents your deployment capacity for value-add improvements, emergency repairs, or new acquisitions.',
}

export const cashFlowVelocitySnippet: LearningSnippet = {
  id: 'cash-flow-velocity',
  title: 'Cash Flow Velocity',
  category: 'Liquidity',
  context: 'general',
  content:
    'Cash flow velocity measures how quickly your investment generates returns. Positive monthly cash flow compounds into larger reserves, creating optionality for reinvestment or distribution.',
}

export function getLiquiditySnippets(): Array<LearningSnippet> {
  return [portfolioCashSnippet, liquidAvailableSnippet, cashFlowVelocitySnippet]
}

// =============================================================================
// FINANCIAL PULSE SNIPPETS
// =============================================================================

export const monthlyNetFlowSnippet: LearningSnippet = {
  id: 'monthly-net-flow',
  title: 'Monthly Net Flow',
  category: 'Cash Flow',
  context: 'general',
  content:
    'Monthly net flow is your actual cash position after all income and expenses. Positive flow builds reserves and equity; negative flow depletes your investment. Track this monthly to catch trends early.',
}

export const grossIncomeMetricSnippet: LearningSnippet = {
  id: 'gross-income-metric',
  title: 'Gross Income',
  category: 'Cash Flow',
  context: 'general',
  content:
    'Gross income is your total rental revenue before any expenses. Compare to market rents to identify upside potential. If you are significantly below market, consider lease renewals at higher rates.',
}

export const opexSnippet: LearningSnippet = {
  id: 'opex',
  title: 'What is OpEx?',
  category: 'Cash Flow',
  context: 'general',
  content:
    'OpEx (Operating Expenses) are the recurring costs to maintain and operate your property. This includes property taxes, insurance, property management fees, HOA dues, maintenance, repairs, and utilities you pay. OpEx does NOT include debt service (mortgage payments) or capital expenditures (major improvements). Tracking OpEx separately helps you understand true property performance independent of financing.',
}

export const expenseRatioSnippet: LearningSnippet = {
  id: 'expense-ratio',
  title: 'Understanding Expense Ratios',
  category: 'Cash Flow',
  context: 'general',
  content:
    'Your expense ratio (OPEX + Debt as % of income) shows operational efficiency. Below 70% is healthy for residential; 80%+ indicates stress. High ratios may require rent increases or expense reduction.',
}

export function getFinancialPulseSnippets(): Array<LearningSnippet> {
  return [
    monthlyNetFlowSnippet,
    grossIncomeMetricSnippet,
    opexSnippet,
    expenseRatioSnippet,
  ]
}
