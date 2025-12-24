import { Caption, Heading } from '@axori/ui'
import { cn } from '@/utils/helpers'
import type { StepProps } from '../types'
import { StepperTitle } from '../components'

export const Step6Strategy = ({ formData, setFormData }: StepProps) => {
  return (
    <div className="w-full max-w-4xl animate-in slide-in-from-right-8 duration-500">
      <StepperTitle
        title="What's your strategy for this property?"
        subtitle="Select the primary investment thesis"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[
          {
            id: 'Primary',
            title: 'Primary Residence',
            desc: 'I live here',
            icon: (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
            ),
          },
          {
            id: 'House Hack',
            title: 'House Hack',
            desc: 'Live in + rent out',
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
                <path d="M9 17h6" />
              </svg>
            ),
          },
          {
            id: 'Hold',
            title: 'Buy-and-Hold',
            desc: 'Long-term rental',
            icon: (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 20V10M18 20V4M6 20v-4" />
              </svg>
            ),
          },
          {
            id: 'BRRRR',
            title: 'BRRRR',
            desc: 'Rehab, rent, refinance',
            icon: (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
            ),
          },
          {
            id: 'STR',
            title: 'Short-Term Rental',
            desc: 'Airbnb / VRBO',
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
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  ry="2"
                />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ),
          },
          {
            id: 'Flip',
            title: 'Fix & Flip',
            desc: 'Renovate and sell',
            icon: (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="m11.5 6.5 4 4.5m4-4.5-4 4.5M21 21l-4.5-4.5M6.5 11.5 2 7l5-5 4.5 4.5L7 11z" />
              </svg>
            ),
          },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => setFormData({ ...formData, strategy: opt.id })}
            className={cn(
              'p-8 rounded-[2.5rem] border text-left transition-all relative overflow-hidden flex flex-col justify-between group h-48 cursor-pointer',
              formData.strategy === opt.id
                ? 'bg-violet-600 text-white border-violet-600 shadow-2xl scale-[1.02] dark:bg-[#E8FF4D] dark:text-black dark:border-[#E8FF4D] dark:shadow-[0_10px_40px_rgba(232,255,77,0.3)]'
                : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-00/50 hover:dark:shadow-slate-900/50 dark:bg-white/5 dark:border-black/5 dark:hover:bg-white/10',
            )}
          >
            <div
              className={cn(
                'transition-all',
                formData.strategy === opt.id
                  ? 'text-white dark:text-black'
                  : 'text-slate-900 dark:text-white',
              )}
            >
              {opt.icon}
            </div>
            <div>
              <Heading
                level={4}
                className={cn(
                  'leading-tight mb-1',
                  formData.strategy === opt.id
                    ? 'text-white dark:text-black'
                    : 'text-slate-900 dark:text-white',
                )}
              >
                {opt.title}
              </Heading>
              <Caption
                className={cn(
                  'opacity-60 leading-none',
                  formData.strategy === opt.id
                    ? 'text-white dark:text-black'
                    : 'text-slate-900 dark:text-white',
                )}
              >
                {opt.desc}
              </Caption>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

