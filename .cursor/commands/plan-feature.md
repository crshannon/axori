# Plan Feature

Creates a structured plan for implementing a feature or update based on a Linear ticket, using all defined rules and agents.

## Usage

```
/plan-feature linear=AXO-123
```

Or with additional context:

```
/plan-feature linear=AXO-123 scope=frontend focus=components
```

## Behavior

1. **Fetches Linear Issue** - Gets ticket details, description, and context
2. **Analyzes Requirements** - Breaks down the feature into actionable tasks
3. **Creates Plan File** - Generates structured plan in `.cursor/plans/`
4. **Applies Rules** - Considers all relevant rules (architecture, design system, testing, etc.)
5. **Suggests Approach** - Recommends implementation strategy based on project patterns
6. **Creates Branch** - Optionally creates a feature branch from the plan

## Inputs

- **linear** (required) - Linear issue identifier (e.g., `AXO-123`)
- **scope** (optional) - Feature scope: `frontend`, `backend`, `fullstack`, `infra` (default: auto-detect)
- **focus** (optional) - Focus area: `components`, `api`, `database`, `ui`, `integration` (default: auto-detect)
- **branch** (optional) - Create branch automatically (default: `true`)

## Plan Structure

The generated plan includes:

- **Overview** - Feature summary from Linear ticket
- **Requirements** - Parsed requirements and acceptance criteria
- **Architecture** - Database, API, and component structure
- **Implementation Tasks** - Step-by-step tasks with rule references
- **Testing Strategy** - Unit, integration, and E2E test plans
- **Design System** - UI components and styling considerations
- **Dependencies** - Related features or prerequisites

## Examples

**Basic feature planning:**

```
/plan-feature linear=AXO-45
```

**Frontend component feature:**

```
/plan-feature linear=AXO-45 scope=frontend focus=components
```

**Full-stack feature:**

```
/plan-feature linear=AXO-45 scope=fullstack
```

## Implementation

Runs: `.cursor/scripts/plan-feature.ts`

Requires:

- `LINEAR_API_KEY` in `.env`
- Git repository
- Access to Linear workspace

## Output

Returns:

- Plan file path (`.cursor/plans/{feature-name}.plan.md`)
- Branch name (if created)
- Next steps summary
- Rule references applied
