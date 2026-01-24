import { useEffect, useState } from 'react'
import { Drawer, ErrorCard, Input, Select } from '@axori/ui'
import { LOAN_TYPE_OPTIONS } from '@axori/shared'
import { DrawerSectionTitle } from './DrawerSectionTitle'
import { useProperty } from '@/hooks/api/useProperties'
import { useCreateLoan, useUpdateLoan } from '@/hooks/api/useLoans'
import type { LoanInsertApi } from '@axori/shared'

interface AddLoanDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  loanId?: string // Optional: if provided, we're editing an existing loan
  onSuccess?: () => void
}

export const AddLoanDrawer = ({
  isOpen,
  onClose,
  propertyId,
  loanId,
  onSuccess,
}: AddLoanDrawerProps) => {
  const createLoan = useCreateLoan()
  const updateLoan = useUpdateLoan()
  const { data: property } = useProperty(propertyId)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const isEditMode = !!loanId
  const mutation = isEditMode ? updateLoan : createLoan

  // Find the loan to edit if loanId is provided
  const existingLoan = loanId
    ? property?.loans?.find((loan) => loan.id === loanId)
    : null

  // Form state - essential fields for now
  // Using string for form inputs, will convert to proper types on submit
  const [formData, setFormData] = useState<{
    loanType: LoanInsertApi['loanType'] | ''
    lenderName: string
    originalLoanAmount: string
    interestRate: string
    termMonths: string
    currentBalance: string
    startDate: string
    loanNumber: string
    servicerName: string
  }>({
    loanType: 'conventional',
    lenderName: '',
    originalLoanAmount: '',
    interestRate: '',
    termMonths: '',
    currentBalance: '',
    startDate: '',
    loanNumber: '',
    servicerName: '',
  })

  // Populate form with existing loan data when editing
  useEffect(() => {
    if (existingLoan && isOpen) {
      setFormData({
        loanType: existingLoan.loanType,
        lenderName: existingLoan.lenderName || '',
        originalLoanAmount: existingLoan.originalLoanAmount.toString(),
        interestRate: existingLoan.interestRate
          ? (() => {
              // Convert from decimal (0.065) to percentage (6.5) for display
              const decimalRate = Number(existingLoan.interestRate)
              // If the rate is < 1, it's already a decimal (0.065), convert to percentage
              // If the rate is >= 1, it might already be a percentage, but we'll assume decimal for consistency
              return (decimalRate * 100).toString()
            })()
          : '',
        termMonths: existingLoan.termMonths.toString(),
        currentBalance: existingLoan.currentBalance.toString(),
        startDate: existingLoan.startDate || '',
        loanNumber: existingLoan.loanNumber || '',
        servicerName: existingLoan.servicerName || '',
      })
    } else if (!isEditMode && isOpen) {
      // Reset form when opening in create mode
      setFormData({
        loanType: 'conventional',
        lenderName: '',
        originalLoanAmount: '',
        interestRate: '',
        termMonths: '',
        currentBalance: '',
        startDate: '',
        loanNumber: '',
        servicerName: '',
      })
    }
  }, [existingLoan, isOpen, isEditMode])

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
    if (!formData.lenderName.trim()) {
      validationErrors.lenderName = 'Lender name is required'
    }
    if (
      !formData.originalLoanAmount ||
      Number(formData.originalLoanAmount) <= 0
    ) {
      validationErrors.originalLoanAmount = 'Original loan amount is required'
    }
    if (!formData.interestRate || Number(formData.interestRate) <= 0) {
      validationErrors.interestRate = 'Interest rate is required'
    }
    if (!formData.termMonths || Number(formData.termMonths) <= 0) {
      validationErrors.termMonths = 'Loan term is required'
    }
    if (!formData.currentBalance || Number(formData.currentBalance) <= 0) {
      validationErrors.currentBalance = 'Current balance is required'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      const loanData: Omit<LoanInsertApi, 'userId'> = {
        propertyId,
        loanType: formData.loanType || 'conventional',
        lenderName: formData.lenderName.trim(),
        servicerName: formData.servicerName.trim() || undefined,
        loanNumber: formData.loanNumber.trim() || undefined,
        originalLoanAmount: Number(formData.originalLoanAmount),
        interestRate: Number(formData.interestRate), // API expects percentage (0-100)
        termMonths: Number(formData.termMonths),
        currentBalance: Number(formData.currentBalance),
        startDate: formData.startDate || undefined,
      }

      if (isEditMode && loanId) {
        await updateLoan.mutateAsync({
          ...loanData,
          loanId,
        })
      } else {
        await createLoan.mutateAsync(loanData)
        // Reset form only on create
        setFormData({
          loanType: 'conventional',
          lenderName: '',
          originalLoanAmount: '',
          interestRate: '',
          termMonths: '',
          currentBalance: '',
          startDate: '',
          loanNumber: '',
          servicerName: '',
        })
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} loan:`,
        error,
      )
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : `Failed to ${isEditMode ? 'update' : 'create'} loan. Please try again.`,
      })
    }
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Loan' : 'Add Loan'}
      subtitle="LOAN MANAGEMENT"
      width="lg"
      footer={
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] border transition-all hover:bg-slate-500/5 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/10 dark:text-white border-slate-200 text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="flex-[2] py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 dark:bg-[#E8FF4D] dark:text-black dark:shadow-xl dark:shadow-[#E8FF4D]/20 bg-violet-600 text-white shadow-xl shadow-violet-200"
          >
            {mutation.isPending
              ? 'Saving...'
              : isEditMode
                ? 'Update Loan'
                : 'Save Loan'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Core Loan Logic Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Loan Details" color="violet" />
          <div className="space-y-4">
            {/* Loan Type */}
            <div className="group">
              <Select
                variant="rounded"
                label="Loan Type"
                required
                value={formData.loanType}
                onChange={(e) => handleChange('loanType', e.target.value)}
                error={errors.loanType}
              >
                {LOAN_TYPE_OPTIONS.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Lender Name */}
            <div className="group">
              <Input
                type="text"
                variant="rounded"
                label="Active Lender"
                required
                value={formData.lenderName}
                onChange={(e) => handleChange('lenderName', e.target.value)}
                placeholder="Enter lender name"
                error={errors.lenderName}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Original Loan Amount */}
              <div>
                <Input
                  type="number"
                  variant="rounded"
                  label="Principal Balance"
                  required
                  step="0.01"
                  min="0"
                  value={formData.originalLoanAmount}
                  onChange={(e) =>
                    handleChange('originalLoanAmount', e.target.value)
                  }
                  placeholder="0.00"
                  error={errors.originalLoanAmount}
                />
              </div>

              {/* Interest Rate */}
              <div>
                <Input
                  type="number"
                  variant="rounded"
                  label="Interest Rate (%)"
                  required
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.interestRate}
                  onChange={(e) => handleChange('interestRate', e.target.value)}
                  placeholder="0.00"
                  error={errors.interestRate}
                />
              </div>
            </div>

            {/* Current Balance */}
            <div className="group">
              <Input
                type="number"
                variant="rounded"
                label="Current Balance"
                required
                step="0.01"
                min="0"
                value={formData.currentBalance}
                onChange={(e) => handleChange('currentBalance', e.target.value)}
                placeholder="0.00"
                error={errors.currentBalance}
              />
            </div>

            {/* Servicer Name */}
            <div className="group">
              <Input
                type="text"
                variant="rounded"
                label="Servicer Name"
                value={formData.servicerName}
                onChange={(e) => handleChange('servicerName', e.target.value)}
                placeholder="Enter servicer name (if different from lender)"
                error={errors.servicerName}
              />
            </div>

            {/* Loan Number */}
            <div className="group">
              <Input
                type="text"
                variant="rounded"
                label="Loan Number"
                value={formData.loanNumber}
                onChange={(e) => handleChange('loanNumber', e.target.value)}
                placeholder="Enter loan number"
                error={errors.loanNumber}
              />
            </div>
          </div>
        </section>

        {/* Maturity & Terms Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Maturity & Terms" color="emerald" />
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <Input
                type="date"
                variant="rounded"
                label="Loan Start Date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />
            </div>

            {/* Term (Months) */}
            <div>
              <Input
                type="number"
                variant="rounded"
                label="Loan Term (Months)"
                required
                min="1"
                value={formData.termMonths}
                onChange={(e) => handleChange('termMonths', e.target.value)}
                placeholder="360"
                error={errors.termMonths}
              />
              <p className="mt-2 text-[9px] font-bold uppercase tracking-widest opacity-40 dark:opacity-50 italic text-slate-600 dark:text-slate-400">
                Common: 360 (30yr), 180 (15yr), 240 (20yr)
              </p>
            </div>
          </div>
        </section>

        {/* Error Message */}
        {errors.submit && <ErrorCard message={errors.submit} />}
      </form>
    </Drawer>
  )
}
