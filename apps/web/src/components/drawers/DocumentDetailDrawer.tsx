import { useState } from 'react'
import {
  Download,
  Trash2,
  RefreshCw,
  Calendar,
  FileText,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Drawer, ErrorCard, Select, Input, Textarea, DeleteConfirmationCard } from '@axori/ui'
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
} from '@axori/shared/src/validation'
import type { DocumentType } from '@axori/shared/src/validation'
import { DrawerSectionTitle } from './DrawerSectionTitle'
import {
  useDocument,
  useUpdateDocument,
  useDeleteDocument,
  useProcessDocument,
} from '@/hooks/api/useDocuments'

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
  const { data: document, isLoading, error } = useDocument(documentId)
  const updateDocument = useUpdateDocument()
  const deleteDocument = useDeleteDocument()
  const processDocument = useProcessDocument()

  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
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
    } catch (error) {
      setErrors({
        delete:
          error instanceof Error
            ? error.message
            : 'Failed to delete document',
      })
    }
  }

  const handleReprocess = async () => {
    if (!documentId) return

    try {
      await processDocument.mutateAsync({ id: documentId, propertyId })
      onSuccess?.()
    } catch (error) {
      setErrors({
        process:
          error instanceof Error
            ? error.message
            : 'Failed to start processing',
      })
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
            onClick={() => {
              // TODO: Implement download from Supabase Storage
              console.log('Download:', document.storagePath)
            }}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
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
            message="Are you sure you want to delete this document? This action cannot be undone."
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            isDeleting={deleteDocument.isPending}
          />
        )}

        {/* Document Preview Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Preview" color="violet" />
          <div className="rounded-2xl bg-slate-100 dark:bg-white/5 h-64 flex items-center justify-center">
            {document.mimeType?.startsWith('image/') ? (
              <div className="text-center">
                <FileText className="w-16 h-16 text-slate-400 mx-auto" />
                <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
                  Image preview coming soon
                </p>
              </div>
            ) : (
              <div className="text-center">
                <FileText className="w-16 h-16 text-slate-400 mx-auto" />
                <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
                  PDF preview coming soon
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
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <p className="font-medium text-emerald-800 dark:text-emerald-300 mb-2">
                Extracted Data
              </p>
              <pre className="text-sm text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap">
                {JSON.stringify(document.aiExtractedData, null, 2)}
              </pre>
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

              <Input
                variant="rounded"
                label="Tags"
                value={editFormData.tags}
                onChange={(e) => handleEditChange('tags', e.target.value)}
                helperText="Separate tags with commas"
              />
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
                {document.uploadedAt
                  ? new Date(document.uploadedAt).toLocaleString()
                  : 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-white/60">Last Updated</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {document.updatedAt
                  ? new Date(document.updatedAt).toLocaleString()
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </section>

        {/* Error Messages */}
        {(errors.submit || errors.delete || errors.process) && (
          <ErrorCard
            message={errors.submit || errors.delete || errors.process || 'An error occurred'}
          />
        )}
      </div>
    </Drawer>
  )
}
