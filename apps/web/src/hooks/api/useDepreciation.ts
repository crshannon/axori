import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api/client'

// Types for depreciation data
export interface PropertyDepreciation {
  propertyId: string
  depreciationType: 'residential' | 'commercial'
  placedInServiceDate?: string | null
  purchasePrice?: string | null
  closingCosts?: string | null
  initialImprovements?: string | null
  landValue?: string | null
  landValueSource?: string | null
  landValueRatio?: string | null
  marginalTaxRate?: string | null
  accumulatedDepreciation?: string | null
  lastDepreciationYear?: number | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface PropertyImprovement {
  id: string
  propertyId: string
  description: string
  amount: string
  completedDate: string
  placedInServiceDate?: string | null
  depreciationClass?: '5_year' | '7_year' | '15_year' | '27_5_year' | '39_year' | null
  accumulatedDepreciation?: string | null
  documentId?: string | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CostSegregationStudy {
  id: string
  propertyId: string
  studyDate: string
  studyProvider?: string | null
  studyCost?: string | null
  originalBasis: string
  amount5Year?: string | null
  amount7Year?: string | null
  amount15Year?: string | null
  amountRemaining: string
  bonusDepreciationPercent?: string | null
  bonusDepreciationAmount?: string | null
  taxYearApplied?: number | null
  documentId?: string | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AnnualDepreciationRecord {
  id: string
  propertyId: string
  taxYear: number
  regularDepreciation: string
  bonusDepreciation?: string | null
  improvementDepreciation?: string | null
  totalDepreciation: string
  monthsDepreciated: number
  verifiedByCpa?: boolean | null
  verifiedDate?: string | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface DepreciationData {
  depreciation: PropertyDepreciation | null
  improvements: PropertyImprovement[]
  costSegStudies: CostSegregationStudy[]
  depreciationRecords: AnnualDepreciationRecord[]
}

// Input types
export interface DepreciationUpdateInput {
  depreciationType?: 'residential' | 'commercial'
  placedInServiceDate?: string | null
  purchasePrice?: number | null
  closingCosts?: number | null
  initialImprovements?: number | null
  landValue?: number | null
  landValueSource?: string | null
  landValueRatio?: number | null
  marginalTaxRate?: number | null
  accumulatedDepreciation?: number | null
  lastDepreciationYear?: number | null
  notes?: string | null
}

export interface ImprovementInput {
  description: string
  amount: number
  completedDate: string
  placedInServiceDate?: string | null
  depreciationClass?: '5_year' | '7_year' | '15_year' | '27_5_year' | '39_year'
  documentId?: string | null
  notes?: string | null
}

export interface CostSegStudyInput {
  studyDate: string
  studyProvider?: string | null
  studyCost?: number | null
  originalBasis: number
  amount5Year?: number | null
  amount7Year?: number | null
  amount15Year?: number | null
  amountRemaining: number
  bonusDepreciationPercent?: number | null
  bonusDepreciationAmount?: number | null
  taxYearApplied?: number | null
  documentId?: string | null
  notes?: string | null
}

export interface DepreciationRecordInput {
  taxYear: number
  regularDepreciation: number
  bonusDepreciation?: number | null
  improvementDepreciation?: number | null
  totalDepreciation: number
  monthsDepreciated?: number
  verifiedByCpa?: boolean
  verifiedDate?: string | null
  notes?: string | null
}

/**
 * Get depreciation data for a property
 */
export function useDepreciation(propertyId: string | null | undefined) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['depreciation', propertyId],
    queryFn: async () => {
      if (!user?.id || !propertyId) {
        throw new Error('User not authenticated or property ID missing')
      }

      const result = await apiFetch<DepreciationData>(
        `/api/properties/${propertyId}/depreciation`,
        {
          clerkId: user.id,
        },
      )

      return result
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Update depreciation settings for a property
 */
export function useUpdateDepreciation() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      propertyId,
      ...data
    }: DepreciationUpdateInput & { propertyId: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ depreciation: PropertyDepreciation }>(
        `/api/properties/${propertyId}/depreciation`,
        {
          method: 'PUT',
          clerkId: user.id,
          body: JSON.stringify(data),
        },
      )
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['depreciation', variables.propertyId] })
      queryClient.invalidateQueries({ queryKey: ['properties', variables.propertyId] })
    },
  })
}

/**
 * Get improvements for a property
 */
export function useImprovements(propertyId: string | null | undefined) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['improvements', propertyId],
    queryFn: async () => {
      if (!user?.id || !propertyId) {
        throw new Error('User not authenticated or property ID missing')
      }

      const result = await apiFetch<{ improvements: PropertyImprovement[] }>(
        `/api/properties/${propertyId}/improvements`,
        {
          clerkId: user.id,
        },
      )

      return result.improvements
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 30 * 1000,
  })
}

/**
 * Add a capital improvement to a property
 */
export function useAddImprovement() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      propertyId,
      ...data
    }: ImprovementInput & { propertyId: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ improvement: PropertyImprovement }>(
        `/api/properties/${propertyId}/improvements`,
        {
          method: 'POST',
          clerkId: user.id,
          body: JSON.stringify(data),
        },
      )
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['improvements', variables.propertyId] })
      queryClient.invalidateQueries({ queryKey: ['depreciation', variables.propertyId] })
    },
  })
}

/**
 * Get cost segregation studies for a property
 */
export function useCostSegStudies(propertyId: string | null | undefined) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['cost-seg-studies', propertyId],
    queryFn: async () => {
      if (!user?.id || !propertyId) {
        throw new Error('User not authenticated or property ID missing')
      }

      const result = await apiFetch<{ costSegStudies: CostSegregationStudy[] }>(
        `/api/properties/${propertyId}/cost-segregation`,
        {
          clerkId: user.id,
        },
      )

      return result.costSegStudies
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 30 * 1000,
  })
}

/**
 * Add a cost segregation study to a property
 */
export function useAddCostSegStudy() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      propertyId,
      ...data
    }: CostSegStudyInput & { propertyId: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ costSegStudy: CostSegregationStudy }>(
        `/api/properties/${propertyId}/cost-segregation`,
        {
          method: 'POST',
          clerkId: user.id,
          body: JSON.stringify(data),
        },
      )
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cost-seg-studies', variables.propertyId] })
      queryClient.invalidateQueries({ queryKey: ['depreciation', variables.propertyId] })
    },
  })
}

/**
 * Get annual depreciation records for a property
 */
export function useDepreciationRecords(propertyId: string | null | undefined) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['depreciation-records', propertyId],
    queryFn: async () => {
      if (!user?.id || !propertyId) {
        throw new Error('User not authenticated or property ID missing')
      }

      const result = await apiFetch<{ depreciationRecords: AnnualDepreciationRecord[] }>(
        `/api/properties/${propertyId}/depreciation-records`,
        {
          clerkId: user.id,
        },
      )

      return result.depreciationRecords
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 30 * 1000,
  })
}

/**
 * Add an annual depreciation record for a property
 */
export function useAddDepreciationRecord() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      propertyId,
      ...data
    }: DepreciationRecordInput & { propertyId: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ depreciationRecord: AnnualDepreciationRecord }>(
        `/api/properties/${propertyId}/depreciation-records`,
        {
          method: 'POST',
          clerkId: user.id,
          body: JSON.stringify(data),
        },
      )
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['depreciation-records', variables.propertyId] })
      queryClient.invalidateQueries({ queryKey: ['depreciation', variables.propertyId] })
    },
  })
}
