import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import type { PropertyDocument } from '@axori/shared'
import type { DocumentType, ProcessingStatus } from '@axori/shared/src/validation'
import { apiFetch } from '@/lib/api/client'

/**
 * Document list filter options
 */
interface DocumentFilters {
  type?: DocumentType
  year?: number
  status?: ProcessingStatus
  search?: string
  sort?: 'uploadedAt' | 'documentType' | 'documentYear' | 'originalFilename'
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

/**
 * Document list response
 */
interface DocumentListResponse {
  documents: PropertyDocument[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
  }
}

/**
 * Document stats response
 */
interface DocumentStatsResponse {
  stats: {
    totalCount: number
    byType: Record<string, number>
    byYear: Record<string, number>
    byStatus: {
      pending: number
      processing: number
      completed: number
      failed: number
    }
    totalSizeBytes: number
  }
}

/**
 * Create document input type
 */
interface CreateDocumentInput {
  propertyId: string
  storagePath: string
  originalFilename: string
  mimeType?: string
  sizeBytes?: number
  documentType: DocumentType
  documentYear?: number | null
  description?: string | null
  tags?: string[]
  enableAiProcessing?: boolean
}

/**
 * Update document input type
 */
interface UpdateDocumentInput {
  id: string
  propertyId: string
  documentType?: DocumentType
  documentYear?: number | null
  description?: string | null
  tags?: string[]
}

/**
 * Get all documents for a property with optional filtering
 */
export function usePropertyDocuments(
  propertyId: string | null | undefined,
  filters?: DocumentFilters,
) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['properties', propertyId, 'documents', filters],
    queryFn: async () => {
      if (!user?.id || !propertyId) {
        throw new Error('User not authenticated or property ID missing')
      }

      // Build query string
      const params = new URLSearchParams()
      if (filters?.type) params.set('type', filters.type)
      if (filters?.year) params.set('year', String(filters.year))
      if (filters?.status) params.set('status', filters.status)
      if (filters?.search) params.set('search', filters.search)
      if (filters?.sort) params.set('sort', filters.sort)
      if (filters?.order) params.set('order', filters.order)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.limit) params.set('limit', String(filters.limit))

      const queryString = params.toString()
      const url = `/api/documents/property/${propertyId}${queryString ? `?${queryString}` : ''}`

      const result = await apiFetch<DocumentListResponse>(url, {
        clerkId: user.id,
      })

      return result
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Get a single document by ID
 */
export function useDocument(documentId: string | null | undefined) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['documents', documentId],
    queryFn: async () => {
      if (!user?.id || !documentId) {
        throw new Error('User not authenticated or document ID missing')
      }

      const result = await apiFetch<{ document: PropertyDocument }>(
        `/api/documents/${documentId}`,
        {
          clerkId: user.id,
        },
      )

      return result.document
    },
    enabled: !!user?.id && !!documentId,
    staleTime: 30 * 1000,
  })
}

/**
 * Get document statistics for a property
 */
export function useDocumentStats(propertyId: string | null | undefined) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['properties', propertyId, 'documents', 'stats'],
    queryFn: async () => {
      if (!user?.id || !propertyId) {
        throw new Error('User not authenticated or property ID missing')
      }

      const result = await apiFetch<DocumentStatsResponse>(
        `/api/documents/property/${propertyId}/stats`,
        {
          clerkId: user.id,
        },
      )

      return result.stats
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Get documents for a specific tax year
 */
export function useTaxYearDocuments(
  propertyId: string | null | undefined,
  year: number | null | undefined,
) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['properties', propertyId, 'documents', 'tax-year', year],
    queryFn: async () => {
      if (!user?.id || !propertyId || !year) {
        throw new Error('User not authenticated or property ID/year missing')
      }

      const result = await apiFetch<{
        year: number
        documents: PropertyDocument[]
        byType: Record<string, PropertyDocument[]>
        missingTypes: string[]
        summary: {
          totalDocuments: number
          processedCount: number
          pendingCount: number
        }
      }>(`/api/documents/property/${propertyId}/tax-year/${year}`, {
        clerkId: user.id,
      })

      return result
    },
    enabled: !!user?.id && !!propertyId && !!year,
    staleTime: 60 * 1000,
  })
}

/**
 * Create a new document record (after file upload to storage)
 */
export function useCreateDocument() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async (input: CreateDocumentInput) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ document: PropertyDocument }>(
        '/api/documents',
        {
          method: 'POST',
          clerkId: user.id,
          body: JSON.stringify(input),
        },
      )
    },
    onSuccess: (_data, variables) => {
      // Invalidate documents list
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId, 'documents'],
      })
    },
  })
}

/**
 * Update document metadata
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({ id, propertyId, ...data }: UpdateDocumentInput) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      // propertyId is used for cache invalidation but not sent to API
      void propertyId

      return await apiFetch<{ document: PropertyDocument }>(
        `/api/documents/${id}`,
        {
          method: 'PATCH',
          clerkId: user.id,
          body: JSON.stringify(data),
        },
      )
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific document
      queryClient.invalidateQueries({
        queryKey: ['documents', variables.id],
      })
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId, 'documents'],
      })
    },
  })
}

/**
 * Delete a document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      id,
      propertyId: _propertyId,
    }: {
      id: string
      propertyId: string
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      // propertyId is used for cache invalidation but not sent to API
      void _propertyId

      return await apiFetch<{ success: boolean; storagePath: string }>(
        `/api/documents/${id}`,
        {
          method: 'DELETE',
          clerkId: user.id,
        },
      )
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific document
      queryClient.invalidateQueries({
        queryKey: ['documents', variables.id],
      })
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId, 'documents'],
      })
    },
  })
}

/**
 * Trigger AI processing for a document
 */
export function useProcessDocument() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      id,
      propertyId: _propertyId,
    }: {
      id: string
      propertyId: string
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      void _propertyId

      return await apiFetch<{ document: PropertyDocument; message: string }>(
        `/api/documents/${id}/process`,
        {
          method: 'POST',
          clerkId: user.id,
        },
      )
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific document
      queryClient.invalidateQueries({
        queryKey: ['documents', variables.id],
      })
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId, 'documents'],
      })
    },
  })
}
