#!/usr/bin/env tsx
/**
 * Pre-Commit Script
 *
 * Runs all quality checks (linting, type checking, tests, and build)
 * to ensure code is ready for commit and will build successfully on the server.
 *
 * Usage:
 *   tsx .cursor/scripts/pre-commit.ts
 *   tsx .cursor/scripts/pre-commit.ts --skip-build
 *   tsx .cursor/scripts/pre-commit.ts --skip-tests --skip-lint
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

interface PreCommitOptions {
  skipBuild: boolean
  skipTests: boolean
  skipLint: boolean
  skipTypeCheck: boolean
}

/**
 * Parse command line arguments
 */
function parseArgs(): PreCommitOptions {
  const args = process.argv.slice(2)
  const options: PreCommitOptions = {
    skipBuild: false,
    skipTests: false,
    skipLint: false,
    skipTypeCheck: false,
  }

  for (const arg of args) {
    switch (arg) {
      case '--skip-build':
        options.skipBuild = true
        break
      case '--skip-tests':
        options.skipTests = true
        break
      case '--skip-lint':
        options.skipLint = true
        break
      case '--skip-type-check':
        options.skipTypeCheck = true
        break
      case '--help':
      case '-h':
        console.log(`
Pre-Commit Quality Checks

Usage:
  tsx .cursor/scripts/pre-commit.ts [options]

Options:
  --skip-build         Skip build step
  --skip-tests         Skip running tests
  --skip-lint          Skip linting checks
  --skip-type-check    Skip TypeScript type checking
  --help, -h           Show this help message

Examples:
  tsx .cursor/scripts/pre-commit.ts
  tsx .cursor/scripts/pre-commit.ts --skip-build
  tsx .cursor/scripts/pre-commit.ts --skip-tests --skip-lint
`)
        process.exit(0)
        break
      default:
        if (arg.startsWith('--')) {
          console.warn(`⚠️  Unknown option: ${arg}`)
        }
        break
    }
  }

  return options
}

/**
 * Check if we're in the project root
 */
function checkProjectRoot(): void {
  const packageJsonPath = join(process.cwd(), 'package.json')
  const turboJsonPath = join(process.cwd(), 'turbo.json')

  if (!existsSync(packageJsonPath) || !existsSync(turboJsonPath)) {
    console.error(
      '❌ Error: Must run from project root (where package.json and turbo.json exist)',
    )
    process.exit(1)
  }
}

/**
 * Run a command and return success status
 */
function runCommand(
  command: string,
  description: string,
  options: { silent?: boolean } = {},
): boolean {
  try {
    console.log(`\n🔍 ${description}...`)
    if (!options.silent) {
      execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd(),
      })
    } else {
      execSync(command, {
        stdio: 'pipe',
        cwd: process.cwd(),
      })
    }
    console.log(`✅ ${description} passed`)
    return true
  } catch (error) {
    console.error(`\n❌ ${description} failed`)
    return false
  }
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs()

  console.log('\n🚀 Running pre-commit quality checks...\n')

  // Check we're in the right directory
  checkProjectRoot()

  const results: { name: string; passed: boolean }[] = []

  // Run linting
  if (!options.skipLint) {
    // Always auto-fix linting issues first
    console.log('\n🔧 Auto-fixing linting issues...')
    const fixPassed = runCommand('turbo run lint:fix', 'Lint fix', {
      silent: false,
    })
    if (!fixPassed) {
      console.warn(
        '\n⚠️  Some linting issues could not be auto-fixed. Continuing with lint check...',
      )
    }

    const passed = runCommand('turbo run lint', 'Linting')
    results.push({ name: 'Linting', passed })
    if (!passed) {
      console.error(
        '\n❌ Linting failed after auto-fix. Please manually fix remaining linting errors before committing.',
      )
      process.exit(1)
    }
  } else {
    console.log('\n⏭️  Skipping linting (--skip-lint)')
  }

  // Run type checking
  if (!options.skipTypeCheck) {
    const passed = runCommand('turbo run type-check', 'Type checking')
    results.push({ name: 'Type checking', passed })
    if (!passed) {
      console.error(
        '\n❌ Type checking failed. Please fix type errors before committing.',
      )
      process.exit(1)
    }
  } else {
    console.log('\n⏭️  Skipping type checking (--skip-type-check)')
  }

  // Run tests
  if (!options.skipTests) {
    const passed = runCommand('turbo run test', 'Tests')
    results.push({ name: 'Tests', passed })
    if (!passed) {
      console.error('\n❌ Tests failed. Please fix failing tests before committing.')
      process.exit(1)
    }
  } else {
    console.log('\n⏭️  Skipping tests (--skip-tests)')
  }

  // Run build
  if (!options.skipBuild) {
    const passed = runCommand('turbo run build', 'Build')
    results.push({ name: 'Build', passed })
    if (!passed) {
      console.error(
        '\n❌ Build failed. Please fix build errors before committing.',
      )
      process.exit(1)
    }
  } else {
    console.log('\n⏭️  Skipping build (--skip-build)')
  }

  // Summary
  const allPassed = results.every((r) => r.passed)
  const ranChecks = results.length

  console.log('\n' + '='.repeat(60))
  if (allPassed) {
    console.log('✅ All quality checks passed!')
    console.log(`   Ran ${ranChecks} check${ranChecks !== 1 ? 's' : ''}`)
    console.log('='.repeat(60) + '\n')
    process.exit(0)
  } else {
    console.log('❌ Some quality checks failed')
    console.log('='.repeat(60) + '\n')
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  })
}
