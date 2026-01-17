import { Button, IconButton, Typography } from '@axori/ui'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { LearningSnippet } from '@/data/learning-hub/loan-snippets'
import { cn } from '@/utils/helpers/cn'

interface LearningHubDrawerProps {
  isOpen: boolean
  onClose: () => void
  snippets: Array<LearningSnippet>
  title?: string
  subtitle?: string
}

/**
 * LearningHubDrawer - Displays contextual learning content
 *
 * This drawer shows educational snippets related to the current page/component
 * context, helping users learn about financial concepts as they work.
 *
 * Enhanced design inspired by Intelligence Hub pattern with:
 * - Fixed position slide-in animation
 * - Large typography and visual hierarchy
 * - Strategic impact sections
 * - Expert context footer
 */
export const LearningHubDrawer = ({
  isOpen,
  onClose,
  snippets,
  title = 'Learning Hub',
  subtitle = 'Financial insights and strategies',
}: LearningHubDrawerProps) => {
  // Track render state for animation
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isAnimating, setIsAnimating] = useState(false)

  // Handle mount/unmount with animation
  useEffect(() => {
    if (isOpen) {
      // Ensure the drawer is in the DOM first
      setShouldRender(true)
      // Reset animation state immediately to ensure it starts from off-screen
      setIsAnimating(false)
      // Use a combination of requestAnimationFrame and setTimeout for reliable timing
      // This ensures the DOM has updated before triggering the animation
      let timer: ReturnType<typeof setTimeout> | null = null
      const frameId = requestAnimationFrame(() => {
        timer = setTimeout(() => {
          setIsAnimating(true)
        }, 16) // ~1 frame delay for smoother animation start
      })
      return () => {
        cancelAnimationFrame(frameId)
        if (timer) clearTimeout(timer)
      }
    } else {
      setIsAnimating(false)
      const timer = setTimeout(() => setShouldRender(false), 700)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!shouldRender || snippets.length === 0) return null

  // Show first snippet (or could be enhanced to show all in a carousel/accordion)
  const activeSnippet = snippets[0]

  const drawerContent = (
    <div
      className={cn(
        'fixed top-0 right-0 h-full w-full md:w-[600px] z-[120]',
        'transition-transform duration-700 ease-in-out',
        'shadow-[-40px_0_80px_rgba(0,0,0,0.4)]',
        isAnimating ? 'translate-x-0' : 'translate-x-full',
        'bg-white dark:bg-[#0F1115]',
      )}
    >
      <div className="h-full flex flex-col p-12 overflow-y-auto no-scrollbar">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black italic text-sm bg-slate-900 dark:bg-white text-white dark:text-black">
              L
            </div>
            <div className="flex flex-col">
              <Typography
                variant="overline"
                className="text-slate-500 dark:text-slate-400 opacity-100 font-black uppercase tracking-widest"
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="caption"
                  className="text-slate-400 dark:text-slate-500 opacity-60 font-medium mt-0.5"
                >
                  {subtitle}
                </Typography>
              )}
            </div>
          </div>
          <IconButton
            icon={X}
            onClick={onClose}
            size="sm"
            variant="ghost"
            shape="rounded"
            className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 shadow-sm dark:shadow-none"
            aria-label="Close drawer"
          />
        </header>

        {/* Content */}
        <div className="space-y-12 flex-1">
          {/* Title Section */}
          <div>
            <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-sky-500/10 text-sky-500 dark:bg-sky-500/20 dark:text-sky-400 mb-6 inline-block">
              {activeSnippet.category}
            </span>
            <Typography
              variant="h1"
              className="text-6xl font-black uppercase tracking-tighter leading-none mb-8 text-slate-900 dark:text-white"
            >
              {activeSnippet.title}
            </Typography>
            {typeof activeSnippet.content === 'string' ? (
              <Typography
                variant="h5"
                className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic"
              >
                "{activeSnippet.content}"
              </Typography>
            ) : (
              <div className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic text-xl">
                {activeSnippet.content}
              </div>
            )}
          </div>

          {/* Strategic Impact Section */}
          {typeof activeSnippet.content !== 'string' && (
            <div className="p-10 rounded-[3.5rem] border bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 shadow-inner dark:shadow-none">
              <Typography
                variant="overline"
                className="text-slate-500 dark:text-slate-400 mb-8 opacity-100 font-black uppercase tracking-[0.2em]"
              >
                Strategic Impact
              </Typography>
              <Typography
                variant="h5"
                className="text-slate-900 dark:text-white font-bold leading-relaxed"
              >
                {typeof activeSnippet.content === 'string'
                  ? activeSnippet.content
                  : 'Understanding these concepts helps optimize your debt strategy and maximize cash flow.'}
              </Typography>
            </div>
          )}

          {/* Additional Snippets (if multiple) */}
          {snippets.length > 1 && (
            <div className="space-y-6">
              <Typography
                variant="overline"
                className="text-slate-500 dark:text-slate-400 ml-4 opacity-100 font-black uppercase tracking-[0.2em]"
              >
                Related Insights
              </Typography>
              <div className="grid grid-cols-1 gap-4">
                {snippets.slice(1).map((snippet) => (
                  <div
                    key={snippet.id}
                    className="flex flex-col gap-2 p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]"
                  >
                    <Typography
                      variant="h6"
                      className="text-slate-900 dark:text-white font-black"
                    >
                      {snippet.title}
                    </Typography>
                    {typeof snippet.content === 'string' && (
                      <Typography
                        variant="body-sm"
                        className="text-slate-600 dark:text-slate-400"
                      >
                        {snippet.content}
                      </Typography>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal Disclaimer / Expert Context Footer */}
          <div className="pt-12 border-t border-slate-500/10 dark:border-white/5">
            <Typography
              variant="overline"
              className="text-slate-500 dark:text-slate-400 mb-6 opacity-100 font-black uppercase tracking-[0.2em]"
            >
              Legal Disclaimer
            </Typography>
            <Typography
              variant="caption"
              className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed opacity-100"
            >
              <strong className="text-slate-700 dark:text-slate-300">
                Axori is not a financial adviser.
              </strong>{' '}
              We provide educational content and tools to help you plan using
              your data. Financial strategies and loan terms are subject to
              market conditions and regulatory changes. Always consult with your
              financial advisor, mortgage professional, or tax advisor to verify
              current rates, terms, and strategies specific to your situation.
            </Typography>
          </div>
        </div>

        {/* Footer Button */}
        <div className="mt-auto pt-16">
          <Button
            onClick={onClose}
            variant="primary"
            size="lg"
            className="w-full py-6 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            Acknowledged
          </Button>
        </div>
      </div>
    </div>
  )

  // Render to portal and add backdrop
  if (typeof window === 'undefined') return null

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[119] transition-opacity duration-700"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {createPortal(drawerContent, document.body)}
    </>
  )
}
