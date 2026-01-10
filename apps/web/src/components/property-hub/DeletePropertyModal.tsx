import { useState } from 'react'
import { X } from 'lucide-react'
import { Button, Card, Heading, Input } from '@axori/ui'
import { cn } from '@/utils/helpers'

interface DeletePropertyModalProps {
  propertyAddress: string
  onConfirm: () => Promise<void>
  onCancel: () => void
  isDeleting?: boolean
}

export const DeletePropertyModal = ({
  propertyAddress,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeletePropertyModalProps) => {
  const [confirmText, setConfirmText] = useState('')
  const isConfirmValid = confirmText.toLowerCase() === 'delete'

  const handleConfirm = async () => {
    if (isConfirmValid) {
      await onConfirm()
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in">
      <Card
        variant="rounded"
        padding="lg"
        radius="lg"
        className="max-w-md w-full"
      >
        <div className="flex justify-between items-center mb-6">
          <Heading level={3} className="text-black dark:text-white">
            Delete Property
          </Heading>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="p-2 rounded-xl transition-all opacity-40 hover:opacity-100 text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Are you sure you want to delete this property? This action cannot be
            undone.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <p className="text-sm font-medium text-black dark:text-white">
              {propertyAddress}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label
            htmlFor="confirm-input"
            className="block text-sm font-medium text-black dark:text-white mb-2"
          >
            Type <span className="font-black">DELETE</span> to confirm:
          </label>
          <Input
            id="confirm-input"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete"
            disabled={isDeleting}
            className="w-full"
          />
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={!isConfirmValid || isDeleting}
            className="flex-1"
          >
            {isDeleting ? 'Deleting...' : 'Delete Property'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
