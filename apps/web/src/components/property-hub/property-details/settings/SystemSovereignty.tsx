import { Card, cn } from '@axori/ui'
import { usePropertyPermissions } from '@/hooks/api'

interface SystemSovereigntyProps {
  propertyId: string
}

/**
 * SystemSovereignty component - Displays critical system actions
 * Shows: Archive Asset, Purge Fiscal Logs, Self-Destruct options
 */
export const SystemSovereignty = ({ propertyId }: SystemSovereigntyProps) => {
  const { canAdmin } = usePropertyPermissions(propertyId)

  // Only show this section to users with admin permission
  if (!canAdmin) {
    return null
  }

  const cardClass = cn(
    'p-10 rounded-[3.5rem] border transition-all duration-500',
    'bg-white border-slate-200 shadow-sm',
    'dark:bg-[#1A1A1A] dark:border-white/5',
  )

  const actions = [
    {
      t: 'Archive Asset',
      d: 'Move this property to the historical archive. Recalculates portfolio aggregates but preserves documents.',
      b: 'Confirm Archival',
      danger: false,
    },
    {
      t: 'Purge Fiscal Logs',
      d: 'Delete all extracted P&L metadata, OCR receipts, and expense histories. Irreversible.',
      b: 'Purge Logs',
      danger: true,
    },
    {
      t: 'Self-Destruct',
      d: 'Complete deletion of property profile, document vault, and intelligence mapping.',
      b: 'Destroy Asset',
      danger: true,
    },
  ]

  return (
    <section className="mt-20">
      <div className="flex items-center gap-4 mb-10">
        <div className={`w-12 h-1 bg-red-500`}></div>
        <h3 className="text-3xl font-black uppercase tracking-tighter text-red-500">
          System Sovereignty
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {actions.map((item, i) => (
          <div
            key={i}
            className={`${cardClass} border-red-500/10 bg-red-500/5`}
          >
            <h4 className="text-lg font-black uppercase tracking-tight mb-4 text-red-500">
              {item.t}
            </h4>
            <p className="text-xs font-bold opacity-50 leading-relaxed mb-10">
              {item.d}
            </p>
            <button
              className={`w-full py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                item.danger
                  ? 'bg-red-500 text-white shadow-xl shadow-red-500/20 hover:scale-105'
                  : 'border border-red-500/30 text-red-500 hover:bg-red-500/10'
              }`}
            >
              {item.b}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
