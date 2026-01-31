/**
 * Shared types for Forge Briefing API
 */

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
