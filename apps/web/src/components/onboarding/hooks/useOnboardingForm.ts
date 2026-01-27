import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import type { OnboardingFormData } from '../types'

const onboardingSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phase: z
      .enum(['Explorer', 'Starting', 'Building', 'Optimizing'])
      .optional(),
    persona: z
      .enum([
        'House Hacker',
        'Accidental Landlord',
        'Aggressive Grower',
        'Passive Income Seeker',
        'Value-Add Investor',
      ])
      .optional(),
    ownership: z.enum(['Personal', 'LLC']).default('Personal'),
    llcName: z.string().optional(),
    freedomNumber: z.number().min(1000).max(100000).default(5000),
    strategy: z
      .enum(['Cash Flow', 'Appreciation', 'BRRRR', 'Hybrid'])
      .optional(),
    markets: z
      .array(z.string().uuid())
      .max(3, 'Select at most 3 markets')
      .optional(),
  })
  .refine(
    (data) => {
      // If ownership is LLC, llcName is required
      if (data.ownership === 'LLC') {
        return data.llcName && data.llcName.trim().length > 0
      }
      return true
    },
    {
      message: 'LLC name is required when ownership structure is LLC',
      path: ['llcName'],
    },
  )

export function useOnboardingForm(initialData?: Partial<OnboardingFormData>) {
  return useForm({
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      phase: initialData?.phase,
      persona: initialData?.persona,
      ownership: initialData?.ownership || 'Personal',
      llcName: initialData?.llcName || '',
      freedomNumber: initialData?.freedomNumber || 5000,
      strategy: initialData?.strategy,
      markets: initialData?.markets || [],
    } as OnboardingFormData,
    validators: {
      onChange: ({ value }) => {
        const result = onboardingSchema.safeParse(value)
        if (!result.success) {
          return result.error.issues.map((err) => err.message).join(', ')
        }
        return undefined
      },
    },
  })
}

export type OnboardingForm = ReturnType<typeof useOnboardingForm>
