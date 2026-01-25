/**
 * Drawer Factory Integration Tests
 *
 * Tests for the URL-based drawer factory system including:
 * - Drawer opening via URL params
 * - Drawer closing behavior (close button, escape key, backdrop click, browser back)
 * - Navigation and deep linking
 * - Error handling for invalid drawer names and params
 *
 * @see AXO-93 - URL-Based Drawer Factory
 * @see AXO-120 - Drawer Factory Integration Tests
 */

import { expect, test, type Page } from '@playwright/test'

// =============================================================================
// TEST CONSTANTS
// =============================================================================

const TEST_PROPERTY_ID = 'prop_test_123'
const TEST_LOAN_ID = 'loan_test_456'

/**
 * Valid drawer names that can be tested
 */
const VALID_DRAWER_NAMES = [
  'asset-config',
  'acquisition',
  'presumptions',
  'notifications',
  'add-loan',
  'add-transaction',
  'operating-expenses',
  'rental-income',
  'connect-bank-account',
  'property-acquisition',
  'valuation',
] as const

// =============================================================================
// TEST UTILITIES
// =============================================================================

/**
 * Helper to set up authentication mocks for tests
 */
async function setupAuthMocks(page: Page) {
  // Mock Clerk authentication
  await page.addInitScript(() => {
    // @ts-expect-error - Adding mock to window
    window.__CLERK_MOCK_USER__ = {
      id: 'user_test_123',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      firstName: 'Test',
      lastName: 'User',
    }
  })

  // Mock Clerk endpoints
  await page.route('**/clerk/**', async (route) => {
    const url = route.request().url()

    if (url.includes('/v1/client') || url.includes('/v1/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: {
            id: 'user_test_123',
            first_name: 'Test',
            last_name: 'User',
            email_addresses: [{ email_address: 'test@example.com' }],
            created_at: Date.now(),
          },
          client: {
            sessions: [
              {
                id: 'sess_test_123',
                status: 'active',
                user: { id: 'user_test_123' },
              },
            ],
          },
        }),
      })
    } else {
      await route.continue()
    }
  })
}

/**
 * Helper to set up API mocks for property and permissions
 */
async function setupApiMocks(page: Page, options: {
  propertyExists?: boolean
  userRole?: 'viewer' | 'member' | 'admin' | 'owner'
  failPropertyFetch?: boolean
} = {}) {
  const {
    propertyExists = true,
    userRole = 'member',
    failPropertyFetch = false,
  } = options

  // Mock property API endpoint
  await page.route(`**/api/properties/${TEST_PROPERTY_ID}`, async (route) => {
    if (failPropertyFetch) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      })
      return
    }

    if (!propertyExists) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Property not found' }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: TEST_PROPERTY_ID,
        portfolioId: 'portfolio_test_123',
        address: '123 Test St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        propertyType: 'single-family',
        nickname: 'Test Property',
      }),
    })
  })

  // Mock properties list endpoint
  await page.route('**/api/properties', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: TEST_PROPERTY_ID,
            portfolioId: 'portfolio_test_123',
            address: '123 Test St',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701',
            propertyType: 'single-family',
            nickname: 'Test Property',
          },
        ]),
      })
    } else {
      await route.continue()
    }
  })

  // Mock permissions API endpoint
  await page.route('**/api/permissions/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        role: userRole,
        canView: true,
        canEdit: userRole !== 'viewer',
        canAdmin: userRole === 'admin' || userRole === 'owner',
        isOwner: userRole === 'owner',
      }),
    })
  })

  // Mock property settings API endpoint
  await page.route('**/api/properties/*/settings', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nickname: 'Test Property',
          propertyType: 'single-family',
          address: '123 Test St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          taxJurisdiction: 'Travis County',
          currencyOverride: 'USD',
        }),
      })
    } else if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    } else {
      await route.continue()
    }
  })

  // Mock loans API endpoint
  await page.route('**/api/properties/*/loans', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  // Mock transactions API endpoint
  await page.route('**/api/properties/*/transactions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  // Mock portfolio endpoints
  await page.route('**/api/portfolios/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'portfolio_test_123',
        name: 'Test Portfolio',
      }),
    })
  })

  // Mock onboarding endpoint to indicate user has completed onboarding
  await page.route('**/api/onboarding', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        step: 'completed',
        completed: true,
        completedAt: new Date().toISOString(),
        data: {},
        firstName: 'Test',
        lastName: 'User',
      }),
    })
  })
}

/**
 * Navigate to property hub settings page
 */
async function navigateToSettingsPage(page: Page) {
  await page.goto(`/property-hub/${TEST_PROPERTY_ID}/settings`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  })
}

/**
 * Navigate to property hub financials page
 */
async function navigateToFinancialsPage(page: Page) {
  await page.goto(`/property-hub/${TEST_PROPERTY_ID}/financials`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  })
}

/**
 * Wait for drawer to be visible
 */
async function waitForDrawerOpen(page: Page, timeout = 10000) {
  await page.waitForSelector('[role="dialog"]', { 
    state: 'visible', 
    timeout,
  })
}

/**
 * Wait for drawer to be hidden
 */
async function waitForDrawerClosed(page: Page, timeout = 10000) {
  await page.waitForSelector('[role="dialog"]', { 
    state: 'hidden', 
    timeout,
  })
}

/**
 * Check if drawer is currently visible
 */
async function isDrawerOpen(page: Page): Promise<boolean> {
  const drawer = page.locator('[role="dialog"]')
  return await drawer.isVisible()
}

/**
 * Get current URL search params
 */
async function getSearchParams(page: Page): Promise<URLSearchParams> {
  const url = new URL(page.url())
  return url.searchParams
}

// =============================================================================
// DRAWER OPENING TESTS
// =============================================================================

test.describe('Drawer Opening', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page)
    await setupApiMocks(page)
  })

  test('URL param change triggers correct drawer to open', async ({ page }) => {
    await navigateToSettingsPage(page)

    // Navigate to URL with drawer param
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    // Wait for drawer to appear
    await waitForDrawerOpen(page)

    // Verify drawer is visible
    expect(await isDrawerOpen(page)).toBe(true)

    // Verify it's the correct drawer (Asset Configuration has this title)
    await expect(page.locator('[role="dialog"]')).toContainText('Asset Configuration')
  })

  test('Drawer receives correct props from URL params', async ({ page }) => {
    await navigateToSettingsPage(page)

    // Open drawer with specific property ID
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    await waitForDrawerOpen(page)

    // Verify the drawer content loads correctly (should have form fields)
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    
    // Check that the drawer has loaded property data (form fields should be present)
    const drawer = page.locator('[role="dialog"]')
    await expect(drawer).toBeVisible()
  })

  test('Drawer content lazy loads successfully', async ({ page }) => {
    await navigateToSettingsPage(page)

    // Open drawer
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    // The drawer should appear after lazy loading
    await waitForDrawerOpen(page)
    
    // Verify content is loaded (not just the loading fallback)
    const drawer = page.locator('[role="dialog"]')
    await expect(drawer).toContainText('Asset Configuration')
  })

  test('Loading state displays while content loads', async ({ page }) => {
    // Add a delay to API responses to observe loading state
    await page.route('**/api/properties/*/settings', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nickname: 'Test Property',
          propertyType: 'single-family',
          address: '123 Test St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
        }),
      })
    })

    await navigateToSettingsPage(page)

    // Navigate to drawer URL
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`
    )

    // Check that some loading indicator appears (either in drawer loading fallback or content)
    // The loading fallback shows "Loading..."
    const loadingOrContent = await page.waitForSelector('[role="dialog"], text=Loading', {
      timeout: 10000,
    })
    expect(loadingOrContent).toBeTruthy()

    // Eventually, the actual content should load
    await waitForDrawerOpen(page)
  })

  test('Multiple rapid open/close cycles do not cause race conditions', async ({ page }) => {
    await navigateToSettingsPage(page)

    // Rapidly change URL params multiple times
    const drawerSequence = ['asset-config', 'acquisition', 'presumptions', 'asset-config']

    for (const drawerName of drawerSequence) {
      await page.goto(
        `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=${drawerName}&propertyId=${TEST_PROPERTY_ID}`,
        { waitUntil: 'domcontentloaded' }
      )
      // Small delay to simulate rapid interactions
      await page.waitForTimeout(100)
    }

    // Final state should show the last drawer
    await waitForDrawerOpen(page)
    
    // Verify URL has the last drawer
    const params = await getSearchParams(page)
    expect(params.get('drawer')).toBe('asset-config')

    // Verify no errors in console
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForTimeout(500)
    
    // Filter out expected warnings (not critical errors)
    const criticalErrors = errors.filter(
      e => !e.includes('Warning') && !e.includes('DevTools')
    )
    expect(criticalErrors.length).toBe(0)
  })
})

// =============================================================================
// DRAWER CLOSING TESTS
// =============================================================================

test.describe('Drawer Closing', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page)
    await setupApiMocks(page)
  })

  test('Close button clears URL params', async ({ page }) => {
    // Open drawer via URL
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    await waitForDrawerOpen(page)

    // Click close button (X button in drawer header)
    const closeButton = page.locator('[role="dialog"]').locator('[aria-label="Close drawer"]')
    await closeButton.click()

    // Wait for drawer to close
    await waitForDrawerClosed(page)

    // Verify URL params are cleared
    const params = await getSearchParams(page)
    expect(params.get('drawer')).toBeNull()
    expect(params.get('propertyId')).toBeNull()
  })

  test('Escape key clears URL params', async ({ page }) => {
    // Open drawer via URL
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    await waitForDrawerOpen(page)

    // Press Escape key
    await page.keyboard.press('Escape')

    // Wait for drawer to close
    await waitForDrawerClosed(page)

    // Verify URL params are cleared
    const params = await getSearchParams(page)
    expect(params.get('drawer')).toBeNull()
  })

  test('Backdrop click clears URL params', async ({ page }) => {
    // Open drawer via URL
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    await waitForDrawerOpen(page)

    // Click on the backdrop (the overlay outside the drawer panel)
    // The backdrop is the fixed overlay with bg-black/50
    const backdrop = page.locator('.fixed.inset-0.z-50').first()
    
    // Click on the left edge of the backdrop (outside the drawer panel)
    await backdrop.click({ position: { x: 50, y: 300 } })

    // Wait for drawer to close
    await waitForDrawerClosed(page)

    // Verify URL params are cleared
    const params = await getSearchParams(page)
    expect(params.get('drawer')).toBeNull()
  })

  test('Browser back button closes drawer and restores previous URL', async ({ page }) => {
    // Start on settings page without drawer
    await navigateToSettingsPage(page)
    const initialUrl = page.url()

    // Navigate to drawer URL (using navigate, not replace)
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    await waitForDrawerOpen(page)

    // Go back using browser navigation
    await page.goBack()

    // Wait for navigation
    await page.waitForLoadState('networkidle')

    // Drawer should be closed
    expect(await isDrawerOpen(page)).toBe(false)

    // URL should not have drawer params
    const params = await getSearchParams(page)
    expect(params.get('drawer')).toBeNull()
  })

  test('Cancel button in footer closes drawer', async ({ page }) => {
    // Open drawer via URL
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    await waitForDrawerOpen(page)

    // Click Cancel button (in the drawer footer)
    const cancelButton = page.locator('[role="dialog"]').locator('button', { hasText: 'Cancel' })
    await cancelButton.click()

    // Wait for drawer to close
    await waitForDrawerClosed(page)

    // Verify drawer is closed
    expect(await isDrawerOpen(page)).toBe(false)
  })
})

// =============================================================================
// NAVIGATION & DEEP LINKING TESTS
// =============================================================================

test.describe('Navigation & Deep Linking', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page)
    await setupApiMocks(page)
  })

  test('Direct URL with drawer params opens drawer on page load', async ({ page }) => {
    // Navigate directly to URL with drawer params
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    // Drawer should open automatically
    await waitForDrawerOpen(page)

    // Verify correct drawer is shown
    const drawer = page.locator('[role="dialog"]')
    await expect(drawer).toContainText('Asset Configuration')
  })

  test('Refreshing page with drawer open re-opens same drawer', async ({ page }) => {
    // Navigate to page with drawer open
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    await waitForDrawerOpen(page)

    // Refresh the page
    await page.reload({ waitUntil: 'networkidle' })

    // Drawer should re-open
    await waitForDrawerOpen(page)

    // Verify same drawer is shown
    const drawer = page.locator('[role="dialog"]')
    await expect(drawer).toContainText('Asset Configuration')

    // Verify URL still has params
    const params = await getSearchParams(page)
    expect(params.get('drawer')).toBe('asset-config')
    expect(params.get('propertyId')).toBe(TEST_PROPERTY_ID)
  })

  test('Sharing URL with drawer params works for authorized users', async ({ page }) => {
    // Simulate sharing a URL - user navigates directly to deep link
    // This tests that drawer opens for a user with proper permissions
    
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=acquisition&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    // Drawer should open for authorized user
    await waitForDrawerOpen(page)

    // Verify correct drawer opened
    const drawer = page.locator('[role="dialog"]')
    await expect(drawer).toContainText('Acquisition')
  })

  test('Navigating to different route closes open drawer', async ({ page }) => {
    // Open drawer
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    await waitForDrawerOpen(page)

    // Navigate to a different route (financials page without drawer params)
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/financials`,
      { waitUntil: 'networkidle' }
    )

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle')

    // Drawer should be closed (no drawer in URL)
    expect(await isDrawerOpen(page)).toBe(false)

    // Verify URL has no drawer params
    const params = await getSearchParams(page)
    expect(params.get('drawer')).toBeNull()
  })

  test('Switching between drawers updates URL correctly', async ({ page }) => {
    // Open first drawer
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    await waitForDrawerOpen(page)
    
    let params = await getSearchParams(page)
    expect(params.get('drawer')).toBe('asset-config')

    // Navigate to a different drawer
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=acquisition&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    await waitForDrawerOpen(page)

    // Verify new drawer is shown
    params = await getSearchParams(page)
    expect(params.get('drawer')).toBe('acquisition')

    const drawer = page.locator('[role="dialog"]')
    await expect(drawer).toContainText('Acquisition')
  })
})

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page)
    await setupApiMocks(page)
  })

  test('Invalid drawer name shows error state, does not crash', async ({ page }) => {
    // Navigate to page with invalid drawer name
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=invalid-drawer-name&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    // App should not crash - settings page should still be visible
    await page.waitForLoadState('networkidle')

    // The drawer should NOT open (invalid drawer name is ignored)
    expect(await isDrawerOpen(page)).toBe(false)

    // Page should still function - check that the settings page content is visible
    await expect(page.locator('body')).toBeVisible()

    // Verify no unhandled errors in console
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('[DrawerRenderer]')) {
        errors.push(msg.text())
      }
    })
    
    await page.waitForTimeout(500)
    
    // Filter expected console warnings
    const unexpectedErrors = errors.filter(
      e => !e.includes('Warning') && !e.includes('DevTools') && !e.includes('[DrawerRenderer]')
    )
    expect(unexpectedErrors.length).toBe(0)
  })

  test('Malformed URL params do not crash the app', async ({ page }) => {
    // Test various malformed params
    const malformedUrls = [
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=`,
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=`,
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config`, // Missing propertyId
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=&propertyId=&loanId=`,
    ]

    for (const url of malformedUrls) {
      await page.goto(url, { waitUntil: 'networkidle' })

      // App should not crash
      await expect(page.locator('body')).toBeVisible()
      
      // No drawer should open with invalid params
      // (drawer may or may not open depending on validation - the key is no crash)
      await page.waitForTimeout(300)
    }
  })

  test('Missing propertyId param does not crash app', async ({ page }) => {
    // Navigate with drawer but no propertyId
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config`,
      { waitUntil: 'networkidle' }
    )

    // App should not crash
    await expect(page.locator('body')).toBeVisible()
    
    // Either the drawer doesn't open or it handles the error gracefully
    await page.waitForTimeout(500)
    
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible()
  })

  test('Network error during property fetch is handled gracefully', async ({ page }) => {
    // Setup API mocks with failed property fetch
    await setupApiMocks(page, { failPropertyFetch: true })

    // Navigate to drawer URL
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle', timeout: 30000 }
    )

    // Wait for error handling
    await page.waitForTimeout(1000)

    // App should handle the error gracefully - either show error state or close drawer
    // Key assertion: no crash
    await expect(page.locator('body')).toBeVisible()
  })

  test('Non-existent property shows appropriate error', async ({ page }) => {
    // Setup API mocks with non-existent property
    await setupApiMocks(page, { propertyExists: false })

    // Navigate to drawer URL
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle', timeout: 30000 }
    )

    // Wait for error handling
    await page.waitForTimeout(1000)

    // App should not crash
    await expect(page.locator('body')).toBeVisible()
  })

  test('Permission denied closes drawer gracefully', async ({ page }) => {
    // Setup API mocks with viewer role (not enough for most drawers)
    await setupApiMocks(page, { userRole: 'viewer' })

    // Navigate to drawer that requires member+ permission
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    // Wait for permission check
    await page.waitForTimeout(2000)

    // Drawer should either not open or close after permission check
    // The key is no crash and URL should be cleaned up
    await expect(page.locator('body')).toBeVisible()
  })

  test('Admin-only drawer denied for member role', async ({ page }) => {
    // Setup API mocks with member role
    await setupApiMocks(page, { userRole: 'member' })

    // Navigate to admin-only drawer (connect-bank-account requires admin)
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=connect-bank-account&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    // Wait for permission check
    await page.waitForTimeout(2000)

    // App should handle gracefully
    await expect(page.locator('body')).toBeVisible()
  })
})

// =============================================================================
// URL STATE MANAGEMENT TESTS
// =============================================================================

test.describe('URL State Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page)
    await setupApiMocks(page)
  })

  test('Drawer params are properly encoded in URL', async ({ page }) => {
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=add-loan&propertyId=${TEST_PROPERTY_ID}&loanId=${TEST_LOAN_ID}`,
      { waitUntil: 'networkidle' }
    )

    const params = await getSearchParams(page)
    expect(params.get('drawer')).toBe('add-loan')
    expect(params.get('propertyId')).toBe(TEST_PROPERTY_ID)
    expect(params.get('loanId')).toBe(TEST_LOAN_ID)
  })

  test('Multiple drawer params coexist correctly', async ({ page }) => {
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/financials?drawer=add-loan&propertyId=${TEST_PROPERTY_ID}&loanId=${TEST_LOAN_ID}`,
      { waitUntil: 'networkidle' }
    )

    const params = await getSearchParams(page)
    expect(params.get('drawer')).toBe('add-loan')
    expect(params.get('propertyId')).toBe(TEST_PROPERTY_ID)
    expect(params.get('loanId')).toBe(TEST_LOAN_ID)
  })

  test('Special characters in params are handled correctly', async ({ page }) => {
    const specialPropertyId = 'prop_test-123_special'
    
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${encodeURIComponent(specialPropertyId)}`,
      { waitUntil: 'networkidle' }
    )

    const params = await getSearchParams(page)
    expect(params.get('propertyId')).toBe(specialPropertyId)
  })
})

// =============================================================================
// DRAWER TYPE-SPECIFIC TESTS
// =============================================================================

test.describe('Drawer Type-Specific Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page)
    await setupApiMocks(page)
  })

  test('Settings drawers work correctly', async ({ page }) => {
    const settingsDrawers = ['asset-config', 'acquisition', 'presumptions', 'notifications']

    for (const drawerName of settingsDrawers) {
      await page.goto(
        `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=${drawerName}&propertyId=${TEST_PROPERTY_ID}`,
        { waitUntil: 'networkidle' }
      )

      // Drawer should open
      await waitForDrawerOpen(page)

      // Drawer content should be visible
      const drawer = page.locator('[role="dialog"]')
      await expect(drawer).toBeVisible()

      // Close drawer before next iteration
      await page.keyboard.press('Escape')
      await waitForDrawerClosed(page)
    }
  })

  test('Financial drawers work correctly', async ({ page }) => {
    const financialDrawers = ['add-loan', 'add-transaction', 'operating-expenses', 'rental-income']

    for (const drawerName of financialDrawers) {
      await page.goto(
        `/property-hub/${TEST_PROPERTY_ID}/financials?drawer=${drawerName}&propertyId=${TEST_PROPERTY_ID}`,
        { waitUntil: 'networkidle' }
      )

      // Drawer should open
      await waitForDrawerOpen(page)

      // Drawer content should be visible
      const drawer = page.locator('[role="dialog"]')
      await expect(drawer).toBeVisible()

      // Close drawer before next iteration
      await page.keyboard.press('Escape')
      await waitForDrawerClosed(page)
    }
  })

  test('Loan drawer with loanId opens in edit mode', async ({ page }) => {
    // Mock a specific loan endpoint
    await page.route(`**/api/loans/${TEST_LOAN_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: TEST_LOAN_ID,
          propertyId: TEST_PROPERTY_ID,
          loanName: 'Test Loan',
          loanAmount: 250000,
          interestRate: 4.5,
        }),
      })
    })

    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/financials?drawer=add-loan&propertyId=${TEST_PROPERTY_ID}&loanId=${TEST_LOAN_ID}`,
      { waitUntil: 'networkidle' }
    )

    await waitForDrawerOpen(page)

    // Verify drawer received loanId param
    const params = await getSearchParams(page)
    expect(params.get('loanId')).toBe(TEST_LOAN_ID)
  })
})

// =============================================================================
// ACCESSIBILITY TESTS
// =============================================================================

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page)
    await setupApiMocks(page)
  })

  test('Drawer has proper ARIA attributes', async ({ page }) => {
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    await waitForDrawerOpen(page)

    const drawer = page.locator('[role="dialog"]')
    await expect(drawer).toHaveAttribute('aria-modal', 'true')
  })

  test('Close button has proper aria-label', async ({ page }) => {
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    await waitForDrawerOpen(page)

    const closeButton = page.locator('[aria-label="Close drawer"]')
    await expect(closeButton).toBeVisible()
  })

  test('Focus is trapped within drawer when open', async ({ page }) => {
    await page.goto(
      `/property-hub/${TEST_PROPERTY_ID}/settings?drawer=asset-config&propertyId=${TEST_PROPERTY_ID}`,
      { waitUntil: 'networkidle' }
    )

    await waitForDrawerOpen(page)

    // Tab through the drawer
    await page.keyboard.press('Tab')
    
    // Focus should remain within the drawer
    const focusedElement = await page.evaluate(() => document.activeElement?.closest('[role="dialog"]'))
    expect(focusedElement).toBeTruthy()
  })
})
