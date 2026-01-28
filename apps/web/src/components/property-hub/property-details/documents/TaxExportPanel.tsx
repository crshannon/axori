import { Download, FileArchive, Plus } from 'lucide-react'
import { DRAWERS, useDrawer } from '@/lib/drawer'
import { cn } from '@/utils/helpers'

interface TaxExportPanelProps {
  propertyId: string
}

export const TaxExportPanel = ({ propertyId }: TaxExportPanelProps) => {
  const { openDrawer } = useDrawer()
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const handleDownload = (year: number) => {
    // Open drawer with year pre-selected
    // The drawer will handle downloading if export exists, or generating if it doesn't
    openDrawer(DRAWERS.TAX_EXPORT, { propertyId, year })
  }

  const handleGenerate = () => {
    openDrawer(DRAWERS.TAX_EXPORT, { propertyId })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
            <FileArchive className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight">
              Tax Export
            </h3>
            <p className="text-xs text-slate-500 dark:text-white/60">
              Download prepared exports
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        className={cn(
          'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
          'flex items-center gap-2',
          'bg-violet-600 text-white hover:bg-violet-700',
          'dark:bg-[#E8FF4D] dark:text-black dark:hover:bg-[#d4eb45]',
        )}
      >
        <Plus className="w-4 h-4" />
        Generate
      </button>

      {/* Year List */}
      <div className="space-y-2">
        {yearOptions.map((year) => (
          <div
            key={year}
            className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
          >
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {year}
              </p>
              <p className="text-xs text-slate-500 dark:text-white/60">
                Tax Year
              </p>
            </div>
            <button
              onClick={() => handleDownload(year)}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-bold transition-all',
                'flex items-center gap-2',
                'bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20',
                'hover:bg-violet-50 hover:border-violet-300 hover:text-violet-600',
                'dark:hover:bg-violet-900/20 dark:hover:border-violet-500 dark:hover:text-violet-400',
              )}
            >
              <Download className="w-4 h-4" />
              Open
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
