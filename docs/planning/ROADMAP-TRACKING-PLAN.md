# Forge Roadmap Tracking System - Planning Document

**Created:** January 31, 2026
**Status:** Planning
**Priority:** Critical - Foundation for MVP release tracking

---

## Executive Summary

This document outlines the plan to enhance Forge into a complete roadmap tracking system for Axori. The goal is clean, clear visibility into MVP progress with proper hierarchy from high-level goals down to individual tasks.

---

## 1. Current State Analysis

### What Exists Today

| Entity | Table | Purpose | Status |
|--------|-------|---------|--------|
| **Milestones** | `forge.milestones` | Feature set groupings | ✅ Active, basic fields |
| **Projects** | `forge.projects` | Grouping under milestones | ⚠️ Exists but unused |
| **Tickets** | `forge.tickets` | Individual work items | ✅ Full-featured |
| **Subtasks** | `forge.subtasks` | Checklist items on tickets | ✅ Active |

### Current Hierarchy

```
Milestone
└── Ticket (has parentId for self-reference)
    └── Subtask (checklist items)
```

### Key Gaps

1. **No MVP scope designation** - Can't mark what's in/out of MVP
2. **No release concept** - Milestones are flat, no "Release 1.0" container
3. **No progress tracking over time** - Can't generate burndown charts
4. **No dependencies** - Can't model "A blocks B"
5. **Missing UI** - `/milestones` route defined but page doesn't exist
6. **Projects unused** - Could be repurposed or removed

---

## 2. Hierarchy Design Options

### Option A: Keep It Simple (Recommended)

```
Release (new field on Milestone: type = 'release')
└── Milestone (type = 'feature_set')
    └── Ticket
        ├── Ticket (via parentId - breakdown)
        └── Subtask (checklist)
```

**Pros:**
- Minimal schema changes
- Milestones already exist and work
- parentId on tickets provides Epic-like breakdown
- Simple to understand

**Cons:**
- Mixing release and feature concepts in one table

### Option B: Separate Release Entity

```
Release (new table)
└── Milestone
    └── Epic (ticket with type = 'epic')
        └── Story (ticket with type = 'story')
            └── Subtask
```

**Pros:**
- Clear separation of concerns
- More traditional agile structure

**Cons:**
- New table and relationships
- More complexity
- Ticket type enum already has 7 values

### Option C: Repurpose Projects as Releases

```
Project (renamed to Release)
└── Milestone
    └── Ticket
        └── Subtask
```

**Pros:**
- Uses existing unused table
- Clean hierarchy

**Cons:**
- Semantic confusion (project vs release)
- Projects table was designed for different purpose

### Recommendation: Option A

**Why:** Minimal changes, leverages existing patterns, and we can achieve everything needed by:
1. Adding `milestoneType` enum to distinguish releases from feature sets
2. Adding `parentMilestoneId` for nesting milestones under releases
3. Adding `inMvpScope` boolean on tickets for explicit MVP marking
4. Using ticket `parentId` for Epic → Story breakdown when needed

---

## 3. The Epic Question

### Do We Need Epics?

**Current approach:** Tickets can have `parentId` referencing another ticket, creating a natural parent-child hierarchy.

**Analysis:**

| Approach | How It Works | Pros | Cons |
|----------|--------------|------|------|
| **Ticket as Epic** | Create ticket type 'epic', child tickets link via parentId | Works today, no schema change | Epics appear on board (noise) |
| **Milestone as Epic** | Use milestones for epic-sized work | Natural grouping | Milestones aren't on the board |
| **New Epic Table** | Separate entity between Milestone and Ticket | Clear separation | More tables, more complexity |

### Recommendation: Use Milestones as Epics

**Why:**
- An Epic is essentially a "feature set" - which is what milestones are
- Keeps the board clean (only actionable tickets)
- Milestones already have progress tracking, target dates, etc.
- Example: "Property Scoring Engine" is both a milestone AND an epic-level concept

**When to use parent tickets:**
- When a single ticket is too big and needs breakdown
- Example: "Create score calculation service" → breaks into "Financial score", "Risk score", etc.

---

## 4. Proposed Schema Changes

### 4.1 Milestone Enhancements

```typescript
// Add to forgeMilestoneTypeEnum (NEW)
export const forgeMilestoneTypeEnum = forgeSchema.enum("milestone_type", [
  "release",      // MVP 1.0, Beta 2.0 - container for milestones
  "feature_set",  // Property Scoring, Market Intelligence - epic-level
  "sprint",       // Week 1, Sprint 14 - time-boxed iteration
]);

// Enhanced milestones table
export const forgeMilestones = forgeSchema.table("milestones", {
  // ... existing fields ...

  // NEW: Hierarchy & Type
  milestoneType: forgeMilestoneTypeEnum("milestone_type").default("feature_set"),
  parentMilestoneId: uuid("parent_milestone_id").references(() => forgeMilestones.id),

  // NEW: Capacity Planning
  targetPoints: integer("target_points"),  // Planned story points

  // COMPUTED (stored for performance, updated on ticket changes):
  // - totalTickets, completedTickets, blockedTickets
  // - totalPoints, completedPoints
  // - These can be stored or computed on-the-fly
});
```

### 4.2 Ticket Enhancements

```typescript
// Enhanced tickets table
export const forgeTickets = forgeSchema.table("tickets", {
  // ... existing fields ...

  // NEW: MVP Scope
  inMvpScope: boolean("in_mvp_scope").default(false),

  // NEW: Dependencies
  blockedBy: uuid("blocked_by").array(),  // Array of ticket IDs that block this

  // Optional: explicit epic flag for filtering
  isEpic: boolean("is_epic").default(false),
});
```

### 4.3 Progress History (NEW Table)

```typescript
// Track milestone progress over time for burndown charts
export const forgeMilestoneSnapshots = forgeSchema.table("milestone_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  milestoneId: uuid("milestone_id").notNull()
    .references(() => forgeMilestones.id, { onDelete: "cascade" }),
  snapshotDate: date("snapshot_date").notNull(),

  // Ticket counts
  totalTickets: integer("total_tickets").notNull(),
  completedTickets: integer("completed_tickets").notNull(),
  inProgressTickets: integer("in_progress_tickets").notNull(),
  blockedTickets: integer("blocked_tickets").notNull(),

  // Point counts
  totalPoints: integer("total_points").notNull(),
  completedPoints: integer("completed_points").notNull(),

  // Scope changes
  scopeChange: integer("scope_change").default(0), // Positive = added, negative = removed

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## 5. MVP Tracking Strategy

### What is "MVP"?

The Minimum Viable Product is defined by:
1. A **Release milestone** (type = 'release') named "MVP 1.0" or similar
2. **Feature milestones** nested under it
3. **Tickets** with `inMvpScope = true` explicitly marked

### MVP Tracking Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MVP 1.0 (Release)                             │
│  Target: March 15, 2026                                                 │
│  Progress: 45% │████████░░░░░░░░░░│ 45/100 tickets                     │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐            │
│ │ Property Scores │ │ Market Intel    │ │ Documents       │            │
│ │ 20% ████░░░░░░░░ │ │ 60% ████████░░░ │ │ 90% ██████████░ │            │
│ │ 5/24 tickets    │ │ 9/15 tickets    │ │ 18/20 tickets   │            │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
```

### MVP Determination Rules

1. **Explicit marking:** Ticket has `inMvpScope = true`
2. **Inheritance:** Child tickets inherit MVP scope from parent
3. **Milestone inference:** Tickets in MVP-child milestones are MVP-scoped

### Progress Calculation

```typescript
// Milestone progress calculation
function calculateMilestoneProgress(milestoneId: string) {
  const tickets = await db.select()
    .from(forgeTickets)
    .where(eq(forgeTickets.milestoneId, milestoneId));

  const total = tickets.length;
  const completed = tickets.filter(t => t.status === 'done').length;
  const points = tickets.reduce((sum, t) => sum + (t.estimate || 0), 0);
  const completedPoints = tickets
    .filter(t => t.status === 'done')
    .reduce((sum, t) => sum + (t.estimate || 0), 0);

  return {
    totalTickets: total,
    completedTickets: completed,
    totalPoints: points,
    completedPoints: completedPoints,
    progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    pointsPercent: points > 0 ? Math.round((completedPoints / points) * 100) : 0,
  };
}
```

---

## 6. UI Requirements

### 6.1 Milestones Page (PRIORITY: HIGH)

**Route:** `/milestones`
**Purpose:** See all milestones with progress, manage hierarchy

**Features:**
- List view with progress bars
- Filter by type (release/feature_set/sprint)
- Filter by status (active/completed/archived)
- Expand to see child milestones
- Click to view tickets in milestone
- Create/edit milestone drawer

**Wireframe:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Milestones                                           [+ New Milestone]  │
├─────────────────────────────────────────────────────────────────────────┤
│ Filter: [All Types ▼] [Active ▼]                    Search: [________] │
├─────────────────────────────────────────────────────────────────────────┤
│ ▼ MVP 1.0                                   🎯 RELEASE                  │
│   Target: Mar 15 • 45/100 tickets • 180/400 pts                        │
│   ████████████░░░░░░░░░░░░ 45%                                         │
│   ├── Property Scoring Engine          20%  ████░░░░░░░░░░░░░         │
│   ├── Market Intelligence              60%  ████████████░░░░░         │
│   └── Documents & Tax                  90%  ██████████████████░       │
│                                                                         │
│ ▶ Post-MVP Features                              🔧 FEATURE_SET        │
│   Not scheduled • 35 tickets                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Roadmap Timeline (PRIORITY: MEDIUM)

**Route:** `/roadmap`
**Purpose:** Visual timeline of milestones with dates

**Features:**
- Horizontal timeline (Gantt-style)
- Milestones as bars
- Today marker
- Color coding by health
- Drag to adjust dates
- Click to view details

**Wireframe:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Roadmap Timeline                                      [Jan 2026 - Apr] │
├─────────────────────────────────────────────────────────────────────────┤
│         Jan          Feb          Mar          Apr                      │
│         |            |            |            |                        │
│ MVP     ════════════════════════════▓                                   │
│ Scoring     ══════════════█                                             │
│ Markets          ═══════════════█                                       │
│ AI Features            ══════════════════█                              │
│                                   ↑                                     │
│                                 Today                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.3 MVP Dashboard Widget (PRIORITY: HIGH)

**Location:** Morning Briefing / Dashboard
**Purpose:** Quick MVP status at a glance

**Features:**
- Overall progress (tickets and points)
- Blockers count
- Days until target
- Quick links

**Wireframe:**
```
┌─────────────────────────────────────────────────────┐
│ 📍 MVP Status                                       │
├─────────────────────────────────────────────────────┤
│ Progress: 45% │████████░░░░░░░░░│                   │
│                                                     │
│ 📊 45/100 tickets  •  180/400 points               │
│ 🚫 3 blocked      •  📅 43 days until target       │
│                                                     │
│ [View MVP Tickets] [View Blockers]                 │
└─────────────────────────────────────────────────────┘
```

### 6.4 Burndown Chart (PRIORITY: MEDIUM)

**Location:** Milestone detail view
**Purpose:** Visualize progress over time

**Features:**
- Line chart: points remaining vs time
- Ideal burndown line
- Scope change indicators
- Toggle: points vs tickets

### 6.5 Board Enhancements (PRIORITY: HIGH)

**MVP Filter:**
- Toggle button: "MVP Only"
- When active, filters to `inMvpScope = true`

**Milestone Filter:**
- Dropdown to filter by milestone

**Dependency Indicators:**
- Blocked icon on ticket cards
- Tooltip showing blockers

---

## 7. API Enhancements

### 7.1 Milestone Endpoints

```typescript
// Enhanced list with progress
GET /forge/milestones?includeProgress=true&type=release

// Milestone with full details
GET /forge/milestones/:id
Response: {
  ...milestone,
  progress: { totalTickets, completedTickets, totalPoints, completedPoints },
  childMilestones: [...],
  health: 'on_track' | 'at_risk' | 'late'
}

// Burndown data
GET /forge/milestones/:id/burndown
Response: {
  snapshots: [
    { date: '2026-01-15', totalPoints: 400, completedPoints: 50 },
    { date: '2026-01-16', totalPoints: 400, completedPoints: 65 },
    ...
  ]
}

// Update milestone with hierarchy
PUT /forge/milestones/:id
Body: { parentMilestoneId: 'uuid', milestoneType: 'feature_set', ... }
```

### 7.2 MVP Endpoints

```typescript
// MVP summary
GET /forge/mvp/summary
Response: {
  totalTickets: 100,
  completedTickets: 45,
  inProgressTickets: 12,
  blockedTickets: 3,
  totalPoints: 400,
  completedPoints: 180,
  progressPercent: 45,
  pointsPercent: 45,
  daysUntilTarget: 43,
  targetDate: '2026-03-15',
  milestones: [...],
  blockers: [...]
}
```

### 7.3 Ticket Enhancements

```typescript
// Add MVP filter
GET /forge/tickets?inMvpScope=true

// Set MVP scope
PATCH /forge/tickets/:id
Body: { inMvpScope: true }

// Add dependencies
PATCH /forge/tickets/:id
Body: { blockedBy: ['uuid1', 'uuid2'] }
```

---

## 8. Implementation Phases

### Phase 0: Planning Cleanup (This Document)

- [x] Analyze current schema
- [x] Define hierarchy approach
- [x] Design MVP tracking strategy
- [x] Document UI requirements
- [ ] Review with user
- [ ] Update existing seed data to match new structure

### Phase 1: Schema & Core API (Week 1)

| Ticket | Type | Est | Priority |
|--------|------|-----|----------|
| Add milestoneType enum and parentMilestoneId | feature | 2 | critical |
| Add inMvpScope and blockedBy to tickets | feature | 2 | critical |
| Create milestone_snapshots table | feature | 1 | high |
| Add milestone progress calculation service | feature | 3 | critical |
| Add MVP summary endpoint | feature | 2 | high |

**Milestone subtotal: 10 points**

### Phase 2: Milestones Page (Week 1-2)

| Ticket | Type | Est | Priority |
|--------|------|-----|----------|
| Create milestones page with list view | feature | 3 | critical |
| Add milestone progress bars | feature | 2 | high |
| Create milestone create/edit drawer | feature | 2 | high |
| Add milestone hierarchy display | feature | 2 | high |
| Add milestone filtering and search | feature | 1 | medium |

**Milestone subtotal: 10 points**

### Phase 3: MVP Tracking UI (Week 2)

| Ticket | Type | Est | Priority |
|--------|------|-----|----------|
| Add MVP dashboard widget to briefing | feature | 2 | critical |
| Add MVP toggle filter to board | feature | 1 | high |
| Add milestone filter to board | feature | 1 | high |
| Add blocked indicator to ticket cards | feature | 1 | medium |
| Add dependency management UI | feature | 2 | medium |

**Milestone subtotal: 7 points**

### Phase 4: Roadmap Visualization (Week 2-3)

| Ticket | Type | Est | Priority |
|--------|------|-----|----------|
| Create roadmap timeline page | feature | 5 | high |
| Add burndown chart component | feature | 3 | medium |
| Implement progress snapshot scheduler | feature | 2 | medium |
| Add health indicators | feature | 1 | low |

**Milestone subtotal: 11 points**

### Phase 5: Polish & Data Migration (Week 3)

| Ticket | Type | Est | Priority |
|--------|------|-----|----------|
| Migrate existing milestones to new structure | chore | 2 | high |
| Update seed script for new schema | chore | 1 | high |
| Add API documentation | docs | 1 | medium |
| End-to-end testing | chore | 2 | medium |

**Milestone subtotal: 6 points**

**Total: 44 points**

---

## 9. Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hierarchy approach | Option A (enhanced milestones) | Minimal changes, leverages existing patterns |
| Epic concept | Use milestones as epics | Keeps board clean, milestones already have progress |
| MVP tracking | Explicit `inMvpScope` flag | Flexible, allows mixed milestones |
| Progress history | New snapshots table | Enables burndown charts |
| Projects table | Keep but don't use | May repurpose later for "areas" |

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep on UI | Delays MVP | Start with list view, add timeline later |
| Complex hierarchy | Confusion | Keep to 2 levels max (release → feature) |
| Snapshot data volume | Performance | Keep 90 days, aggregate older |
| Existing data migration | Data loss | Script with dry-run mode |

---

## 11. Success Criteria

1. **Can answer:** "What % of MVP is complete?" in < 5 seconds
2. **Can answer:** "What's blocking MVP progress?" with one click
3. **Can visualize:** Progress trend over past 30 days
4. **Can filter:** Board to show only MVP-scoped tickets
5. **Can organize:** Features into release milestones

---

## 12. Open Questions for Review

1. **Sprint support:** Do we need time-boxed sprints or just target dates?
2. **Velocity tracking:** Should we track velocity (points per week)?
3. **Multiple releases:** Support concurrent releases (MVP + Beta)?
4. **Team assignment:** Add team/owner to milestones?
5. **Notifications:** Alerts for approaching target dates?

---

## Next Steps

1. **Review this document** - Confirm approach and priorities
2. **Create Forge milestone** - "Roadmap Tracking System" as first milestone
3. **Create tickets** - Based on Phase 1-5 breakdown
4. **Start Phase 1** - Schema changes first

---

*Document Status: Ready for Review*
