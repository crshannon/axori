/**
 * Learning Hub - Settings Learning Snippets
 *
 * These snippets provide contextual learning content for the Property Settings page
 * and related configuration features. They're displayed in the Learning Hub drawer.
 */

import type { LearningSnippet } from './types'

/**
 * Asset Configuration Snippets
 */

export const propertyTypeSnippet: LearningSnippet = {
  id: 'property-type',
  title: 'Understanding Property Types',
  category: 'Asset Configuration',
  context: 'asset-configuration',
  content:
    'Property type affects tax calculations, depreciation schedules, and financing options. Single-family properties typically have simpler management, while multi-family and commercial properties offer different risk/return profiles and operational complexity.',
}

export const taxJurisdictionSnippet: LearningSnippet = {
  id: 'tax-jurisdiction',
  title: 'Tax Jurisdiction Impact',
  category: 'Asset Configuration',
  context: 'asset-configuration',
  content:
    'Tax jurisdiction determines your property tax rate, assessment methodology, and appeal processes. Different jurisdictions have varying tax rates, exemptions, and assessment cycles. Accurate jurisdiction data ensures proper tax planning and budgeting.',
}

export const currencyOverrideSnippet: LearningSnippet = {
  id: 'currency-override',
  title: 'Currency Override for International Properties',
  category: 'Asset Configuration',
  context: 'asset-configuration',
  content:
    'Currency override allows you to track properties in their local currency while maintaining portfolio-level reporting in your base currency. This is essential for international portfolios to accurately reflect local market conditions and exchange rate impacts.',
}

/**
 * Acquisition Metadata Snippets
 */

export const purchasePriceSnippet: LearningSnippet = {
  id: 'purchase-price',
  title: 'Purchase Price and Basis',
  category: 'Acquisition',
  context: 'acquisition-metadata',
  content:
    'Purchase price establishes your cost basis for depreciation, capital gains calculations, and ROI metrics. Include all acquisition costs (closing costs, improvements at purchase) in your basis for accurate tax and financial reporting.',
}

export const closingDateSnippet: LearningSnippet = {
  id: 'closing-date',
  title: 'Closing Date Significance',
  category: 'Acquisition',
  context: 'acquisition-metadata',
  content:
    'Closing date determines when you take ownership, when depreciation begins, and affects your first-year tax deductions. It also impacts rent collection timing and operational start date for financial projections.',
}

export const yearBuiltSnippet: LearningSnippet = {
  id: 'year-built',
  title: 'Year Built and Depreciation',
  category: 'Acquisition',
  context: 'acquisition-metadata',
  content:
    'Year built affects depreciation schedules, maintenance expectations, and property value assessments. Older properties may have different depreciation methods and typically require higher maintenance reserves. This data is also used for insurance and appraisal purposes.',
}

/**
 * Calculation Presumptions Snippets
 */

export const vacancyRateSnippet: LearningSnippet = {
  id: 'vacancy-rate',
  title: 'Vacancy Reserve Planning',
  category: 'Financial Presumptions',
  context: 'calculation-presumptions',
  content:
    'Vacancy rate is the percentage of time your property is expected to be unoccupied. Typical rates range from 3-8% depending on market conditions, property type, and location. Higher vacancy rates provide more conservative cash flow projections and better prepare you for market downturns.',
}

export const maintenanceRateSnippet: LearningSnippet = {
  id: 'maintenance-rate',
  title: 'Maintenance Reserve Strategy',
  category: 'Financial Presumptions',
  context: 'calculation-presumptions',
  content:
    'Maintenance reserves are typically 5-10% of rental income, depending on property age and condition. Older properties require higher reserves. This reserve covers routine repairs, replacements, and unexpected maintenance to protect cash flow and property value.',
}

export const expenseInflationSnippet: LearningSnippet = {
  id: 'expense-inflation',
  title: 'Expense Inflation Projections',
  category: 'Financial Presumptions',
  context: 'calculation-presumptions',
  content:
    'Expense inflation accounts for rising costs over time (typically 2-4% annually). This includes property taxes, insurance, maintenance costs, and management fees. Accurate inflation assumptions are critical for long-term cash flow projections and investment planning.',
}

export const capexSinkingSnippet: LearningSnippet = {
  id: 'capex-sinking',
  title: 'Capital Expenditure Sinking Fund',
  category: 'Financial Presumptions',
  context: 'calculation-presumptions',
  content:
    'CapEx sinking funds set aside money for major capital improvements (roofs, HVAC, appliances, structural repairs). Typically $2,000-$5,000 annually per unit, depending on property age and condition. Proper CapEx planning prevents cash flow surprises and maintains property value.',
}

/**
 * Asset DNA Calibration Snippets
 */

export const yieldMaximizationSnippet: LearningSnippet = {
  id: 'yield-maximization',
  title: 'Yield Maximization Strategy',
  category: 'Investment Strategy',
  context: 'asset-dna-calibration',
  content:
    'Yield maximization focuses on maximizing current cash flow and rental income. This strategy prioritizes properties with high rental yields, efficient operations, and strong cash-on-cash returns. Ideal for investors seeking immediate income and cash flow stability.',
}

export const equityGrowthSnippet: LearningSnippet = {
  id: 'equity-growth',
  title: 'Equity Growth Strategy',
  category: 'Investment Strategy',
  context: 'asset-dna-calibration',
  content:
    'Equity growth strategy focuses on long-term appreciation and equity building. This approach may accept lower current yields in favor of properties in appreciating markets, with potential for value-add improvements and market appreciation over time.',
}

export const capitalRecirculationSnippet: LearningSnippet = {
  id: 'capital-recirculation',
  title: 'Capital Recirculation Strategy',
  category: 'Investment Strategy',
  context: 'asset-dna-calibration',
  content:
    'Capital recirculation strategy focuses on recycling equity through refinancing and sales to fund additional acquisitions. This approach maximizes portfolio growth by leveraging appreciation and cash flow to acquire more properties, building wealth through scale.',
}

/**
 * Notification Settings Snippets
 */

export const emailNotificationsSnippet: LearningSnippet = {
  id: 'email-notifications',
  title: 'Email Notification Strategy',
  category: 'Notifications',
  context: 'notification-engine',
  content:
    'Email notifications provide comprehensive updates including weekly P&L summaries, monthly financial reports, and important property events. Ideal for detailed analysis and record-keeping. Configure email frequency to match your review schedule without overwhelming your inbox.',
}

export const smsNotificationsSnippet: LearningSnippet = {
  id: 'sms-notifications',
  title: 'SMS for Urgent Alerts',
  category: 'Notifications',
  context: 'notification-engine',
  content:
    'SMS notifications are best reserved for urgent operational emergencies like maintenance issues, tenant problems, or critical system alerts. Keep SMS alerts minimal to ensure you respond quickly when truly important events occur.',
}

export const pushNotificationsSnippet: LearningSnippet = {
  id: 'push-notifications',
  title: 'Push Notifications for Real-Time Updates',
  category: 'Notifications',
  context: 'notification-engine',
  content:
    'Push notifications provide real-time updates on legal climate shifts, zoning changes, regulatory updates, and market conditions. These alerts help you stay informed about external factors that could impact your property value or operations.',
}

/**
 * Get learning snippets for asset configuration
 */
export function getAssetConfigurationSnippets(): Array<LearningSnippet> {
  return [propertyTypeSnippet, taxJurisdictionSnippet, currencyOverrideSnippet]
}

/**
 * Get learning snippets for acquisition metadata
 */
export function getAcquisitionMetadataSnippets(): Array<LearningSnippet> {
  return [purchasePriceSnippet, closingDateSnippet, yearBuiltSnippet]
}

/**
 * Get learning snippets for calculation presumptions
 */
export function getCalculationPresumptionsSnippets(): Array<LearningSnippet> {
  return [
    vacancyRateSnippet,
    maintenanceRateSnippet,
    expenseInflationSnippet,
    capexSinkingSnippet,
  ]
}

/**
 * Get learning snippets for asset DNA calibration
 */
export function getAssetDnaSnippets(): Array<LearningSnippet> {
  return [yieldMaximizationSnippet, equityGrowthSnippet, capitalRecirculationSnippet]
}

/**
 * Get learning snippets for notification settings
 */
export function getNotificationSettingsSnippets(): Array<LearningSnippet> {
  return [emailNotificationsSnippet, smsNotificationsSnippet, pushNotificationsSnippet]
}

/**
 * Generate contextual learning content for Settings page
 * Can be enhanced with property-specific data in the future
 */
export function generateSettingsLearning(
  propertyType?: string,
  hasInternationalProperties?: boolean,
): Array<LearningSnippet> {
  const snippets: Array<LearningSnippet> = []

  // Always include general configuration snippets
  snippets.push(...getAssetConfigurationSnippets())

  // Add currency override snippet if relevant
  if (hasInternationalProperties) {
    snippets.push(currencyOverrideSnippet)
  }

  return snippets
}
