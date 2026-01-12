import { cn } from '@axori/ui'

export const PropertyDetailsHeaderActions = () => {
  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          'px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border',
          'bg-emerald-50 border-emerald-100 text-emerald-600',
          'dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-500',
        )}
      >
        CLAIMED ASSET
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
