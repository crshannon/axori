import { useCallback, useState } from 'react'
import { Upload, File, X, AlertCircle } from 'lucide-react'
import { Drawer, ErrorCard, Input, Select, Textarea, Button } from '@axori/ui'
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_PDF,
  MAX_FILE_SIZE_IMAGE,
} from '@axori/shared/src/validation'
import type { DocumentType } from '@axori/shared/src/validation'
import { DrawerSectionTitle } from './DrawerSectionTitle'
import { useCreateDocument } from '@/hooks/api/useDocuments'

interface DocumentUploadDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  documentId?: string // Optional: for future edit support
  onSuccess?: () => void
}

interface UploadedFile {
  file: File
  preview?: string
  storagePath?: string
}

export const DocumentUploadDrawer = ({
  isOpen,
  onClose,
  propertyId,
  onSuccess,
}: DocumentUploadDrawerProps) => {
  const createDocument = useCreateDocument()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDragging, setIsDragging] = useState(false)

  // Form state
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null)
  const [formData, setFormData] = useState({
    documentType: '' as DocumentType | '',
    documentYear: '',
    description: '',
    tags: '',
    enableAiProcessing: true,
  })

  const resetForm = useCallback(() => {
    setSelectedFile(null)
    setFormData({
      documentType: '',
      documentYear: '',
      description: '',
      tags: '',
      enableAiProcessing: true,
    })
    setErrors({})
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateFile = (file: File): string | null => {
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
      return `Invalid file type. Allowed: PDF, PNG, JPG, HEIC`
    }

    // Check file size
    const maxSize = file.type === 'application/pdf' ? MAX_FILE_SIZE_PDF : MAX_FILE_SIZE_IMAGE
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024))
      return `File too large. Maximum size: ${maxMB}MB`
    }

    return null
  }

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      setErrors((prev) => ({ ...prev, file: error }))
      return
    }

    // Create preview for images
    let preview: string | undefined
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file)
    }

    setSelectedFile({ file, preview })
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.file
      return newErrors
    })

    // Try to auto-detect year from filename (e.g., "tax_bill_2024.pdf")
    const yearMatch = file.name.match(/20\d{2}/)
    if (yearMatch && !formData.documentYear) {
      setFormData((prev) => ({ ...prev, documentYear: yearMatch[0] }))
    }
  }, [formData.documentYear])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const removeFile = useCallback(() => {
    if (selectedFile?.preview) {
      URL.revokeObjectURL(selectedFile.preview)
    }
    setSelectedFile(null)
  }, [selectedFile])

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    setErrors({})

    // Validate required fields
    const validationErrors: Record<string, string> = {}

    if (!selectedFile) {
      validationErrors.file = 'Please select a file to upload'
    }

    if (!formData.documentType) {
      validationErrors.documentType = 'Document type is required'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      // TODO: Implement Supabase Storage upload here
      // For now, we'll create a mock storage path
      // In production, this would:
      // 1. Upload file to Supabase Storage
      // 2. Get the storage path back
      // 3. Create the document record

      const storagePath = `documents/${propertyId}/${Date.now()}_${selectedFile!.file.name}`

      // Parse tags
      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      await createDocument.mutateAsync({
        propertyId,
        storagePath,
        originalFilename: selectedFile!.file.name,
        mimeType: selectedFile!.file.type,
        sizeBytes: selectedFile!.file.size,
        documentType: formData.documentType as DocumentType,
        documentYear: formData.documentYear ? parseInt(formData.documentYear, 10) : null,
        description: formData.description || null,
        tags: tags.length > 0 ? tags : undefined,
        enableAiProcessing: formData.enableAiProcessing,
      })

      onSuccess?.()
      handleClose()
    } catch (error) {
      console.error('Error uploading document:', error)
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to upload document. Please try again.',
      })
    }
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i)

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Document"
      subtitle="ADD NEW DOCUMENT"
      width="lg"
      footer={
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={createDocument.isPending}
            className="flex-1 py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] border transition-all hover:bg-slate-500/5 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/10 dark:text-white border-slate-200 text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={createDocument.isPending || !selectedFile || !formData.documentType}
            className="flex-[2] py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 dark:bg-[#E8FF4D] dark:text-black dark:shadow-xl dark:shadow-[#E8FF4D]/20 bg-violet-600 text-white shadow-xl shadow-violet-200"
          >
            {createDocument.isPending ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-10">
        {/* File Upload Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Select File" color="violet" />

          {!selectedFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
                ${isDragging
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-slate-300 dark:border-white/20 hover:border-violet-400 dark:hover:border-violet-500'
                }
                ${errors.file ? 'border-red-500' : ''}
              `}
            >
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.heic,.heif"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-slate-500 dark:text-white/60 mt-1">
                    PDF, PNG, JPG, HEIC (max 25MB for PDF, 10MB for images)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative border rounded-2xl p-4 bg-slate-50 dark:bg-white/5">
              <div className="flex items-center gap-4">
                {selectedFile.preview ? (
                  <img
                    src={selectedFile.preview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                    <File className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">
                    {selectedFile.file.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-white/60">
                    {(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500 dark:text-white/60" />
                </button>
              </div>
            </div>
          )}

          {errors.file && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.file}
            </div>
          )}
        </section>

        {/* Document Classification Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Document Details" color="violet" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              variant="rounded"
              label="Document Type"
              value={formData.documentType}
              onChange={(e) => handleChange('documentType', e.target.value)}
              error={errors.documentType}
              required
            >
              <option value="">Select type...</option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DOCUMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>

            <Select
              variant="rounded"
              label="Tax Year"
              value={formData.documentYear}
              onChange={(e) => handleChange('documentYear', e.target.value)}
              error={errors.documentYear}
            >
              <option value="">Select year...</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            variant="rounded"
            label="Description (optional)"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Add notes about this document..."
            rows={3}
          />

          <Input
            variant="rounded"
            label="Tags (optional)"
            value={formData.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
            placeholder="Enter tags separated by commas"
            helperText="e.g., urgent, needs-review, 2024-taxes"
          />
        </section>

        {/* AI Processing Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="AI Processing" color="violet" />
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.enableAiProcessing}
                onChange={(e) => handleChange('enableAiProcessing', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 rounded-full peer peer-checked:bg-violet-600 dark:peer-checked:bg-[#E8FF4D] transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-[#E8FF4D] transition-colors">
                Enable AI Document Intelligence
              </p>
              <p className="text-sm text-slate-500 dark:text-white/60">
                Automatically extract key data from this document
              </p>
            </div>
          </label>
        </section>

        {/* Error Message */}
        {(errors.submit || createDocument.error) && (
          <ErrorCard
            message={
              errors.submit ||
              (createDocument.error instanceof Error
                ? createDocument.error.message
                : 'Failed to upload')
            }
          />
        )}
      </form>
    </Drawer>
  )
}
