/**
 * Global Setup for E2E Tests
 *
 * Runs before all tests to verify environment is properly configured.
 * If environment is not ready, provides helpful error messages.
 *
 * REQUIREMENTS:
 * - VITE_CLERK_PUBLISHABLE_KEY must be set in .env.local
 * - DATABASE_URL must be set (for API server)
 * - Servers must be able to start successfully
 *
 * @see AXO-120 - Drawer Factory Integration Tests
 */

import type { FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('\n📋 Running E2E Test Global Setup...')
  console.log('━'.repeat(60))

  // Check if running in CI or local
  const isCI = !!process.env.CI
  console.log(`🔧 Environment: ${isCI ? 'CI' : 'Local'}`)

  // Log base URL
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000'
  console.log(`🌐 Base URL: ${baseURL}`)

  // Check for required environment variables
  const requiredEnvVars = [
    'VITE_CLERK_PUBLISHABLE_KEY',
  ]

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  )

  if (missingEnvVars.length > 0) {
    console.log('\n⚠️  WARNING: Missing environment variables:')
    missingEnvVars.forEach((envVar) => {
      console.log(`   - ${envVar}`)
    })
    console.log('\n📝 To run E2E tests:')
    console.log('   1. Copy .env.local.example to .env.local')
    console.log('   2. Fill in the required values')
    console.log('   3. Re-run the tests\n')
    console.log('   For more info, see the README or SETUP.md')
    console.log('━'.repeat(60))
  } else {
    console.log('✅ Environment variables configured')
    console.log('━'.repeat(60))
    console.log('✅ Global setup complete\n')
  }
}

export default globalSetup
