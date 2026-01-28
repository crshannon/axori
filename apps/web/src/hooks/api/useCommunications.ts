import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import type {
  PropertyCommunication,
  PropertyContact,
  CommunicationTemplate,
} from "@axori/db";
import type {
  CommunicationType,
  CommunicationDirection,
  CommunicationCategory,
  CommunicationStatus,
  ContactType,
} from "@axori/shared/src/validation";
import { apiFetch } from "@/lib/api/client";

// ============================================================================
// Query Keys
// ============================================================================

export const communicationKeys = {
  all: ["communications"] as const,
  lists: () => [...communicationKeys.all, "list"] as const,
  list: (propertyId: string, filters?: CommunicationFilters) =>
    [...communicationKeys.lists(), propertyId, filters] as const,
  details: () => [...communicationKeys.all, "detail"] as const,
  detail: (id: string) => [...communicationKeys.details(), id] as const,
  stats: (propertyId: string) =>
    [...communicationKeys.all, "stats", propertyId] as const,
};

export const contactKeys = {
  all: ["contacts"] as const,
  lists: () => [...contactKeys.all, "list"] as const,
  list: (propertyId: string, filters?: ContactFilters) =>
    [...contactKeys.lists(), propertyId, filters] as const,
  details: () => [...contactKeys.all, "detail"] as const,
  detail: (id: string) => [...contactKeys.details(), id] as const,
};

export const templateKeys = {
  all: ["communication-templates"] as const,
  lists: () => [...templateKeys.all, "list"] as const,
  list: (filters?: TemplateFilters) => [...templateKeys.lists(), filters] as const,
  details: () => [...templateKeys.all, "detail"] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
};

// ============================================================================
// Types
// ============================================================================

interface CommunicationFilters {
  type?: CommunicationType;
  direction?: CommunicationDirection;
  category?: CommunicationCategory;
  status?: CommunicationStatus;
  contactId?: string;
  search?: string;
  isPinned?: boolean;
  startDate?: string;
  endDate?: string;
  sort?: "communicationDate" | "createdAt" | "subject" | "type" | "category";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

interface ContactFilters {
  type?: ContactType;
  isActive?: boolean;
  isPrimary?: boolean;
  search?: string;
  sort?: "name" | "company" | "type" | "createdAt";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

interface TemplateFilters {
  type?: CommunicationType;
  category?: CommunicationCategory;
  search?: string;
  sort?: "name" | "type" | "category" | "usageCount" | "createdAt";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  data: T[];
}

interface CommunicationListResponse extends PaginatedResponse<PropertyCommunication> {
  communications: PropertyCommunication[];
}

interface ContactListResponse extends PaginatedResponse<PropertyContact> {
  contacts: PropertyContact[];
}

interface TemplateListResponse extends PaginatedResponse<CommunicationTemplate> {
  templates: CommunicationTemplate[];
}

interface CommunicationStatsResponse {
  stats: {
    communications: {
      total: number;
      byType: Record<string, number>;
      byDirection: Record<string, number>;
      byCategory: Record<string, number>;
      byStatus: Record<string, number>;
      pinned: number;
      requiresAcknowledgment: number;
      acknowledged: number;
    };
    contacts: {
      total: number;
      active: number;
      byType: Record<string, number>;
      primary: number;
    };
    recentActivity: {
      last7Days: number;
      last30Days: number;
    };
  };
}

// ============================================================================
// Communication Create/Update Types
// ============================================================================

interface CreateCommunicationInput {
  propertyId: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  category?: CommunicationCategory;
  status?: CommunicationStatus;
  subject: string;
  summary?: string | null;
  content?: string | null;
  communicationDate?: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactRole?: string | null;
  contactId?: string | null;
  transactionId?: string | null;
  deliveryMethod?: string | null;
  acknowledgmentRequired?: boolean;
  attachmentUrls?: string[];
  tags?: string[];
  isPinned?: boolean;
}

interface UpdateCommunicationInput {
  id: string;
  propertyId: string;
  type?: CommunicationType;
  direction?: CommunicationDirection;
  category?: CommunicationCategory;
  status?: CommunicationStatus;
  subject?: string;
  summary?: string | null;
  content?: string | null;
  communicationDate?: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactRole?: string | null;
  contactId?: string | null;
  transactionId?: string | null;
  deliveryMethod?: string | null;
  acknowledgmentRequired?: boolean;
  acknowledgedAt?: string | null;
  attachmentUrls?: string[];
  tags?: string[];
  isPinned?: boolean;
}

// ============================================================================
// Contact Create/Update Types
// ============================================================================

interface CreateContactInput {
  propertyId: string;
  name: string;
  company?: string | null;
  type: ContactType;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  preferredContactMethod?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  notes?: string | null;
  hoursAvailable?: string | null;
  isActive?: boolean;
  isPrimary?: boolean;
}

interface UpdateContactInput {
  id: string;
  propertyId: string;
  name?: string;
  company?: string | null;
  type?: ContactType;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  preferredContactMethod?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  notes?: string | null;
  hoursAvailable?: string | null;
  isActive?: boolean;
  isPrimary?: boolean;
}

// ============================================================================
// Template Create/Update Types
// ============================================================================

interface CreateTemplateInput {
  name: string;
  type: CommunicationType;
  category?: CommunicationCategory;
  subject?: string | null;
  content: string;
  isDefault?: boolean;
}

interface UpdateTemplateInput {
  id: string;
  name?: string;
  type?: CommunicationType;
  category?: CommunicationCategory;
  subject?: string | null;
  content?: string;
  isDefault?: boolean;
}

// ============================================================================
// Communication Hooks
// ============================================================================

/**
 * Get all communications for a property with optional filtering
 */
export function usePropertyCommunications(
  propertyId: string | null | undefined,
  filters?: CommunicationFilters
) {
  const { user } = useUser();

  return useQuery({
    queryKey: communicationKeys.list(propertyId || "", filters),
    queryFn: async () => {
      if (!user?.id || !propertyId) {
        throw new Error("User not authenticated or property ID missing");
      }

      const params = new URLSearchParams();
      if (filters?.type) params.set("type", filters.type);
      if (filters?.direction) params.set("direction", filters.direction);
      if (filters?.category) params.set("category", filters.category);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.contactId) params.set("contactId", filters.contactId);
      if (filters?.search) params.set("search", filters.search);
      if (filters?.isPinned !== undefined) params.set("isPinned", String(filters.isPinned));
      if (filters?.startDate) params.set("startDate", filters.startDate);
      if (filters?.endDate) params.set("endDate", filters.endDate);
      if (filters?.sort) params.set("sort", filters.sort);
      if (filters?.order) params.set("order", filters.order);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));

      const queryString = params.toString();
      const url = `/api/communications/property/${propertyId}${queryString ? `?${queryString}` : ""}`;

      const result = await apiFetch<CommunicationListResponse>(url, {
        clerkId: user.id,
      });

      return result;
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 30 * 1000,
  });
}

/**
 * Get a single communication by ID
 */
export function useCommunication(communicationId: string | null | undefined) {
  const { user } = useUser();

  return useQuery({
    queryKey: communicationKeys.detail(communicationId || ""),
    queryFn: async () => {
      if (!user?.id || !communicationId) {
        throw new Error("User not authenticated or communication ID missing");
      }

      const result = await apiFetch<{ communication: PropertyCommunication }>(
        `/api/communications/${communicationId}`,
        { clerkId: user.id }
      );

      return result.communication;
    },
    enabled: !!user?.id && !!communicationId,
    staleTime: 30 * 1000,
  });
}

/**
 * Get communication statistics for a property
 */
export function useCommunicationStats(propertyId: string | null | undefined) {
  const { user } = useUser();

  return useQuery({
    queryKey: communicationKeys.stats(propertyId || ""),
    queryFn: async () => {
      if (!user?.id || !propertyId) {
        throw new Error("User not authenticated or property ID missing");
      }

      const result = await apiFetch<CommunicationStatsResponse>(
        `/api/communications/property/${propertyId}/stats`,
        { clerkId: user.id }
      );

      return result.stats;
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 60 * 1000,
  });
}

/**
 * Create a new communication
 */
export function useCreateCommunication() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (input: CreateCommunicationInput) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      return await apiFetch<{ communication: PropertyCommunication }>(
        "/api/communications",
        {
          method: "POST",
          clerkId: user.id,
          body: JSON.stringify(input),
        }
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: communicationKeys.list(variables.propertyId),
      });
      queryClient.invalidateQueries({
        queryKey: communicationKeys.stats(variables.propertyId),
      });
    },
  });
}

/**
 * Update a communication
 */
export function useUpdateCommunication() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ id, propertyId, ...data }: UpdateCommunicationInput) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      void propertyId; // Used for cache invalidation

      return await apiFetch<{ communication: PropertyCommunication }>(
        `/api/communications/${id}`,
        {
          method: "PATCH",
          clerkId: user.id,
          body: JSON.stringify(data),
        }
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: communicationKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: communicationKeys.list(variables.propertyId),
      });
      queryClient.invalidateQueries({
        queryKey: communicationKeys.stats(variables.propertyId),
      });
    },
  });
}

/**
 * Delete a communication
 */
export function useDeleteCommunication() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ id, propertyId: _propertyId }: { id: string; propertyId: string }) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      void _propertyId;

      return await apiFetch<{ success: boolean }>(`/api/communications/${id}`, {
        method: "DELETE",
        clerkId: user.id,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: communicationKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: communicationKeys.list(variables.propertyId),
      });
      queryClient.invalidateQueries({
        queryKey: communicationKeys.stats(variables.propertyId),
      });
    },
  });
}

// ============================================================================
// Contact Hooks
// ============================================================================

/**
 * Get all contacts for a property with optional filtering
 */
export function usePropertyContacts(
  propertyId: string | null | undefined,
  filters?: ContactFilters
) {
  const { user } = useUser();

  return useQuery({
    queryKey: contactKeys.list(propertyId || "", filters),
    queryFn: async () => {
      if (!user?.id || !propertyId) {
        throw new Error("User not authenticated or property ID missing");
      }

      const params = new URLSearchParams();
      if (filters?.type) params.set("type", filters.type);
      if (filters?.isActive !== undefined) params.set("isActive", String(filters.isActive));
      if (filters?.isPrimary !== undefined) params.set("isPrimary", String(filters.isPrimary));
      if (filters?.search) params.set("search", filters.search);
      if (filters?.sort) params.set("sort", filters.sort);
      if (filters?.order) params.set("order", filters.order);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));

      const queryString = params.toString();
      const url = `/api/communications/property/${propertyId}/contacts${queryString ? `?${queryString}` : ""}`;

      const result = await apiFetch<ContactListResponse>(url, {
        clerkId: user.id,
      });

      return result;
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 30 * 1000,
  });
}

/**
 * Get a single contact by ID
 */
export function useContact(contactId: string | null | undefined) {
  const { user } = useUser();

  return useQuery({
    queryKey: contactKeys.detail(contactId || ""),
    queryFn: async () => {
      if (!user?.id || !contactId) {
        throw new Error("User not authenticated or contact ID missing");
      }

      const result = await apiFetch<{ contact: PropertyContact }>(
        `/api/communications/contacts/${contactId}`,
        { clerkId: user.id }
      );

      return result.contact;
    },
    enabled: !!user?.id && !!contactId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create a new contact
 */
export function useCreateContact() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (input: CreateContactInput) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      return await apiFetch<{ contact: PropertyContact }>(
        "/api/communications/contacts",
        {
          method: "POST",
          clerkId: user.id,
          body: JSON.stringify(input),
        }
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: contactKeys.list(variables.propertyId),
      });
      queryClient.invalidateQueries({
        queryKey: communicationKeys.stats(variables.propertyId),
      });
    },
  });
}

/**
 * Update a contact
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ id, propertyId, ...data }: UpdateContactInput) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      void propertyId;

      return await apiFetch<{ contact: PropertyContact }>(
        `/api/communications/contacts/${id}`,
        {
          method: "PATCH",
          clerkId: user.id,
          body: JSON.stringify(data),
        }
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: contactKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: contactKeys.list(variables.propertyId),
      });
      queryClient.invalidateQueries({
        queryKey: communicationKeys.stats(variables.propertyId),
      });
    },
  });
}

/**
 * Delete a contact
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ id, propertyId: _propertyId }: { id: string; propertyId: string }) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      void _propertyId;

      return await apiFetch<{ success: boolean }>(`/api/communications/contacts/${id}`, {
        method: "DELETE",
        clerkId: user.id,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: contactKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: contactKeys.list(variables.propertyId),
      });
      queryClient.invalidateQueries({
        queryKey: communicationKeys.stats(variables.propertyId),
      });
    },
  });
}

// ============================================================================
// Template Hooks
// ============================================================================

/**
 * Get all templates for the current user with optional filtering
 */
export function useCommunicationTemplates(filters?: TemplateFilters) {
  const { user } = useUser();

  return useQuery({
    queryKey: templateKeys.list(filters),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const params = new URLSearchParams();
      if (filters?.type) params.set("type", filters.type);
      if (filters?.category) params.set("category", filters.category);
      if (filters?.search) params.set("search", filters.search);
      if (filters?.sort) params.set("sort", filters.sort);
      if (filters?.order) params.set("order", filters.order);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));

      const queryString = params.toString();
      const url = `/api/communications/templates${queryString ? `?${queryString}` : ""}`;

      const result = await apiFetch<TemplateListResponse>(url, {
        clerkId: user.id,
      });

      return result;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });
}

/**
 * Get a single template by ID
 */
export function useCommunicationTemplate(templateId: string | null | undefined) {
  const { user } = useUser();

  return useQuery({
    queryKey: templateKeys.detail(templateId || ""),
    queryFn: async () => {
      if (!user?.id || !templateId) {
        throw new Error("User not authenticated or template ID missing");
      }

      const result = await apiFetch<{ template: CommunicationTemplate }>(
        `/api/communications/templates/${templateId}`,
        { clerkId: user.id }
      );

      return result.template;
    },
    enabled: !!user?.id && !!templateId,
    staleTime: 60 * 1000,
  });
}

/**
 * Create a new template
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      return await apiFetch<{ template: CommunicationTemplate }>(
        "/api/communications/templates",
        {
          method: "POST",
          clerkId: user.id,
          body: JSON.stringify(input),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: templateKeys.lists(),
      });
    },
  });
}

/**
 * Update a template
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateTemplateInput) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      return await apiFetch<{ template: CommunicationTemplate }>(
        `/api/communications/templates/${id}`,
        {
          method: "PATCH",
          clerkId: user.id,
          body: JSON.stringify(data),
        }
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: templateKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: templateKeys.lists(),
      });
    },
  });
}

/**
 * Delete a template
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      return await apiFetch<{ success: boolean }>(
        `/api/communications/templates/${id}`,
        {
          method: "DELETE",
          clerkId: user.id,
        }
      );
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: templateKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: templateKeys.lists(),
      });
    },
  });
}

/**
 * Increment template usage count when using a template
 */
export function useUseTemplate() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      return await apiFetch<{ template: CommunicationTemplate }>(
        `/api/communications/templates/${id}/use`,
        {
          method: "POST",
          clerkId: user.id,
        }
      );
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: templateKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: templateKeys.lists(),
      });
    },
  });
}
