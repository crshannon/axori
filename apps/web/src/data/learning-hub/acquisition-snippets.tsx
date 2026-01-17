/**
 * Learning Hub - Acquisition Learning Snippets
 *
 * These snippets provide contextual learning content for the AcquisitionIntel component
 * and related property acquisition features. They're displayed in the Learning Hub drawer.
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
 * Current Basis Snippet
 */
export const currentBasisSnippet: LearningSnippet = {
  id: 'current-basis',
  title: 'Understanding Current Basis',
  category: 'Acquisition Strategy',
  context: 'acquisition',
  content:
    'Your current basis is the total cost basis of the property including purchase price, closing costs, and improvements. This is critical for calculating depreciation, capital gains, and tax implications when you sell.',
}

/**
 * Equity Velocity Snippet
 */
export const equityVelocitySnippet: LearningSnippet = {
  id: 'equity-velocity',
  title: 'Equity Velocity Explained',
  category: 'Acquisition Strategy',
  context: 'acquisition',
  content:
    'Equity velocity measures how quickly your equity is growing. It combines appreciation and principal paydown. Higher equity velocity means you\'re building wealth faster and may be able to leverage that equity for additional acquisitions.',
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
    'Closing costs are part of your basis and reduce your immediate equity, but they\'re typically 2-5% of purchase price. These include lender fees, title insurance, inspections, and escrow fees. Track these to understand your true acquisition cost.',
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
): Array<LearningSnippet> {
  const snippets = getAcquisitionLearningSnippets()

  // Enhance current basis snippet with contextual data
  if (currentBasis !== null) {
    const enhancedBasisSnippet: LearningSnippet = {
      ...currentBasisSnippet,
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            Your current basis is{' '}
            <strong className="text-slate-900 dark:text-white">
              ${currentBasis.toLocaleString()}
            </strong>
            . This includes your purchase price, closing costs, and any improvements.
          </p>
          <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
              Why it matters:
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 italic">
              Your basis determines depreciation deductions, capital gains calculations, and your
              true equity position. Higher basis means more depreciation benefits but less potential
              for appreciation-based equity growth.
            </p>
          </div>
        </div>
      ),
    }

    // Enhance unrealized gain snippet if we have both value and basis
    if (currentValue !== null && unrealizedGain !== null) {
      const gainPercentage = currentBasis > 0 ? (unrealizedGain / currentBasis) * 100 : 0
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

      return [
        enhancedBasisSnippet,
        enhancedGainSnippet,
        ...snippets.filter(
          (s) => s.id !== 'current-basis' && s.id !== 'unrealized-gain',
        ),
      ]
    }

    return [
      enhancedBasisSnippet,
      ...snippets.filter((s) => s.id !== 'current-basis'),
    ]
  }

  return snippets
}

