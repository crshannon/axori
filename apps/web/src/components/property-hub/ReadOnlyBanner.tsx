import { cn } from '@axori/ui'
import { Eye } from 'lucide-react'

interface ReadOnlyBannerProps {
  /** Optional custom message */
  message?: string
  /** Optional custom class name */
  className?: string
  /** Variant for different display styles */
  variant?: 'banner' | 'badge' | 'inline'
}

/**
 * ReadOnlyBanner - Displays a visual indicator that the user has read-only access
 *
 * Use this component to inform users they cannot edit the current resource.
 *
 * @example
 * ```tsx
 * // Full banner (for page headers)
 * <ReadOnlyBanner />
 *
 * // Badge variant (for card headers)
 * <ReadOnlyBanner variant="badge" />
 *
 * // Inline variant (for action areas)
 * <ReadOnlyBanner variant="inline" message="View Only" />
 * ```
 */
export const ReadOnlyBanner = ({
  message = 'You have view-only access to this property',
  className,
  variant = 'banner',
}: ReadOnlyBannerProps) => {
  if (variant === 'badge') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full',
          'bg-amber-50 text-amber-700 border border-amber-200',
          'dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
          'text-[10px] font-black uppercase tracking-wider',
          className,
        )}
      >
        <Eye size={12} strokeWidth={3} />
        <span>View Only</span>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400',
          'text-xs font-bold',
          className,
        )}
      >
        <Eye size={14} strokeWidth={2.5} />
        <span>{message}</span>
      </div>
    )
  }

  // Default: banner variant
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl',
        'bg-amber-50 border border-amber-200',
        'dark:bg-amber-500/10 dark:border-amber-500/20',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-xl',
          'bg-amber-100 dark:bg-amber-500/20',
        )}
      >
        <Eye
          size={16}
          strokeWidth={2.5}
          className="text-amber-600 dark:text-amber-400"
        />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
          {message}
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
          Contact the property owner to request edit access.
        </p>
      </div>
    </div>
  )
}
