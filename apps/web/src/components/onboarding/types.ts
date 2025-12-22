export type OnboardingPhase = 'Explorer' | 'Starting' | 'Building' | 'Optimizing'

export type OnboardingPersona =
  | 'House Hacker'
  | 'Accidental Landlord'
  | 'Aggressive Grower'
  | 'Passive Income Seeker'
  | 'Value-Add Investor'

export type OnboardingOwnership = 'Personal' | 'LLC'

export type OnboardingStrategy = 'Cash Flow' | 'Appreciation' | 'BRRRR'

export interface OnboardingFormData {
  firstName: string
  lastName: string
  phase?: OnboardingPhase
  persona?: OnboardingPersona
  ownership: OnboardingOwnership
  freedomNumber: number
  strategy?: OnboardingStrategy
}

export interface OnboardingData {
  step: string | null
  completed: boolean
  completedAt: Date | null
  data: {
    phase?: OnboardingPhase
    persona?: OnboardingPersona
    ownership?: OnboardingOwnership
    freedomNumber?: number
    strategy?: OnboardingStrategy
  } | null
  firstName: string | null
  lastName: string | null
}

export interface OnboardingUpdate {
  step: string | null
  data?: Partial<OnboardingFormData>
  firstName?: string | null
  lastName?: string | null
}

