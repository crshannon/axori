# Morning Briefing Dashboard Design

**Date:** 2025-01-30
**Status:** Approved
**Goal:** First Forge self-bootstrap test - have the agent build a real feature autonomously.

---

## Overview

Replace the static dashboard with a dynamic Morning Briefing component that pulls real data from a new API endpoint. Include full Jarvis-style personality with context-aware quips, easter eggs, and edge case handling.

---

## Ticket Breakdown

Split into 3 sequential tickets to stay within token limits (30-50k per execution):

| Ticket | Deliverable | Est. Tokens | Dependencies |
|--------|-------------|-------------|--------------|
| FORGE-A | `GET /api/forge/briefing` endpoint | ~15-20k | None |
| FORGE-B | `personality.ts` with greetings/quips | ~10-15k | None (parallel with A) |
| FORGE-C | `MorningBriefing.tsx` component | ~20-25k | A, B |

---

## FORGE-A: Briefing API Endpoint

**File:** `apps/api/src/routes/forge/briefing.ts`

**Endpoint:** `GET /api/forge/briefing`

**Response shape:**
```typescript
{
  generatedAt: string,
  greeting: {
    timeOfDay: "morning" | "afternoon" | "evening",
    hour: number
  },
  overnight: {
    completedTickets: Array<{ id, title, completedAt }>,
    prsReady: Array<{ id, title, prUrl, prNumber }>,
    needsAttention: Array<{ id, title, reason }>
  },
  todaysFocus: Array<{ id, title, priority, points, blockedCount }>,
  tokenBudget: {
    usedTokens: number,
    limitTokens: number,
    usedCents: number,
    limitCents: number,
    percentUsed: number
  },
  recentExecutions: Array<{ id, ticketId, status, completedAt }>
}
```

**Implementation notes:**
- Query tickets table for completed (last 24h), in-progress, and blocked
- Query executions table for recent activity
- Query token_budgets table for today's usage
- No personality logic - just data aggregation

---

## FORGE-B: Jarvis Personality Data

**File:** `apps/admin/src/lib/briefing/personality.ts`

**Structure:**
```typescript
// Time-based greetings (randomly selected)
export const greetings = {
  morning: [
    "Good morning, sir.",
    "Rise and shine, sir.",
    "Good morning. I trust you slept well.",
    "Ah, you're awake. Excellent timing.",
  ],
  afternoon: [
    "Good afternoon, sir.",
    "Welcome back, sir.",
    "Afternoon, sir. I hope lunch was productive.",
  ],
  evening: [
    "Good evening, sir.",
    "Burning the midnight oil, sir?",
    "Working late, I see. Shall I order coffee?",
  ]
}

// Status-aware quips (selected based on data)
export const quips = {
  allClear: [
    "No fires to report.",
    "Smooth sailing, as they say.",
    "All systems nominal.",
  ],
  prsWaiting: [
    "{count} PRs await your discerning eye.",
    "{count} pull requests require your attention.",
    "I've prepared {count} PRs for your review.",
  ],
  highActivity: [
    "I've been rather busy in your absence.",
    "A productive night, if I may say so.",
    "While you were unconscious, I was productive.",
  ],
  noActivity: [
    "A quiet night. Almost suspiciously so.",
    "Nothing to report. I found it unsettling.",
    "An uneventful evening. I kept myself entertained.",
  ],
  budgetLow: [
    "We're running a bit lean on tokens, sir.",
    "The token reserves are looking thin.",
    "I suggest we economize on the remaining tokens.",
  ],
  budgetExhausted: [
    "I regret to inform you the coffers are empty.",
    "We've exhausted today's token allocation.",
    "The budget is spent. I'll resume tomorrow.",
  ],
  needsAttention: [
    "{count} items require your attention.",
    "There are {count} matters that need addressing.",
    "I hesitate to interrupt, but {count} issues have arisen.",
  ]
}

// Easter eggs (rare, triggered by specific conditions)
export const easterEggs = {
  fridayDeploy: "Deploying on a Friday evening, sir? Bold strategy.",
  firstTicketDone: "Your first ticket, sir. They grow up so fast.",
  perfectWeek: "A flawless week. I'm almost impressed.",
  monday: "Ah, Monday. The universe's way of testing resolve.",
  emptyBoard: "No tickets await. A rare moment of peace. Suspicious, but peaceful.",
  hundredPercent: "Budget fully utilized. I regret nothing.",
  midnight: "Working at this hour? I admire your dedication. Or question your judgment.",
  newYear: "Happy New Year, sir. Shall we make this one count?",
}

// Helper function to generate briefing copy
export function generateBriefingCopy(data: BriefingData): BriefingCopy {
  // Select greeting based on time
  // Select quips based on data state
  // Check for easter egg conditions
  // Return composed copy
}
```

---

## FORGE-C: Morning Briefing Component

**File:** `apps/admin/src/components/briefing/MorningBriefing.tsx`

**Structure:**
- Uses `useBriefing()` hook to fetch from `/api/forge/briefing`
- Calls `generateBriefingCopy()` to get personalized text
- Renders in a grid layout similar to current dashboard

**Sections:**
1. **Header** - Jarvis greeting + status quip
2. **Overnight Report** - Completed tickets, PRs ready, needs attention
3. **Today's Focus** - Recommended tickets to work on
4. **Token Budget** - Circular progress + stats

**States:**
- **Loading:** Skeleton cards (not a spinner)
- **Error:** Jarvis-style ("I seem to have misplaced the data, sir.")
- **Empty:** Per-section personality ("No tickets await. A rare moment of peace.")

**Wiring:**
- Dashboard route imports `<MorningBriefing />`
- Replaces current static content in `dashboard.tsx`

---

## Key Decisions

1. **Dedicated API endpoint** - Single call returns all briefing data (better UX, easier caching)
2. **Full Jarvis personality** - 10+ greeting variants, status-aware quips, easter eggs
3. **Single-file component** - Simpler for agent to build, easier to review
4. **Real data** - Pulls from tickets, executions, and budget tables

---

## Success Criteria

- [ ] `GET /api/forge/briefing` returns correct data shape
- [ ] Personality file exports greetings, quips, easter eggs
- [ ] Component fetches and displays real data
- [ ] Jarvis personality appears in UI
- [ ] Loading and error states handled gracefully
- [ ] Dashboard route wired to new component

---

## Out of Scope (Future)

- Code health score (needs new data source)
- Milestone progress tracking
- Notification system integration
- Mobile-responsive refinements
