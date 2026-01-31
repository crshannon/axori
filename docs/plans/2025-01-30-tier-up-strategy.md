# Forge Tier-Up Strategy

**Date:** 2025-01-30
**Status:** Approved
**Goal:** Reach Anthropic Tier 2 ($40 spend) through productive small tasks

---

## Context

- Current: Tier 1 (30k TPM input limit)
- Target: Tier 2 (80k TPM) at $40 cumulative spend
- Constraint: Must produce useful output, not just burn tokens

## Strategy Overview

Accumulate spend while producing value across three categories:
- **Documentation** - JSDoc, code comments, README sections
- **Tests** - Unit tests, edge case coverage
- **Code cleanup** - Type fixes, dead code removal, small refactors

### Model Allocation

| Model | Use Case | Est. Cost/Task |
|-------|----------|----------------|
| Haiku | Docs, comments, type fixes, simple tests | $0.25-0.50 |
| Sonnet | Complex logic tests, refactors requiring reasoning | $1-2 |

**Default to Haiku** - Handles 80% of small tasks, burns through spend faster.

### Estimated Path to Tier 2

- ~80-160 Haiku tasks to reach $40
- At 5-10 tasks/day → **Tier 2 in 2-3 weeks**

---

## Automated Task Scanner

**Location:** `scripts/forge-task-scanner.ts`

### What It Scans

| Category | Detection Method | Example Task |
|----------|------------------|--------------|
| Missing docs | Functions >5 lines without JSDoc | "Add JSDoc to `calculateScore()` in utils.ts" |
| Test gaps | Exported functions with no `*.test.ts` | "Add unit test for `validateEmail()` in shared" |
| Type issues | `any` types, missing return types | "Replace `any` with proper type in api/routes/tickets.ts:45" |

### Commands

```bash
pnpm forge:scan                    # Full scan, output report
pnpm forge:scan --create-tickets   # Scan + create Forge tickets
pnpm forge:scan --limit 10         # Create max 10 tickets
```

### Design Principles

- **One task = one function/section** - Never "document all functions in file"
- **Auto-tags** - All tickets get `tier-up` label
- **Protocol suggestion** - Scanner recommends `haiku_quick_edit` or `haiku_docs`

---

## On-Demand Workflow

After each feature built with Claude Code:

1. Identify 2-3 small follow-up tasks from code touched
2. Create as Forge tickets with `tier-up` label
3. Assign Haiku agent when API headroom available

### Task Templates

| Type | Title Pattern | Est. Tokens |
|------|---------------|-------------|
| Docs | "Add JSDoc to [function] in [file]" | 3-5k |
| Test | "Add unit test for [function]" | 5-8k |
| Type fix | "Fix `any` type in [file:line]" | 2-4k |
| Cleanup | "Remove unused import in [file]" | 1-2k |

### Priority Order (for Haiku)

1. Type fixes - Smallest, fastest
2. Docs - Straightforward
3. Simple tests - Predictable
4. Cleanup - Low risk

---

## Tracking Progress

- Filter Kanban by `tier-up` label to see accumulation tasks
- Monitor Anthropic console for cumulative spend
- Tier upgrade happens automatically when threshold reached

---

## Success Criteria

- [ ] Scanner tool created and working
- [ ] 10+ tier-up tasks completed via Forge agents
- [ ] Reached Tier 2 ($40 spend)
- [ ] No wasted spend - all tasks produce useful output
