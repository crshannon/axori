# Create Pull Request

Creates a GitHub pull request from the current branch to the target branch.

## Usage

```
/create-pr
```

Or with parameters:
```
/create-pr base=main title="Feature: Add loan summary" body="Adds loan summary totals to DebtLogic component"
```

## Behavior

1. Detects current branch automatically
2. Prompts for base branch (default: `main`)
3. Prompts for PR title and description
4. Creates PR via GitHub API
5. Returns PR URL and number

## Inputs

- **base** (optional) - Base branch to merge into (default: `main`)
- **head** (optional) - Branch to merge from (default: current branch)
- **title** (required) - PR title
- **body** (optional) - PR description
- **draft** (optional) - Create as draft PR (default: `false`)
- **reviewers** (optional) - Comma-separated GitHub usernames
- **labels** (optional) - Comma-separated labels

## Examples

```
/create-pr base=main title="Fix: Loan summary calculation" body="Fixes monthly payment calculation in useLoanSummary hook"
```

```
/create-pr base=main title="Feature: Loan summary totals" draft=true
```

## Implementation

Runs: `.cursor/scripts/create-pr.ts`

Requires:
- `GITHUB_TOKEN` in `.env` file
- Git repository with remote configured
- Current branch with commits

## Output

Returns:
- PR number
- PR URL
- Success confirmation

