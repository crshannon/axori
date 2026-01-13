import { useState } from 'react'
import { Drawer, Input, Select, Typography } from '@axori/ui'
import { useCreateLoan } from '@/hooks/api/useProperties'

interface AddLoanDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  onSuccess?: () => void
}

export const AddLoanDrawer = ({
  isOpen,
  onClose,
  propertyId,
  onSuccess,
}: AddLoanDrawerProps) => {
  const createLoan = useCreateLoan()
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state - essential fields for now
  const [formData, setFormData] = useState({
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
      await createLoan.mutateAsync({
        propertyId,
        loanType: formData.loanType,
        lenderName: formData.lenderName.trim(),
        servicerName: formData.servicerName.trim() || undefined,
        loanNumber: formData.loanNumber.trim() || undefined,
        originalLoanAmount: Number(formData.originalLoanAmount),
        interestRate: Number(formData.interestRate),
        termMonths: Number(formData.termMonths),
        currentBalance: Number(formData.currentBalance),
        startDate: formData.startDate || undefined,
      })

      // Reset form
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

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error creating loan:', error)
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to create loan. Please try again.',
      })
    }
  }

  const loanTypes = [
    { value: 'conventional', label: 'Conventional' },
    { value: 'fha', label: 'FHA' },
    { value: 'va', label: 'VA' },
    { value: 'usda', label: 'USDA' },
    { value: 'portfolio', label: 'Portfolio' },
    { value: 'hard_money', label: 'Hard Money' },
    { value: 'bridge', label: 'Bridge' },
    { value: 'heloc', label: 'HELOC' },
    { value: 'construction', label: 'Construction' },
    { value: 'owner_financed', label: 'Owner Financed' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Add Loan"
      subtitle="LOAN MANAGEMENT"
      width="lg"
      footer={
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={createLoan.isPending}
            className="flex-1 py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] border transition-all hover:bg-slate-500/5 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/10 dark:text-white border-slate-200 text-slate-900"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={createLoan.isPending}
            className="flex-[2] py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 dark:bg-[#E8FF4D] dark:text-black dark:shadow-xl dark:shadow-[#E8FF4D]/20 bg-violet-600 text-white shadow-xl shadow-violet-200"
          >
            {createLoan.isPending ? 'Saving...' : 'Save Loan'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Core Loan Logic Section */}
        <section className="space-y-6">
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
                {loanTypes.map((type) => (
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
          <Typography
            variant="label-sm"
            tracking="custom"
            className="text-sm opacity-30 dark:opacity-40 text-slate-900 dark:text-slate-300"
          >
            Maturity & Terms
          </Typography>
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
        {errors.submit && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6">
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              {errors.submit}
            </p>
          </div>
        )}
      </form>
    </Drawer>
  )
}
