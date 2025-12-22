import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import type { OnboardingFormData } from '../types'

const onboardingSchema = z.object({
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
  freedomNumber: z.number().min(1000).max(100000).default(5000),
  strategy: z.enum(['Cash Flow', 'Appreciation', 'BRRRR']).optional(),
})

export function useOnboardingForm(initialData?: Partial<OnboardingFormData>) {
  return useForm({
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      phase: initialData?.phase,
      persona: initialData?.persona,
      ownership: initialData?.ownership || 'Personal',
      freedomNumber: initialData?.freedomNumber || 5000,
      strategy: initialData?.strategy,
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

