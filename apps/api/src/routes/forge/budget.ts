/**
 * Forge Token Budget API Routes
 *
 * Routes for managing token budgets and tracking usage
 */

import { Hono } from "hono"
import { z } from "zod"
import {
  db,
  forgeTokenBudgets,
  forgeTokenUsage,
  forgeAgentExecutions,
  eq,
  desc,
  sql,
  and,
} from "@axori/db"
import { requireAuth } from "../../middleware/permissions"
import { withErrorHandling, validateData } from "../../utils/errors"

const router = new Hono()

// =============================================================================
// Validation Schemas
// =============================================================================

const updateBudgetSchema = z.object({
  dailyLimitTokens: z.number().int().min(0).optional(),
  dailyLimitCents: z.number().int().min(0).optional(),
  autopilotLimitTokens: z.number().int().min(0).optional(),
})

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /forge/budget/today
 * Get today's budget status
 */
router.get(
  "/today",
  requireAuth(),
  withErrorHandling(async (c) => {
    const today = new Date().toISOString().split("T")[0]

    let [budget] = await db
      .select()
      .from(forgeTokenBudgets)
      .where(eq(forgeTokenBudgets.date, today))
      .limit(1)

    // Create today's budget if it doesn't exist
    if (!budget) {
      ;[budget] = await db
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
        .returning()
    }

    // Calculate percentages
    const tokenPercentUsed = budget.dailyLimitTokens
      ? Math.round(((budget.usedTokens || 0) / budget.dailyLimitTokens) * 100)
      : 0
    const costPercentUsed = budget.dailyLimitCents
      ? Math.round(((budget.usedCents || 0) / budget.dailyLimitCents) * 100)
      : 0

    return c.json({
      ...budget,
      tokenPercentUsed,
      costPercentUsed,
      remainingTokens: (budget.dailyLimitTokens || 0) - (budget.usedTokens || 0),
      remainingCents: (budget.dailyLimitCents || 0) - (budget.usedCents || 0),
    })
  }, { operation: "getTodayBudget" })
)

/**
 * GET /forge/budget/history
 * Get budget history for the past N days
 */
router.get(
  "/history",
  requireAuth(),
  withErrorHandling(async (c) => {
    const days = parseInt(c.req.query("days") || "30", 10)

    const history = await db
      .select()
      .from(forgeTokenBudgets)
      .orderBy(desc(forgeTokenBudgets.date))
      .limit(days)

    // Calculate totals
    const totals = history.reduce(
      (acc, day) => ({
        totalTokens: acc.totalTokens + (day.usedTokens || 0),
        totalCents: acc.totalCents + (day.usedCents || 0),
        totalAutopilotTokens: acc.totalAutopilotTokens + (day.autopilotUsedTokens || 0),
      }),
      { totalTokens: 0, totalCents: 0, totalAutopilotTokens: 0 }
    )

    return c.json({
      history: history.reverse(), // Chronological order
      totals,
      averageDaily: {
        tokens: Math.round(totals.totalTokens / Math.max(history.length, 1)),
        cents: Math.round(totals.totalCents / Math.max(history.length, 1)),
      },
    })
  }, { operation: "getBudgetHistory" })
)

/**
 * PUT /forge/budget/today
 * Update today's budget limits
 */
router.put(
  "/today",
  requireAuth(),
  withErrorHandling(async (c) => {
    const body = await c.req.json()
    const validated = validateData(body, updateBudgetSchema, {
      operation: "updateTodayBudget",
    })

    const today = new Date().toISOString().split("T")[0]

    // Ensure today's budget exists
    let [budget] = await db
      .select()
      .from(forgeTokenBudgets)
      .where(eq(forgeTokenBudgets.date, today))
      .limit(1)

    if (!budget) {
      ;[budget] = await db
        .insert(forgeTokenBudgets)
        .values({
          date: today,
          dailyLimitTokens: validated.dailyLimitTokens || 500000,
          dailyLimitCents: validated.dailyLimitCents || 500,
          usedTokens: 0,
          usedCents: 0,
          autopilotLimitTokens: validated.autopilotLimitTokens || 100000,
          autopilotUsedTokens: 0,
        })
        .returning()
    } else {
      ;[budget] = await db
        .update(forgeTokenBudgets)
        .set(validated)
        .where(eq(forgeTokenBudgets.id, budget.id))
        .returning()
    }

    return c.json(budget)
  }, { operation: "updateTodayBudget" })
)

/**
 * GET /forge/budget/usage
 * Get detailed token usage breakdown
 */
router.get(
  "/usage",
  requireAuth(),
  withErrorHandling(async (c) => {
    const days = parseInt(c.req.query("days") || "7", 10)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get usage by model
    const usageByModel = await db
      .select({
        model: forgeTokenUsage.model,
        totalInput: sql<number>`sum(${forgeTokenUsage.inputTokens})::int`,
        totalOutput: sql<number>`sum(${forgeTokenUsage.outputTokens})::int`,
        totalCost: sql<number>`sum(${forgeTokenUsage.costCents})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(forgeTokenUsage)
      .where(sql`${forgeTokenUsage.createdAt} >= ${startDate.toISOString()}`)
      .groupBy(forgeTokenUsage.model)

    // Get usage by protocol (via executions)
    const usageByProtocol = await db
      .select({
        protocol: forgeAgentExecutions.protocol,
        totalTokens: sql<number>`sum(${forgeAgentExecutions.tokensUsed})::int`,
        totalCost: sql<number>`sum(${forgeAgentExecutions.costCents})::int`,
        count: sql<number>`count(*)::int`,
        avgDuration: sql<number>`avg(${forgeAgentExecutions.durationMs})::int`,
      })
      .from(forgeAgentExecutions)
      .where(
        and(
          sql`${forgeAgentExecutions.createdAt} >= ${startDate.toISOString()}`,
          eq(forgeAgentExecutions.status, "completed")
        )
      )
      .groupBy(forgeAgentExecutions.protocol)

    // Get daily breakdown
    const dailyUsage = await db
      .select({
        date: sql<string>`date_trunc('day', ${forgeTokenUsage.createdAt})::date`,
        totalTokens: sql<number>`sum(${forgeTokenUsage.inputTokens} + ${forgeTokenUsage.outputTokens})::int`,
        totalCost: sql<number>`sum(${forgeTokenUsage.costCents})::int`,
      })
      .from(forgeTokenUsage)
      .where(sql`${forgeTokenUsage.createdAt} >= ${startDate.toISOString()}`)
      .groupBy(sql`date_trunc('day', ${forgeTokenUsage.createdAt})`)
      .orderBy(sql`date_trunc('day', ${forgeTokenUsage.createdAt})`)

    return c.json({
      byModel: usageByModel,
      byProtocol: usageByProtocol,
      daily: dailyUsage,
      period: { days, startDate: startDate.toISOString() },
    })
  }, { operation: "getTokenUsage" })
)

/**
 * GET /forge/budget/recent
 * Get recent token usage entries
 */
router.get(
  "/recent",
  requireAuth(),
  withErrorHandling(async (c) => {
    const limit = parseInt(c.req.query("limit") || "50", 10)

    const recentUsage = await db
      .select({
        usage: forgeTokenUsage,
        execution: {
          id: forgeAgentExecutions.id,
          protocol: forgeAgentExecutions.protocol,
          status: forgeAgentExecutions.status,
        },
      })
      .from(forgeTokenUsage)
      .leftJoin(
        forgeAgentExecutions,
        eq(forgeTokenUsage.executionId, forgeAgentExecutions.id)
      )
      .orderBy(desc(forgeTokenUsage.createdAt))
      .limit(limit)

    return c.json(
      recentUsage.map((r) => ({
        ...r.usage,
        execution: r.execution,
      }))
    )
  }, { operation: "getRecentUsage" })
)

/**
 * GET /forge/budget/stats
 * Get summary statistics
 */
router.get(
  "/stats",
  requireAuth(),
  withErrorHandling(async (c) => {
    const today = new Date().toISOString().split("T")[0]
    const thisMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

    // Today's stats
    const [todayBudget] = await db
      .select()
      .from(forgeTokenBudgets)
      .where(eq(forgeTokenBudgets.date, today))
      .limit(1)

    // This month's totals
    const [monthlyTotals] = await db
      .select({
        totalTokens: sql<number>`sum(${forgeTokenBudgets.usedTokens})::int`,
        totalCents: sql<number>`sum(${forgeTokenBudgets.usedCents})::int`,
        daysActive: sql<number>`count(*)::int`,
      })
      .from(forgeTokenBudgets)
      .where(sql`to_char(${forgeTokenBudgets.date}, 'YYYY-MM') = ${thisMonth}`)

    // Execution stats for this month
    const [executionStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where ${forgeAgentExecutions.status} = 'completed')::int`,
        failed: sql<number>`count(*) filter (where ${forgeAgentExecutions.status} = 'failed')::int`,
        avgTokens: sql<number>`avg(${forgeAgentExecutions.tokensUsed})::int`,
        avgCost: sql<number>`avg(${forgeAgentExecutions.costCents})::int`,
        avgDuration: sql<number>`avg(${forgeAgentExecutions.durationMs})::int`,
      })
      .from(forgeAgentExecutions)
      .where(sql`to_char(${forgeAgentExecutions.createdAt}, 'YYYY-MM') = ${thisMonth}`)

    return c.json({
      today: {
        usedTokens: todayBudget?.usedTokens || 0,
        usedCents: todayBudget?.usedCents || 0,
        limitTokens: todayBudget?.dailyLimitTokens || 500000,
        limitCents: todayBudget?.dailyLimitCents || 500,
        percentUsed: todayBudget?.dailyLimitTokens
          ? Math.round(((todayBudget.usedTokens || 0) / todayBudget.dailyLimitTokens) * 100)
          : 0,
      },
      thisMonth: {
        totalTokens: monthlyTotals?.totalTokens || 0,
        totalCents: monthlyTotals?.totalCents || 0,
        daysActive: monthlyTotals?.daysActive || 0,
        totalDollars: ((monthlyTotals?.totalCents || 0) / 100).toFixed(2),
      },
      executions: {
        total: executionStats?.total || 0,
        completed: executionStats?.completed || 0,
        failed: executionStats?.failed || 0,
        successRate: executionStats?.total
          ? Math.round(((executionStats.completed || 0) / executionStats.total) * 100)
          : 0,
        avgTokens: executionStats?.avgTokens || 0,
        avgCostCents: executionStats?.avgCost || 0,
        avgDurationMs: executionStats?.avgDuration || 0,
      },
    })
  }, { operation: "getBudgetStats" })
)

export default router
