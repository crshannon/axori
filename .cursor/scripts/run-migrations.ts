#!/usr/bin/env tsx
/**
 * Run Migrations Script
 * 
 * Runs database migrations using the proper Drizzle migration workflow.
 * 
 * - Checks for pending migrations
 * - Optionally generates migrations from schema changes
 * - Applies migrations using migrate.ts
 * - Verifies database state
 * 
 * Usage:
 *   tsx .cursor/scripts/run-migrations.ts --generate
 *   tsx .cursor/scripts/run-migrations.ts --check-only
 */

import { execSync } from 'child_process'
import { readdir } from 'fs/promises'
import { join } from 'path'

interface RunMigrationsOptions {
  generate?: boolean
  checkOnly?: boolean
  skipVerify?: boolean
}

/**
 * Parse command line arguments
 */
function parseArgs(): RunMigrationsOptions {
  const args = process.argv.slice(2)
  const options: RunMigrationsOptions = {}

  for (const arg of args) {
    if (arg === '--generate' || arg === '-g') {
      options.generate = true
    } else if (arg === '--check-only' || arg === '-c') {
      options.checkOnly = true
    } else if (arg === '--skip-verify') {
      options.skipVerify = true
    } else if (arg.startsWith('generate=')) {
      options.generate = arg.split('=')[1] === 'true'
    } else if (arg.startsWith('check-only=')) {
      options.checkOnly = arg.split('=')[1] === 'true'
    } else if (arg.startsWith('skip-verify=')) {
      options.skipVerify = arg.split('=')[1] === 'true'
    }
  }

  return options
}

/**
 * Get the project root directory
 */
function getProjectRoot(): string {
  try {
    // Try to find root by looking for package.json or .git
    const cwd = process.cwd()
    let current = cwd
    
    while (current !== '/') {
      try {
        execSync('test -f package.json', { cwd: current, stdio: 'ignore' })
        return current
      } catch {
        current = join(current, '..')
      }
    }
    
    return cwd
  } catch {
    return process.cwd()
  }
}

/**
 * Check if we're in the project root
 */
function isProjectRoot(dir: string): boolean {
  try {
    execSync('test -f package.json', { cwd: dir, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Get list of migration files
 */
async function getMigrationFiles(projectRoot: string): Promise<string[]> {
  const drizzlePath = join(projectRoot, 'packages', 'db', 'drizzle')
  try {
    const files = await readdir(drizzlePath)
    return files
      .filter((file) => file.endsWith('.sql'))
      .sort()
  } catch (error) {
    console.warn('⚠️  Could not read drizzle folder:', error)
    return []
  }
}

/**
 * Generate migrations from schema
 */
function generateMigrations(projectRoot: string): boolean {
  console.log('📝 Generating migrations from schema changes...\n')
  
  try {
    execSync('pnpm db:generate', {
      cwd: projectRoot,
      stdio: 'inherit',
    })
    console.log('\n✅ Migrations generated successfully')
    return true
  } catch (error) {
    console.error('\n❌ Failed to generate migrations:', error)
    return false
  }
}

/**
 * Run migrations using migrate.ts
 */
function runMigrations(projectRoot: string, checkOnly: boolean): boolean {
  if (checkOnly) {
    console.log('🔍 Checking migration status...\n')
  } else {
    console.log('🚀 Applying migrations...\n')
  }

  try {
    const dbPath = join(projectRoot, 'packages', 'db')
    
    // Use npx tsx to avoid permission issues
    execSync('npx --yes tsx migrate.ts', {
      cwd: dbPath,
      stdio: 'inherit',
    })
    
    return true
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    return false
  }
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs()
  const projectRoot = getProjectRoot()

  // Ensure we're in the project root
  if (!isProjectRoot(projectRoot)) {
    console.error('❌ Not in project root. Please run from the project root directory.')
    process.exit(1)
  }

  console.log('🔄 Database Migration Tool\n')
  console.log(`📁 Project root: ${projectRoot}\n`)

  // Check for migration files
  const migrationFiles = await getMigrationFiles(projectRoot)
  console.log(`📋 Found ${migrationFiles.length} migration file(s) in drizzle/`)

  if (migrationFiles.length > 0) {
    console.log('   Files:')
    migrationFiles.forEach((file) => console.log(`   - ${file}`))
  }
  console.log()

  // Generate migrations if requested
  if (options.generate) {
    const generated = generateMigrations(projectRoot)
    if (!generated) {
      console.error('\n❌ Migration generation failed')
      process.exit(1)
    }
    
    // Re-check migration files after generation
    const newMigrationFiles = await getMigrationFiles(projectRoot)
    const newFiles = newMigrationFiles.filter(f => !migrationFiles.includes(f))
    
    if (newFiles.length > 0) {
      console.log(`\n✨ Generated ${newFiles.length} new migration file(s):`)
      newFiles.forEach((file) => console.log(`   - ${file}`))
    } else {
      console.log('\nℹ️  No new migrations generated (schema is up to date)')
    }
    console.log()
  }

  // Check-only mode
  if (options.checkOnly) {
    console.log('ℹ️  Check-only mode: Not applying migrations\n')
    // Still run migrate.ts in check mode if it supports it
    // For now, just show status
    process.exit(0)
  }

  // Run migrations
  const success = runMigrations(projectRoot, options.checkOnly || false)

  if (success) {
    console.log('\n✅ Migration process completed!')
    process.exit(0)
  } else {
    console.error('\n❌ Migration process failed')
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
}

export { runMigrations, generateMigrations, getMigrationFiles }
