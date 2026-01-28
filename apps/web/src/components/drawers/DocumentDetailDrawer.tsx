import { useState } from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Tag,
  Trash2,
} from 'lucide-react'
import { DeleteConfirmationCard, Drawer, ErrorCard, Input, Select, Textarea } from '@axori/ui'
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
} from '@axori/shared/src/validation'
import { useUser } from '@clerk/clerk-react'
import { DrawerSectionTitle } from './DrawerSectionTitle'
import type { DocumentType } from '@axori/shared/src/validation'
import {
  fetchDocumentDownloadUrl,
  useApplyDocumentData,
  useDeleteDocument,
  useDocument,
  useDocumentDownloadUrl,
  useDocumentFieldSchema,
  useProcessDocument,
  useUpdateDocument,
} from '@/hooks/api/useDocuments'
import { cn } from '@/utils/helpers'

interface DocumentDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  documentId?: string
  onSuccess?: () => void
}

export const DocumentDetailDrawer = ({
  isOpen,
  onClose,
  propertyId,
  documentId,
  onSuccess,
}: DocumentDetailDrawerProps) => {
  const { user } = useUser()
  const { data: document, isLoading, error } = useDocument(documentId)
  const updateDocument = useUpdateDocument()
  const deleteDocument = useDeleteDocument()
  const processDocument = useProcessDocument()
  const applyDocumentData = useApplyDocumentData()

  // Get field schema for this document type
  const { data: fieldSchema } = useDocumentFieldSchema(
    document?.documentType
  )

  // Get signed URL for preview (enabled when drawer is open and we have a document)
  const { data: downloadUrlData, isLoading: isLoadingPreview } = useDocumentDownloadUrl(
    documentId,
    isOpen && !!documentId
  )

  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showApplyPanel, setShowApplyPanel] = useState(false)
  const [selectedFieldsToApply, setSelectedFieldsToApply] = useState<Array<string>>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDownloading, setIsDownloading] = useState(false)

  // Form state for editing
  const [editFormData, setEditFormData] = useState({
    documentType: '' as DocumentType | '',
    documentYear: '',
    description: '',
    tags: '',
  })

  const handleStartEdit = () => {
    if (document) {
      setEditFormData({
        documentType: document.documentType,
        documentYear: document.documentYear?.toString() || '',
        description: document.description || '',
        tags: document.tags?.join(', ') || '',
      })
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setErrors({})
  }

  const handleEditChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveEdit = async () => {
    if (!document || !documentId) return

    try {
      const tags = editFormData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      await updateDocument.mutateAsync({
        id: documentId,
        propertyId,
        documentType: editFormData.documentType as DocumentType,
        documentYear: editFormData.documentYear
          ? parseInt(editFormData.documentYear, 10)
          : null,
        description: editFormData.description || null,
        tags: tags.length > 0 ? tags : undefined,
      })

      setIsEditing(false)
      onSuccess?.()
    } catch (updateError) {
      setErrors({
        submit:
          updateError instanceof Error
            ? updateError.message
            : 'Failed to update document',
      })
    }
  }

  const handleDelete = async () => {
    if (!documentId) return

    try {
      await deleteDocument.mutateAsync({ id: documentId, propertyId })
      onSuccess?.()
      onClose()
    } catch (deleteError) {
      setErrors({
        delete:
          deleteError instanceof Error
            ? deleteError.message
            : 'Failed to delete document',
      })
    }
  }

  const handleReprocess = async () => {
    if (!documentId) return

    try {
      await processDocument.mutateAsync({ id: documentId, propertyId })
      onSuccess?.()
    } catch (processError) {
      setErrors({
        process:
          processError instanceof Error
            ? processError.message
            : 'Failed to start processing',
      })
    }
  }

  const handleDownload = async () => {
    if (!documentId || !user?.id) return

    try {
      setIsDownloading(true)
      const { url, filename } = await fetchDocumentDownloadUrl(documentId, user.id)

      // Create a temporary link and trigger download
      const link = window.document.createElement('a')
      link.href = url
      link.download = filename
      link.target = '_blank'
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    } catch (downloadError) {
      setErrors({
        download:
          downloadError instanceof Error
            ? downloadError.message
            : 'Failed to download document',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleOpenInNewTab = () => {
    if (downloadUrlData?.url) {
      window.open(downloadUrlData.url, '_blank')
    }
  }

  const getStatusIcon = () => {
    if (!document?.processingStatus) return null

    switch (document.processingStatus) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      case 'processing':
        return <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-slate-400" />
    }
  }

  const getStatusText = () => {
    if (!document?.processingStatus) return 'Not processed'

    switch (document.processingStatus) {
      case 'completed':
        return 'AI extraction complete'
      case 'processing':
        return 'Processing...'
      case 'failed':
        return 'Processing failed'
      default:
        return 'Pending processing'
    }
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i)

  if (isLoading) {
    return (
      <Drawer isOpen={isOpen} onClose={onClose} title="Loading..." width="lg">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </Drawer>
    )
  }

  if (error || !document) {
    return (
      <Drawer isOpen={isOpen} onClose={onClose} title="Error" width="lg">
        <ErrorCard message={error?.message || 'Document not found'} />
      </Drawer>
    )
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={document.originalFilename}
      subtitle={DOCUMENT_TYPE_LABELS[document.documentType]}
      width="lg"
      headerActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReprocess}
            disabled={processDocument.isPending}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            title="Reprocess with AI"
          >
            <RefreshCw className={`w-5 h-5 ${processDocument.isPending ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenInNewTab}
            disabled={!downloadUrlData?.url}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Open in new tab"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Download"
          >
            {isDownloading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      }
      footer={
        isEditing ? (
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={updateDocument.isPending}
              className="flex-1 py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] border transition-all hover:bg-slate-500/5 disabled:opacity-50 dark:border-white/10 dark:text-white border-slate-200 text-slate-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={updateDocument.isPending}
              className="flex-[2] py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105 disabled:opacity-50 dark:bg-[#E8FF4D] dark:text-black bg-violet-600 text-white shadow-xl"
            >
              {updateDocument.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStartEdit}
            className="w-full py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] border transition-all hover:bg-slate-500/5 dark:border-white/10 dark:text-white border-slate-200 text-slate-900"
          >
            Edit Details
          </button>
        )
      }
    >
      <div className="space-y-10">
        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <DeleteConfirmationCard
            title="Delete Document"
            description="Are you sure you want to delete this document? This action cannot be undone."
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            isLoading={deleteDocument.isPending}
          />
        )}

        {/* Document Preview Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Preview" color="violet" />
          <div className="rounded-2xl bg-slate-100 dark:bg-white/5 overflow-hidden">
            {isLoadingPreview ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              </div>
            ) : downloadUrlData?.url ? (
              document.mimeType?.startsWith('image/') ? (
                <div className="relative">
                  <img
                    src={downloadUrlData.url}
                    alt={document.originalFilename}
                    className="w-full max-h-96 object-contain bg-slate-50 dark:bg-black/20"
                  />
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 shadow-lg transition-colors"
                    title="View full size"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ) : document.mimeType === 'application/pdf' ? (
                <div className="relative">
                  <iframe
                    src={`${downloadUrlData.url}#toolbar=0&navpanes=0`}
                    className="w-full h-96 border-0"
                    title={document.originalFilename}
                  />
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 shadow-lg transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center">
                  <FileText className="w-16 h-16 text-slate-400 mb-3" />
                  <p className="text-sm text-slate-500 dark:text-white/60 mb-3">
                    Preview not available for this file type
                  </p>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors"
                  >
                    Download to view
                  </button>
                </div>
              )
            ) : (
              <div className="h-64 flex flex-col items-center justify-center">
                <FileText className="w-16 h-16 text-slate-400 mb-3" />
                <p className="text-sm text-slate-500 dark:text-white/60">
                  Unable to load preview
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Processing Status Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="AI Processing Status" color="violet" />
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-white/5">
            {getStatusIcon()}
            <div className="flex-1">
              <p className="font-medium text-slate-900 dark:text-white">
                {getStatusText()}
              </p>
              {document.aiProcessedAt && (
                <p className="text-sm text-slate-500 dark:text-white/60">
                  Processed: {new Date(document.aiProcessedAt).toLocaleString()}
                </p>
              )}
              {document.aiError && (
                <p className="text-sm text-red-500 mt-1">{document.aiError}</p>
              )}
            </div>
            {document.aiConfidence && (
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {Math.round(parseFloat(document.aiConfidence) * 100)}%
                </p>
                <p className="text-xs text-slate-500 dark:text-white/60">
                  Confidence
                </p>
              </div>
            )}
          </div>

          {/* Extracted Data Preview */}
          {document.aiExtractedData && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-emerald-800 dark:text-emerald-300">
                    Extracted Data
                  </p>
                  {!document.aiAppliedAt && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowApplyPanel(!showApplyPanel)
                        // Pre-select all available fields
                        if (!showApplyPanel && fieldSchema) {
                          const extractedData = document.aiExtractedData as Record<string, unknown>
                          const availableFields = fieldSchema
                            .filter(f => f.field in extractedData && extractedData[f.field] !== undefined)
                            .map(f => f.field)
                          setSelectedFieldsToApply(availableFields)
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                      {showApplyPanel ? 'Cancel' : 'Apply to Property'}
                    </button>
                  )}
                  {document.aiAppliedAt && (
                    <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">
                      Applied {new Date(document.aiAppliedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {showApplyPanel && fieldSchema ? (
                  <div className="space-y-3">
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      Select fields to apply to this property:
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {fieldSchema.map(field => {
                        const extractedData = document.aiExtractedData as Record<string, unknown>
                        const value = extractedData[field.field]
                        if (value === undefined) return null

                        const isSelected = selectedFieldsToApply.includes(field.field)
                        const formatValue = (val: unknown, type: string) => {
                          if (val === null || val === undefined) return 'N/A'
                          if (type === 'currency') return `$${Number(val).toLocaleString()}`
                          if (type === 'percent') return `${val}%`
                          return String(val)
                        }

                        return (
                          <label
                            key={field.field}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                              isSelected
                                ? 'bg-emerald-100 dark:bg-emerald-800/50'
                                : 'bg-white/50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFieldsToApply([...selectedFieldsToApply, field.field])
                                } else {
                                  setSelectedFieldsToApply(selectedFieldsToApply.filter(f => f !== field.field))
                                }
                              }}
                              className="w-4 h-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                                {field.label}
                              </p>
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
                                {formatValue(value, field.type)}
                              </p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowApplyPanel(false)}
                        className="flex-1 py-2 px-4 text-sm font-medium rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!documentId || selectedFieldsToApply.length === 0) return
                          try {
                            await applyDocumentData.mutateAsync({
                              id: documentId,
                              propertyId,
                              selectedFields: selectedFieldsToApply,
                            })
                            setShowApplyPanel(false)
                            onSuccess?.()
                          } catch (applyError) {
                            setErrors({
                              apply: applyError instanceof Error ? applyError.message : 'Failed to apply data',
                            })
                          }
                        }}
                        disabled={applyDocumentData.isPending || selectedFieldsToApply.length === 0}
                        className="flex-1 py-2 px-4 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {applyDocumentData.isPending ? 'Applying...' : `Apply ${selectedFieldsToApply.length} Fields`}
                      </button>
                    </div>
                  </div>
                ) : (
                  <pre className="text-sm text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(document.aiExtractedData, null, 2)}
                  </pre>
                )}
              </div>

              {/* Show applied data if exists */}
              {document.aiAppliedData && (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                    Applied Data
                  </p>
                  <pre className="text-sm text-blue-700 dark:text-blue-400 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(document.aiAppliedData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Document Details Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Document Details" color="violet" />

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  variant="rounded"
                  label="Document Type"
                  value={editFormData.documentType}
                  onChange={(e) => handleEditChange('documentType', e.target.value)}
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {DOCUMENT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </Select>

                <Select
                  variant="rounded"
                  label="Tax Year"
                  value={editFormData.documentYear}
                  onChange={(e) => handleEditChange('documentYear', e.target.value)}
                >
                  <option value="">No year</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
              </div>

              <Textarea
                variant="rounded"
                label="Description"
                value={editFormData.description}
                onChange={(e) => handleEditChange('description', e.target.value)}
                rows={3}
              />

              <div>
                <Input
                  variant="rounded"
                  label="Tags"
                  value={editFormData.tags}
                  onChange={(e) => handleEditChange('tags', e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-white/60">
                  Separate tags with commas
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-white/60">Type</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {DOCUMENT_TYPE_LABELS[document.documentType]}
                  </p>
                </div>
              </div>

              {document.documentYear && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-white/60">Tax Year</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {document.documentYear}
                    </p>
                  </div>
                </div>
              )}

              {document.description && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-white/60">Description</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {document.description}
                    </p>
                  </div>
                </div>
              )}

              {document.tags && document.tags.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-white/60">Tags</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {document.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* File Info Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="File Information" color="violet" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 dark:text-white/60">File Size</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {document.sizeBytes
                  ? `${(document.sizeBytes / 1024 / 1024).toFixed(2)} MB`
                  : 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-white/60">File Type</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {document.mimeType || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-white/60">Uploaded</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {new Date(document.uploadedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-white/60">Last Updated</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {new Date(document.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* Error Messages */}
        {(errors.submit || errors.delete || errors.process || errors.download || errors.apply) && (
          <ErrorCard
            message={errors.submit || errors.delete || errors.process || errors.download || errors.apply || 'An error occurred'}
          />
        )}
      </div>
    </Drawer>
  )
}
