import type { ReactNode } from 'react'

/**
 * LearningSnippet - Shared type for all learning hub snippets
 *
 * This type is used across all learning hub snippet files to ensure
 * type compatibility when passing snippets to LearningHubButton.
 */
export interface LearningSnippet {
  id: string
  title: string
  category: string
  content: string | ReactNode
  context?:
    | 'debt-logic'
    | 'acquisition'
    | 'operating-core'
    | 'tax-shield'
    | 'general'
    | 'asset-configuration'
    | 'acquisition-metadata'
    | 'asset-dna-calibration'
    | 'calculation-presumptions'
    | 'notification-engine'
  /** Link to full glossary entry for "Learn More" functionality */
  glossarySlug?: string
}
