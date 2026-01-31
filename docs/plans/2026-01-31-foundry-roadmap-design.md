# Foundry Roadmap System Design

## Overview

The Foundry section is a product roadmap and release planning hub that consolidates milestone management, feature tracking, and release coordination into a single unified interface.

## Problem Statement

Axori needs a source of truth for its product roadmap that:
- Tracks semantic versioned releases (MVP, Alpha, v1.0, etc.)
- Organizes work across business functions (Engineering, Marketing, SEO, Forge, etc.)
- Shows feature evolution across releases
- Integrates with the daily briefing for focus
- Supports both technical and non-technical initiatives

## Data Model

### Hierarchy

```
FOUNDRIES (business areas)
├── Engineering Foundry
├── Marketing Foundry
├── SEO Foundry
├── Analytics Foundry
├── Forge Foundry
└── Operations Foundry

FEATURES (long-lived capabilities, belong to a Foundry)
├── Authentication (Engineering)
├── Dashboard (Engineering)
├── Content Strategy (Marketing)
├── Token Management (Forge)
└── ...

RELEASES (roadmap phases, one is "active")
├── MVP (v0.1.0) ← active
├── Alpha (v0.5.0)
├── Beta (v0.9.0)
└── v1.0.0

EPICS (Feature × Release intersection, groups tickets)
├── "Auth for MVP"
├── "Dashboard for MVP"
├── "Auth v2 for Alpha"
└── ...

TICKETS (individual work items)
└── Belong to an Epic
```

### Database Schema Changes

#### New Table: `forge_feature_categories` → `forge_foundries`

```typescript
export const forgeFoundries = forgeSchema.table("foundries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),           // "Engineering", "Marketing"
  description: text("description"),
  color: text("color"),                   // Hex color for UI
  icon: text("icon"),                     // Lucide icon name
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

#### New Table: `forge_features`

```typescript
export const forgeFeatures = forgeSchema.table("features", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull().unique(),  // "FEAT-001"
  name: text("name").notNull(),                       // "Authentication"
  description: text("description"),
  foundryId: uuid("foundry_id").references(() => forgeFoundries.id),
  color: text("color"),
  icon: text("icon"),
  status: text("status").default("active"),           // active, deprecated, planned
  owner: text("owner"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

#### Modify: `forge_milestones` (Releases)

Add fields to existing table:

```typescript
// Add to forgeMilestones
version: text("version"),                    // "0.1.0" semver
isActive: boolean("is_active").default(false), // Only ONE release is active
```

#### Modify: `forge_projects` (Epics)

Add field to link to Features:

```typescript
// Add to forgeProjects
featureId: uuid("feature_id").references(() => forgeFeatures.id),
```

### Relationships

```
Foundry (1) ─── (many) Feature
Feature (1) ─── (many) Epic (forgeProjects)
Release (1) ─── (many) Epic (via milestoneId)
Epic (1) ─── (many) Ticket
```

---

## Navigation

### Sidebar Change

Replace "Milestones" nav item with "Foundry":

```typescript
// In SideNav.tsx
{ to: "/foundry", icon: Flame, label: "Foundry", feature: "forge:tickets" }
```

Uses **amber/orange** accent color to differentiate from:
- Violet (Decisions, Board)
- Cyan (Registry)

### URL Structure

```
/foundry                    → Timeline tab (default)
/foundry?tab=timeline       → Timeline tab
/foundry?tab=releases       → Releases tab
/foundry?tab=foundries      → Foundries tab
```

---

## UI Design

### Page Structure

```tsx
<div className="min-h-screen p-8">
  {/* Header */}
  <div className="mb-8">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
        <Flame className="h-5 w-5 text-amber-400" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white">Foundry</h1>
        <p className="text-sm text-slate-400">Product roadmap and release planning</p>
      </div>
    </div>
  </div>

  {/* Tab Navigation */}
  <div className="mb-6 flex gap-1 rounded-xl bg-white/5 p-1 w-fit">
    <TabButton active={tab === "timeline"}>Timeline</TabButton>
    <TabButton active={tab === "releases"}>Releases</TabButton>
    <TabButton active={tab === "foundries"}>Foundries</TabButton>
  </div>

  {/* Tab Content */}
  {activeTabContent}
</div>
```

### Tab 1: Timeline

Horizontal roadmap showing releases as columns with features/epics mapped across.

**Layout:**
```
FEATURES        │  MVP v0.1 ●      │  Alpha v0.5     │  v1.0
                │  ▓▓▓▓▓▓▓░░ 72%   │  ░░░░░░░░░ 0%   │  ░░░░░░░░░
────────────────┼──────────────────┼─────────────────┼────────────
🔧 Engineering  │                  │                 │
  Auth          │  [Epic ████░ 80%]│  [Epic ░░░░]    │
  Dashboard     │  [Epic ██░░ 40%] │                 │  [Epic ░░░░]
                │                  │                 │
📢 Marketing    │                  │                 │
  Landing Page  │  [Epic ███░ 60%] │                 │
```

**Key Features:**
- Active release has pulsing indicator and highlighted column
- Epic cards are draggable between releases (dnd-kit)
- Click epic opens drawer with tickets
- Empty cells show "+" to create epic
- Progress bars show ticket completion

### Tab 2: Releases

Card grid of all releases with progress and epic lists.

**Release Card:**
- Header: Name + version badge + active indicator
- Progress bar with percentage
- Target date with days remaining
- Epic pills showing feature name + progress
- Footer: Epic/ticket counts + Edit/Set Active button

**Active release styling:**
- Amber border highlight
- Subtle amber background tint
- Pulsing dot indicator

### Tab 3: Foundries

Nested card layout for managing foundries and features.

**Foundry Card:**
- Header: Icon + name + description + menu
- Feature pills with epic counts
- "+ Add Feature" button (dashed border)

**Feature Pill:**
- Name + epic count
- Hover reveals edit action
- Click opens feature detail/edit

---

## Dashboard Integration

### Active Release Widget

Added to Morning Briefing dashboard:

```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 ACTIVE RELEASE                                              │
├─────────────────────────────────────────────────────────────────┤
│  MVP v0.1.0                                                     │
│  ▓▓▓▓▓▓▓▓░░░░░░ 72%                                            │
│                                                                 │
│  Target: Mar 15 · 12 days remaining                             │
│                                                                 │
│  ┌─────────────┬─────────────┬─────────────┐                   │
│  │ Engineering │ Marketing   │ Forge       │                   │
│  │ ████░ 80%   │ ██░░ 40%    │ ███░ 65%    │                   │
│  └─────────────┴─────────────┴─────────────┘                   │
│                                                                 │
│  8 epics · 24 tickets · 5 blocked                    [View →]  │
└─────────────────────────────────────────────────────────────────┘
```

**Widget shows:**
- Active release name and version
- Overall progress bar
- Target date with urgency coloring (amber when < 7 days)
- Foundry breakdown with mini progress bars
- Quick stats (epics, tickets, blocked count)
- Link to Foundry section

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `packages/db/src/schema/foundry.ts` | New schema for foundries and features |
| `apps/api/src/routes/forge/foundries.ts` | CRUD API for foundries |
| `apps/api/src/routes/forge/features.ts` | CRUD API for features |
| `apps/admin/src/routes/_authed/foundry.tsx` | Main Foundry page |
| `apps/admin/src/components/foundry/timeline-view.tsx` | Timeline tab |
| `apps/admin/src/components/foundry/releases-view.tsx` | Releases tab |
| `apps/admin/src/components/foundry/foundries-view.tsx` | Foundries tab |
| `apps/admin/src/components/foundry/release-card.tsx` | Release card component |
| `apps/admin/src/components/foundry/foundry-card.tsx` | Foundry card component |
| `apps/admin/src/components/foundry/epic-card.tsx` | Epic card for timeline |
| `apps/admin/src/components/foundry/feature-pill.tsx` | Feature pill component |
| `apps/admin/src/components/foundry/foundry-modal.tsx` | Create/edit foundry |
| `apps/admin/src/components/foundry/feature-modal.tsx` | Create/edit feature |
| `apps/admin/src/components/foundry/release-modal.tsx` | Create/edit release |
| `apps/admin/src/components/foundry/epic-drawer.tsx` | Epic detail with tickets |
| `apps/admin/src/components/dashboard/active-release-widget.tsx` | Briefing widget |
| `apps/admin/src/hooks/api/use-foundries.ts` | React Query hooks |
| `apps/admin/src/hooks/api/use-features.ts` | React Query hooks |

### Modified Files

| File | Change |
|------|--------|
| `packages/db/src/schema/forge.ts` | Add version/isActive to milestones, featureId to projects |
| `packages/db/src/schema/index.ts` | Export new foundry schema |
| `apps/admin/src/components/side-nav/SideNav.tsx` | Replace Milestones with Foundry |
| `apps/admin/src/routes/_authed/dashboard.tsx` | Add ActiveReleaseWidget |
| `apps/api/src/routes/forge/milestones.ts` | Support isActive field |
| `apps/api/src/routes/forge/projects.ts` | Support featureId field |

### Migration

```
packages/db/drizzle/XXXX_add_foundry_system.sql
```

---

## API Endpoints

### Foundries

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/forge/foundries` | List all foundries with features |
| POST | `/forge/foundries` | Create foundry |
| PUT | `/forge/foundries/:id` | Update foundry |
| DELETE | `/forge/foundries/:id` | Delete foundry |

### Features

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/forge/features` | List features (filter by foundryId) |
| POST | `/forge/features` | Create feature |
| PUT | `/forge/features/:id` | Update feature |
| DELETE | `/forge/features/:id` | Delete feature |

### Releases (existing milestones, enhanced)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/forge/milestones/active` | Get active release with stats |
| PUT | `/forge/milestones/:id/activate` | Set release as active |

---

## Color System

| Element | Color | Usage |
|---------|-------|-------|
| Foundry accent | `amber-500` | Borders, icons, progress bars |
| Active indicator | `amber-500` | Pulsing dot, highlighted borders |
| Background tint | `amber-500/5` | Active release cards |
| Icon background | `amber-500/20` | Header icon, widget icon |
| Gradient | `amber-500 → orange-500` | Progress bars |

---

## Success Criteria

1. Single "Foundry" nav item replaces "Milestones"
2. Three functional tabs: Timeline, Releases, Foundries
3. Drag-and-drop epics between releases on Timeline
4. One release marked as "active" at a time
5. Active Release widget on Dashboard briefing
6. Full CRUD for Foundries, Features, Releases
7. Epics link to existing ticket system
8. Progress calculated from ticket completion
