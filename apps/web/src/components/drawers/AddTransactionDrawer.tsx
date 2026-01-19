import { useEffect, useRef, useState } from 'react'
import { Archive, MoreVertical, Trash2 } from 'lucide-react'
import {
  Button,
  DeleteConfirmationCard,
  Drawer,
  ErrorCard,
  IconButton,
  Input,
  Menu,
  MenuDivider,
  MenuItem,
  Select,
  Textarea,
  Typography,
} from '@axori/ui'
import { getTransactionCategories } from '@axori/shared'
import { DrawerSectionTitle } from './DrawerSectionTitle'
import {
  useCreateTransaction,
  useDeleteTransaction,
  usePropertyTransaction,
  useUpdateTransaction,
} from '@/hooks/api/useTransactions'

interface AddTransactionDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  transactionId?: string // Optional: if provided, we're editing an existing transaction
  onSuccess?: () => void
}

export const AddTransactionDrawer = ({
  isOpen,
  onClose,
  propertyId,
  transactionId,
  onSuccess,
}: AddTransactionDrawerProps) => {
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()
  const { data: existingTransaction } = usePropertyTransaction(
    propertyId,
    transactionId || null,
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isEditMode = !!transactionId
  const mutation = isEditMode ? updateTransaction : createTransaction

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  // Form state
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense' | 'capital',
    transactionDate: new Date().toISOString().split('T')[0], // Today's date
    amount: '',
    category: '',
    subcategory: '',
    vendor: '', // For expenses
    payer: '', // For income
    description: '',
    notes: '',
    taxCategory: '',
    isTaxDeductible: true,
    isRecurring: false,
    isExcluded: false,
  })

  // Get categories based on transaction type (from shared utilities)
  const getCategories = () => getTransactionCategories(formData.type)

  // Populate form with existing transaction data when editing
  useEffect(() => {
    if (existingTransaction && isOpen && isEditMode) {
      setFormData({
        type: existingTransaction.type,
        transactionDate: existingTransaction.transactionDate,
        amount: parseFloat(existingTransaction.amount).toString(),
        category: existingTransaction.category,
        subcategory: existingTransaction.subcategory || '',
        vendor: existingTransaction.vendor || '',
        payer: existingTransaction.payer || '',
        description: existingTransaction.description || '',
        notes: existingTransaction.notes || '',
        taxCategory: existingTransaction.taxCategory || '',
        isTaxDeductible: existingTransaction.isTaxDeductible ?? true,
        isRecurring: existingTransaction.isRecurring ?? false,
        isExcluded: existingTransaction.isExcluded ?? false,
      })
      setErrors({})
    } else if (!isEditMode && isOpen) {
      // Reset form when opening in create mode
      setFormData({
        type: 'expense',
        transactionDate: new Date().toISOString().split('T')[0],
        amount: '',
        category: '',
        subcategory: '',
        vendor: '',
        payer: '',
        description: '',
        notes: '',
        taxCategory: '',
        isTaxDeductible: true,
        isRecurring: false,
        isExcluded: false,
      })
      setErrors({})
    }
  }, [existingTransaction, isOpen, isEditMode])

  // Reset category when type changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, category: '' }))
  }, [formData.type])

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    setErrors({})

    // Validate required fields
    const validationErrors: Record<string, string> = {}
    if (!formData.transactionDate) {
      validationErrors.transactionDate = 'Transaction date is required'
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      validationErrors.amount = 'Amount must be greater than 0'
    }
    if (!formData.category) {
      validationErrors.category = 'Category is required'
    }
    if (formData.type === 'expense' && !formData.vendor.trim()) {
      validationErrors.vendor = 'Vendor is required for expenses'
    }
    if (formData.type === 'income' && !formData.payer.trim()) {
      validationErrors.payer = 'Payer is required for income'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      // Prepare transaction data
      const transactionData: any = {
        type: formData.type,
        transactionDate: formData.transactionDate,
        amount: parseFloat(formData.amount),
        category: formData.category,
        isTaxDeductible: formData.isTaxDeductible,
        isRecurring: formData.isRecurring,
      }

      // Add type-specific fields
      if (formData.type === 'expense' && formData.vendor) {
        transactionData.vendor = formData.vendor.trim()
      }
      if (formData.type === 'income' && formData.payer) {
        transactionData.payer = formData.payer.trim()
      }

      // Add optional fields
      if (formData.subcategory.trim()) {
        transactionData.subcategory = formData.subcategory.trim()
      }
      if (formData.description.trim()) {
        transactionData.description = formData.description.trim()
      }
      if (formData.notes.trim()) {
        transactionData.notes = formData.notes.trim()
      }
      if (formData.taxCategory.trim()) {
        transactionData.taxCategory = formData.taxCategory.trim()
      }
      transactionData.isExcluded = formData.isExcluded

      if (isEditMode && transactionId) {
        await updateTransaction.mutateAsync({
          propertyId,
          transactionId,
          ...transactionData,
        })
      } else {
        await createTransaction.mutateAsync({
          propertyId,
          ...transactionData,
        })
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error creating transaction:', error)
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to create transaction. Please try again.',
      })
    }
  }

  const handleArchive = async () => {
    if (!transactionId) return

    try {
      setShowMenu(false)
      await updateTransaction.mutateAsync({
        propertyId,
        transactionId,
        id: transactionId,
        isExcluded: !existingTransaction?.isExcluded,
      })
      onSuccess?.()
    } catch (error) {
      console.error('Error archiving transaction:', error)
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to archive transaction. Please try again.',
      })
    }
  }

  const handleDelete = async () => {
    if (!transactionId) return

    try {
      setShowMenu(false)
      setIsDeleting(true)
      await deleteTransaction.mutateAsync({
        propertyId,
        transactionId,
      })
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to delete transaction. Please try again.',
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleDeleteClick = () => {
    setShowMenu(false)
    setShowDeleteConfirm(true)
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Transaction' : 'Add Transaction'}
      subtitle="HISTORICAL P&L REGISTRY"
      width="lg"
      className="relative"
      headerActions={
        isEditMode ? (
          <div className="relative" ref={menuRef}>
            <IconButton
              icon={MoreVertical}
              onClick={() => setShowMenu(!showMenu)}
              size="md"
              variant="primary"
              shape="rounded"
              aria-label="Transaction actions"
            />
            {showMenu && (
              <Menu>
                <MenuItem
                  icon={Archive}
                  label={
                    existingTransaction?.isExcluded
                      ? 'Include in calculations'
                      : 'Archive'
                  }
                  onClick={handleArchive}
                  disabled={mutation.isPending}
                />
                <MenuDivider />
                <MenuItem
                  icon={Trash2}
                  label="Delete"
                  destructive
                  onClick={handleDeleteClick}
                  disabled={mutation.isPending || isDeleting}
                />
              </Menu>
            )}
          </div>
        ) : undefined
      }
      footer={
        !showDeleteConfirm ? (
          <div className="flex gap-4">
            <Button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending || isDeleting}
              variant="outline"
              size="lg"
              className="flex-1 py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={mutation.isPending || isDeleting}
              variant="primary"
              size="lg"
              className="flex-[2] py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] hover:scale-105 disabled:hover:scale-100 shadow-xl shadow-violet-200 dark:shadow-[rgb(var(--color-accent))]/20"
            >
              {mutation.isPending
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                  ? 'Update Transaction'
                  : 'Add Transaction'}
            </Button>
          </div>
        ) : null
      }
    >
      {showDeleteConfirm ? (
        <div className="space-y-6 w-full">
          <DeleteConfirmationCard
            title="Delete Transaction"
            description="Are you sure you want to permanently delete this transaction? This action cannot be undone."
            onCancel={() => setShowDeleteConfirm(false)}
            onDelete={handleDelete}
            isLoading={isDeleting}
            disabled={isDeleting}
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Transaction Type & Basic Info */}
          <section className="space-y-6">
            <DrawerSectionTitle title="Transaction Details" color="violet" />
            <div className="grid grid-cols-2 gap-4">
              <Select
                variant="rounded"
                label="Transaction Type"
                value={formData.type}
                onChange={(e) =>
                  handleChange(
                    'type',
                    e.target.value as 'income' | 'expense' | 'capital',
                  )
                }
                options={[
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expense' },
                  { value: 'capital', label: 'Capital' },
                ]}
                error={errors.type}
                required
              />
              <Input
                type="date"
                variant="rounded"
                label="Transaction Date"
                value={formData.transactionDate}
                onChange={(e) =>
                  handleChange('transactionDate', e.target.value)
                }
                error={errors.transactionDate}
                required
              />
              <Input
                type="number"
                variant="rounded"
                label="Amount"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="0.00"
                error={errors.amount}
                required
              />
              <Select
                variant="rounded"
                label="Category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                options={getCategories()}
                error={errors.category}
                required
              />
            </div>
          </section>

          {/* Party Information */}
          <section className="space-y-6">
            <DrawerSectionTitle
              title={
                formData.type === 'expense'
                  ? 'Vendor Information'
                  : formData.type === 'income'
                    ? 'Payer Information'
                    : 'Transaction Details'
              }
              color="emerald"
            />
            {formData.type === 'expense' && (
              <Input
                type="text"
                variant="rounded"
                label="Vendor"
                value={formData.vendor}
                onChange={(e) => handleChange('vendor', e.target.value)}
                placeholder="Who was paid?"
                error={errors.vendor}
                required
              />
            )}
            {formData.type === 'income' && (
              <Input
                type="text"
                variant="rounded"
                label="Payer"
                value={formData.payer}
                onChange={(e) => handleChange('payer', e.target.value)}
                placeholder="Who paid?"
                error={errors.payer}
                required
              />
            )}
            <Input
              type="text"
              variant="rounded"
              label="Subcategory"
              value={formData.subcategory}
              onChange={(e) => handleChange('subcategory', e.target.value)}
              placeholder="Optional subcategory"
              error={errors.subcategory}
            />
          </section>

          {/* Description & Notes */}
          <section className="space-y-6">
            <DrawerSectionTitle title="Additional Information" color="amber" />
            <Input
              type="text"
              variant="rounded"
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Transaction description"
              error={errors.description}
            />
            <Textarea
              variant="rounded"
              label="Notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              error={errors.notes}
            />
          </section>

          {/* Tax Information */}
          {(formData.type === 'expense' || formData.type === 'capital') && (
            <section className="space-y-6">
              <DrawerSectionTitle title="Tax Information" color="slate" />
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isTaxDeductible}
                    onChange={(e) =>
                      handleChange('isTaxDeductible', e.target.checked)
                    }
                    className="w-5 h-5 rounded border-slate-300 dark:border-white/20 text-violet-600 dark:text-[rgb(var(--color-accent))] focus:ring-violet-500 dark:focus:ring-[rgb(var(--color-accent))]"
                  />
                  <Typography
                    variant="body-sm"
                    weight="bold"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Tax Deductible
                  </Typography>
                </label>
                <Input
                  type="text"
                  variant="rounded"
                  label="Tax Category (Schedule E)"
                  value={formData.taxCategory}
                  onChange={(e) => handleChange('taxCategory', e.target.value)}
                  placeholder="e.g., Repairs, Maintenance, Utilities"
                  error={errors.taxCategory}
                />
              </div>
            </section>
          )}

          {/* Recurring */}
          <section className="space-y-6">
            <DrawerSectionTitle title="Recurring" color="indigo" />
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => handleChange('isRecurring', e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 dark:border-white/20 text-violet-600 dark:text-[rgb(var(--color-accent))] focus:ring-violet-500 dark:focus:ring-[rgb(var(--color-accent))]"
              />
              <Typography
                variant="body-sm"
                weight="bold"
                className="text-slate-700 dark:text-slate-300"
              >
                This is a recurring transaction
              </Typography>
            </label>
          </section>

          {/* Exclude from Calculations */}
          {isEditMode && (
            <section className="space-y-6">
              <DrawerSectionTitle title="Transaction Status" color="slate" />
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isExcluded}
                  onChange={(e) => handleChange('isExcluded', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 dark:border-white/20 text-violet-600 dark:text-[rgb(var(--color-accent))] focus:ring-violet-500 dark:focus:ring-[rgb(var(--color-accent))]"
                />
                <div className="flex flex-col gap-1">
                  <Typography
                    variant="body-sm"
                    weight="bold"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Exclude from calculations
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-slate-500 dark:text-slate-400"
                  >
                    Transaction will remain visible but won't be included in
                    financial calculations
                  </Typography>
                </div>
              </label>
            </section>
          )}

          {/* Error Message */}
          {errors.submit && <ErrorCard message={errors.submit} />}
        </form>
      )}
    </Drawer>
  )
}
