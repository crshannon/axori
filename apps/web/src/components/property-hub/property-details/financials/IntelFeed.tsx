import { Button, Card, Typography } from '@axori/ui'
import type {
  Suggestion,
  SuggestionType,
} from '@/services/suggestions/suggestionEngine'
import { useSuggestions } from '@/hooks/computed/useSuggestions'
import { cn } from '@/utils/helpers/cn'
import { DRAWERS, useDrawer } from '@/lib/drawer'

interface IntelFeedProps {
  propertyId: string
}

/**
 * IntelFeed component - AI-powered financial suggestions
 *
 * Displays actionable recommendations with priority styling.
 * Features gradient backgrounds, hover interactions, and action buttons.
 */
export const IntelFeed = ({ propertyId }: IntelFeedProps) => {
  const { suggestions, isLoading } = useSuggestions(propertyId)
  const { openDrawer } = useDrawer()

  // Take top 2 suggestions for compact display
  const displaySuggestions = suggestions.slice(0, 2)

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.actionDrawer) {
      const drawerMap: Partial<Record<string, keyof typeof DRAWERS>> = {
        'rental-income': 'RENTAL_INCOME',
        loan: 'ADD_LOAN',
        'operating-expenses': 'OPERATING_EXPENSES',
        'bank-allocation': 'BANK_ALLOCATION',
        'connect-bank-account': 'CONNECT_BANK_ACCOUNT',
      }
      const drawerKey = drawerMap[suggestion.actionDrawer]
      if (drawerKey) {
        openDrawer(DRAWERS[drawerKey], { propertyId })
      }
    }
  }

  const getAlertStyle = (type: SuggestionType, priority: string) => {
    // Color based on priority/type
    if (priority === 'critical') {
      return {
        label: 'COMPLIANCE ALERT',
        labelColor: 'text-rose-400',
        bg: 'bg-white/5 dark:bg-white/5',
        border: 'border-white/5 dark:border-white/5',
        shadow: 'shadow-sm',
      }
    }
    if (type === 'refinance' || type === 'rent') {
      return {
        label: 'ALPHA OPPORTUNITY',
        labelColor: 'text-emerald-500',
        bg: 'bg-white/5 dark:bg-white/5',
        border: 'border-white/5 dark:border-white/5',
        shadow: 'shadow-sm',
      }
    }
    return {
      label: 'OPTIMIZATION',
      labelColor: 'text-sky-400',
      bg: 'bg-white/5 dark:bg-white/5',
      border: 'border-white/5 dark:border-white/5',
      shadow: 'shadow-sm',
    }
  }

  if (isLoading) {
    return (
      <Card
        variant="rounded"
        padding="lg"
        radius="xl"
        className="h-full border-violet-500/30 bg-gradient-to-br from-violet-600/5 to-transparent"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 bg-slate-200 dark:bg-white/5 rounded-xl"
              />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (suggestions.length === 0) {
    return (
      <Card
        variant="rounded"
        padding="lg"
        radius="xl"
        className="h-full border-emerald-500/30 bg-gradient-to-br from-emerald-600/5 to-transparent"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
            <Typography
              variant="h6"
              className="uppercase tracking-widest text-slate-900 dark:text-white"
            >
              Intel Feed
            </Typography>
          </div>
          <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            ALL_CLEAR
          </span>
        </div>
        <div className="flex items-center gap-3 p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <Typography variant="body-sm" className="text-emerald-400">
            No immediate action items detected. Your portfolio is optimized.
          </Typography>
        </div>
      </Card>
    )
  }

  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className="h-full flex flex-col border-violet-500/30 bg-gradient-to-br from-violet-600/5 to-transparent relative overflow-hidden"
    >
      {/* Decorative glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-violet-500 rounded-full shadow-[0_0_12px_rgba(139,92,246,0.5)]" />
          <Typography
            variant="h6"
            className="uppercase tracking-widest text-slate-900 dark:text-white"
          >
            Intel Feed
          </Typography>
        </div>
        <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border bg-violet-500/10 text-violet-500 border-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.15)]">
          AI_Priority
        </span>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 space-y-4 relative z-10">
        {displaySuggestions.map((suggestion) => {
          const style = getAlertStyle(suggestion.type, suggestion.priority)
          return (
            <div
              key={suggestion.id}
              className={cn(
                'p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] group/alert',
                style.bg,
                style.border,
                style.shadow,
              )}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <Typography
                  variant="caption"
                  weight="bold"
                  className={cn('uppercase tracking-wider', style.labelColor)}
                >
                  {style.label}
                </Typography>
                <span className="text-[9px] font-black opacity-30 group-hover/alert:opacity-100 transition-opacity text-slate-500 dark:text-slate-400 uppercase">
                  NOW
                </span>
              </div>
              <Typography
                variant="body-sm"
                weight="bold"
                className="text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed"
              >
                {suggestion.description}
              </Typography>
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
        <Button
          variant="outline"
          size="lg"
          className="py-3.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black font-black text-[9px] uppercase tracking-widest transition-all hover:scale-[1.02] shadow-lg"
          onClick={() =>
            displaySuggestions[0] &&
            handleSuggestionClick(displaySuggestions[0])
          }
        >
          Execute Optimization
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="py-3.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white font-black text-[9px] uppercase tracking-widest transition-all hover:bg-slate-50 dark:hover:bg-white/5"
        >
          Dismiss All
        </Button>
      </div>
    </Card>
  )
}
