import { useState } from 'react'
import { Download, FileArchive, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { useTaxYearDocuments } from '@/hooks/api/useDocuments'
import { DOCUMENT_TYPE_LABELS } from '@axori/shared/src/validation'
import { useUser } from '@clerk/clerk-react'

interface TaxExportPanelProps {
  propertyId: string
}

export const TaxExportPanel = ({ propertyId }: TaxExportPanelProps) => {
  const { user } = useUser()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear - 1) // Default to last year
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportSuccess, setExportSuccess] = useState(false)

  const { data: taxYearData, isLoading, error } = useTaxYearDocuments(propertyId, selectedYear)

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const handleExport = async () => {
    if (!user?.id || !taxYearData?.documents.length) return

    try {
      setIsExporting(true)
      setExportError(null)
      setExportSuccess(false)

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(
        `${apiUrl}/api/documents/property/${propertyId}/export/${selectedYear}`,
        {
          method: 'POST',
          headers: {
            'x-clerk-user-id': user.id,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Export failed' }))
        throw new Error(error.message || 'Failed to export documents')
      }

      // Download the ZIP file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = `tax-documents-${selectedYear}.zip`
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setExportSuccess(true)
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const cardClass = cn(
    'p-8 rounded-3xl border transition-all',
    'bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200',
    'dark:from-violet-900/20 dark:to-indigo-900/20 dark:border-violet-800/50',
  )

  return (
    <div className={cardClass}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
          <FileArchive className="w-6 h-6 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight">Tax Export</h3>
          <p className="text-xs text-slate-500 dark:text-white/60">
            Export documents for CPA review
          </p>
        </div>
      </div>

      {/* Year Selector */}
      <div className="mb-6">
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/60 mb-2">
          Tax Year
        </label>
        <div className="flex gap-2 flex-wrap">
          {yearOptions.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-bold transition-all',
                selectedYear === year
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/50'
                  : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500',
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Document Summary */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          Failed to load documents
        </div>
      ) : taxYearData ? (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-white/5">
              <p className="text-2xl font-black">{taxYearData.summary.totalDocuments}</p>
              <p className="text-xs text-slate-500 dark:text-white/60">Documents</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-white/5">
              <p className="text-2xl font-black text-emerald-600">{taxYearData.summary.processedCount}</p>
              <p className="text-xs text-slate-500 dark:text-white/60">Processed</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-white/5">
              <p className="text-2xl font-black text-amber-600">{taxYearData.summary.pendingCount}</p>
              <p className="text-xs text-slate-500 dark:text-white/60">Pending</p>
            </div>
          </div>

          {/* Documents by Type */}
          <div className="p-4 rounded-xl bg-white dark:bg-white/5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/60 mb-3">
              Documents by Type
            </p>
            <div className="space-y-2">
              {Object.entries(taxYearData.byType).map(([type, docs]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-white/80">
                    {DOCUMENT_TYPE_LABELS[type as keyof typeof DOCUMENT_TYPE_LABELS] || type}
                  </span>
                  <span className="font-bold">{(docs as unknown[]).length}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Documents Warning */}
          {taxYearData.missingTypes.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300 text-sm">
                    Missing Tax Documents
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {taxYearData.missingTypes.map(type =>
                      DOCUMENT_TYPE_LABELS[type as keyof typeof DOCUMENT_TYPE_LABELS] || type
                    ).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting || taxYearData.documents.length === 0}
            className={cn(
              'w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all',
              'flex items-center justify-center gap-3',
              'bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed',
              'dark:bg-[#E8FF4D] dark:text-black dark:hover:bg-[#d4eb45]',
            )}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Preparing Export...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Export {selectedYear} Documents
              </>
            )}
          </button>

          {/* Success Message */}
          {exportSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Export complete! Check your downloads folder.
              </p>
            </div>
          )}

          {/* Error Message */}
          {exportError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{exportError}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500 dark:text-white/60">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No documents for {selectedYear}</p>
        </div>
      )}
    </div>
  )
}
