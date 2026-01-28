import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import type {
  PropertyStrategy,
  BRRRRPhaseRecord,
  BRRRRPhaseHistory,
  RehabScopeItem,
} from "@axori/shared";
import type {
  PrimaryStrategy,
  ExitMethod,
  HoldPeriod,
  BRRRRPhase,
  RehabCategory,
  RehabStatus,
} from "@axori/shared/src/validation";
import { apiFetch } from "@/lib/api/client";

// ============================================================================
// Query Keys
// ============================================================================

export const strategyKeys = {
  all: ["strategy"] as const,
  property: (propertyId: string) => [...strategyKeys.all, "property", propertyId] as const,
  brrrr: (propertyId: string) => [...strategyKeys.all, "brrrr", propertyId] as const,
  rehabScope: (propertyId: string) => [...strategyKeys.all, "rehab-scope", propertyId] as const,
  enums: () => [...strategyKeys.all, "enums"] as const,
};

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Strategy API response
 */
interface StrategyResponse {
  strategy: PropertyStrategy | null;
  brrrrPhase: BRRRRPhaseRecord | null;
  rehabItems: RehabScopeItem[];
}

/**
 * BRRRR Phase API response
 */
interface BrrrrPhaseResponse {
  brrrrPhase: BRRRRPhaseRecord | null;
  history: BRRRRPhaseHistory[];
}

/**
 * Rehab scope response
 */
interface RehabScopeResponse {
  items: RehabScopeItem[];
  totals: {
    estimated: number;
    actual: number;
    variance: number;
  };
  byCategory: Record<string, { estimated: number; actual: number; count: number }>;
}

/**
 * Enum values response
 */
interface EnumsResponse {
  primaryStrategies: readonly PrimaryStrategy[];
  exitMethods: readonly ExitMethod[];
  holdPeriods: readonly HoldPeriod[];
  brrrrPhases: readonly BRRRRPhase[];
  rehabCategories: readonly RehabCategory[];
  rehabStatuses: readonly RehabStatus[];
}

/**
 * Create/Update strategy input type
 */
interface SaveStrategyInput {
  propertyId: string;
  primaryStrategy: PrimaryStrategy;
  strategyVariant?: string | null;
  holdPeriod?: HoldPeriod | null;
  targetExitYear?: number | null;
  holdYearsMin?: number | null;
  holdYearsMax?: number | null;
  exitMethod?: ExitMethod | null;
  exitPriceTarget?: number | null;
  exitEquityTarget?: number | null;
  exitCapRateFloor?: number | null;
  exitCashFlowFloor?: number | null;
  exitLifeEvent?: string | null;
  is1031Replacement?: boolean | null;
  sourcePropertyId?: string | null;
  exchangeDeadline?: string | null;
  identificationDeadline?: string | null;
  futureRentalIntent?: boolean | null;
  plannedConversionDate?: string | null;
  targetMonthlyCashFlow?: number | null;
  targetEquity?: number | null;
  targetCashOnCash?: number | null;
  targetPayoffDate?: string | null;
  weightFinancialPerformance?: number | null;
  weightEquityVelocity?: number | null;
  weightOperationalHealth?: number | null;
  weightMarketPosition?: number | null;
  weightRiskFactors?: number | null;
}

/**
 * BRRRR phase transition input
 */
interface TransitionBrrrrPhaseInput {
  propertyId: string;
  toPhase: BRRRRPhase;
  transitionDate?: string;
  notes?: string;
  actualCost?: number | null;
  actualArv?: number | null;
}

/**
 * Update BRRRR metrics input
 */
interface UpdateBrrrrMetricsInput {
  propertyId: string;
  arvEstimate?: number | null;
  rehabBudget?: number | null;
  allInCost?: number | null;
  targetEquityCapture?: number | null;
  rehabStartDate?: string | null;
  rehabTargetEndDate?: string | null;
  rehabActualEndDate?: string | null;
  rehabBudgetSpent?: number | null;
  holdingCosts?: number | null;
  listedDate?: string | null;
  leasedDate?: string | null;
  achievedRent?: number | null;
  marketRentAtLease?: number | null;
  appraisalDate?: string | null;
  appraisalValue?: number | null;
  newLoanAmount?: number | null;
  cashOutAmount?: number | null;
  newInterestRate?: number | null;
  newMonthlyPayment?: number | null;
  capitalLeftInDeal?: number | null;
  refinanceCloseDate?: string | null;
}

/**
 * Create rehab item input
 */
interface CreateRehabItemInput {
  propertyId: string;
  category: RehabCategory;
  description: string;
  estimatedCost?: number | null;
  actualCost?: number | null;
  status?: RehabStatus;
  vendorName?: string | null;
  completedAt?: string | null;
  notes?: string | null;
}

/**
 * Update rehab item input
 */
interface UpdateRehabItemInput {
  propertyId: string;
  itemId: string;
  category?: RehabCategory;
  description?: string;
  estimatedCost?: number | null;
  actualCost?: number | null;
  status?: RehabStatus;
  vendorName?: string | null;
  completedAt?: string | null;
  notes?: string | null;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get strategy for a property (includes BRRRR phase and rehab items if applicable)
 */
export function usePropertyStrategy(propertyId: string | null | undefined) {
  const { user } = useUser();

  return useQuery({
    queryKey: strategyKeys.property(propertyId || ""),
    queryFn: async () => {
      if (!user?.id || !propertyId) {
        throw new Error("User not authenticated or property ID missing");
      }

      const result = await apiFetch<StrategyResponse>(
        `/api/strategy/property/${propertyId}`,
        {
          clerkId: user.id,
        }
      );

      return result;
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Get BRRRR phase details and history for a property
 */
export function useBrrrrPhase(propertyId: string | null | undefined) {
  const { user } = useUser();

  return useQuery({
    queryKey: strategyKeys.brrrr(propertyId || ""),
    queryFn: async () => {
      if (!user?.id || !propertyId) {
        throw new Error("User not authenticated or property ID missing");
      }

      const result = await apiFetch<BrrrrPhaseResponse>(
        `/api/strategy/property/${propertyId}/brrrr`,
        {
          clerkId: user.id,
        }
      );

      return result;
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 30 * 1000,
  });
}

/**
 * Get rehab scope items for a property
 */
export function useRehabScope(propertyId: string | null | undefined) {
  const { user } = useUser();

  return useQuery({
    queryKey: strategyKeys.rehabScope(propertyId || ""),
    queryFn: async () => {
      if (!user?.id || !propertyId) {
        throw new Error("User not authenticated or property ID missing");
      }

      const result = await apiFetch<RehabScopeResponse>(
        `/api/strategy/property/${propertyId}/rehab-scope`,
        {
          clerkId: user.id,
        }
      );

      return result;
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 30 * 1000,
  });
}

/**
 * Get enum values for strategy forms
 */
export function useStrategyEnums() {
  const { user } = useUser();

  return useQuery({
    queryKey: strategyKeys.enums(),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const result = await apiFetch<EnumsResponse>("/api/strategy/enums", {
        clerkId: user.id,
      });

      return result;
    },
    enabled: !!user?.id,
    staleTime: 60 * 60 * 1000, // 1 hour (enums don't change)
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create or update strategy for a property (upsert)
 */
export function useSaveStrategy() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ propertyId, ...data }: SaveStrategyInput) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      return await apiFetch<{ strategy: PropertyStrategy }>(
        `/api/strategy/property/${propertyId}`,
        {
          method: "PUT",
          clerkId: user.id,
          body: JSON.stringify(data),
        }
      );
    },
    onSuccess: (_data, variables) => {
      // Invalidate strategy queries
      queryClient.invalidateQueries({
        queryKey: strategyKeys.property(variables.propertyId),
      });
      // Also invalidate BRRRR if strategy is BRRRR
      if (variables.primaryStrategy === "brrrr") {
        queryClient.invalidateQueries({
          queryKey: strategyKeys.brrrr(variables.propertyId),
        });
      }
    },
  });
}

/**
 * Delete strategy for a property
 */
export function useDeleteStrategy() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      return await apiFetch<{ success: boolean }>(
        `/api/strategy/property/${propertyId}`,
        {
          method: "DELETE",
          clerkId: user.id,
        }
      );
    },
    onSuccess: (_data, propertyId) => {
      // Invalidate all strategy queries for this property
      queryClient.invalidateQueries({
        queryKey: strategyKeys.property(propertyId),
      });
      queryClient.invalidateQueries({
        queryKey: strategyKeys.brrrr(propertyId),
      });
      queryClient.invalidateQueries({
        queryKey: strategyKeys.rehabScope(propertyId),
      });
    },
  });
}

/**
 * Transition BRRRR phase
 */
export function useTransitionBrrrrPhase() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ propertyId, ...data }: TransitionBrrrrPhaseInput) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      return await apiFetch<{
        brrrrPhase: BRRRRPhaseRecord;
        transition: { from: BRRRRPhase; to: BRRRRPhase };
      }>(`/api/strategy/property/${propertyId}/brrrr/transition`, {
        method: "POST",
        clerkId: user.id,
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_data, variables) => {
      // Invalidate BRRRR and strategy queries
      queryClient.invalidateQueries({
        queryKey: strategyKeys.brrrr(variables.propertyId),
      });
      queryClient.invalidateQueries({
        queryKey: strategyKeys.property(variables.propertyId),
      });
    },
  });
}

/**
 * Update BRRRR metrics (without phase transition)
 */
export function useUpdateBrrrrMetrics() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ propertyId, ...data }: UpdateBrrrrMetricsInput) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      return await apiFetch<{ brrrrPhase: BRRRRPhaseRecord }>(
        `/api/strategy/property/${propertyId}/brrrr`,
        {
          method: "PATCH",
          clerkId: user.id,
          body: JSON.stringify(data),
        }
      );
    },
    onSuccess: (_data, variables) => {
      // Invalidate BRRRR and strategy queries
      queryClient.invalidateQueries({
        queryKey: strategyKeys.brrrr(variables.propertyId),
      });
      queryClient.invalidateQueries({
        queryKey: strategyKeys.property(variables.propertyId),
      });
    },
  });
}

/**
 * Create a rehab scope item
 */
export function useCreateRehabItem() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ propertyId, ...data }: CreateRehabItemInput) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      return await apiFetch<{ item: RehabScopeItem }>(
        `/api/strategy/property/${propertyId}/rehab-scope`,
        {
          method: "POST",
          clerkId: user.id,
          body: JSON.stringify(data),
        }
      );
    },
    onSuccess: (_data, variables) => {
      // Invalidate rehab scope and strategy queries
      queryClient.invalidateQueries({
        queryKey: strategyKeys.rehabScope(variables.propertyId),
      });
      queryClient.invalidateQueries({
        queryKey: strategyKeys.property(variables.propertyId),
      });
    },
  });
}

/**
 * Update a rehab scope item
 */
export function useUpdateRehabItem() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ propertyId, itemId, ...data }: UpdateRehabItemInput) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      return await apiFetch<{ item: RehabScopeItem }>(
        `/api/strategy/property/${propertyId}/rehab-scope/${itemId}`,
        {
          method: "PATCH",
          clerkId: user.id,
          body: JSON.stringify(data),
        }
      );
    },
    onSuccess: (_data, variables) => {
      // Invalidate rehab scope and strategy queries
      queryClient.invalidateQueries({
        queryKey: strategyKeys.rehabScope(variables.propertyId),
      });
      queryClient.invalidateQueries({
        queryKey: strategyKeys.property(variables.propertyId),
      });
    },
  });
}

/**
 * Delete a rehab scope item
 */
export function useDeleteRehabItem() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      propertyId,
      itemId,
    }: {
      propertyId: string;
      itemId: string;
    }) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      return await apiFetch<{ success: boolean }>(
        `/api/strategy/property/${propertyId}/rehab-scope/${itemId}`,
        {
          method: "DELETE",
          clerkId: user.id,
        }
      );
    },
    onSuccess: (_data, variables) => {
      // Invalidate rehab scope and strategy queries
      queryClient.invalidateQueries({
        queryKey: strategyKeys.rehabScope(variables.propertyId),
      });
      queryClient.invalidateQueries({
        queryKey: strategyKeys.property(variables.propertyId),
      });
    },
  });
}
