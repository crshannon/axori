/**
 * Learning Hub - Acquisition Learning Snippets
 *
 * These snippets provide contextual learning content for the AcquisitionIntel component
 * and related property acquisition features. They're displayed in the Learning Hub drawer.
 */

import type { LearningSnippet } from './types'

/**
 * Current Basis Snippet
 */
export const currentBasisSnippet: LearningSnippet = {
  id: 'current-basis',
  title: 'Understanding Current Basis',
  category: 'Acquisition Strategy',
  context: 'acquisition',
  content: (
    <div className="space-y-4">
      <p className="text-slate-700 dark:text-slate-300">
        <strong>Current Basis</strong> (also called "Cost Basis" or "Tax Basis") is the total amount you've invested in the property for tax and accounting purposes.
      </p>
      <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
          How it's calculated:
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
          <strong>Current Basis = Purchase Price + Closing Costs</strong>
        </p>
        <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside ml-2">
          <li>Purchase Price: The amount you paid for the property</li>
          <li>Closing Costs: Lender fees, title insurance, inspections, escrow fees (typically 2-5% of purchase price)</li>
        </ul>
      </div>
      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
          Why it matters:
        </p>
        <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside ml-2">
          <li><strong>Depreciation:</strong> Your basis (minus land value) determines how much you can depreciate each year</li>
          <li><strong>Capital Gains:</strong> When you sell, your profit = Sale Price - Current Basis</li>
          <li><strong>Tax Strategy:</strong> Higher basis means more depreciation deductions but less appreciation-based equity growth</li>
        </ul>
      </div>
    </div>
  ),
}

/**
 * Current Equity Snippet
 */
export const currentEquitySnippet: LearningSnippet = {
  id: 'current-equity',
  title: 'Understanding Current Equity',
  category: 'Acquisition Strategy',
  context: 'acquisition',
  content: (
    <div className="space-y-4">
      <p className="text-slate-700 dark:text-slate-300">
        <strong>Current Equity</strong> is the portion of the property you actually own - it's your stake in the property after accounting for any outstanding loans.
      </p>
      <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
        <p className="text-sm font-semibold text-violet-900 dark:text-violet-100 mb-2">
          How it's calculated:
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
          <strong>Current Equity = Current Property Value - Total Outstanding Loan Amount</strong>
        </p>
        <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside ml-2">
          <li>Current Property Value: The property's current market value (from valuation or acquisition data)</li>
          <li>Total Outstanding Loan Amount: The remaining balance on your primary active loan</li>
        </ul>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 italic">
          Example: If your property is worth $500,000 and you have a $350,000 loan, your equity is $150,000 (30%).
        </p>
      </div>
      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
          Why it matters:
        </p>
        <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside ml-2">
          <li><strong>Your Ownership:</strong> Equity represents your actual stake in the property</li>
          <li><strong>Leverage Potential:</strong> Higher equity can be used for refinancing or securing additional loans</li>
          <li><strong>Risk Assessment:</strong> More equity means less leverage and lower risk</li>
          <li><strong>Exit Strategy:</strong> Equity determines how much cash you'd receive if you sold</li>
        </ul>
      </div>
    </div>
  ),
}

/**
 * Equity Velocity Snippet
 */
export const equityVelocitySnippet: LearningSnippet = {
  id: 'equity-velocity',
  title: 'Equity Velocity Explained',
  category: 'Acquisition Strategy',
  context: 'acquisition',
  content: (
    <div className="space-y-4">
      <p className="text-slate-700 dark:text-slate-300">
        <strong>Equity Velocity</strong> measures how quickly your property's value is growing relative to what you paid for it. It shows the percentage change in value since purchase.
      </p>
      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
          How it's calculated:
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
          <strong>Equity Velocity = ((Current Value - Purchase Price) / Purchase Price) × 100%</strong>
        </p>
        <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside ml-2">
          <li>Current Value: The property's current market value</li>
          <li>Purchase Price: What you originally paid for the property</li>
        </ul>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 italic">
          Example: If you bought for $400,000 and it's now worth $500,000, your equity velocity is +25%.
        </p>
      </div>
      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
          Why it matters:
        </p>
        <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside ml-2">
          <li><strong>Performance Tracking:</strong> Shows how well your investment is appreciating</li>
          <li><strong>Market Comparison:</strong> Compare velocity across properties to see which are outperforming</li>
          <li><strong>Strategic Decisions:</strong> High velocity might indicate a good time to refinance or sell</li>
          <li><strong>Portfolio Growth:</strong> Higher velocity means you're building wealth faster</li>
        </ul>
      </div>
      <div className="p-4 rounded-lg bg-slate-500/10 border border-slate-500/20">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Note:
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Equity Velocity reflects <strong>appreciation only</strong> - it doesn't include principal paydown from loan payments. Your actual equity growth combines both appreciation (velocity) and principal reduction.
        </p>
      </div>
    </div>
  ),
}

/**
 * Closing Costs Snippet
 */
export const closingCostsSnippet: LearningSnippet = {
  id: 'closing-costs',
  title: 'Closing Costs Impact',
  category: 'Acquisition Strategy',
  context: 'acquisition',
  content:
    "Closing costs are part of your basis and reduce your immediate equity, but they're typically 2-5% of purchase price. These include lender fees, title insurance, inspections, and escrow fees. Track these to understand your true acquisition cost.",
}

/**
 * Unrealized Gain Snippet
 */
export const unrealizedGainSnippet: LearningSnippet = {
  id: 'unrealized-gain',
  title: 'Unrealized vs Realized Gains',
  category: 'Acquisition Strategy',
  context: 'acquisition',
  content:
    'Unrealized gains show your paper profit (current value minus basis). These become realized gains only when you sell. Understanding unrealized gains helps you make decisions about holding vs selling, but remember you haven\'t "made" the money until you sell.',
}

/**
 * Acquisition Method Snippet
 */
export const acquisitionMethodSnippet: LearningSnippet = {
  id: 'acquisition-method',
  title: 'Acquisition Methods & Strategy',
  category: 'Acquisition Strategy',
  context: 'acquisition',
  content:
    'Different acquisition methods (traditional, wholesaling, auctions, off-market) have different cost structures, risks, and timelines. Traditional purchases offer more due diligence time but may have higher competition and prices.',
}

/**
 * Get learning snippets for acquisition context
 */
export function getAcquisitionLearningSnippets(): Array<LearningSnippet> {
  return [
    currentEquitySnippet,
    currentBasisSnippet,
    equityVelocitySnippet,
    closingCostsSnippet,
    unrealizedGainSnippet,
    acquisitionMethodSnippet,
  ]
}

/**
 * Generate contextual learning content for AcquisitionIntel component
 */
export function generateAcquisitionLearning(
  currentBasis: number | null,
  currentValue: number | null,
  unrealizedGain: number | null,
  purchasePrice?: number | null,
): Array<LearningSnippet> {
  const snippets = getAcquisitionLearningSnippets()

  // Enhance snippets with contextual data when available
  const enhancedSnippets: Array<LearningSnippet> = []

  // Enhance current equity snippet if we have value
  if (currentValue !== null) {
    const enhancedEquitySnippet: LearningSnippet = {
      ...currentEquitySnippet,
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            <strong>Current Equity</strong> is the portion of the property you actually own - it's your stake in the property after accounting for any outstanding loans.
          </p>
          <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <p className="text-sm font-semibold text-violet-900 dark:text-violet-100 mb-2">
              How it's calculated:
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              <strong>Current Equity = Current Property Value - Total Outstanding Loan Amount</strong>
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Your property's current value is{' '}
              <strong className="text-slate-900 dark:text-white">
                ${currentValue.toLocaleString()}
              </strong>
              . Subtract your loan balance to see your equity.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
              Why it matters:
            </p>
            <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside ml-2">
              <li><strong>Your Ownership:</strong> Equity represents your actual stake in the property</li>
              <li><strong>Leverage Potential:</strong> Higher equity can be used for refinancing or securing additional loans</li>
              <li><strong>Risk Assessment:</strong> More equity means less leverage and lower risk</li>
              <li><strong>Exit Strategy:</strong> Equity determines how much cash you'd receive if you sold</li>
            </ul>
          </div>
        </div>
      ),
    }
    enhancedSnippets.push(enhancedEquitySnippet)
  } else {
    enhancedSnippets.push(currentEquitySnippet)
  }

  // Enhance current basis snippet with contextual data
  if (currentBasis !== null) {
    const enhancedBasisSnippet: LearningSnippet = {
      ...currentBasisSnippet,
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            <strong>Current Basis</strong> (also called "Cost Basis" or "Tax Basis") is the total amount you've invested in the property for tax and accounting purposes.
          </p>
          <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
              How it's calculated:
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              <strong>Current Basis = Purchase Price + Closing Costs</strong>
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Your current basis is{' '}
              <strong className="text-slate-900 dark:text-white">
                ${currentBasis.toLocaleString()}
              </strong>
              . This includes your purchase price, closing costs, and any improvements.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
              Why it matters:
            </p>
            <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside ml-2">
              <li><strong>Depreciation:</strong> Your basis (minus land value) determines how much you can depreciate each year</li>
              <li><strong>Capital Gains:</strong> When you sell, your profit = Sale Price - Current Basis</li>
              <li><strong>Tax Strategy:</strong> Higher basis means more depreciation deductions but less potential for appreciation-based equity growth</li>
            </ul>
          </div>
        </div>
      ),
    }
    enhancedSnippets.push(enhancedBasisSnippet)
  } else {
    enhancedSnippets.push(currentBasisSnippet)
  }

  // Enhance equity velocity snippet if we have both value and purchase price
  if (currentValue !== null && purchasePrice !== null && purchasePrice > 0) {
    const velocity = ((currentValue - purchasePrice) / purchasePrice) * 100
    
    if (!isNaN(velocity) && isFinite(velocity)) {
      const enhancedVelocitySnippet: LearningSnippet = {
        ...equityVelocitySnippet,
        content: (
          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300">
              <strong>Equity Velocity</strong> measures how quickly your property's value is growing relative to what you paid for it.
            </p>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                How it's calculated:
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                <strong>Equity Velocity = ((Current Value - Purchase Price) / Purchase Price) × 100%</strong>
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                With a current value of{' '}
                <strong>${currentValue.toLocaleString()}</strong> and purchase price of{' '}
                <strong>${purchasePrice.toLocaleString()}</strong>, your equity velocity is{' '}
                <strong className={velocity >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                  {velocity >= 0 ? '+' : ''}{velocity.toFixed(1)}%
                </strong>
                .
              </p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                Why it matters:
              </p>
              <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside ml-2">
                <li><strong>Performance Tracking:</strong> Shows how well your investment is appreciating</li>
                <li><strong>Market Comparison:</strong> Compare velocity across properties to see which are outperforming</li>
                <li><strong>Strategic Decisions:</strong> High velocity might indicate a good time to refinance or sell</li>
                <li><strong>Portfolio Growth:</strong> Higher velocity means you're building wealth faster</li>
              </ul>
            </div>
          </div>
        ),
      }
      enhancedSnippets.push(enhancedVelocitySnippet)
    } else {
      enhancedSnippets.push(equityVelocitySnippet)
    }
  } else {
    enhancedSnippets.push(equityVelocitySnippet)
  }

  // Enhance unrealized gain snippet if we have both value and basis
  if (currentValue !== null && unrealizedGain !== null && currentBasis !== null) {
    const gainPercentage =
      currentBasis > 0 ? (unrealizedGain / currentBasis) * 100 : 0
    const enhancedGainSnippet: LearningSnippet = {
      ...unrealizedGainSnippet,
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            Your unrealized gain is{' '}
            <strong className="text-slate-900 dark:text-white">
              ${unrealizedGain.toLocaleString()}
            </strong>{' '}
            ({gainPercentage.toFixed(1)}% return). Current value:{' '}
            <strong>${currentValue.toLocaleString()}</strong>
          </p>
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
              Strategy:
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 italic">
              {unrealizedGain > 0
                ? 'You have paper gains. Consider whether to hold for more appreciation, sell to realize gains, or refinance to pull equity for your next acquisition.'
                : 'You may be underwater or at break-even. Focus on improving cash flow and operations while waiting for market appreciation.'}
            </p>
          </div>
        </div>
      ),
    }
    enhancedSnippets.push(enhancedGainSnippet)
  } else {
    enhancedSnippets.push(unrealizedGainSnippet)
  }

  // Add remaining snippets
  enhancedSnippets.push(closingCostsSnippet, acquisitionMethodSnippet)

  return enhancedSnippets
}
