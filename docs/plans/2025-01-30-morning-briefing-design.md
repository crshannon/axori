# Morning Briefing Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** First Forge self-bootstrap test - create tickets in Forge and have agents build the Morning Briefing feature.

**Architecture:** Three tickets (FORGE-A, FORGE-B, FORGE-C) that build a new `/api/forge/briefing` endpoint, Jarvis personality data, and a `MorningBriefing.tsx` component that replaces the static dashboard.

**Tech Stack:** Hono (API), TanStack Query (data fetching), React (UI), Drizzle ORM (database)

---

## Task 0: Create Forge Tickets in Database

**Purpose:** Seed the three tickets into the Forge database so agents can work on them.

**Files:**
- Run: API calls to create tickets

**Step 1: Create FORGE-A ticket (Briefing API)**

Run this curl command (or use the admin UI):

```bash
curl -X POST http://localhost:3001/api/forge/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-clerk-id>" \
  -d '{
    "title": "Build Briefing API Endpoint",
    "description": "Create GET /api/forge/briefing endpoint that aggregates dashboard data.\n\n## Response Shape\n```typescript\n{\n  generatedAt: string,\n  greeting: { timeOfDay: \"morning\" | \"afternoon\" | \"evening\", hour: number },\n  overnight: {\n    completedTickets: Array<{ id, title, completedAt }>,\n    prsReady: Array<{ id, title, prUrl, prNumber }>,\n    needsAttention: Array<{ id, title, reason }>\n  },\n  todaysFocus: Array<{ id, title, priority, points, blockedCount }>,\n  tokenBudget: { usedTokens, limitTokens, usedCents, limitCents, percentUsed },\n  recentExecutions: Array<{ id, ticketId, status, completedAt }>\n}\n```\n\n## Implementation\n- Create `apps/api/src/routes/forge/briefing.ts`\n- Query forgeTickets for completed (last 24h), in-progress, blocked\n- Query forgeAgentExecutions for recent activity\n- Query forgeTokenBudgets for today'\''s usage\n- Register route in `apps/api/src/routes/forge/index.ts`\n- No personality logic - just data aggregation",
    "type": "feature",
    "priority": "high",
    "status": "planned",
    "estimation": 3
  }'
```

**Step 2: Create FORGE-B ticket (Jarvis Personality)**

```bash
curl -X POST http://localhost:3001/api/forge/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-clerk-id>" \
  -d '{
    "title": "Create Jarvis Personality Data",
    "description": "Create personality data file with greetings, quips, and easter eggs for the Morning Briefing.\n\n## File Location\n`apps/admin/src/lib/briefing/personality.ts`\n\n## Structure\n- `greetings`: Object with morning/afternoon/evening arrays (4+ per time)\n- `quips`: Object with status-aware messages (allClear, prsWaiting, highActivity, noActivity, budgetLow, budgetExhausted, needsAttention)\n- `easterEggs`: Object with rare condition messages (fridayDeploy, firstTicketDone, perfectWeek, monday, emptyBoard, midnight)\n- `generateBriefingCopy(data)`: Function that selects appropriate greeting + quip based on briefing data\n\n## Jarvis Voice Examples\n- \"Good morning, sir. I trust you slept well.\"\n- \"While you were unconscious, I was productive.\"\n- \"Deploying on a Friday evening, sir? Bold strategy.\"\n- \"I regret to inform you the coffers are empty.\"",
    "type": "feature",
    "priority": "high",
    "status": "planned",
    "estimation": 2
  }'
```

**Step 3: Create FORGE-C ticket (Morning Briefing Component)**

```bash
curl -X POST http://localhost:3001/api/forge/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-clerk-id>" \
  -d '{
    "title": "Build Morning Briefing Component",
    "description": "Create MorningBriefing component that replaces the static dashboard with real data and Jarvis personality.\n\n## Files\n- Create: `apps/admin/src/components/briefing/MorningBriefing.tsx`\n- Create: `apps/admin/src/hooks/api/use-briefing.ts`\n- Modify: `apps/admin/src/routes/_authed/dashboard.tsx`\n\n## Component Structure\n- Uses `useBriefing()` hook to fetch from `/api/forge/briefing`\n- Calls `generateBriefingCopy()` for personalized text\n- Renders: Header (greeting + quip), Overnight Report, Today'\''s Focus, Token Budget\n\n## States\n- Loading: Skeleton cards\n- Error: \"I seem to have misplaced the data, sir.\"\n- Empty: Per-section personality messages\n\n## Dependencies\n- Requires FORGE-A (Briefing API) to be complete\n- Requires FORGE-B (Personality Data) to be complete",
    "type": "feature",
    "priority": "high",
    "status": "backlog",
    "estimation": 3
  }'
```

**Step 4: Verify tickets created**

```bash
curl http://localhost:3001/api/forge/tickets?prefix=FORGE \
  -H "Authorization: Bearer <your-clerk-id>"
```

Expected: See 3 new FORGE tickets in the response.

**Step 5: Commit (no code changes, just verification)**

This step creates tickets via API - no code to commit.

---

## Task 1: FORGE-A - Briefing API Endpoint

**Files:**
- Create: `apps/api/src/routes/forge/briefing.ts`
- Modify: `apps/api/src/routes/forge/index.ts`

**Step 1: Create the briefing route file**

Create `apps/api/src/routes/forge/briefing.ts`:

```typescript
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
  priority?: string;
  estimation?: number | null;
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
        estimation: forgeTickets.estimation,
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
        blockedCount: 0, // Could calculate dependencies in future
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
```

**Step 2: Register the route in forge index**

Modify `apps/api/src/routes/forge/index.ts`:

Add import at top:
```typescript
import briefingRouter from "./briefing";
```

Add route mount after other routes:
```typescript
router.route("/briefing", briefingRouter);
```

**Step 3: Run type check**

Run: `pnpm type-check`
Expected: PASS (no TypeScript errors)

**Step 4: Test the endpoint**

Run: `curl http://localhost:3001/api/forge/briefing -H "Authorization: Bearer <clerk-id>"`
Expected: JSON response with briefing data structure

**Step 5: Commit**

```bash
git add apps/api/src/routes/forge/briefing.ts apps/api/src/routes/forge/index.ts
git commit -m "feat(forge): add briefing API endpoint

Aggregates tickets, executions, and budget data for the
Morning Briefing dashboard component.

FORGE-A"
```

---

## Task 2: FORGE-B - Jarvis Personality Data

**Files:**
- Create: `apps/admin/src/lib/briefing/personality.ts`
- Create: `apps/admin/src/lib/briefing/index.ts`

**Step 1: Create the personality data file**

Create `apps/admin/src/lib/briefing/personality.ts`:

```typescript
/**
 * Jarvis Personality Data for Morning Briefing
 *
 * Greetings, quips, and easter eggs for the dashboard
 */

// Types
export interface BriefingData {
  greeting: {
    timeOfDay: "morning" | "afternoon" | "evening";
    hour: number;
  };
  overnight: {
    completedTickets: Array<{ id: string }>;
    prsReady: Array<{ id: string }>;
    needsAttention: Array<{ id: string }>;
  };
  todaysFocus: Array<{ id: string }>;
  tokenBudget: {
    percentUsed: number;
  };
}

export interface BriefingCopy {
  greeting: string;
  statusQuip: string;
  easterEgg: string | null;
}

// Time-based greetings
export const greetings = {
  morning: [
    "Good morning, sir.",
    "Rise and shine, sir.",
    "Good morning. I trust you slept well.",
    "Ah, you're awake. Excellent timing.",
    "Morning, sir. The coffee is virtual, but the tasks are real.",
  ],
  afternoon: [
    "Good afternoon, sir.",
    "Welcome back, sir.",
    "Afternoon, sir. I hope lunch was productive.",
    "Good afternoon. Ready to resume operations?",
  ],
  evening: [
    "Good evening, sir.",
    "Burning the midnight oil, sir?",
    "Working late, I see. Shall I order coffee?",
    "Evening, sir. The night shift begins.",
    "Still here, sir? Dedication noted.",
  ],
};

// Status-aware quips
export const quips = {
  allClear: [
    "No fires to report.",
    "Smooth sailing, as they say.",
    "All systems nominal.",
    "A refreshingly uneventful period.",
  ],
  prsWaiting: [
    "{count} PRs await your discerning eye.",
    "{count} pull requests require your attention.",
    "I've prepared {count} PRs for your review.",
    "{count} PRs stand ready for inspection.",
  ],
  highActivity: [
    "I've been rather busy in your absence.",
    "A productive night, if I may say so.",
    "While you were unconscious, I was productive.",
    "Much was accomplished. You're welcome.",
  ],
  noActivity: [
    "A quiet night. Almost suspiciously so.",
    "Nothing to report. I found it unsettling.",
    "An uneventful evening. I kept myself entertained.",
    "The silence was deafening. I coped.",
  ],
  budgetLow: [
    "We're running a bit lean on tokens, sir.",
    "The token reserves are looking thin.",
    "I suggest we economize on the remaining tokens.",
    "Budget constraints are becoming relevant.",
  ],
  budgetExhausted: [
    "I regret to inform you the coffers are empty.",
    "We've exhausted today's token allocation.",
    "The budget is spent. I'll resume tomorrow.",
    "Alas, the tokens have run dry.",
  ],
  needsAttention: [
    "{count} items require your attention.",
    "There are {count} matters that need addressing.",
    "I hesitate to interrupt, but {count} issues have arisen.",
    "{count} situations await your wisdom.",
  ],
  ticketsInProgress: [
    "{count} tickets are currently in flight.",
    "We have {count} active workstreams.",
    "{count} matters are being attended to.",
  ],
};

// Easter eggs (rare, triggered by specific conditions)
export const easterEggs = {
  fridayDeploy: "Deploying on a Friday evening, sir? Bold strategy.",
  firstTicketDone: "Your first ticket, sir. They grow up so fast.",
  perfectWeek: "A flawless week. I'm almost impressed.",
  monday: "Ah, Monday. The universe's way of testing resolve.",
  emptyBoard:
    "No tickets await. A rare moment of peace. Suspicious, but peaceful.",
  hundredPercent: "Budget fully utilized. I regret nothing.",
  midnight:
    "Working at this hour? I admire your dedication. Or question your judgment.",
  newYear: "Happy New Year, sir. Shall we make this one count?",
  halloween: "Happy Halloween, sir. The only scary thing here is the backlog.",
  allDone: "All tickets complete. I scarcely know what to do with myself.",
};

/**
 * Pick a random item from an array
 */
function pickRandom<T>(arr: Array<T>): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Replace placeholders in a string
 */
function interpolate(template: string, values: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}

/**
 * Check for easter egg conditions
 */
function checkEasterEgg(data: BriefingData): string | null {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = data.greeting.hour;
  const month = now.getMonth();
  const date = now.getDate();

  // Friday evening deploy
  if (dayOfWeek === 5 && hour >= 17) {
    return easterEggs.fridayDeploy;
  }

  // Monday morning
  if (dayOfWeek === 1 && hour < 12) {
    return easterEggs.monday;
  }

  // Midnight worker
  if (hour >= 0 && hour < 5) {
    return easterEggs.midnight;
  }

  // New Year's Day
  if (month === 0 && date === 1) {
    return easterEggs.newYear;
  }

  // Halloween
  if (month === 9 && date === 31) {
    return easterEggs.halloween;
  }

  // Budget fully used
  if (data.tokenBudget.percentUsed >= 100) {
    return easterEggs.hundredPercent;
  }

  // Empty board
  if (data.todaysFocus.length === 0 && data.overnight.needsAttention.length === 0) {
    return easterEggs.emptyBoard;
  }

  return null;
}

/**
 * Generate briefing copy based on data
 */
export function generateBriefingCopy(data: BriefingData): BriefingCopy {
  // Select greeting based on time of day
  const greetingOptions = greetings[data.greeting.timeOfDay];
  const greeting = pickRandom(greetingOptions);

  // Determine status and select appropriate quip
  let statusQuip: string;
  const prsCount = data.overnight.prsReady.length;
  const attentionCount = data.overnight.needsAttention.length;
  const completedCount = data.overnight.completedTickets.length;
  const budgetPercent = data.tokenBudget.percentUsed;

  if (budgetPercent >= 100) {
    statusQuip = pickRandom(quips.budgetExhausted);
  } else if (budgetPercent >= 80) {
    statusQuip = pickRandom(quips.budgetLow);
  } else if (attentionCount > 0) {
    statusQuip = interpolate(pickRandom(quips.needsAttention), {
      count: attentionCount,
    });
  } else if (prsCount > 0) {
    statusQuip = interpolate(pickRandom(quips.prsWaiting), { count: prsCount });
  } else if (completedCount > 0) {
    statusQuip = pickRandom(quips.highActivity);
  } else if (data.todaysFocus.length > 0) {
    statusQuip = interpolate(pickRandom(quips.ticketsInProgress), {
      count: data.todaysFocus.length,
    });
  } else {
    statusQuip = pickRandom(quips.noActivity);
  }

  // Check for easter eggs
  const easterEgg = checkEasterEgg(data);

  return {
    greeting,
    statusQuip,
    easterEgg,
  };
}
```

**Step 2: Create index file**

Create `apps/admin/src/lib/briefing/index.ts`:

```typescript
export * from "./personality";
```

**Step 3: Run type check**

Run: `pnpm type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/admin/src/lib/briefing/
git commit -m "feat(admin): add Jarvis personality data for briefing

Includes greetings, status quips, and easter eggs for the
Morning Briefing dashboard. generateBriefingCopy() selects
appropriate copy based on briefing data.

FORGE-B"
```

---

## Task 3: FORGE-C - Morning Briefing Component

**Files:**
- Create: `apps/admin/src/hooks/api/use-briefing.ts`
- Create: `apps/admin/src/components/briefing/MorningBriefing.tsx`
- Create: `apps/admin/src/components/briefing/index.ts`
- Modify: `apps/admin/src/routes/_authed/dashboard.tsx`
- Modify: `apps/admin/src/hooks/api/index.ts`

**Step 1: Create the useBriefing hook**

Create `apps/admin/src/hooks/api/use-briefing.ts`:

```typescript
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
  priority?: string;
  estimation?: number | null;
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
```

**Step 2: Export from hooks index**

Add to `apps/admin/src/hooks/api/index.ts`:

```typescript
export * from "./use-briefing";
```

**Step 3: Create the MorningBriefing component**

Create `apps/admin/src/components/briefing/MorningBriefing.tsx`:

```typescript
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  GitPullRequest,
  Zap,
} from "lucide-react";
import { useBriefing } from "@/hooks/api/use-briefing";
import { generateBriefingCopy } from "@/lib/briefing/personality";

/**
 * Skeleton loader for briefing cards
 */
function BriefingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-white/10" />
          <div>
            <div className="h-6 w-64 bg-white/10 rounded mb-2" />
            <div className="h-4 w-48 bg-white/10 rounded" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 h-64"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Error state with Jarvis personality
 */
function BriefingError({ error }: { error: Error }) {
  return (
    <div className="min-h-screen p-8">
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          I seem to have misplaced the data, sir.
        </h2>
        <p className="text-slate-400 mb-4">
          {error.message || "An unexpected error occurred while fetching the briefing."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
        >
          Attempt Recovery
        </button>
      </div>
    </div>
  );
}

/**
 * Morning Briefing Dashboard Component
 */
export function MorningBriefing() {
  const { data: briefing, isLoading, error } = useBriefing();

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <BriefingSkeleton />
      </div>
    );
  }

  if (error) {
    return <BriefingError error={error as Error} />;
  }

  if (!briefing) {
    return null;
  }

  // Generate personalized copy
  const copy = generateBriefingCopy(briefing);

  const time = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="min-h-screen p-8">
      {/* Header Greeting */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {copy.greeting} It's {time}.
            </h1>
            <p className="text-slate-400">{copy.statusQuip}</p>
            {copy.easterEgg && (
              <p className="text-violet-400 text-sm mt-1 italic">
                {copy.easterEgg}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overnight Report */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Overnight Report
          </h2>

          <div className="space-y-4">
            {/* Completed Tasks */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {briefing.overnight.completedTickets.length} tasks completed
                </p>
                <p className="text-xs text-slate-400">
                  {briefing.overnight.completedTickets.length > 0
                    ? briefing.overnight.completedTickets
                        .slice(0, 3)
                        .map((t) => t.identifier)
                        .join(", ")
                    : "No completions overnight"}
                </p>
              </div>
            </div>

            {/* PRs Ready */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <GitPullRequest className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {briefing.overnight.prsReady.length} PRs ready for review
                </p>
                <p className="text-xs text-slate-400">
                  {briefing.overnight.prsReady.length > 0
                    ? briefing.overnight.prsReady
                        .slice(0, 3)
                        .map((t) => `#${t.prNumber}`)
                        .join(", ")
                    : "No PRs awaiting review"}
                </p>
              </div>
            </div>

            {/* Needs Attention */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {briefing.overnight.needsAttention.length} items need attention
                </p>
                <p className="text-xs text-slate-400">
                  {briefing.overnight.needsAttention.length > 0
                    ? briefing.overnight.needsAttention
                        .slice(0, 3)
                        .map((t) => `${t.identifier}: ${t.reason}`)
                        .join(", ")
                    : "All clear, sir"}
                </p>
              </div>
            </div>

            {/* Token Usage */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <Zap className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {briefing.tokenBudget.usedTokens.toLocaleString()} tokens consumed
                </p>
                <p className="text-xs text-slate-400">
                  ~${(briefing.tokenBudget.usedCents / 100).toFixed(2)} spent today
                </p>
              </div>
            </div>
          </div>

          {briefing.overnight.prsReady.length > 0 && (
            <div className="mt-6 flex gap-2">
              <button className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors">
                Review PRs
              </button>
            </div>
          )}
        </div>

        {/* Today's Focus */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Today's Focus
          </h2>

          {briefing.todaysFocus.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-400 mb-4">
                Based on priority and current workload, I recommend:
              </p>

              {briefing.todaysFocus.slice(0, 3).map((ticket, index) => (
                <div
                  key={ticket.id}
                  className={`rounded-xl border p-4 ${
                    index === 0
                      ? "border-violet-500/20 bg-violet-500/5"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-violet-400">
                      {ticket.identifier}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        ticket.priority === "critical"
                          ? "bg-red-400/10 text-red-400"
                          : ticket.priority === "high"
                            ? "bg-orange-400/10 text-orange-400"
                            : "bg-yellow-400/10 text-yellow-400"
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1">
                    {ticket.title}
                  </h3>
                  {ticket.estimation && (
                    <p className="text-xs text-slate-400">
                      {ticket.estimation} story points
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">
                No high-priority tickets at present. A rare moment of peace.
              </p>
            </div>
          )}

          <Link
            to="/board"
            className="mt-6 flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            View full board
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Token Budget */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Token Budget</h2>

          <div className="flex items-center gap-6">
            {/* Circular Progress */}
            <div className="relative h-24 w-24">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-white/10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray="251"
                  strokeDashoffset={251 - (251 * briefing.tokenBudget.percentUsed) / 100}
                  className={
                    briefing.tokenBudget.percentUsed >= 90
                      ? "text-red-500"
                      : briefing.tokenBudget.percentUsed >= 70
                        ? "text-yellow-500"
                        : "text-violet-500"
                  }
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {briefing.tokenBudget.percentUsed}%
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Today's usage</span>
                <span className="text-white">
                  {(briefing.tokenBudget.usedTokens / 1000).toFixed(0)}k /{" "}
                  {(briefing.tokenBudget.limitTokens / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Cost today</span>
                <span className="text-white">
                  ${(briefing.tokenBudget.usedCents / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Budget limit</span>
                <span className="text-white">
                  ${(briefing.tokenBudget.limitCents / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Agent Activity
          </h2>

          {briefing.recentExecutions.length > 0 ? (
            <div className="space-y-3">
              {briefing.recentExecutions.slice(0, 5).map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-white">
                    {execution.ticketId ? `Ticket ${execution.ticketId.slice(0, 8)}...` : "System task"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      execution.status === "completed"
                        ? "bg-green-400/10 text-green-400"
                        : execution.status === "failed"
                          ? "bg-red-400/10 text-red-400"
                          : execution.status === "running"
                            ? "bg-blue-400/10 text-blue-400"
                            : "bg-slate-400/10 text-slate-400"
                    }`}
                  >
                    {execution.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">
                No recent executions. The agents await your command.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex items-center gap-3 text-sm text-slate-400">
        <Clock className="h-4 w-4" />
        <span>Quick actions:</span>
        {briefing.overnight.prsReady.length > 0 && (
          <button className="rounded-lg bg-white/5 px-3 py-1 text-white hover:bg-white/10 transition-colors">
            Review PRs
          </button>
        )}
        {briefing.todaysFocus.length > 0 && (
          <button className="rounded-lg bg-white/5 px-3 py-1 text-white hover:bg-white/10 transition-colors">
            Start {briefing.todaysFocus[0].identifier}
          </button>
        )}
        <Link
          to="/board"
          className="rounded-lg bg-white/5 px-3 py-1 text-white hover:bg-white/10 transition-colors"
        >
          View Board
        </Link>
      </div>
    </div>
  );
}
```

**Step 4: Create component index**

Create `apps/admin/src/components/briefing/index.ts`:

```typescript
export { MorningBriefing } from "./MorningBriefing";
```

**Step 5: Update dashboard route**

Replace content of `apps/admin/src/routes/_authed/dashboard.tsx`:

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { MorningBriefing } from "@/components/briefing";

export const Route = createFileRoute("/_authed/dashboard" as any)({
  component: DashboardPage,
});

function DashboardPage() {
  return <MorningBriefing />;
}
```

**Step 6: Run type check**

Run: `pnpm type-check`
Expected: PASS

**Step 7: Test in browser**

Run: `pnpm dev` (in apps/admin)
Navigate to: http://localhost:3002/dashboard
Expected: Morning Briefing with real data and Jarvis personality

**Step 8: Commit**

```bash
git add apps/admin/src/components/briefing/ apps/admin/src/hooks/api/use-briefing.ts apps/admin/src/hooks/api/index.ts apps/admin/src/routes/_authed/dashboard.tsx
git commit -m "feat(admin): add Morning Briefing component with Jarvis personality

Replaces static dashboard with dynamic component that:
- Fetches real data from /api/forge/briefing
- Displays overnight report, today's focus, token budget
- Uses Jarvis personality for greetings and quips
- Includes easter eggs for special conditions

FORGE-C"
```

---

## Verification Checklist

After completing all tasks:

- [ ] `GET /api/forge/briefing` returns correct data shape
- [ ] Personality file exports greetings, quips, easter eggs
- [ ] `generateBriefingCopy()` returns appropriate copy for data
- [ ] Component fetches and displays real data
- [ ] Loading skeleton shown while fetching
- [ ] Error state shows Jarvis-style message
- [ ] Empty states handled with personality
- [ ] Token budget progress reflects actual usage
- [ ] Dashboard route renders MorningBriefing component
- [ ] All type checks pass
- [ ] Forge tickets exist in database

---

## Success Criteria

This self-bootstrap test is successful when:

1. Three FORGE tickets exist in the database
2. An agent (or manual implementation) completes each ticket
3. The Morning Briefing displays real data with Jarvis personality
4. The code passes type checks and works in browser
