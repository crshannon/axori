import { Heading } from '@axori/ui'
import { FormLabel, StepperTitle, ToggleButton, inputClass } from '../components'
import type { StepProps } from '../types'
import { cn } from '@/utils/helpers'

export const Step5Management = ({
  formData,
  setFormData,
  formatCurrency,
}: StepProps) => {
  return (
    <div className="w-full animate-in slide-in-from-right-8 duration-500">
      <StepperTitle
        title="How is this property managed?"
        subtitle="Define operational structure"
      />

      <div className="flex gap-6 mb-12 flex-wrap">
        {[
          {
            id: 'Self-Managed',
            icon: (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            ),
          },
          {
            id: 'Property Manager',
            icon: (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <rect
                  x="4"
                  y="2"
                  width="16"
                  height="20"
                  rx="2"
                  ry="2"
                />
                <line x1="9" y1="22" x2="9" y2="2" />
                <line x1="8" y1="6" x2="16" y2="6" />
                <line x1="8" y1="10" x2="16" y2="10" />
                <line x1="8" y1="14" x2="16" y2="14" />
                <line x1="8" y1="18" x2="16" y2="18" />
              </svg>
            ),
          },
        ].map((opt) => (
          <ToggleButton
            key={opt.id}
            id={opt.id}
            icon={opt.icon}
            label={opt.id}
            isSelected={formData.mgmtType === opt.id}
            onClick={() =>
              setFormData({ ...formData, mgmtType: opt.id as any })
            }
          />
        ))}
      </div>

      {formData.mgmtType === 'Property Manager' && (
        <div className="mb-12 animate-in slide-in-from-top-4 duration-500">
          <FormLabel>PM Company Name</FormLabel>
          <div className="flex gap-4">
            <input
              type="text"
              value={formData.pmCompany}
              onChange={(e) =>
                setFormData({ ...formData, pmCompany: e.target.value })
              }
              placeholder="Enter PM firm name..."
              className={inputClass}
            />
            <button className="shrink-0 px-6 rounded-2xl border text-[9px] font-black text-black dark:text-white uppercase tracking-widest flex items-center gap-2 transition-all border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-400 dark:hover:bg-indigo-500/10">
              Connect AppFolio
            </button>
          </div>
        </div>
      )}

      <div className="h-px bg-slate-500/10 w-full mb-12"></div>

      <div>
        <div className="flex justify-between items-center mb-6">
          <Heading level={5} className="text-black dark:text-white">
            Rental Status
          </Heading>
          <div className="flex p-1 rounded-xl bg-slate-500/10">
            {['Yes', 'No'].map((v) => (
              <button
                key={v}
                onClick={() => setFormData({ ...formData, isRented: v })}
                className={cn(
                  'px-6 py-2 rounded-lg text-[10px] font-black text-black dark:text-white uppercase tracking-widest transition-all',
                  formData.isRented === v
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                    : 'opacity-40 hover:opacity-100',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {formData.isRented === 'Yes' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-500">
            <div className="space-y-1">
              <FormLabel>Monthly Rent ($)</FormLabel>
              <input
                type="text"
                value={formData.rentAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rentAmount: formatCurrency(e.target.value),
                  })
                }
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <FormLabel>Lease End Date</FormLabel>
              <input
                type="date"
                value={formData.leaseEnd}
                onChange={(e) =>
                  setFormData({ ...formData, leaseEnd: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <FormLabel>Tenant Name (Optional)</FormLabel>
              <input
                type="text"
                value={formData.tenantName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tenantName: e.target.value,
                  })
                }
                placeholder="John Doe"
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

