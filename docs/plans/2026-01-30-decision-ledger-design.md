# Decision Ledger System - Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

**Goal:** Capture institutional decisions and inject them into agent prompts so agents follow established conventions.

**Architecture:** Decisions stored in database, matched to tickets via Haiku call, injected into agent system prompts before execution.

**Tech Stack:** Drizzle ORM, Hono API, TanStack Query, Claude Haiku for matching

---

## Overview

The Decision Ledger is a system for capturing and propagating coding decisions across Forge agents. When you make a decision like "always use Zod for API validation," it gets stored and automatically injected into relevant agent executions.

### V1 Scope

**Building:**
- Decision capture and storage
- AI-powered decision matching (Haiku picks relevant decisions per ticket)
- Injection into agent prompts
- Simple list UI for managing decisions

**Not Building (v1):**
- Compliance tracking / metrics
- Violation scanning of in-flight tickets
- Decision versioning (supersedes)
- "Create lint rule" automation

---

## Data Model

Using the existing schema from FORGE-COMPLETE-SPEC.md with focus on v1 fields.

### forge.decisions table

```sql
CREATE TABLE forge.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL UNIQUE,        -- DEC-001, auto-generated
  decision TEXT NOT NULL,                  -- The rule itself
  context TEXT,                            -- Why this was decided
  category TEXT NOT NULL,                  -- code_standards, architecture, etc.
  scope TEXT[],                            -- Tags for matching: api, validation, etc.
  active BOOLEAN DEFAULT TRUE,             -- Enable/disable without deleting
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate identifier
CREATE SEQUENCE forge.decision_seq START 1;

CREATE OR REPLACE FUNCTION forge.generate_decision_identifier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.identifier IS NULL THEN
    NEW.identifier := 'DEC-' || LPAD(nextval('forge.decision_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decision_identifier_trigger
BEFORE INSERT ON forge.decisions
FOR EACH ROW
EXECUTE FUNCTION forge.generate_decision_identifier();
```

### Categories

- `code_standards` - Coding conventions
- `architecture` - System design decisions
- `testing` - Test strategy decisions
- `design` - UI/UX patterns
- `process` - Workflow decisions
- `tooling` - Tool and library choices
- `product` - Feature behavior decisions
- `performance` - Optimization decisions

---

## Decision Injection Flow

### When Agent Execution Starts

1. **Gather context** - Collect ticket title, description, type, labels
2. **Call Haiku** - Ask it to pick relevant decisions from the active set
3. **Format decisions** - Structure selected decisions for the agent prompt
4. **Inject into prompt** - Add "Decisions to Follow" section to buildUserMessage()

### Haiku Matching Call

**Input:**
- Ticket context (title, description, type, labels)
- All active decisions (id, decision text, scope tags)

**Output:**
- Array of decision IDs that are relevant to this ticket

**Cost:** ~500-1000 tokens per call, fractions of a cent with Haiku.

**Token budget:** Cap at ~500 tokens for decisions section. If too many match, take top 5-7.

**Fallback:** If Haiku matching fails, skip decisions gracefully (don't block execution).

### Injected Format

```markdown
## Decisions to Follow

These are established conventions for this codebase:

- DEC-003: Always use Zod for API request/response validation
- DEC-007: Use withErrorHandling wrapper on all API routes
- DEC-012: Prefer TanStack Query for data fetching over raw fetch

Follow these unless you have a specific reason to deviate.
```

---

## API Endpoints

### CRUD for Decisions

```
GET    /api/forge/decisions           # List all decisions (with filters)
GET    /api/forge/decisions/:id       # Get single decision
POST   /api/forge/decisions           # Create decision
PUT    /api/forge/decisions/:id       # Update decision
DELETE /api/forge/decisions/:id       # Delete decision
PATCH  /api/forge/decisions/:id/toggle # Toggle active status
```

### Request/Response Schemas

**Create Decision:**
```typescript
{
  decision: string;      // Required - the rule
  context?: string;      // Optional - why
  category: CategoryEnum;
  scope?: string[];      // Optional tags
}
```

**Response:**
```typescript
{
  id: string;
  identifier: string;    // DEC-001
  decision: string;
  context: string | null;
  category: string;
  scope: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## UI Components

### Decision Capture Modal

Triggered from:
- "Add Decision" button on /decisions page
- Quick action in ticket drawer
- Keyboard shortcut (Cmd+D)

**Fields:**
- Decision (required) - textarea
- Context (optional) - textarea
- Category (required) - dropdown
- Scope tags (optional) - free-form chips with suggestions

### Decisions List Page

**Route:** `/decisions`

**Features:**
- List all decisions as cards
- Filter by category
- Filter by scope tag
- Search text
- Edit/toggle/delete actions on each card

**Card display:**
- Identifier (DEC-003)
- Category badge
- Active indicator
- Decision text
- Context (truncated)
- Scope tags

---

## File Structure

```
# New files
apps/api/src/services/forge/decisions.ts       # Decision matching logic
apps/api/src/routes/forge/decisions.ts         # CRUD API endpoints
apps/admin/src/routes/decisions.tsx            # List page
apps/admin/src/components/decisions/
  decision-modal.tsx                           # Capture/edit modal
  decision-card.tsx                            # Card component
  decision-list.tsx                            # List with filters
apps/admin/src/hooks/api/use-decisions.ts      # TanStack Query hooks

# Modified files
apps/api/src/services/forge/orchestrator.ts   # Inject decisions into prompts
apps/api/src/routes/forge/index.ts            # Register decisions routes
apps/admin/src/routes/__root.tsx              # Add nav link
packages/db/src/schema/index.ts               # Add decisions table
```

---

## Integration Points

### Orchestrator Modification

In `buildUserMessage()` function:

```typescript
// After building existing work section, before additional context:
const relevantDecisions = await matchDecisionsForTicket(context);
let decisionsSection = "";
if (relevantDecisions.length > 0) {
  decisionsSection = formatDecisionsForPrompt(relevantDecisions);
}

// Include in final message
return `# Task: ${context.ticketIdentifier} - ${context.ticketTitle}

${description ? `## Description\n${description}\n\n` : ""}${existingWorkSection}${decisionsSection}## Additional Context
${additionalContext}
...`;
```

### Haiku Matching Implementation

```typescript
async function matchDecisionsForTicket(
  context: ExecutionContext
): Promise<Decision[]> {
  const allDecisions = await getActiveDecisions();
  if (allDecisions.length === 0) return [];

  const prompt = `Given this ticket:
Title: ${context.ticketTitle}
Description: ${context.ticketDescription || 'None'}
Type: ${context.ticketType || 'Unknown'}

Which of these decisions are relevant? Return only the IDs as JSON array.

Decisions:
${allDecisions.map(d => `- ${d.identifier}: ${d.decision} [tags: ${d.scope?.join(', ')}]`).join('\n')}`;

  const response = await haiku.complete(prompt);
  const matchedIds = JSON.parse(response);

  return allDecisions.filter(d => matchedIds.includes(d.identifier));
}
```

---

## Success Criteria

- [ ] Can create decisions via modal
- [ ] Decisions appear in list page with filters
- [ ] Can edit/toggle/delete decisions
- [ ] Haiku matching returns relevant decisions for a ticket
- [ ] Matched decisions appear in agent execution prompts
- [ ] Agent output reflects following the decisions

---

## Future Enhancements (v2+)

- Compliance tracking (times_applied, times_overridden)
- Decision applications table for audit trail
- Violation scanning of agent output
- Decision versioning with supersedes
- Auto-suggest decisions from agent conversations
- "Create lint rule" integration
