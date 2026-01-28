import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { FolderOpen, Grid, List, Loader2, Search, Upload } from 'lucide-react'
import { DOCUMENT_TYPE_LABELS } from '@axori/shared/src/validation'
import type {
  DocumentType,
  ProcessingStatus,
} from '@axori/shared/src/validation'
import { cn } from '@/utils/helpers'
import { usePropertyPermissions } from '@/hooks/api'
import {
  useDocumentStats,
  usePropertyDocuments,
} from '@/hooks/api/useDocuments'
import { DRAWERS, useDrawer } from '@/lib/drawer'
import { DocumentCard } from '@/components/property-hub/property-details/documents/DocumentCard'
import { TaxExportPanel } from '@/components/property-hub/property-details/documents/TaxExportPanel'

export const Route = createFileRoute(
  '/_authed/property-hub/$propertyId/documents',
)({
  component: DocumentsPage,
})

function DocumentsPage() {
  const { propertyId } = Route.useParams()
  const { canEdit } = usePropertyPermissions(propertyId)
  const { openDrawer } = useDrawer()

  // Filter state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<DocumentType | ''>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<ProcessingStatus | ''>(
    '',
  )

  // Fetch documents with filters
  const {
    data: documentsData,
    isLoading: isLoadingDocuments,
    error: documentsError,
  } = usePropertyDocuments(propertyId, {
    type: selectedType || undefined,
    year: selectedYear ? parseInt(selectedYear, 10) : undefined,
    status: selectedStatus || undefined,
    search: searchQuery || undefined,
  })

  // Fetch document stats for sidebar
  const { data: stats } = useDocumentStats(propertyId)

  const documents = documentsData?.documents || []

  // Group documents by type for folder view
  const documentsByType = useMemo(() => {
    const grouped: Record<string, number> = {}
    documents.forEach((doc) => {
      grouped[doc.documentType] = (grouped[doc.documentType] || 0) + 1
    })
    return grouped
  }, [documents])

  const cardClass = cn(
    'p-10 rounded-[3.5rem] border transition-all duration-500',
    'bg-white border-slate-200 shadow-sm',
    'dark:bg-[#1A1A1A] dark:border-white/5',
  )

  const handleUploadClick = () => {
    openDrawer(DRAWERS.UPLOAD_DOCUMENT, { propertyId })
  }

  const handleDocumentClick = (documentId: string) => {
    openDrawer(DRAWERS.DOCUMENT_DETAIL, { propertyId, documentId })
  }

  const handleFolderClick = (type: DocumentType) => {
    setSelectedType(selectedType === type ? '' : type)
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i)

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6">
        <FolderOpen className="w-10 h-10 text-slate-400" />
      </div>
      <h3 className="text-xl font-black tracking-tight mb-2">
        No documents yet
      </h3>
      <p className="text-sm text-slate-500 dark:text-white/60 text-center max-w-sm mb-6">
        Upload your first document to start organizing your property paperwork
        for tax preparation.
      </p>
      {canEdit && (
        <button
          onClick={handleUploadClick}
          className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-violet-600 text-white hover:bg-violet-700 transition-colors dark:bg-[#E8FF4D] dark:text-black dark:hover:bg-[#d4eb45]"
        >
          Upload Document
        </button>
      )}
    </div>
  )

  const taxExportCardClass = cn(
    'p-10 rounded-[3.5rem] border transition-all duration-500',
    'bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200',
    'dark:from-violet-900/20 dark:to-indigo-900/20 dark:border-violet-800/50',
  )

  return (
    <div className="p-8 w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className={`${cardClass} lg:col-span-3 flex flex-col gap-8`}>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-6">
              Document Types
            </h3>
            <div className="space-y-2">
              {Object.entries(documentsByType).length > 0 ? (
                Object.entries(documentsByType).map(([type, count]) => (
                  <button
                    key={type}
                    onClick={() => handleFolderClick(type as DocumentType)}
                    className={cn(
                      'w-full p-4 rounded-2xl flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-left transition-all',
                      selectedType === type
                        ? 'bg-violet-100 border border-violet-300 text-violet-700 dark:bg-violet-900/40 dark:border-violet-500/50 dark:text-violet-300'
                        : 'bg-slate-50 border border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm dark:bg-white/5 dark:hover:bg-white/10',
                    )}
                  >
                    <span>{DOCUMENT_TYPE_LABELS[type as DocumentType]}</span>
                    <span className="opacity-50">{count}</span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-white/60 text-center py-4">
                  No documents uploaded
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className={`p-6 rounded-3xl bg-slate-50 dark:bg-white/5`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                Document Summary
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-white/70">
                    Total
                  </span>
                  <span className="font-bold">{stats.totalCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Processed
                  </span>
                  <span className="font-bold">{stats.byStatus.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-600 dark:text-amber-400">
                    Pending
                  </span>
                  <span className="font-bold">{stats.byStatus.pending}</span>
                </div>
                {stats.totalSizeBytes > 0 && (
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-white/10">
                    <span className="text-slate-600 dark:text-white/70">
                      Storage
                    </span>
                    <span className="font-bold">
                      {(stats.totalSizeBytes / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="mt-auto pt-8 border-t border-slate-200 dark:border-white/10">
            {canEdit && (
              <button
                onClick={handleUploadClick}
                className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-dashed border-slate-300 dark:border-white/20 hover:border-violet-400 hover:text-violet-600 dark:hover:border-violet-500 dark:hover:text-violet-400 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={`${cardClass} lg:col-span-6`}>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">
                Document Vault
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                {documents.length} document{documents.length !== 1 ? 's' : ''}
                {selectedType && ` in ${DOCUMENT_TYPE_LABELS[selectedType]}`}
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-white/10 shadow-sm'
                    : 'hover:bg-white/50 dark:hover:bg-white/5',
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'list'
                    ? 'bg-white dark:bg-white/10 shadow-sm'
                    : 'hover:bg-white/50 dark:hover:bg-white/5',
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none bg-slate-50 border-slate-200 focus:border-violet-300 dark:bg-white/5 dark:border-white/5 dark:focus:border-white/20"
              />
            </div>

            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm border outline-none bg-slate-50 border-slate-200 focus:border-violet-300 dark:bg-white/5 dark:border-white/5 dark:focus:border-white/20"
            >
              <option value="">All Years</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as ProcessingStatus | '')
              }
              className="px-4 py-2.5 rounded-xl text-sm border outline-none bg-slate-50 border-slate-200 focus:border-violet-300 dark:bg-white/5 dark:border-white/5 dark:focus:border-white/20"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Processed</option>
              <option value="failed">Failed</option>
            </select>

            {/* Clear Filters */}
            {(selectedType ||
              selectedYear ||
              selectedStatus ||
              searchQuery) && (
              <button
                onClick={() => {
                  setSelectedType('')
                  setSelectedYear('')
                  setSelectedStatus('')
                  setSearchQuery('')
                }}
                className="px-4 py-2.5 rounded-xl text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Content */}
          {isLoadingDocuments ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : documentsError ? (
            <div className="text-center py-16">
              <p className="text-red-500">
                Error loading documents: {documentsError.message}
              </p>
            </div>
          ) : documents.length === 0 ? (
            <EmptyState />
          ) : (
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
                  : 'space-y-3',
              )}
            >
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onClick={() => handleDocumentClick(doc.id)}
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-10">
              Vault secured with enterprise-grade encryption
            </p>
          </div>
        </div>

        <div className={`${taxExportCardClass} lg:col-span-3 flex flex-col gap-8`}>
          <TaxExportPanel propertyId={propertyId} />
        </div>
      </div>
    </div>
  )
}
