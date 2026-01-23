# Cursor Commands Reference

Quick reference for common commands in the Axori project.

## Development Commands

### Start Development Servers
```bash
# Start all apps
pnpm dev

# Start specific app
pnpm --filter @axori/web dev      # Web app (port 3000)
pnpm --filter @axori/api dev       # API server (port 3001)
pnpm --filter @axori/mobile dev    # Mobile app
```

### Build Commands
```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter @axori/web build
pnpm --filter @axori/api build
pnpm --filter @axori/mobile build
```

## Database Commands

### Schema Management
```bash
# Generate migration from schema changes
pnpm --filter @axori/db db:generate

# Push schema to database (dev)
pnpm --filter @axori/db db:push

# Run migrations
pnpm --filter @axori/db db:migrate

# Pull schema from database
pnpm --filter @axori/web db:pull

# Open Drizzle Studio (database GUI)
pnpm --filter @axori/db db:studio

# Seed database with test data
pnpm --filter @axori/db db:seed
```

## Testing Commands

```bash
# Run all tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Run E2E tests in debug mode
pnpm test:e2e:debug
```

## Code Quality Commands

### Linting
```bash
# Lint all packages
pnpm lint

# Lint specific package
pnpm --filter @axori/web lint
pnpm --filter @axori/api lint
pnpm --filter @axori/mobile lint
```

### Type Checking
```bash
# Type check all packages
pnpm type-check

# Type check specific package
pnpm --filter @axori/web type-check
pnpm --filter @axori/api type-check
pnpm --filter @axori/mobile type-check
```

### Formatting
```bash
# Format code
pnpm format

# Check formatting
pnpm check
```

## Cleanup Commands

```bash
# Clean all build artifacts
pnpm clean
```

## Cursor Chat Commands

These commands can be used in Cursor chat with `/` prefix:

- `/create-linear-issue` - Create a Linear issue (see `.cursor/commands/create-linear-issue.md`)
- `/create-commit` - Create a commit with branch management (see `.cursor/commands/create-commit.md`)
- `/create-pr` - Create a GitHub pull request (see `.cursor/commands/create-pr.md`)
- `/pre-commit` - Run all quality checks (linting, type checking, tests, build) (see `.cursor/commands/pre-commit.md`)

## Linear Integration Commands

These commands facilitate working with Linear issues:

### Test Linear Connection

Test your Linear API key and see available teams:

```bash
LINEAR_API_KEY=xxx tsx .cursor/scripts/test-linear-connection.ts
```

This will:
- Verify your API key works
- Show your logged-in user
- List all available teams with their IDs
- Suggest which team ID to use

**Setup Steps:**

1. **Add API key to `.env` file:**
   ```bash
   echo "LINEAR_API_KEY=lin_api_..." >> .env
   ```

2. **Test the connection:**
   ```bash
   source .env  # Load environment variables
   tsx .cursor/scripts/test-linear-connection.ts
   ```

3. **Add team ID (optional, will auto-detect if only one team):**
   ```bash
   echo "LINEAR_TEAM_ID=team-id-here" >> .env
   ```

### Create Linear Issue

Create a new Linear issue from the command line:

**Easy way (recommended):**
```bash
# Uses .env file automatically
.cursor/scripts/linear-issue.sh \
  --title "Fix bug in DebtLogic component" \
  --description "The monthly payment calculation is incorrect" \
  --priority high
```

**Direct usage:**
```bash
# Basic usage (requires LINEAR_API_KEY)
LINEAR_API_KEY=xxx LINEAR_TEAM_ID=xxx tsx .cursor/scripts/create-linear-issue.ts \
  --title "Fix bug in DebtLogic component" \
  --description "The monthly payment calculation is incorrect" \
  --priority high

# With labels and project
LINEAR_API_KEY=xxx tsx .cursor/scripts/create-linear-issue.ts \
  --title "Feature: Add loan sorting" \
  --description "Allow users to sort loans by position, date, balance, or rate" \
  --priority medium \
  --labels "feature,frontend" \
  --project-id "project-id-here"

# Interactive mode (prompts for missing info)
LINEAR_API_KEY=xxx tsx .cursor/scripts/create-linear-issue.ts --interactive
```

**Environment Variables:**
- `LINEAR_API_KEY` (required) - Get from https://linear.app/settings/api
- `LINEAR_TEAM_ID` (optional) - Will auto-detect if only one team exists

**Options:**
- `--title` / `-t` - Issue title (required)
- `--description` / `-d` - Issue description
- `--priority` / `-p` - Priority: urgent, high, medium, low (default: medium)
- `--team-id` - Linear team ID (overrides LINEAR_TEAM_ID env var)
- `--project-id` - Linear project ID
- `--labels` / `-l` - Comma-separated label names
- `--assignee-id` - Assignee user ID
- `--state-id` - Initial state ID
- `--interactive` / `-i` - Interactive mode with prompts

**Example from Cursor Context:**
When working on a bug or feature, you can quickly create a Linear issue:

```bash
# Create issue for current bug
LINEAR_API_KEY=xxx tsx .cursor/scripts/create-linear-issue.ts \
  --title "Bug: useLoanSummary undercounts monthly payments" \
  --description "When totalMonthlyPayment is null, the hook should fallback to monthlyPrincipalInterest + monthlyEscrow" \
  --priority high
```

### `linear:sync-todos`
One-time migration of TODO.md tasks to Linear.
- Parses markdown structure
- Creates issues with proper hierarchy
- Generates migration report

```bash
LINEAR_API_KEY=xxx LINEAR_TEAM_ID=xxx tsx .cursor/scripts/migrate-todos-to-linear.ts
```

### `linear:update-status`
Updates Linear issue status from commit messages.
- Recognizes patterns: `Fixes LINEAR-123`, `Closes LINEAR-456`
- Can be run as git hook or manually

### `linear:link-pr`
Links PR to Linear issue when creating PRs.
- Adds Linear issue reference to PR description
- Updates Linear issue with PR link

## Git Commit Commands

### Create Commit

Create a commit with automatic branch management and Linear integration:

**Easy way (recommended):**
```bash
# Uses .env file automatically
.cursor/scripts/create-commit.sh \
  --message "Fix loan calculation bug" \
  --linear AXO-123 \
  --stage-all
```

**Direct usage:**
```bash
tsx .cursor/scripts/create-commit.ts \
  --message "Fix bug" \
  --linear AXO-123 \
  --stage-all
```

**Options:**
- `--message` / `-m` - Commit message (required)
- `--linear` / `-l` - Linear issue identifier (e.g., `AXO-123`)
- `--branch` / `-b` - Branch name (auto-generated if not provided)
- `--type` / `-t` - Commit type: `fix`, `feat`, `refactor`, `docs`, `test`, `chore`
- `--update-linear` - Update Linear issue status to "In Progress"
- `--stage-all` / `-a` - Stage all changes before committing

**Features:**
- ✅ **Prevents commits to main/master** - Will create a new branch automatically
- ✅ **Auto-branch naming** - Creates branches like `linear/AXO-123-short-description`
- ✅ **Linear integration** - Links commit to Linear issue
- ✅ **Smart commit messages** - Adds Linear reference and type prefix

**Examples:**
```bash
# Create commit with Linear ticket (auto-creates branch if on main)
.cursor/scripts/create-commit.sh \
  --message "Fix monthly payment calculation" \
  --linear AXO-5 \
  --type fix \
  --stage-all

# Create commit on existing branch
.cursor/scripts/create-commit.sh \
  --message "Add loan summary totals" \
  --linear AXO-6 \
  --stage-all

# Create commit without Linear (auto-generates branch name)
.cursor/scripts/create-commit.sh \
  --message "Update component styling" \
  --type refactor \
  --stage-all
```

**Branch Naming:**
- With Linear: `linear/AXO-123-short-description`
- Without Linear: `feat/short-description` or `fix/short-description`
- Custom: Use `--branch` to specify

**Workflow:**
1. Make your changes
2. Run commit command with message and Linear ticket
3. Script creates branch if needed (prevents main commits)
4. Stages and commits changes
5. Links commit to Linear issue
6. Optionally updates Linear status

## GitHub PR Commands

### Create Pull Request

Create a GitHub pull request from the current branch:

**Easy way (recommended):**
```bash
# Uses .env file automatically
.cursor/scripts/create-pr.sh \
  --base main \
  --title "Feature: Add loan summary totals" \
  --body "Adds loan summary section to DebtLogic component with totals for debt, weighted rate, and monthly payments"
```

**Direct usage:**
```bash
GITHUB_TOKEN=xxx tsx .cursor/scripts/create-pr.ts \
  --base main \
  --title "PR Title" \
  --body "PR Description"
```

**Options:**
- `--base` / `-b` - Base branch (default: `main`)
- `--head` / `-h` - Head branch (default: current branch)
- `--title` / `-t` - PR title (required)
- `--body` / `-d` - PR description
- `--draft` - Create as draft PR
- `--reviewers` / `-r` - Comma-separated GitHub usernames
- `--labels` / `-l` - Comma-separated labels

**Environment Variables:**
- `GITHUB_TOKEN` (required) - Get from https://github.com/settings/tokens
  - Required scopes: `repo` (private repos) or `public_repo` (public repos)

**Examples:**
```bash
# Create PR from current branch to main
.cursor/scripts/create-pr.sh \
  --title "Fix: Loan summary calculation" \
  --body "Fixes monthly payment calculation in useLoanSummary hook"

# Create draft PR with reviewers
.cursor/scripts/create-pr.sh \
  --title "Feature: Add loan sorting" \
  --draft \
  --reviewers "username1,username2" \
  --labels "feature,frontend"
```

## Package Filtering

Use `--filter` to run commands for specific packages:

```bash
# Run command for specific package
pnpm --filter @axori/web <command>
pnpm --filter @axori/api <command>
pnpm --filter @axori/db <command>
pnpm --filter @axori/shared <command>
pnpm --filter @axori/ui <command>
```

## Common Workflows

### Adding a New Database Table
```bash
# 1. Modify schema in packages/db/src/schema/index.ts
# 2. Generate migration
pnpm --filter @axori/db db:generate

# 3. Review generated SQL
# 4. Apply migration
pnpm --filter @axori/db db:push
```

### Running Tests Before Commit
```bash
# Run all tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Or use the pre-commit command for comprehensive checks
/pre-commit
# Or with options:
/pre-commit --skip-build  # Faster, skips build step
```

### Starting Full Development Environment
```bash
# Start all services
pnpm dev

# In separate terminals, you can also run:
pnpm --filter @axori/api dev      # API on port 3001
pnpm --filter @axori/web dev      # Web on port 3000
```

## Environment Variables

Make sure to set up `.env` file with required variables:
- Database connection (Supabase or PostgreSQL)
- Clerk authentication keys
- API keys for external services
- See `SETUP.md` for complete list

