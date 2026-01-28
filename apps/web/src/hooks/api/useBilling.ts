/**
 * Billing Hooks
 *
 * React Query hooks for billing and subscription management.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// =============================================================================
// Query Key Factory
// =============================================================================

/**
 * Query keys for billing operations.
 * Follows the standard key factory pattern for TanStack Query.
 */
export const billingKeys = {
  all: ["billing"] as const,
  subscription: () => [...billingKeys.all, "subscription"] as const,
  plans: () => [...billingKeys.all, "plans"] as const,
  invoices: () => [...billingKeys.all, "invoices"] as const,
  upcomingInvoice: () => [...billingKeys.all, "upcoming-invoice"] as const,
  paymentMethods: () => [...billingKeys.all, "payment-methods"] as const,
};

// =============================================================================
// Types (API Response Types)
// Note: These represent API response shapes which may differ from raw database types.
// For database types, use @axori/db types (Subscription, Plan, etc.)
// =============================================================================

export interface PlanResponse {
  id: string;
  name: string;
  slug: string;
  amount: number;
  interval: "month" | "year";
  features: Array<string>;
  propertyLimit: number | null;
  teamMemberLimit: number | null;
  isPopular: boolean;
}

export interface SubscriptionResponse {
  id?: string;
  plan: string;
  status: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: string;
  features: Array<string>;
  propertyLimit: number;
  teamMemberLimit: number;
}

export interface InvoiceResponse {
  id: string;
  number?: string;
  status: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
  paidAt?: string;
  invoicePdf?: string;
  hostedInvoiceUrl?: string;
}

export interface UpcomingInvoiceResponse {
  amount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  nextPaymentAttempt?: string;
}

export interface PaymentMethodResponse {
  id: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

// Helper to make authenticated API calls
async function apiFetch<T>(
  endpoint: string,
  token: string | null,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

/**
 * Hook to get current subscription
 */
export function useSubscription() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: billingKeys.subscription(),
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<SubscriptionResponse>("/api/billing/subscription", token);
    },
  });
}

/**
 * Hook to get available plans
 */
export function usePlans() {
  return useQuery({
    queryKey: billingKeys.plans(),
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/billing/plans`);
      const data = await response.json();
      return data.plans as Array<PlanResponse>;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

/**
 * Hook to get invoice history
 */
export function useInvoices() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: billingKeys.invoices(),
    queryFn: async () => {
      const token = await getToken();
      const data = await apiFetch<{ invoices: Array<InvoiceResponse> }>("/api/billing/invoices", token);
      return data.invoices;
    },
  });
}

/**
 * Hook to get upcoming invoice
 */
export function useUpcomingInvoice() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: billingKeys.upcomingInvoice(),
    queryFn: async () => {
      const token = await getToken();
      const data = await apiFetch<{ upcomingInvoice: UpcomingInvoiceResponse | null }>(
        "/api/billing/upcoming-invoice",
        token
      );
      return data.upcomingInvoice;
    },
  });
}

/**
 * Hook to get payment methods
 */
export function usePaymentMethods() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: billingKeys.paymentMethods(),
    queryFn: async () => {
      const token = await getToken();
      const data = await apiFetch<{ paymentMethods: Array<PaymentMethodResponse> }>(
        "/api/billing/payment-methods",
        token
      );
      return data.paymentMethods;
    },
  });
}

/**
 * Hook to create checkout session
 */
export function useCreateCheckoutSession() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      priceId,
      successUrl,
      cancelUrl,
    }: {
      priceId: string;
      successUrl?: string;
      cancelUrl?: string;
    }) => {
      const token = await getToken();
      const data = await apiFetch<{ url: string; sessionId: string }>(
        "/api/billing/checkout",
        token,
        {
          method: "POST",
          body: JSON.stringify({ priceId, successUrl, cancelUrl }),
        }
      );
      return data;
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}

/**
 * Hook to create customer portal session
 */
export function useCreatePortalSession() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ returnUrl }: { returnUrl?: string }) => {
      const token = await getToken();
      const data = await apiFetch<{ url: string }>("/api/billing/portal", token, {
        method: "POST",
        body: JSON.stringify({ returnUrl }),
      });
      return data;
    },
    onSuccess: (data) => {
      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}

/**
 * Hook to cancel subscription
 */
export function useCancelSubscription() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reason,
      cancelImmediately = false,
    }: {
      reason?: string;
      cancelImmediately?: boolean;
    }) => {
      const token = await getToken();
      return apiFetch<{ success: boolean; cancelImmediately: boolean }>(
        "/api/billing/cancel",
        token,
        {
          method: "POST",
          body: JSON.stringify({ reason, cancelImmediately }),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.subscription() });
    },
  });
}

/**
 * Hook to resume subscription
 */
export function useResumeSubscription() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch<{ success: boolean }>("/api/billing/resume", token, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.subscription() });
    },
  });
}
