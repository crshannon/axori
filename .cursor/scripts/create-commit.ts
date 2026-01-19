#!/usr/bin/env tsx
/**
 * Create Commit Script
 * 
 * Creates a commit with proper branch management and Linear integration.
 * 
 * - Prevents committing to main/master
 * - Creates branch if needed (from Linear ticket or name)
 * - Links commit to Linear issue
 * - Generates descriptive commit message
 * 
 * Usage:
 *   tsx .cursor/scripts/create-commit.ts --message "Fix bug" --linear AXO-123
 */

import { execSync } from 'child_process'

interface CreateCommitOptions {
  message: string
  linear?: string
  branch?: string
  type?: 'fix' | 'feat' | 'refactor' | 'docs' | 'test' | 'chore'
  updateLinear?: boolean
  stageAll?: boolean
}

interface LinearIssue {
  id: string
  identifier: string
  title: string
  url: string
}

/**
 * Get current git branch
 */
function getCurrentBranch(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    throw new Error('Not in a git repository')
  }
}

/**
 * Check if branch is a protected branch
 */
function isProtectedBranch(branch: string): boolean {
  const protectedBranches = ['main', 'master', 'develop', 'production']
  return protectedBranches.includes(branch.toLowerCase())
}

/**
 * Get Linear issue details
 */
async function getLinearIssue(apiKey: string, identifier: string): Promise<LinearIssue | null> {
  const LINEAR_API_URL = 'https://api.linear.app/graphql'
  
  // Extract issue number from identifier (e.g., "AXO-123" -> "123")
  const issueNumber = identifier.split('-')[1]
  if (!issueNumber) {
    return null
  }

  const query = `
    query {
      issue(identifier: "${identifier}") {
        id
        identifier
        title
        url
      }
    }
  `

  try {
    const response = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({ query }),
    })

    const result = await response.json()
    if (result.data?.issue) {
      return result.data.issue
    }
    return null
  } catch {
    return null
  }
}

/**
 * Update Linear issue status
 */
async function updateLinearIssueStatus(
  apiKey: string,
  issueId: string,
  status: 'started' | 'completed'
): Promise<boolean> {
  const LINEAR_API_URL = 'https://api.linear.app/graphql'
  
  // Get workflow states
  const workflowQuery = `
    query {
      workflowStates {
        nodes {
          id
          name
          type
        }
      }
    }
  `

  try {
    const workflowResponse = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({ query: workflowQuery }),
    })

    const workflowResult = await workflowResponse.json()
    const states = workflowResult.data?.workflowStates?.nodes || []
    
    // Find "In Progress" or "Started" state
    const inProgressState = states.find(
      (state: { name: string; type: string }) =>
        state.type === 'started' || state.name.toLowerCase().includes('in progress')
    )

    if (!inProgressState) {
      return false
    }

    const mutation = `
      mutation {
        issueUpdate(id: "${issueId}", input: { stateId: "${inProgressState.id}" }) {
          success
        }
      }
    `

    const updateResponse = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({ query: mutation }),
    })

    const updateResult = await updateResponse.json()
    return updateResult.data?.issueUpdate?.success || false
  } catch {
    return false
  }
}

/**
 * Generate branch name from Linear issue
 */
function generateBranchName(linearIssue: LinearIssue, type?: string): string {
  const prefix = type === 'fix' ? 'fix' : type === 'feat' ? 'feat' : 'linear'
  const slug = linearIssue.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40)
  
  return `${prefix}/${linearIssue.identifier.toLowerCase()}-${slug}`
}

/**
 * Generate branch name without Linear
 */
function generateBranchNameFromMessage(message: string, type?: string): string {
  const prefix = type || 'feat'
  const slug = message
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40)
  
  return `${prefix}/${slug}`
}

/**
 * Create a branch
 */
function createBranch(branchName: string): void {
  try {
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' })
    console.log(`✅ Created and switched to branch: ${branchName}`)
  } catch (error) {
    throw new Error(`Failed to create branch: ${error instanceof Error ? error.message : error}`)
  }
}

/**
 * Check if there are changes to commit
 */
function hasChanges(): boolean {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim()
    return status.length > 0
  } catch {
    return false
  }
}

/**
 * Get staged files
 */
function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' }).trim()
    return output ? output.split('\n').filter(Boolean) : []
  } catch {
    return []
  }
}

/**
 * Get unstaged files
 */
function getUnstagedFiles(): string[] {
  try {
    const output = execSync('git diff --name-only', { encoding: 'utf-8' }).trim()
    return output ? output.split('\n').filter(Boolean) : []
  } catch {
    return []
  }
}

/**
 * Get diff summary for staged changes
 */
function getStagedDiffSummary(): string {
  try {
    const diff = execSync('git diff --cached --stat', { encoding: 'utf-8' }).trim()
    return diff
  } catch {
    return ''
  }
}

/**
 * Get diff summary for unstaged changes
 */
function getUnstagedDiffSummary(): string {
  try {
    const diff = execSync('git diff --stat', { encoding: 'utf-8' }).trim()
    return diff
  } catch {
    return ''
  }
}

/**
 * Analyze git diff to determine what changed
 */
function analyzeDiff(filePath: string): { added: number; removed: number; type: 'add' | 'modify' | 'delete' } {
  try {
    // Check if file is new
    const status = execSync(`git status --porcelain "${filePath}"`, { encoding: 'utf-8' }).trim()
    if (status.startsWith('??')) {
      return { added: 0, removed: 0, type: 'add' }
    }
    
    // Get diff stats
    const diff = execSync(`git diff --numstat "${filePath}" 2>/dev/null || git diff --cached --numstat "${filePath}" 2>/dev/null`, { encoding: 'utf-8' }).trim()
    if (diff) {
      const [added, removed] = diff.split('\t').map(Number)
      return { 
        added: added || 0, 
        removed: removed || 0, 
        type: added > removed * 2 ? 'add' : removed > added * 2 ? 'delete' : 'modify' 
      }
    }
    
    return { added: 0, removed: 0, type: 'modify' }
  } catch {
    return { added: 0, removed: 0, type: 'modify' }
  }
}

/**
 * Generate commit message from changes
 */
function generateCommitMessageFromChanges(linearIssue?: LinearIssue | null): string {
  const stagedFiles = getStagedFiles()
  const unstagedFiles = getUnstagedFiles()
  const allFiles = [...new Set([...stagedFiles, ...unstagedFiles])]
  
  if (allFiles.length === 0) {
    return linearIssue?.title || 'Update files'
  }

  // Analyze file patterns to determine what was changed
  const patterns = {
    component: /components\/.*\.(tsx|jsx)$/,
    hook: /hooks\/.*\.ts$/,
    util: /utils\/.*\.ts$/,
    api: /api\/.*\.ts$/,
    test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
    config: /\.(config|rc)\.(ts|js|json)$/,
    rule: /\.cursor\/rules\/.*\.mdc$/,
    command: /\.cursor\/commands\/.*\.md$/,
    script: /\.cursor\/scripts\/.*\.ts$/,
  }

  // Analyze the primary file to determine action
  const primaryFile = allFiles.find(f => 
    patterns.component.test(f) || 
    patterns.hook.test(f) || 
    patterns.api.test(f)
  ) || allFiles[0]

  if (primaryFile) {
    const diff = analyzeDiff(primaryFile)
    const fileName = primaryFile.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || ''
    const baseName = fileName.split(/(?=[A-Z])/).join(' ').toLowerCase()
    
    // Determine action based on diff and file patterns
    let action = 'Update'
    if (diff.type === 'add' || primaryFile.includes('add') || primaryFile.includes('create')) {
      action = 'Add'
    } else if (primaryFile.includes('fix') || primaryFile.includes('bug')) {
      action = 'Fix'
    } else if (primaryFile.includes('refactor')) {
      action = 'Refactor'
    } else if (diff.removed > diff.added * 2) {
      action = 'Remove'
    } else if (diff.added > diff.removed * 2) {
      action = 'Add'
    }

    // Check for component changes
    if (patterns.component.test(primaryFile)) {
      return `${action} ${baseName} component`
    }
    
    // Check for hook changes
    if (patterns.hook.test(primaryFile)) {
      return `${action} ${baseName} hook`
    }
    
    // Check for API changes
    if (patterns.api.test(primaryFile)) {
      return `${action} API ${baseName}`
    }
    
    // Check for test changes
    if (patterns.test.test(primaryFile)) {
      return `${action} tests for ${baseName}`
    }
    
    // Check for config/rule changes
    if (patterns.rule.test(primaryFile) || patterns.command.test(primaryFile)) {
      return `${action} ${baseName} configuration`
    }
    
    // Check for script changes
    if (patterns.script.test(primaryFile)) {
      return `${action} ${baseName} script`
    }
    
    return `${action} ${baseName}`
  }

  // Fallback: analyze all files
  const componentFiles = allFiles.filter(f => patterns.component.test(f))
  const hookFiles = allFiles.filter(f => patterns.hook.test(f))
  const apiFiles = allFiles.filter(f => patterns.api.test(f))
  const testFiles = allFiles.filter(f => patterns.test.test(f))
  const configFiles = allFiles.filter(f => patterns.config.test(f) || patterns.rule.test(f) || patterns.command.test(f))

  if (componentFiles.length > 0) {
    const names = componentFiles
      .map(f => f.split('/').pop()?.replace(/\.(tsx|jsx)$/, '') || '')
      .slice(0, 2)
    return `Update ${names.join(' and ')} component${names.length > 1 ? 's' : ''}`
  }

  if (hookFiles.length > 0) {
    return 'Update hooks'
  }

  if (apiFiles.length > 0) {
    return 'Update API routes'
  }

  if (testFiles.length > 0) {
    return 'Add/update tests'
  }

  if (configFiles.length > 0) {
    return 'Update configuration'
  }

  // Final fallback
  const fileCount = allFiles.length
  if (fileCount === 1) {
    const fileName = allFiles[0].split('/').pop() || 'file'
    return `Update ${fileName}`
  }

  return linearIssue?.title || `Update ${fileCount} files`
}

/**
 * Stage all changes
 */
function stageAll(): void {
  try {
    execSync('git add -A', { stdio: 'inherit' })
  } catch (error) {
    throw new Error(`Failed to stage changes: ${error instanceof Error ? error.message : error}`)
  }
}

/**
 * Create commit
 */
function createCommit(message: string): string {
  try {
    // Use -m flag for each line to handle multiline messages properly
    const lines = message.split('\n')
    const args = lines.map((line) => `-m "${line.replace(/"/g, '\\"')}"`).join(' ')
    execSync(`git commit ${args}`, { stdio: 'inherit' })
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
    return hash
  } catch (error) {
    throw new Error(`Failed to create commit: ${error instanceof Error ? error.message : error}`)
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): {
  message?: string
  linear?: string
  branch?: string
  type?: 'fix' | 'feat' | 'refactor' | 'docs' | 'test' | 'chore'
  updateLinear?: boolean
  stageAll?: boolean
} {
  const args = process.argv.slice(2)
  const options: ReturnType<typeof parseArgs> = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--message':
      case '-m':
        options.message = args[++i]
        break
      case '--linear':
      case '-l':
        options.linear = args[++i]
        break
      case '--branch':
      case '-b':
        options.branch = args[++i]
        break
      case '--type':
      case '-t':
        options.type = args[++i] as CreateCommitOptions['type']
        break
      case '--update-linear':
        options.updateLinear = true
        break
      case '--stage-all':
      case '-a':
        options.stageAll = true
        break
    }
  }

  return options
}

/**
 * Main function
 */
async function main() {
  // Check if we're in a git repo
  let currentBranch: string
  try {
    currentBranch = getCurrentBranch()
  } catch (error) {
    console.error('❌ Not in a git repository')
    process.exit(1)
  }

  const options = parseArgs()

  // Check if we're on a protected branch
  if (isProtectedBranch(currentBranch)) {
    console.warn(`⚠️  You're on protected branch: ${currentBranch}`)
    
    if (!options.branch && !options.linear) {
      console.error('❌ Cannot commit directly to protected branch')
      console.error('   Provide --branch or --linear to create a new branch')
      process.exit(1)
    }

    // We'll create a new branch below
    console.log('📦 Will create a new branch before committing')
  }

  // Get Linear issue if provided
  let linearIssue: LinearIssue | null = null
  if (options.linear) {
    const apiKey = process.env.LINEAR_API_KEY
    if (!apiKey) {
      console.warn('⚠️  LINEAR_API_KEY not set, skipping Linear integration')
    } else {
      console.log(`🔗 Fetching Linear issue: ${options.linear}...`)
      linearIssue = await getLinearIssue(apiKey, options.linear)
      if (linearIssue) {
        console.log(`✅ Found: ${linearIssue.title}`)
      } else {
        console.warn(`⚠️  Could not find Linear issue: ${options.linear}`)
      }
    }
  }

  // Determine branch name
  let targetBranch = currentBranch
  if (isProtectedBranch(currentBranch) || options.branch) {
    if (options.branch) {
      targetBranch = options.branch
    } else if (linearIssue) {
      targetBranch = generateBranchName(linearIssue, options.type)
    } else if (options.message) {
      targetBranch = generateBranchNameFromMessage(options.message, options.type)
    } else {
      console.error('❌ Need --branch, --linear, or --message to create branch')
      process.exit(1)
    }

    // Create the branch
    createBranch(targetBranch)
    currentBranch = targetBranch
  }

  // Check for changes
  if (!hasChanges()) {
    console.error('❌ No changes to commit')
    console.error('   Make some changes first, or use --stage-all if files are already staged')
    process.exit(1)
  }

  // Stage changes if requested
  if (options.stageAll) {
    console.log('📝 Staging all changes...')
    stageAll()
  } else {
    // Check if there are unstaged changes
    try {
      const unstaged = execSync('git diff --name-only', { encoding: 'utf-8' }).trim()
      if (unstaged) {
        console.warn('⚠️  You have unstaged changes')
        console.warn('   Use --stage-all to stage all changes, or stage manually with git add')
      }
    } catch {
      // No unstaged changes, that's fine
    }
  }

  // Generate commit message
  let commitMessage = options.message
  
  // If no message provided, generate one from changes
  if (!commitMessage) {
    console.log('📝 Generating commit message from changes...')
    commitMessage = generateCommitMessageFromChanges(linearIssue)
    if (commitMessage) {
      console.log(`✅ Generated message: "${commitMessage}"`)
    } else {
      console.error('❌ Could not generate commit message. Use --message "Your message"')
      process.exit(1)
    }
  }

  // Add Linear reference if available
  if (linearIssue) {
    commitMessage = `${commitMessage}\n\nRefs: ${linearIssue.identifier}`
  }

  // Add type prefix if not already present
  if (options.type && !commitMessage.startsWith(`${options.type}:`)) {
    commitMessage = `${options.type}: ${commitMessage}`
  }

  // Create commit
  console.log('💾 Creating commit...')
  const commitHash = createCommit(commitMessage)

  console.log('✅ Commit created successfully!')
  console.log(`   Hash: ${commitHash}`)
  console.log(`   Branch: ${currentBranch}`)
  
  if (linearIssue) {
    console.log(`   Linear: ${linearIssue.identifier} - ${linearIssue.title}`)
    console.log(`   Link: ${linearIssue.url}`)
  }

  // Update Linear issue status if requested
  if (options.updateLinear && linearIssue && process.env.LINEAR_API_KEY) {
    console.log('🔄 Updating Linear issue status...')
    const updated = await updateLinearIssueStatus(process.env.LINEAR_API_KEY, linearIssue.id, 'started')
    if (updated) {
      console.log('✅ Linear issue status updated to "In Progress"')
    } else {
      console.warn('⚠️  Could not update Linear issue status')
    }
  }

  console.log('\n💡 Next steps:')
  console.log(`   git push -u origin ${currentBranch}`)
  if (linearIssue) {
    console.log(`   Or create PR: .cursor/scripts/create-pr.sh --title "${linearIssue.title}"`)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
}

export { createCommit, getCurrentBranch, isProtectedBranch, generateBranchName }

