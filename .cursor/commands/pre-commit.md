# Pre-Commit

Runs all quality checks (linting, type checking, tests, and build) to ensure code is ready for commit and will build successfully on the server.

## Usage

```
/pre-commit
```

Or with options:
```
/pre-commit --skip-build
/pre-commit --skip-tests
/pre-commit --skip-lint
/pre-commit --skip-type-check
```

## Behavior

1. **Auto-fixes linting** (always) - Executes `turbo run lint:fix` to auto-fix issues before checking
   - Auto-fixes issues like: unused imports, formatting, some TypeScript issues
   - Some issues (like variable shadowing) require manual fixes
2. **Runs linting** - Executes `turbo run lint` across all packages
   - Fails on any warnings or errors (uses `--max-warnings 0`)
   - Ensures code quality standards are met
3. **Runs type checking** - Executes `turbo run type-check` across all packages
4. **Runs tests** - Executes `turbo run test` across all packages
5. **Runs build** - Executes `turbo run build` to ensure everything compiles (optional)
6. **Fails on error** - Stops execution if any check fails

## Options

- **--skip-build** - Skip the build step (faster, but doesn't verify compilation)
- **--skip-tests** - Skip running tests
- **--skip-lint** - Skip linting checks (also skips auto-fix)
- **--skip-type-check** - Skip TypeScript type checking

## What It Checks

### Linting
- **Auto-fixes** issues first via `turbo run lint:fix`
  - Auto-fixable: unused imports, formatting, `require-await` (removes async), and more
  - Not auto-fixable: variable shadowing (`no-shadow`), some TypeScript issues (requires manual fixes)
- **Validates** code quality via `turbo run lint`
  - Fails on any warnings or errors (`--max-warnings 0`)
  - Ensures code follows project style guidelines
- Commands: `turbo run lint:fix` → `turbo run lint`

### Type Checking
- Runs TypeScript compiler in `--noEmit` mode
- Verifies all types are correct and there are no type errors
- Command: `turbo run type-check`

### Tests
- Runs unit tests across all packages
- Uses Vitest for web app, other test runners as configured
- Command: `turbo run test`

### Build
- Compiles all packages to verify they build successfully
- Ensures production builds will work on the server
- Command: `turbo run build`

## Exit Codes

- **0** - All checks passed
- **1** - One or more checks failed

## Examples

```bash
# Run all checks (auto-fixes linting automatically)
/pre-commit

# Skip build (faster for quick checks)
/pre-commit --skip-build

# Only run linting and type checking
/pre-commit --skip-tests --skip-build

# Skip linting entirely
/pre-commit --skip-lint
```

## Implementation

Runs: `.cursor/scripts/pre-commit.ts`

Uses Turborepo to run tasks in parallel across the monorepo, respecting dependencies defined in `turbo.json`.

## Integration with Git Hooks

This command can be used as a git pre-commit hook. To set it up:

```bash
# Add to .git/hooks/pre-commit
#!/bin/sh
pnpm tsx .cursor/scripts/pre-commit.ts
```

Or use a tool like `husky` to manage git hooks.
