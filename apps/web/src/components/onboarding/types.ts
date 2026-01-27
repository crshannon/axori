export type OnboardingPhase =
  | 'Explorer'
  | 'Starting'
  | 'Building'
  | 'Optimizing'

export type OnboardingPersona =
  | 'House Hacker'
  | 'Accidental Landlord'
  | 'Aggressive Grower'
  | 'Passive Income Seeker'
  | 'Value-Add Investor'

export type OnboardingOwnership = 'Personal' | 'LLC'

export type OnboardingStrategy =
  | 'Cash Flow'
  | 'Appreciation'
  | 'BRRRR'
  | 'Hybrid'

export type MarketRelationshipType =
  | 'owns_property'
  | 'watching'
  | 'target_market'

export interface Market {
  id: string
  name: string
  state: string
  region?: string
  investmentProfile?: Array<'cash_flow' | 'appreciation' | 'hybrid'>
  avgCapRate?: number
  medianPrice?: number
  rentToPriceRatio?: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserMarket {
  id: string
  userId: string
  marketId: string
  relationshipType: MarketRelationshipType
  createdAt: Date
  market?: Market // Populated when fetching with join
}

export interface OnboardingFormData {
  firstName: string
  lastName: string
  phase?: OnboardingPhase
  persona?: OnboardingPersona
  ownership: OnboardingOwnership
  llcName?: string // Required when ownership is 'LLC'
  freedomNumber: number
  strategy?: OnboardingStrategy
  markets?: Array<string> // Array of market IDs
}

export interface OnboardingData {
  step: string | null
  completed: boolean
  completedAt: Date | null
  data: {
    phase?: OnboardingPhase
    persona?: OnboardingPersona
    ownership?: OnboardingOwnership
    llcName?: string
    freedomNumber?: number
    strategy?: OnboardingStrategy
    markets?: Array<string> // Array of market IDs
  } | null
  firstName: string | null
  lastName: string | null
}

export interface OnboardingUpdate {
  step: string | null
  data?: Partial<OnboardingFormData>
  markets?: Array<string> // Array of market IDs for step 7
  firstName?: string | null
  lastName?: string | null
}
