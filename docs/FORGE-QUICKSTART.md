# Forge Quick Start - Claude Code Handoff

## 🚀 Start Here

This is the condensed handoff for Claude Code. The full spec is in `FORGE-COMPLETE-SPEC.md`.

---

## What We're Building

**Forge** = Axori's AI-powered dev workflow engine (replaces Linear)

Key capabilities:
- Kanban board for tickets
- AI agents that implement tickets
- Preview deployments per feature branch
- Token budget tracking
- Self-bootstrapping (builds itself after MVF)

---

## Phase 1: MVF (Minimum Viable Forge)

Build these 5 things manually, in order:

### Step 1: Database Schema
```
Location: packages/database/src/schema/forge.ts
```
- Create `forge` schema in Supabase
- Tables: tickets, subtasks, milestones, projects, agent_executions, file_locks, token_usage, registry, decisions
- See full SQL in main spec Section 3.2

**Prompt:**
```
Create the Forge database schema using Drizzle ORM.
Use the forge schema (not public).
Reference FORGE-COMPLETE-SPEC.md Section 3.2 for complete SQL.
Generate and run migrations.
```

### Step 2: Kanban Board
```
Location: apps/admin/src/components/kanban/
```
- Drag-drop board with @dnd-kit
- Columns: Backlog, Design, Planned, In Progress, In Review, Testing, Done
- Ticket cards with status, priority, agent assignment
- Wire to database with TanStack Query

**Prompt:**
```
Build the Forge Kanban board in apps/admin.
Use @dnd-kit for drag-drop.
Create: kanban-board.tsx, kanban-column.tsx, ticket-card.tsx
Wire to forge.tickets table.
Include ticket CRUD operations.
```

### Step 3: Agent Orchestrator
```
Location: apps/admin/src/lib/agents/orchestrator.ts
```
- Protocol definitions (Opus/Sonnet/Haiku)
- Anthropic API integration
- Tool definitions (read_file, write_file, create_branch, create_pr)
- Execution loop with checkpoints

**Prompt:**
```
Build the Agent Orchestrator for Forge.
Create protocol configs for all 8 agent types.
Implement tools: read_file, write_file, create_branch, create_pr, run_command.
Use GitHub Octokit for git operations.
Log executions to forge.agent_executions.
```

### Step 4: GitHub Actions
```
Location: .github/workflows/
```
- preview.yml - Deploy feature branches
- staging.yml - Deploy staging with E2E
- production.yml - Deploy main with release

**Prompt:**
```
Create GitHub Actions workflows for Forge.
preview.yml: Deploy feature/* branches to *.forge.axori.dev
staging.yml: Deploy staging branch, run E2E tests
production.yml: Deploy main, create GitHub release
Notify Forge webhook on deploy completion.
```

### Step 5: Token Budget Tracking
```
Location: apps/admin/src/lib/budget/tracker.ts
```
- Log usage from agent executions
- Daily budget enforcement
- Reserve pool for interactive use
- Basic budget widget

**Prompt:**
```
Implement token budget tracking for Forge.
Log all API calls to forge.token_usage.
Enforce daily limits (500k tokens, $5).
Reserve 50k tokens for interactive use.
Create basic budget status widget.
```

---

## After MVF: Self-Bootstrap

Once MVF works, Forge builds itself:

1. Create ticket in Forge: "Token Budget Dashboard UI"
2. Assign Sonnet agent
3. Agent implements feature
4. You review PR
5. Merge → Forge has new capability

Pre-written tickets in main spec, Phase 2-4.

---

## Key Files Reference

```
apps/admin/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard
│   │   ├── board/page.tsx        # Kanban
│   │   └── api/                   # API routes
│   ├── components/
│   │   ├── kanban/               # Board components
│   │   ├── agents/               # Agent UI
│   │   └── budget/               # Budget widgets
│   └── lib/
│       ├── agents/orchestrator.ts
│       └── budget/tracker.ts

packages/database/src/schema/forge.ts  # Drizzle schema
.github/workflows/                      # CI/CD
```

---

## Environment Variables Needed

```bash
# Add to .env
ANTHROPIC_API_KEY=sk-xxx
GITHUB_TOKEN=ghp_xxx
FORGE_WEBHOOK_SECRET=xxx

# Already have from Axori
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CLERK_SECRET_KEY=
VERCEL_TOKEN=
```

---

## Verification Checklist

### MVF Complete When:
- [ ] `pnpm db:migrate` creates forge tables
- [ ] Kanban board loads at /board
- [ ] Can create ticket via UI
- [ ] Can drag ticket between columns
- [ ] Can assign agent to ticket
- [ ] Agent creates branch on GitHub
- [ ] Agent creates PR
- [ ] Preview URL appears on ticket
- [ ] Token usage logged

### Ready for Self-Bootstrap When:
- [ ] Created "Morning Briefing Widget" ticket in Forge
- [ ] Assigned Sonnet agent
- [ ] Agent successfully built the feature
- [ ] PR merged without manual code edits

---

## Questions to Answer First

1. Admin URL: `forge.axori.com` or `admin.axori.com`?
2. Preview domain: `*.forge.axori.dev`?
3. GitHub repo: `axori/axori-platform`?
4. Daily token budget: 500k tokens / $5 OK?

---

## Implementation Notes (Updated)

### Ticket Identifiers
- **Forge tickets** use the `FORGE-` prefix (e.g., `FORGE-001`)
- **Legacy Axori tickets** use the `AXO-` prefix (e.g., `AXO-123`)
- Both prefixes are supported for backward compatibility
- Filter by prefix using `?prefix=FORGE` or `?prefix=AXO`

### API Endpoints
- Tickets: `GET/POST /api/forge/tickets`
- Executions: `GET/POST /api/forge/executions`
- Health check: `GET /api/forge/executions/health`
- Budgets: `GET /api/forge/budget/*`

### Key Changes from Original Spec
- Agent orchestrator runs on API server, not admin app
- Simulated tools in Phase 1 (real git integration in Phase 2)
- Playwright E2E tests set up in admin app
- Ticket drawer supports create/edit/delete

---

## Full Spec

For complete details on:
- All database tables and relationships
- Agent protocol definitions
- Test persona system
- Decision ledger system
- Conflict detection
- All phase 2-4 features
- **Forge AI Persona (Jarvis-inspired personality)**
- **Design System & AI Studio prompts**

See: `FORGE-COMPLETE-SPEC.md`

---

## Forge Personality Quick Reference

Forge has a Jarvis-inspired personality. Key traits:

| Context | Forge Says |
|---------|------------|
| Morning greeting | "Good morning, sir. While you were unconscious, I was productive." |
| Task complete | "The deed is done, sir." |
| Error detected | "I regret to inform you of a complication." |
| Conflict found | "I hesitate to interrupt, but we have a situation." |
| Waiting | "Standing by, as always." |
| Friday deploy | "Deploying on a Friday evening, sir? Bold strategy." |

Full persona config and easter eggs in main spec Section 15.

---

## Design First

Before building UI, generate designs in Google AI Studio using the prompt in the main spec Section 16. Key screens:

1. Morning Briefing Dashboard
2. Kanban Board
3. Ticket Detail Sheet
4. Agent Assignment Modal
5. Token Budget Dashboard
6. Forge Chat Interface
7. Decision Capture Modal

Design style: Dark mode, violet/blue accents, Linear meets Vercel aesthetic.
