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
import type { TransactionFormData } from '@axori/shared'

import {
  useDeleteTransaction,
  usePropertyTransaction,
  useUpdateTransaction,
} from '@/hooks/api/useTransactions'
import { useTransactionForm } from '@/hooks/forms'

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
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()
  const { data: existingTransaction } = usePropertyTransaction(
    propertyId,
    transactionId || null,
  )
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Use the form hook with Zod validation
  const {
    form,
    isEditMode,
    isPending,
    submitError,
    setSubmitError,
    handleSubmit,
    getFieldError,
  } = useTransactionForm({
    propertyId,
    transactionId,
    onSuccess,
    onClose,
  })

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

  // Get current form values for conditional rendering
  const formType = form.state.values.type

  // Get categories based on transaction type (from shared utilities)
  const getCategories = () => getTransactionCategories(formType)

  // Handle field change with error clearing
  const handleFieldChange = (
    field: keyof TransactionFormData,
    value: string | boolean,
  ) => {
    form.setFieldValue(field, value as never)
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
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to archive transaction. Please try again.',
      )
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
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to delete transaction. Please try again.',
      )
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
                  disabled={isPending}
                />
                <MenuDivider />
                <MenuItem
                  icon={Trash2}
                  label="Delete"
                  destructive
                  onClick={handleDeleteClick}
                  disabled={isPending || isDeleting}
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
              disabled={isPending || isDeleting}
              variant="outline"
              size="lg"
              className="flex-1 py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || isDeleting}
              variant="primary"
              size="lg"
              className="flex-[2] py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] hover:scale-105 disabled:hover:scale-100 shadow-xl shadow-violet-200 dark:shadow-[rgb(var(--color-accent))]/20"
            >
              {isPending
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
                value={form.state.values.type}
                onChange={(e) =>
                  handleFieldChange(
                    'type',
                    e.target.value as 'income' | 'expense' | 'capital',
                  )
                }
                options={[
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expense' },
                  { value: 'capital', label: 'Capital' },
                ]}
                error={getFieldError('type')}
                required
              />
              <Input
                type="date"
                variant="rounded"
                label="Transaction Date"
                value={form.state.values.transactionDate}
                onChange={(e) =>
                  handleFieldChange('transactionDate', e.target.value)
                }
                error={getFieldError('transactionDate')}
                required
              />
              <Input
                type="number"
                variant="rounded"
                label="Amount"
                step="0.01"
                min="0.01"
                value={form.state.values.amount}
                onChange={(e) => handleFieldChange('amount', e.target.value)}
                placeholder="0.00"
                error={getFieldError('amount')}
                required
              />
              <Select
                variant="rounded"
                label="Category"
                value={form.state.values.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                options={getCategories()}
                error={getFieldError('category')}
                required
              />
            </div>
          </section>

          {/* Party Information */}
          <section className="space-y-6">
            <DrawerSectionTitle
              title={
                formType === 'expense'
                  ? 'Vendor Information'
                  : formType === 'income'
                    ? 'Payer Information'
                    : 'Transaction Details'
              }
              color="emerald"
            />
            {formType === 'expense' && (
              <Input
                type="text"
                variant="rounded"
                label="Vendor"
                value={form.state.values.vendor}
                onChange={(e) => handleFieldChange('vendor', e.target.value)}
                placeholder="Who was paid?"
                error={getFieldError('vendor')}
                required
              />
            )}
            {formType === 'income' && (
              <Input
                type="text"
                variant="rounded"
                label="Payer"
                value={form.state.values.payer}
                onChange={(e) => handleFieldChange('payer', e.target.value)}
                placeholder="Who paid?"
                error={getFieldError('payer')}
                required
              />
            )}
            <Input
              type="text"
              variant="rounded"
              label="Subcategory"
              value={form.state.values.subcategory}
              onChange={(e) => handleFieldChange('subcategory', e.target.value)}
              placeholder="Optional subcategory"
              error={getFieldError('subcategory')}
            />
          </section>

          {/* Description & Notes */}
          <section className="space-y-6">
            <DrawerSectionTitle title="Additional Information" color="amber" />
            <Input
              type="text"
              variant="rounded"
              label="Description"
              value={form.state.values.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Transaction description"
              error={getFieldError('description')}
            />
            <Textarea
              variant="rounded"
              label="Notes"
              value={form.state.values.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              error={getFieldError('notes')}
            />
          </section>

          {/* Tax Information */}
          {(formType === 'expense' || formType === 'capital') && (
            <section className="space-y-6">
              <DrawerSectionTitle title="Tax Information" color="slate" />
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.state.values.isTaxDeductible}
                    onChange={(e) =>
                      handleFieldChange('isTaxDeductible', e.target.checked)
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
                  value={form.state.values.taxCategory}
                  onChange={(e) =>
                    handleFieldChange('taxCategory', e.target.value)
                  }
                  placeholder="e.g., Repairs, Maintenance, Utilities"
                  error={getFieldError('taxCategory')}
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
                checked={form.state.values.isRecurring}
                onChange={(e) =>
                  handleFieldChange('isRecurring', e.target.checked)
                }
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
                  checked={form.state.values.isExcluded}
                  onChange={(e) =>
                    handleFieldChange('isExcluded', e.target.checked)
                  }
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
          {submitError && <ErrorCard message={submitError} />}
        </form>
      )}
    </Drawer>
  )
}
