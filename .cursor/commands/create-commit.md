# Create Commit

Creates a commit on the current branch with proper branch management and Linear integration.

## Usage

```
/create-commit
```

Or with parameters:
```
/create-commit message="Fix loan calculation" linear=AXO-123
```

## Behavior

1. **Checks branch safety** - Prevents committing directly to `main` or `master`
2. **Creates branch if needed** - Auto-creates a branch from Linear ticket or provided name
3. **Links to Linear** - Associates commit with Linear issue if provided
4. **Auto-generates commit message** - Analyzes staged changes and creates descriptive message
5. **Summarizes work** - Uses Linear issue title or generates from file changes
6. **Updates Linear** (optional) - Can update Linear issue status

## Inputs

- **message** (optional) - Commit message (auto-generated from changes if not provided)
- **linear** (optional) - Linear issue identifier (e.g., `AXO-123`)
- **branch** (optional) - Branch name (auto-generated from Linear if not provided)
- **type** (optional) - Commit type: `fix`, `feat`, `refactor`, `docs`, `test` (default: auto-detected)
- **update-linear** (optional) - Update Linear issue status to "In Progress" (default: `false`)

## Branch Naming

If creating a new branch:
- **With Linear ticket**: `linear/AXO-123-short-description`
- **Without Linear**: `feat/short-description` or `fix/short-description`

## Examples

**Auto-generate message from changes:**
```
/create-commit linear=AXO-7
```

**With explicit message:**
```
/create-commit message="Fix monthly payment calculation" linear=AXO-5
```

```
/create-commit message="Add loan summary totals" linear=AXO-6 type=feat
```

```
/create-commit message="Update component styling" branch=update-styling
```

**Auto-generate without Linear:**
```
/create-commit stage-all
```

## Implementation

Runs: `.cursor/scripts/create-commit.ts`

Requires:
- Git repository
- Not on `main` or `master` branch (or will create new branch)
- `LINEAR_API_KEY` in `.env` (if using Linear integration)

## Output

Returns:
- Branch name (created or current)
- Commit hash
- Linear issue link (if provided)
- Success confirmation

