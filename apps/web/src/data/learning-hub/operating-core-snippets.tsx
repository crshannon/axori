/**
 * Learning Hub - Operating Core Learning Snippets
 *
 * These snippets provide contextual learning content for the OperatingCore component
 * and related property operations features. They're displayed in the Learning Hub drawer.
 */

import type { LearningSnippet } from './types'

/**
 * NOI (Net Operating Income) Snippet
 */
export const noiSnippet: LearningSnippet = {
  id: 'noi',
  title: 'Understanding Net Operating Income',
  category: 'Operations',
  context: 'operating-core',
  glossarySlug: 'net-operating-income',
  content:
    "NOI is your property's income after operating expenses but before financing costs and taxes. It's the true measure of property performance. Higher NOI means more cash flow available for debt service, reserves, and profit.",
}

/**
 * Yield Efficiency Snippet
 */
export const yieldEfficiencySnippet: LearningSnippet = {
  id: 'yield-efficiency',
  title: 'Yield Efficiency Explained',
  category: 'Operations',
  context: 'operating-core',
  content:
    'Yield efficiency (NOI / Current Value) shows your return on invested capital. Higher yields indicate better-performing properties relative to their value. Compare yield efficiency across properties to identify your best performers.',
}

/**
 * CapEx Reserve Snippet
 */
export const capexReserveSnippet: LearningSnippet = {
  id: 'capex-reserve',
  title: 'Capital Expenditure Reserves',
  category: 'Operations',
  context: 'operating-core',
  glossarySlug: 'capex-reserve',
  content:
    'CapEx reserves are funds set aside for major repairs and replacements (roofs, HVAC, appliances). Typically 5-10% of rental income. Proper reserves prevent cash flow surprises and protect your investment value.',
}

/**
 * Fixed Expenses Snippet
 */
export const fixedExpensesSnippet: LearningSnippet = {
  id: 'fixed-expenses',
  title: 'Fixed vs Variable Expenses',
  category: 'Operations',
  context: 'operating-core',
  glossarySlug: 'operating-expenses',
  content:
    "Fixed expenses are recurring costs that don't vary with occupancy (property taxes, insurance, management fees). Variable expenses fluctuate with use (utilities, repairs, maintenance). Understanding this helps with cash flow planning.",
}

/**
 * Gross Income Snippet
 */
export const grossIncomeSnippet: LearningSnippet = {
  id: 'gross-income',
  title: 'Gross Rental Income',
  category: 'Operations',
  context: 'operating-core',
  glossarySlug: 'gross-rental-income',
  content:
    "Gross income is your total rental income before expenses. Market-adjusted rent reflects current market rates, not just what you're collecting. Use this for projections and when evaluating refinancing or selling.",
}

/**
 * Get learning snippets for operating core context
 */
export function getOperatingCoreLearningSnippets(): Array<LearningSnippet> {
  return [
    noiSnippet,
    yieldEfficiencySnippet,
    capexReserveSnippet,
    fixedExpensesSnippet,
    grossIncomeSnippet,
  ]
}

/**
 * Generate contextual learning content for OperatingCore component
 */
export function generateOperatingCoreLearning(
  noi: number | null,
  grossIncome: number | null,
  margin: number | null,
  currentValue: number | null,
): Array<LearningSnippet> {
  const snippets = getOperatingCoreLearningSnippets()

  // Enhance NOI snippet with contextual data
  if (noi !== null) {
    const enhancedNoiSnippet: LearningSnippet = {
      ...noiSnippet,
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            Your property's NOI is{' '}
            <strong className="text-slate-900 dark:text-white">
              ${noi.toLocaleString()}
            </strong>
            {grossIncome !== null && (
              <>
                {' '}
                from <strong>${grossIncome.toLocaleString()}</strong> in gross
                income.
              </>
            )}
          </p>
          <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
              Why it matters:
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 italic">
              NOI determines how much cash flow you have after operations but
              before debt service and taxes. A strong NOI means you can
              comfortably cover your loan payments and build reserves.
            </p>
          </div>
        </div>
      ),
    }

    // Enhance yield efficiency snippet if we have margin and value
    if (margin !== null && currentValue !== null) {
      const enhancedYieldSnippet: LearningSnippet = {
        ...yieldEfficiencySnippet,
        content: (
          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300">
              Your yield efficiency is{' '}
              <strong className="text-slate-900 dark:text-white">
                {margin.toFixed(1)}%
              </strong>
              . This means you're earning {margin.toFixed(1)}% on a property
              valued at <strong>${currentValue.toLocaleString()}</strong>.
            </p>
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                Strategy:
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                {margin >= 8
                  ? 'Excellent yield! You have a high-performing property. Consider if this equity could be better deployed in additional acquisitions.'
                  : margin >= 6
                    ? 'Solid yield. Your property is performing well. Focus on maintaining occupancy and controlling expenses.'
                    : 'Lower yield indicates either high expenses or overvaluation. Review expenses and consider if the property meets your return targets.'}
              </p>
            </div>
          </div>
        ),
      }

      return [
        enhancedNoiSnippet,
        enhancedYieldSnippet,
        ...snippets.filter(
          (s) => s.id !== 'noi' && s.id !== 'yield-efficiency',
        ),
      ]
    }

    return [enhancedNoiSnippet, ...snippets.filter((s) => s.id !== 'noi')]
  }

  return snippets
}
