/**
 * Learning Hub - Loan Learning Snippets
 *
 * These snippets provide contextual learning content for the Debt Logic component
 * and related loan features. They're displayed in the Learning Hub drawer.
 */

import type { ReactNode } from 'react'

export interface LearningSnippet {
  id: string
  title: string
  category: string
  content: string | ReactNode
  context?: 'debt-logic' | 'acquisition' | 'operating-core' | 'general'
}

/**
 * Refinancing Strategy Snippet
 * Contextual learning for the Debt Logic component's refinancing benchmark
 */
export const refinancingStrategySnippet: LearningSnippet = {
  id: 'refi-strategy',
  title: 'Refinancing Strategy',
  category: 'Debt Management',
  context: 'debt-logic',
  content:
    'Understanding when to refinance is crucial for maximizing returns. A refinance decision should consider your current interest rate relative to market rates, closing costs, and your long-term investment strategy.',
}

/**
 * Interest Rate Analysis Snippet
 */
export const interestRateAnalysisSnippet: LearningSnippet = {
  id: 'interest-rate-analysis',
  title: 'Interest Rate Analysis',
  category: 'Debt Management',
  context: 'debt-logic',
  content:
    'Your interest rate determines your debt service cost. Lower rates mean more cash flow. Compare your rate to market averages to identify refinancing opportunities or recognize when you have optimal debt leverage.',
}

/**
 * HELOC vs Primary Mortgage Snippet
 */
export const helocVsPrimarySnippet: LearningSnippet = {
  id: 'heloc-vs-primary',
  title: 'HELOC vs Primary Mortgage',
  category: 'Debt Management',
  context: 'debt-logic',
  content:
    'A HELOC (Home Equity Line of Credit) is a second-lien loan that allows you to access equity. Unlike a primary mortgage, HELOCs typically have variable rates and require interest-only payments during the draw period. They\'re useful for accessing equity without refinancing your primary loan.',
}

/**
 * Loan Position Snippet
 */
export const loanPositionSnippet: LearningSnippet = {
  id: 'loan-position',
  title: 'Understanding Loan Position',
  category: 'Debt Management',
  context: 'debt-logic',
  content:
    'Loan position indicates your lien priority. First position loans (primary) are paid first in foreclosure. Second position loans (like HELOCs) have higher risk but can provide access to equity without refinancing your primary mortgage.',
}

/**
 * Debt Service Coverage Snippet
 */
export const debtServiceCoverageSnippet: LearningSnippet = {
  id: 'debt-service-coverage',
  title: 'Debt Service Coverage',
  category: 'Debt Management',
  context: 'debt-logic',
  content:
    'Debt service is your total monthly loan payments (principal, interest, escrow, PMI). This is a key metric for cash flow analysis. Lower debt service means more cash flow available for operations, reserves, or new acquisitions.',
}

/**
 * Get learning snippets for a specific context
 */
export function getLearningSnippets(
  context: LearningSnippet['context'] = 'general',
): Array<LearningSnippet> {
  const allSnippets: Array<LearningSnippet> = [
    refinancingStrategySnippet,
    interestRateAnalysisSnippet,
    helocVsPrimarySnippet,
    loanPositionSnippet,
    debtServiceCoverageSnippet,
  ]

  return context === 'general'
    ? allSnippets
    : allSnippets.filter((snippet) => snippet.context === context)
}

/**
 * Generate contextual learning content for Debt Logic component
 */
export function generateDebtLogicLearning(
  primaryLoanRate: number | null,
  marketAverageRate: number,
): Array<LearningSnippet> {
  const snippets = getLearningSnippets('debt-logic')

  // Enhance refinancing strategy snippet with contextual data
  if (primaryLoanRate !== null) {
    const isLowRate = primaryLoanRate < marketAverageRate
    const enhancedRefiSnippet: LearningSnippet = {
      ...refinancingStrategySnippet,
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            {isLowRate
              ? `Your current rate of ${primaryLoanRate.toFixed(2)}% is below the market average of ${marketAverageRate}%. This is optimal debt leverage.`
              : `Your current rate of ${primaryLoanRate.toFixed(2)}% is above the market average of ${marketAverageRate}%. Consider refinancing when rates drop.`}
          </p>
          <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
              Strategy:
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 italic">
              {isLowRate
                ? `Your ${primaryLoanRate.toFixed(2)}% rate is high-value leverage. Do not refinance unless pull-out equity is required for next acquisition.`
                : `Your ${primaryLoanRate.toFixed(2)}% rate is above market average. Consider refinancing when rates drop or if you need to pull equity for your next acquisition.`}
            </p>
          </div>
        </div>
      ),
    }
    return [enhancedRefiSnippet, ...snippets.filter((s) => s.id !== 'refi-strategy')]
  }

  return snippets
}

