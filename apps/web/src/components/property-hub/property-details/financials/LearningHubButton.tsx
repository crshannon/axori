import { IconButton } from '@axori/ui'
import { Brain } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { LearningSnippet } from '@/data/learning-hub/types'
import { LearningHubDrawer } from '@/components/drawers/LearningHubDrawer'

interface LearningHubButtonProps {
  snippets: Array<LearningSnippet>
  title: string
  subtitle: string
  componentKey: string // Unique identifier for localStorage tracking (e.g., 'operating-core', 'acquisition-intel')
}

/**
 * LearningHubButton - Reusable button component for opening Learning Hub drawers
 *
 * Handles all state management for opened/dismissed state, pulse animation,
 * and drawer display. Can be dropped into any component header.
 */
export const LearningHubButton = ({
  snippets,
  title,
  subtitle,
  componentKey,
}: LearningHubButtonProps) => {
  const [isLearningDrawerOpen, setIsLearningDrawerOpen] = useState(false)
  const [hasDismissedLearning, setHasDismissedLearning] = useState(false)
  const [hasOpenedLearning, setHasOpenedLearning] = useState(false)

  // Component-specific localStorage key
  const learningHubKey = `axori:learning-hub:opened:${componentKey}`

  // Check if user has dismissed learning globally or opened for this component
  useEffect(() => {
    const dismissed =
      localStorage.getItem('axori:learning-hub:dismissed') === 'true'
    const opened = localStorage.getItem(learningHubKey) === 'true'
    setHasDismissedLearning(dismissed)
    setHasOpenedLearning(opened)
  }, [learningHubKey])

  // Check if learning should pulse (not dismissed, not opened, not currently open, and has snippets)
  const shouldPulseLearning =
    !hasDismissedLearning &&
    !hasOpenedLearning &&
    !isLearningDrawerOpen &&
    snippets.length > 0

  const handleOpenLearning = () => {
    setIsLearningDrawerOpen(true)
  }

  const handleCloseLearning = () => {
    setIsLearningDrawerOpen(false)
    // Mark as opened after viewing
    localStorage.setItem(learningHubKey, 'true')
    setHasOpenedLearning(true)
  }

  // Don't render if dismissed globally or no snippets
  if (hasDismissedLearning || snippets.length === 0) {
    return null
  }

  return (
    <>
      <IconButton
        icon={Brain}
        size="sm"
        variant="ghost"
        shape="circle"
        animation={shouldPulseLearning ? 'pulse' : 'none'}
        onClick={handleOpenLearning}
        aria-label="Open Learning Hub"
        className={
          hasOpenedLearning
            ? 'text-indigo-400/50 hover:text-indigo-500/70 dark:text-indigo-500/40 dark:hover:text-indigo-400/60'
            : 'text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300'
        }
      />
      <LearningHubDrawer
        isOpen={isLearningDrawerOpen}
        onClose={handleCloseLearning}
        snippets={snippets}
        title={title}
        subtitle={subtitle}
      />
    </>
  )
}
