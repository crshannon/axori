/**
 * Forge Briefing API Route
 *
 * Aggregates dashboard data for the Morning Briefing component
 */

import { Hono } from "hono";
import {
  db,
  forgeTickets,
  forgeAgentExecutions,
  forgeTokenBudgets,
  eq,
  desc,
  and,
  gte,
  sql,
} from "@axori/db";
import { requireAuth } from "../../middleware/permissions";
import { withErrorHandling } from "../../utils/errors";

const router = new Hono();

// Types for the briefing response
interface BriefingTicket {
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

interface BriefingResponse {
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

/**
 * GET /forge/briefing
 * Get aggregated dashboard data for morning briefing
 */
router.get(
  "/",
  requireAuth(),
  withErrorHandling(async (c) => {
    const now = new Date();
    const hour = now.getHours();
    const today = now.toISOString().split("T")[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Determine time of day
    const timeOfDay: "morning" | "afternoon" | "evening" =
      hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

    // Get tickets completed in last 24 hours
    const completedTickets = await db
      .select({
        id: forgeTickets.id,
        identifier: forgeTickets.identifier,
        title: forgeTickets.title,
        completedAt: forgeTickets.updatedAt,
      })
      .from(forgeTickets)
      .where(
        and(
          eq(forgeTickets.status, "done"),
          gte(forgeTickets.updatedAt, yesterday)
        )
      )
      .orderBy(desc(forgeTickets.updatedAt))
      .limit(10);

    // Get tickets with PRs ready for review
    const prsReady = await db
      .select({
        id: forgeTickets.id,
        identifier: forgeTickets.identifier,
        title: forgeTickets.title,
        prUrl: forgeTickets.prUrl,
        prNumber: forgeTickets.prNumber,
      })
      .from(forgeTickets)
      .where(
        and(
          eq(forgeTickets.status, "in_review"),
          sql`${forgeTickets.prUrl} IS NOT NULL`
        )
      )
      .orderBy(desc(forgeTickets.updatedAt))
      .limit(10);

    // Get tickets needing attention (blocked or failed executions)
    const needsAttention = await db
      .select({
        id: forgeTickets.id,
        identifier: forgeTickets.identifier,
        title: forgeTickets.title,
        status: forgeTickets.status,
      })
      .from(forgeTickets)
      .where(eq(forgeTickets.status, "blocked"))
      .orderBy(desc(forgeTickets.updatedAt))
      .limit(10);

    // Get today's focus (high priority in_progress or planned)
    const todaysFocus = await db
      .select({
        id: forgeTickets.id,
        identifier: forgeTickets.identifier,
        title: forgeTickets.title,
        priority: forgeTickets.priority,
        estimate: forgeTickets.estimate,
      })
      .from(forgeTickets)
      .where(
        sql`${forgeTickets.status} IN ('in_progress', 'planned') AND ${forgeTickets.priority} IN ('critical', 'high')`
      )
      .orderBy(
        sql`CASE ${forgeTickets.priority} WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END`,
        desc(forgeTickets.updatedAt)
      )
      .limit(5);

    // Get today's token budget
    let budget = await db
      .select()
      .from(forgeTokenBudgets)
      .where(eq(forgeTokenBudgets.date, today))
      .limit(1)
      .then((r) => r[0]);

    if (!budget) {
      // Create default budget if none exists
      [budget] = await db
        .insert(forgeTokenBudgets)
        .values({
          date: today,
          dailyLimitTokens: 500000,
          dailyLimitCents: 500,
          usedTokens: 0,
          usedCents: 0,
          autopilotLimitTokens: 100000,
          autopilotUsedTokens: 0,
        })
        .returning();
    }

    const percentUsed = budget.dailyLimitTokens
      ? Math.round(((budget.usedTokens || 0) / budget.dailyLimitTokens) * 100)
      : 0;

    // Get recent executions
    const recentExecutions = await db
      .select({
        id: forgeAgentExecutions.id,
        ticketId: forgeAgentExecutions.ticketId,
        status: forgeAgentExecutions.status,
        completedAt: forgeAgentExecutions.completedAt,
      })
      .from(forgeAgentExecutions)
      .orderBy(desc(forgeAgentExecutions.createdAt))
      .limit(10);

    const response: BriefingResponse = {
      generatedAt: now.toISOString(),
      greeting: {
        timeOfDay,
        hour,
      },
      overnight: {
        completedTickets: completedTickets.map((t) => ({
          ...t,
          completedAt: t.completedAt?.toISOString(),
        })),
        prsReady,
        needsAttention: needsAttention.map((t) => ({
          ...t,
          reason: t.status === "blocked" ? "Blocked" : "Needs review",
        })),
      },
      todaysFocus: todaysFocus.map((t) => ({
        ...t,
        blockedCount: 0,
      })),
      tokenBudget: {
        usedTokens: budget.usedTokens || 0,
        limitTokens: budget.dailyLimitTokens || 500000,
        usedCents: budget.usedCents || 0,
        limitCents: budget.dailyLimitCents || 500,
        percentUsed,
      },
      recentExecutions: recentExecutions.map((e) => ({
        ...e,
        completedAt: e.completedAt?.toISOString() || null,
      })),
    };

    return c.json(response);
  })
);

export default router;
