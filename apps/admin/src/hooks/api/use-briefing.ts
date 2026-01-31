import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import type { BriefingResponse } from "@axori/shared";
import { apiFetch } from "@/lib/api/client";

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
