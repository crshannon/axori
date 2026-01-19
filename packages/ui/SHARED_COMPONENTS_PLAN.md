# Shared Components Extraction Plan

## Analysis of Dashboard & Wealth Journey Pages

### Components to Extract:

1. **StatCard** ⭐ HIGH PRIORITY
   - Used in: Dashboard (3 instances), Wealth Journey (4 instances)
   - Pattern: Label, Value, Sub-label, optional Icon
   - Variants: With icon, without icon, compact
   - Location: `packages/ui/src/components/StatCard.tsx`

2. **ProgressBar** ⭐ HIGH PRIORITY
   - Used in: Dashboard (multiple), Wealth Journey (3 instances)
   - Variants: 
     - Simple progress bar
     - Gradient progress bar (freedom engine)
     - Progress bar with inline labels
     - Progress bar with target marker
   - Location: `packages/ui/src/components/ProgressBar.tsx`

3. **DashboardCard** ⭐ HIGH PRIORITY
   - Used in: Dashboard (10+ instances), Wealth Journey (8+ instances)
   - Pattern: `p-8 rounded-[2.5rem] shadow-sm border` with dark mode support
   - Variants: Default, hover effect, gradient background
   - Location: `packages/ui/src/components/DashboardCard.tsx`

4. **PageHeader** ⭐ MEDIUM PRIORITY
   - Used in: Dashboard, Wealth Journey
   - Pattern: Title, subtitle, right-side actions (search, notifications, avatar)
   - Location: `packages/ui/src/components/PageHeader.tsx`

5. **Avatar** ⭐ MEDIUM PRIORITY
   - Used in: Dashboard, Wealth Journey
   - Pattern: Circular avatar with initial, dark mode support
   - Location: `packages/ui/src/components/Avatar.tsx`

6. **StatusBadge** ⭐ MEDIUM PRIORITY
   - Used in: Wealth Journey ("Mission Status: On Track", "Reserves Funded")
   - Pattern: Colored badge with border and text
   - Location: `packages/ui/src/components/StatusBadge.tsx`

7. **MetricCard** (for Capital Locker style cards)
   - Used in: Wealth Journey (Deployable Cash, Reserve Health)
   - Pattern: Large number display with label and optional progress indicator
   - Location: `packages/ui/src/components/MetricCard.tsx`

## Implementation Order:

1. DashboardCard (foundation for others)
2. StatCard (most repeated pattern)
3. ProgressBar (multiple variants needed)
4. Avatar (simple, used frequently)
5. StatusBadge (simple, improves consistency)
6. MetricCard (specialized but useful)
7. PageHeader (more complex, can be done last)

