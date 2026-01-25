# E2E Test Setup Guide

This guide explains how to set up and run the E2E (end-to-end) integration tests for the Axori web application.

## Prerequisites

- Node.js 18+
- pnpm 8+
- A Clerk account with test API keys
- A Supabase project (or local PostgreSQL database)

## Environment Setup

### 1. Create Environment File

Copy the example environment file to create your local configuration:

```bash
cp .env.local.example .env.local
```

### 2. Configure Required Variables

Edit `.env.local` and fill in the following required values:

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk frontend publishable key | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `CLERK_SECRET_KEY` | Clerk backend secret key | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `DATABASE_URL` | PostgreSQL connection string | [Supabase Dashboard](https://supabase.com) → Settings → Database |

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Install Playwright Browsers

```bash
pnpm --filter @axori/web exec playwright install
```

## Running Tests

### Run All E2E Tests

```bash
pnpm --filter @axori/web test:e2e
```

### Run Tests with UI

```bash
pnpm --filter @axori/web test:e2e:ui
```

### Run Tests in Debug Mode

```bash
pnpm --filter @axori/web test:e2e:debug
```

### Run Specific Test File

```bash
pnpm --filter @axori/web test:e2e drawer-factory.spec.ts
```

### Run Specific Test

```bash
pnpm --filter @axori/web test:e2e -g "URL param change triggers correct drawer"
```

## Test Files

| File | Description |
|------|-------------|
| `drawer-factory.spec.ts` | Tests for URL-based drawer system (opening, closing, navigation, error handling) |
| `onboarding-name-save.spec.ts` | Tests for user onboarding name input flow |
| `global-setup.ts` | Global setup that runs before all tests |

## Test Architecture

### How Tests Work

1. **Global Setup** (`global-setup.ts`) - Validates environment configuration
2. **Web Servers** - Playwright automatically starts the API and web servers
3. **Test Execution** - Tests run against the running application
4. **Mocking** - Tests mock Clerk authentication and API endpoints

### Mocking Strategy

The tests use Playwright's request interception to mock:

- **Clerk Authentication** - User sessions and auth endpoints
- **API Endpoints** - Property data, permissions, settings, etc.

This allows testing the drawer behavior without requiring real data in the database.

## Troubleshooting

### "Add your Clerk Publishable Key" Error

The web server requires Clerk API keys to start. Ensure:

1. `.env.local` exists in the project root
2. `VITE_CLERK_PUBLISHABLE_KEY` is set with a valid key from Clerk dashboard

### Tests Timing Out

If tests time out waiting for the server:

1. Check that ports 3000 and 3001 are available
2. Increase timeout in `playwright.config.ts` if needed
3. Run servers manually first: `pnpm dev`

### Permission Denied Errors

The drawer tests mock permissions. If you see unexpected permission errors:

1. Check the `setupTestMocks` function in the test file
2. Verify the `userRole` parameter is set correctly

## CI/CD Integration

For GitHub Actions, configure these secrets:

```yaml
env:
  VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.VITE_CLERK_PUBLISHABLE_KEY }}
  CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Example workflow step:

```yaml
- name: Run E2E Tests
  run: pnpm --filter @axori/web test:e2e
  env:
    VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.VITE_CLERK_PUBLISHABLE_KEY }}
    CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Writing New Tests

### Test Structure

```typescript
import { expect, test, type Page } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mocks
    await setupTestMocks(page)
  })

  test('should do something', async ({ page }) => {
    // Navigate
    await page.goto('/your-route')
    
    // Interact
    await page.click('button')
    
    // Assert
    await expect(page.locator('.result')).toBeVisible()
  })
})
```

### Best Practices

1. **Use `data-testid` attributes** for reliable selectors
2. **Mock external services** to avoid flaky tests
3. **Use `waitFor*` methods** instead of arbitrary timeouts
4. **Keep tests focused** - one behavior per test
5. **Clean up state** between tests

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Clerk Testing Guide](https://clerk.com/docs/testing/overview)
- [Project Testing Rules](/.cursor/rules/testing-reminders.mdc)
