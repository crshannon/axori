# Create Linear Issue

Creates a new issue in Linear from the current context or with provided details.

## Usage

```
/create-linear-issue
```

Or with parameters:
```
/create-linear-issue title="Fix bug" description="Bug description" priority=high
```

## Behavior

1. Prompts for missing information (title is required)
2. Uses current file/context if available
3. Creates issue via Linear API
4. Returns issue identifier and URL

## Inputs

- **title** (required) - Issue title
- **description** (optional) - Detailed description
- **priority** (optional) - Priority level: `urgent`, `high`, `medium`, `low` (default: `medium`)
- **team-id** (optional) - Linear team ID (uses LINEAR_TEAM_ID from .env if not provided)
- **labels** (optional) - Comma-separated labels
- **project-id** (optional) - Linear project ID

## Examples

```
/create-linear-issue title="Bug: DebtLogic calculation error" priority=high
```

```
/create-linear-issue title="Feature: Add loan sorting" description="Allow users to sort loans by position, date, balance, or rate" priority=medium
```

## Implementation

Runs: `.cursor/scripts/create-linear-issue.ts`

Requires:
- `LINEAR_API_KEY` in `.env` file
- `LINEAR_TEAM_ID` in `.env` file (optional, will auto-detect)

## Output

Returns:
- Issue identifier (e.g., `AXO-123`)
- Issue URL
- Success confirmation

