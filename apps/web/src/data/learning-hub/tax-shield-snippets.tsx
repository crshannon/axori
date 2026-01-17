/**
 * Learning Hub - Tax Shield Learning Snippets
 *
 * These snippets provide contextual learning content for the TaxShieldIntel component
 * and related tax strategy features. They're displayed in the Learning Hub drawer.
 */

import type { ReactNode } from 'react'

export interface LearningSnippet {
  id: string
  title: string
  category: string
  content: string | ReactNode
  context?: 'debt-logic' | 'acquisition' | 'operating-core' | 'tax-shield' | 'general'
}

/**
 * Depreciation Snippet
 */
export const depreciationSnippet: LearningSnippet = {
  id: 'depreciation',
  title: 'Understanding Depreciation',
  category: 'Tax Strategy',
  context: 'tax-shield',
  content:
    'Depreciation is a non-cash expense that reduces your taxable income. Residential properties depreciate over 27.5 years, while commercial properties use 39 years. The depreciation basis is typically your purchase price (excluding land value).',
}

/**
 * Cost Segregation Snippet
 */
export const costSegregationSnippet: LearningSnippet = {
  id: 'cost-segregation',
  title: 'Cost Segregation Studies',
  category: 'Tax Strategy',
  context: 'tax-shield',
  content:
    'Cost segregation allows you to accelerate depreciation by identifying property components with shorter lifespans (5, 7, or 15 years). This front-loads depreciation deductions, reducing taxes in early years and improving cash flow.',
}

/**
 * Tax Shield Benefit Snippet
 */
export const taxShieldBenefitSnippet: LearningSnippet = {
  id: 'tax-shield-benefit',
  title: 'Tax Shield Benefits',
  category: 'Tax Strategy',
  context: 'tax-shield',
  content:
    'A tax shield is the reduction in taxable income through deductions. Higher depreciation means lower taxable income and less tax paid. This creates "phantom losses" that offset other income, effectively deferring taxes.',
}

/**
 * Unclaimed Depreciation Snippet
 */
export const unclaimedDepreciationSnippet: LearningSnippet = {
  id: 'unclaimed-depreciation',
  title: 'Unclaimed Depreciation',
  category: 'Tax Strategy',
  context: 'tax-shield',
  content:
    'Unclaimed depreciation represents potential tax savings you haven\'t yet taken. You can amend prior tax returns (up to 3 years) or carry forward unused depreciation. Tracking this helps you maximize your tax strategy.',
}

/**
 * Land Value Impact Snippet
 */
export const landValueImpactSnippet: LearningSnippet = {
  id: 'land-value-impact',
  title: 'Land Value & Depreciation',
  category: 'Tax Strategy',
  context: 'tax-shield',
  content:
    'Land cannot be depreciated, only the building and improvements. Separating land value from building value increases your depreciation basis. Work with a professional to properly allocate your purchase price.',
}

/**
 * Get learning snippets for tax shield context
 */
export function getTaxShieldLearningSnippets(): Array<LearningSnippet> {
  return [
    depreciationSnippet,
    costSegregationSnippet,
    taxShieldBenefitSnippet,
    unclaimedDepreciationSnippet,
    landValueImpactSnippet,
  ]
}

/**
 * Generate contextual learning content for TaxShieldIntel component
 */
export function generateTaxShieldLearning(
  unclaimedDepreciation: number | null,
  costSegPotential: number | null,
  depreciationBasis: number | null,
): Array<LearningSnippet> {
  const snippets = getTaxShieldLearningSnippets()

  // Enhance unclaimed depreciation snippet with contextual data
  if (unclaimedDepreciation !== null && unclaimedDepreciation > 0) {
    const enhancedUnclaimedSnippet: LearningSnippet = {
      ...unclaimedDepreciationSnippet,
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            You have{' '}
            <strong className="text-slate-900 dark:text-white">
              ${unclaimedDepreciation.toLocaleString()}
            </strong>{' '}
            in unclaimed depreciation available.
          </p>
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Action Required:
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 italic">
              Consider amending prior tax returns (up to 3 years) or ensure you're claiming this
              depreciation on your current return. This could result in significant tax savings or
              refunds.
            </p>
          </div>
        </div>
      ),
    }

    // Enhance cost segregation snippet if we have potential
    if (costSegPotential !== null && costSegPotential > 0) {
      const enhancedCostSegSnippet: LearningSnippet = {
        ...costSegregationSnippet,
        content: (
          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300">
              A cost segregation study could unlock approximately{' '}
              <strong className="text-slate-900 dark:text-white">
                ${costSegPotential.toLocaleString()}
              </strong>{' '}
              in accelerated depreciation.
            </p>
            <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                Strategy:
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                Cost segregation studies typically cost $3,000-$10,000 but can generate tens of
                thousands in tax savings. The study identifies property components that can be
                depreciated over 5, 7, or 15 years instead of 27.5/39 years.
              </p>
            </div>
          </div>
        ),
      }

      return [
        enhancedUnclaimedSnippet,
        enhancedCostSegSnippet,
        ...snippets.filter(
          (s) => s.id !== 'unclaimed-depreciation' && s.id !== 'cost-segregation',
        ),
      ]
    }

    return [
      enhancedUnclaimedSnippet,
      ...snippets.filter((s) => s.id !== 'unclaimed-depreciation'),
    ]
  }

  // Enhance depreciation basis snippet if available
  if (depreciationBasis !== null && depreciationBasis > 0) {
    const enhancedDepreciationSnippet: LearningSnippet = {
      ...depreciationSnippet,
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            Your depreciation basis is{' '}
            <strong className="text-slate-900 dark:text-white">
              ${depreciationBasis.toLocaleString()}
            </strong>
            . This is the amount you can depreciate over the property's useful life.
          </p>
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
              Annual Depreciation:
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 italic">
              For residential properties (27.5 years): $
              {Math.round(depreciationBasis / 27.5).toLocaleString()}/year. For commercial
              (39 years): ${Math.round(depreciationBasis / 39).toLocaleString()}/year.
            </p>
          </div>
        </div>
      ),
    }

    return [enhancedDepreciationSnippet, ...snippets.filter((s) => s.id !== 'depreciation')]
  }

  return snippets
}

