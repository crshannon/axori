import { Input, Select, Typography } from '@axori/ui'
import { FormLabel, StepperTitle, ToggleButton } from '../components'
import type { StepProps } from '../types'

export const Step4Financing = ({
  formData,
  setFormData,
  formatCurrency,
  calculatePI,
}: StepProps & { calculatePI: () => string }) => {
  return (
    <div className="w-full animate-in slide-in-from-right-8 duration-500">
      <StepperTitle
        title="How did you finance this?"
        subtitle="Select acquisition funding method"
      />

      <div className="flex gap-6 mb-12 flex-wrap">
        {[
          {
            id: 'Cash',
            icon: (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            ),
          },
          {
            id: 'Mortgage',
            icon: (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M3 21h18M3 10l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
            ),
          },
        ].map((opt) => (
          <ToggleButton
            key={opt.id}
            id={opt.id}
            icon={opt.icon}
            label={opt.id}
            isSelected={formData.financeType === opt.id}
            onClick={() =>
              setFormData({ ...formData, financeType: opt.id as any })
            }
          />
        ))}
      </div>

      {formData.financeType === 'Mortgage' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="space-y-1">
            <FormLabel>Loan Type</FormLabel>
            <Select
              variant="rounded"
              value={formData.loanType}
              onChange={(e) =>
                setFormData({ ...formData, loanType: e.target.value })
              }
            >
              <option>Conventional</option>
              <option>FHA</option>
              <option>VA</option>
              <option>DSCR</option>
              <option>Hard Money</option>
            </Select>
          </div>
          <div className="space-y-1">
            <FormLabel>Provider</FormLabel>
            <Input
              type="text"
              variant="rounded"
              value={formData.provider}
              onChange={(e) =>
                setFormData({ ...formData, provider: e.target.value })
              }
              placeholder="Enter lender name..."
            />
          </div>
          <div className="space-y-1">
            <FormLabel>Loan Amount ($)</FormLabel>
            <Input
              type="text"
              variant="rounded"
              value={formData.loanAmount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  loanAmount: formatCurrency(e.target.value),
                })
              }
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <FormLabel>Interest Rate (%)</FormLabel>
            <Input
              type="text"
              variant="rounded"
              value={formData.interestRate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  interestRate: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-1">
            <FormLabel>Loan Term (Years)</FormLabel>
            <Select
              variant="rounded"
              value={formData.loanTerm}
              onChange={(e) =>
                setFormData({ ...formData, loanTerm: e.target.value })
              }
            >
              <option>15</option>
              <option>20</option>
              <option>30</option>
            </Select>
          </div>
          <div className="space-y-1">
            <FormLabel>Estimated P&I Payment</FormLabel>
            <div className="py-2 px-4 rounded-2xl border flex items-center justify-between bg-slate-50 border-slate-100 dark:bg-white/5 dark:border-white/5">
              <Typography
                variant="h4"
                className="tabular-nums tracking-tighter text-violet-600 dark:text-[#E8FF4D]"
              >
                ${calculatePI()}/mo
              </Typography>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
