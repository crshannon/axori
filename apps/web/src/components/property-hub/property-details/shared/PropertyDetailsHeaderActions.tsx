import { cn } from '@axori/ui'
import type { PortfolioRole } from '@axori/permissions'

interface PropertyDetailsHeaderActionsProps {
  canEdit?: boolean
  role?: PortfolioRole | null
}

export const PropertyDetailsHeaderActions = ({
  canEdit = true,
  role,
}: PropertyDetailsHeaderActionsProps) => {
  // Determine the badge based on role
  const getRoleBadge = () => {
    if (!role) return { text: 'CLAIMED ASSET', variant: 'emerald' }

    switch (role) {
      case 'owner':
        return { text: 'OWNER', variant: 'emerald' }
      case 'admin':
        return { text: 'ADMIN', variant: 'sky' }
      case 'member':
        return { text: 'MEMBER', variant: 'violet' }
      case 'viewer':
        return { text: 'VIEWER', variant: 'amber' }
      default:
        return { text: 'CLAIMED ASSET', variant: 'emerald' }
    }
  }

  const badge = getRoleBadge()

  const badgeStyles: Record<string, string> = {
    emerald: cn(
      'bg-emerald-50 border-emerald-100 text-emerald-600',
      'dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-500',
    ),
    sky: cn(
      'bg-sky-50 border-sky-100 text-sky-600',
      'dark:bg-sky-500/10 dark:border-sky-500/20 dark:text-sky-500',
    ),
    violet: cn(
      'bg-violet-50 border-violet-100 text-violet-600',
      'dark:bg-violet-500/10 dark:border-violet-500/20 dark:text-violet-500',
    ),
    amber: cn(
      'bg-amber-50 border-amber-100 text-amber-600',
      'dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-500',
    ),
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          'px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border',
          badgeStyles[badge.variant],
        )}
      >
        {badge.text}
      </div>
      <button
        className={cn(
          'px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105',
          'bg-slate-900 text-white',
          'dark:bg-white dark:text-black',
        )}
      >
        Export Ledger
      </button>
    </div>
  )
}
