import { Card, Typography } from '@axori/ui'
import {
  AlertTriangle,
  ChevronRight,
  DollarSign,
  FileText,
  Home,
  Percent,
  PiggyBank,
  TrendingDown,
} from 'lucide-react'
import type {
  Suggestion,
  SuggestionPriority,
  SuggestionType,
} from '@/services/suggestions/suggestionEngine'
import { useSuggestions } from '@/hooks/computed/useSuggestions'
import { cn } from '@/utils/helpers/cn'
import { DRAWERS, useDrawer } from '@/lib/drawer'

interface AxoriSuggestionsProps {
  propertyId: string
  maxItems?: number // Limit number of suggestions shown
  compact?: boolean // Compact mode for property overview
}

/**
 * AxoriSuggestions component - Displays intelligent property improvement suggestions
 *
 * Shows actionable recommendations based on property data analysis.
 * Can be used on individual property pages or portfolio view.
 */
export const AxoriSuggestions = ({
  propertyId,
  maxItems = 5,
  compact = false,
}: AxoriSuggestionsProps) => {
  const { suggestions, criticalCount, highCount, isLoading } =
    useSuggestions(propertyId)
  const { openDrawer } = useDrawer()

  const displaySuggestions = maxItems
    ? suggestions.slice(0, maxItems)
    : suggestions

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.actionDrawer) {
      // Map drawer names to DRAWERS enum
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

  const getPriorityStyles = (priority: SuggestionPriority) => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-rose-50 dark:bg-rose-500/10',
          border: 'border-rose-200 dark:border-rose-500/30',
          text: 'text-rose-600 dark:text-rose-400',
          badge: 'bg-rose-500 text-white',
        }
      case 'high':
        return {
          bg: 'bg-amber-50 dark:bg-amber-500/10',
          border: 'border-amber-200 dark:border-amber-500/30',
          text: 'text-amber-600 dark:text-amber-400',
          badge: 'bg-amber-500 text-white',
        }
      case 'medium':
        return {
          bg: 'bg-sky-50 dark:bg-sky-500/10',
          border: 'border-sky-200 dark:border-sky-500/30',
          text: 'text-sky-600 dark:text-sky-400',
          badge: 'bg-sky-500 text-white',
        }
      case 'low':
        return {
          bg: 'bg-slate-50 dark:bg-slate-500/10',
          border: 'border-slate-200 dark:border-slate-500/30',
          text: 'text-slate-600 dark:text-slate-400',
          badge: 'bg-slate-400 text-white',
        }
    }
  }

  const getTypeIcon = (type: SuggestionType) => {
    switch (type) {
      case 'rent':
        return <DollarSign size={16} />
      case 'refinance':
        return <Percent size={16} />
      case 'vacancy':
        return <Home size={16} />
      case 'expense':
        return <TrendingDown size={16} />
      case 'reserve':
        return <PiggyBank size={16} />
      case 'tax':
        return <FileText size={16} />
      case 'performance':
        return <TrendingDown size={16} />
      default:
        return <AlertTriangle size={16} />
    }
  }

  if (isLoading) {
    return (
      <Card variant="rounded" padding={compact ? 'md' : 'lg'} radius="xl">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-slate-200 dark:bg-white/5 rounded-xl"
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
        padding={compact ? 'md' : 'lg'}
        radius="xl"
        className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
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
          <div>
            <Typography
              variant="body"
              weight="bold"
              className="text-emerald-700 dark:text-emerald-300"
            >
              Looking Good!
            </Typography>
            <Typography
              variant="body-sm"
              className="text-emerald-600 dark:text-emerald-400"
            >
              No immediate action items detected for this property.
            </Typography>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="rounded" padding={compact ? 'md' : 'lg'} radius="xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Typography
            variant="h5"
            className="uppercase tracking-tighter text-slate-900 dark:text-white"
          >
            Axori Suggestions
          </Typography>
          {(criticalCount > 0 || highCount > 0) && (
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-rose-500 text-white">
                  {criticalCount} Critical
                </span>
              )}
              {highCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-amber-500 text-white">
                  {highCount} High
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {displaySuggestions.map((suggestion) => {
          const styles = getPriorityStyles(suggestion.priority)
          return (
            <div
              key={suggestion.id}
              className={cn(
                'p-3 rounded-xl border cursor-pointer transition-all',
                'hover:shadow-md dark:hover:shadow-none',
                styles.bg,
                styles.border,
                'group',
              )}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    styles.bg,
                    styles.text,
                  )}
                >
                  {getTypeIcon(suggestion.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded',
                        styles.badge,
                      )}
                    >
                      {suggestion.priority}
                    </span>
                    <Typography
                      variant="body-sm"
                      weight="bold"
                      className="truncate text-slate-900 dark:text-white"
                    >
                      {suggestion.title}
                    </Typography>
                  </div>
                  <Typography
                    variant="caption"
                    className="text-slate-600 dark:text-slate-400 line-clamp-2"
                  >
                    {suggestion.description}
                  </Typography>
                  <div className="flex items-center justify-between mt-2">
                    <Typography
                      variant="caption"
                      weight="bold"
                      className={styles.text}
                    >
                      {suggestion.potentialImpact}
                    </Typography>
                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                      <span className="text-xs font-medium">
                        {suggestion.actionLabel}
                      </span>
                      <ChevronRight
                        size={14}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Show More Link */}
      {suggestions.length > maxItems && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 text-center">
          <Typography
            variant="caption"
            className="text-slate-500 dark:text-slate-400"
          >
            +{suggestions.length - maxItems} more suggestions
          </Typography>
        </div>
      )}
    </Card>
  )
}
