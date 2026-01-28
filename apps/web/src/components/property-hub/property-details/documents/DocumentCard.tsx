import {
  AlertCircle,
  CheckCircle2,
  Clock,
  File,
  FileText,
  Image,
  Loader2,
} from 'lucide-react'
import { DOCUMENT_TYPE_LABELS } from '@axori/shared/src/validation'
import type { PropertyDocument } from '@axori/shared'

interface DocumentCardProps {
  document: PropertyDocument
  onClick: () => void
}

export const DocumentCard = ({ document, onClick }: DocumentCardProps) => {
  const getFileIcon = () => {
    if (document.mimeType?.startsWith('image/')) {
      return <Image className="w-8 h-8 text-violet-500" />
    }
    if (document.mimeType === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />
    }
    return <File className="w-8 h-8 text-slate-400" />
  }

  const getStatusBadge = () => {
    switch (document.processingStatus) {
      case 'completed':
        return (
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Processed</span>
          </div>
        )
      case 'processing':
        return (
          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Processing</span>
          </div>
        )
      case 'failed':
        return (
          <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-white/60">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </div>
        )
    }
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/5 hover:border-violet-300 dark:hover:border-violet-500/50 hover:shadow-lg transition-all group"
    >
      <div className="flex items-start gap-3">
        {/* File Icon */}
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30 transition-colors">
          {getFileIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Filename */}
          <p className="font-medium text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-[#E8FF4D] transition-colors">
            {document.originalFilename}
          </p>

          {/* Type and Year */}
          <p className="text-sm text-slate-500 dark:text-white/60 truncate mt-0.5">
            {DOCUMENT_TYPE_LABELS[document.documentType]}
            {document.documentYear && ` - ${document.documentYear}`}
          </p>

          {/* Status and Date */}
          <div className="flex items-center justify-between mt-2">
            {getStatusBadge()}
            <span className="text-xs text-slate-400 dark:text-white/40">
              {formatDate(document.uploadedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {document.tags && document.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
          {document.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70"
            >
              {tag}
            </span>
          ))}
          {document.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/50">
              +{document.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  )
}
