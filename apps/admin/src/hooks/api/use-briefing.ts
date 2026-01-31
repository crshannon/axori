import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { apiFetch } from "@/lib/api/client";

// Response types matching the API
export interface BriefingTicket {
  id: string;
  identifier: string;
  title: string;
  completedAt?: string;
  prUrl?: string | null;
  prNumber?: number | null;
  reason?: string;
  priority?: string | null;
  estimate?: number | null;
  blockedCount?: number;
}

export interface BriefingResponse {
  generatedAt: string;
  greeting: {
    timeOfDay: "morning" | "afternoon" | "evening";
    hour: number;
  };
  overnight: {
    completedTickets: Array<BriefingTicket>;
    prsReady: Array<BriefingTicket>;
    needsAttention: Array<BriefingTicket>;
  };
  todaysFocus: Array<BriefingTicket>;
  tokenBudget: {
    usedTokens: number;
    limitTokens: number;
    usedCents: number;
    limitCents: number;
    percentUsed: number;
  };
  recentExecutions: Array<{
    id: string;
    ticketId: string | null;
    status: string;
    completedAt: string | null;
  }>;
}

export const briefingKeys = {
  all: ["forge", "briefing"] as const,
  current: () => [...briefingKeys.all, "current"] as const,
};

/**
 * Fetch morning briefing data
 */
export function useBriefing() {
  const { user } = useUser();

  return useQuery({
    queryKey: briefingKeys.current(),
    queryFn: async () => {
      return apiFetch<BriefingResponse>("/api/forge/briefing", {
        clerkId: user?.id,
      });
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // Consider fresh for 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}
