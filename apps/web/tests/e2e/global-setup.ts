/**
 * Global Setup for E2E Tests
 *
 * Runs before all tests to verify environment is properly configured.
 * If environment is not ready, fails early with a helpful error message.
 *
 * REQUIREMENTS:
 * - VITE_CLERK_PUBLISHABLE_KEY must be set in .env.local
 * - DATABASE_URL must be set (for API server)
 * - Servers must be able to start successfully
 *
 * @see AXO-120 - Drawer Factory Integration Tests
 */

import type { FullConfig } from '@playwright/test'

/**
 * Required environment variables for E2E tests to run.
 * Tests will fail early if any of these are missing.
 */
const REQUIRED_ENV_VARS = [
  {
    name: 'VITE_CLERK_PUBLISHABLE_KEY',
    description: 'Clerk frontend publishable key',
    where: 'Clerk Dashboard → API Keys',
  },
]

/**
 * Optional but recommended environment variables.
 * Missing these will show a warning but not fail.
 */
const RECOMMENDED_ENV_VARS = [
  {
    name: 'DATABASE_URL',
    description: 'PostgreSQL connection string',
    where: 'Supabase Dashboard → Settings → Database',
  },
]

async function globalSetup(config: FullConfig) {
  console.log('\n')
  console.log('╔' + '═'.repeat(62) + '╗')
  console.log('║' + '  📋 E2E Test Environment Check'.padEnd(62) + '║')
  console.log('╚' + '═'.repeat(62) + '╝')
  console.log('')

  // Check if running in CI or local
  const isCI = !!process.env.CI
  console.log(`🔧 Environment: ${isCI ? 'CI' : 'Local'}`)

  // Log base URL
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000'
  console.log(`🌐 Base URL: ${baseURL}`)
  console.log('')

  // Check for required environment variables
  const missingRequired = REQUIRED_ENV_VARS.filter(
    (envVar) => !process.env[envVar.name],
  )

  const missingRecommended = RECOMMENDED_ENV_VARS.filter(
    (envVar) => !process.env[envVar.name],
  )

  // Show status of required variables
  console.log('Required Environment Variables:')
  console.log('─'.repeat(64))

  for (const envVar of REQUIRED_ENV_VARS) {
    const isSet = !!process.env[envVar.name]
    const status = isSet ? '✅' : '❌'
    console.log(`  ${status} ${envVar.name}`)
    if (!isSet) {
      console.log(`     └─ ${envVar.description}`)
      console.log(`        Get from: ${envVar.where}`)
    }
  }
  console.log('')

  // Show status of recommended variables
  if (missingRecommended.length > 0) {
    console.log('Recommended Environment Variables:')
    console.log('─'.repeat(64))

    for (const envVar of RECOMMENDED_ENV_VARS) {
      const isSet = !!process.env[envVar.name]
      const status = isSet ? '✅' : '⚠️'
      console.log(`  ${status} ${envVar.name}`)
      if (!isSet) {
        console.log(`     └─ ${envVar.description}`)
      }
    }
    console.log('')
  }

  // If required variables are missing, fail with helpful instructions
  if (missingRequired.length > 0) {
    console.log('╔' + '═'.repeat(62) + '╗')
    console.log(
      '║' +
        '  ❌ E2E TESTS CANNOT RUN - Missing Required Configuration'.padEnd(
          62,
        ) +
        '║',
    )
    console.log('╚' + '═'.repeat(62) + '╝')
    console.log('')
    console.log('📝 To fix this:')
    console.log('')
    console.log('   1. Copy the example environment file:')
    console.log('      cp .env.local.example .env.local')
    console.log('')
    console.log('   2. Edit .env.local and add the missing values')
    console.log('')
    console.log('   3. Re-run the tests:')
    console.log('      pnpm --filter @axori/web test:e2e')
    console.log('')
    console.log('📖 See tests/e2e/SETUP.md for detailed instructions')
    console.log('')
    console.log('─'.repeat(64))
    console.log('')

    // Throw error to stop test execution
    throw new Error(
      `E2E tests require environment configuration. Missing: ${missingRequired.map((v) => v.name).join(', ')}. ` +
        `See tests/e2e/SETUP.md for instructions.`,
    )
  }

  // All required variables are set
  console.log('╔' + '═'.repeat(62) + '╗')
  console.log(
    '║' + '  ✅ Environment configured - Starting tests...'.padEnd(62) + '║',
  )
  console.log('╚' + '═'.repeat(62) + '╝')
  console.log('')
}

export default globalSetup
