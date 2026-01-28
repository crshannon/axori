import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Download, FileArchive, Loader2 } from 'lucide-react'
import { Button, Drawer, ErrorCard } from '@axori/ui'
import { DOCUMENT_TYPE_LABELS } from '@axori/shared/src/validation'
import { useTaxExport, useTaxYearDocuments } from '@/hooks/api/useDocuments'
import { cn } from '@/utils/helpers'

interface TaxExportDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  year?: number | string
}

export const TaxExportDrawer = ({
  isOpen,
  onClose,
  propertyId,
  year,
}: TaxExportDrawerProps) => {
  const currentYear = new Date().getFullYear()
  const initialYear =
    year !== undefined ? (typeof year === 'string' ? parseInt(year, 10) : year) : currentYear - 1
  const [selectedYear, setSelectedYear] = useState(initialYear)

  // Update selected year when year prop changes
  useEffect(() => {
    if (year !== undefined) {
      const yearNum = typeof year === 'string' ? parseInt(year, 10) : year
      if (!isNaN(yearNum)) {
        setSelectedYear(yearNum)
      }
    }
  }, [year])

  const taxExport = useTaxExport()
  const { data: taxYearData, isLoading, error: taxYearError } = useTaxYearDocuments(
    propertyId,
    selectedYear,
  )

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const handleExport = async () => {
    if (!taxYearData?.documents.length) return

    try {
      const blob = await taxExport.mutateAsync({
        propertyId,
        year: selectedYear,
      })

      // Download the ZIP file
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = `tax-documents-${selectedYear}.zip`
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Close drawer after successful export
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (exportError) {
      // Error is handled by mutation state
      console.error('Export error:', exportError)
    }
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Tax Export"
      subtitle="EXPORT DOCUMENTS FOR CPA"
      width="lg"
    >
      <div className="space-y-8">
        {/* Year Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/60 mb-4">
            Select Tax Year
          </label>
          <div className="flex gap-2 flex-wrap">
            {yearOptions.map((yearOption) => (
              <button
                key={yearOption}
                onClick={() => setSelectedYear(yearOption)}
                className={cn(
                  'px-6 py-3 rounded-xl text-sm font-bold transition-all min-w-[80px]',
                  selectedYear === yearOption
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/50'
                    : 'bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500',
                )}
              >
                {yearOption}
              </button>
            ))}
          </div>
        </div>

        {/* Document Summary */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : taxYearError ? (
          <ErrorCard
            message={
              taxYearError instanceof Error ? taxYearError.message : 'Failed to load documents'
            }
          />
        ) : taxYearData ? (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-white/5">
                <p className="text-2xl font-black mb-1">{taxYearData.summary.totalDocuments}</p>
                <p className="text-xs text-slate-500 dark:text-white/60">Documents</p>
              </div>
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-white/5">
                <p className="text-2xl font-black text-emerald-600 mb-1">
                  {taxYearData.summary.processedCount}
                </p>
                <p className="text-xs text-slate-500 dark:text-white/60">Processed</p>
              </div>
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-white/5">
                <p className="text-2xl font-black text-amber-600 mb-1">
                  {taxYearData.summary.pendingCount}
                </p>
                <p className="text-xs text-slate-500 dark:text-white/60">Pending</p>
              </div>
            </div>

            {/* Documents by Type */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-white/5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/60 mb-4">
                Documents by Type
              </p>
              <div className="space-y-3">
                {Object.entries(taxYearData.byType).map(([type, docs]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-white/80">
                      {DOCUMENT_TYPE_LABELS[type as keyof typeof DOCUMENT_TYPE_LABELS] || type}
                    </span>
                    <span className="font-bold">{(docs as Array<unknown>).length}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Documents Warning */}
            {taxYearData.missingTypes.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium text-amber-800 dark:text-amber-300 text-sm mb-1">
                      Missing Tax Documents
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                      {taxYearData.missingTypes
                        .map(
                          (type) =>
                            DOCUMENT_TYPE_LABELS[type as keyof typeof DOCUMENT_TYPE_LABELS] ||
                            type,
                        )
                        .join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {taxExport.isSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Export complete! Check your downloads folder.
                </p>
              </div>
            )}

            {/* Error Message */}
            {taxExport.isError && (
              <ErrorCard
                message={
                  taxExport.error instanceof Error
                    ? taxExport.error.message
                    : 'Export failed'
                }
              />
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 dark:text-white/60">
            <FileArchive className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No documents for {selectedYear}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-4 mt-8 pt-8 border-t border-slate-200 dark:border-white/10">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={taxExport.isPending}
          className="flex-1 py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em]"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleExport}
          disabled={taxExport.isPending || !taxYearData?.documents.length}
          isLoading={taxExport.isPending}
          className="flex-[2] py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em]"
        >
          {taxExport.isPending ? (
            'Generating Export...'
          ) : (
            <>
              <Download className="w-4 h-4 inline-block mr-2" />
              Generate & Download {selectedYear} Export
            </>
          )}
        </Button>
      </div>
    </Drawer>
  )
}
