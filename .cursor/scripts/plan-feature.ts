#!/usr/bin/env tsx
/**
 * Plan Feature Script
 * 
 * Creates a structured plan for implementing a feature based on a Linear ticket.
 * Uses all defined rules and agents to guide implementation.
 * 
 * Usage:
 *   tsx .cursor/scripts/plan-feature.ts --linear AXO-123
 */

import { execSync } from 'child_process'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'

config()

interface LinearIssue {
  id: string
  identifier: string
  title: string
  description?: string
  url: string
  state?: {
    name: string
  }
  priority?: number
  labels?: {
    nodes: Array<{ name: string }>
  }
}

interface PlanFeatureOptions {
  linear: string
  scope?: 'frontend' | 'backend' | 'fullstack' | 'infra'
  focus?: 'components' | 'api' | 'database' | 'ui' | 'integration'
  branch?: boolean
}

/**
 * Validate and sanitize Linear identifier components
 */
function validateIdentifier(identifier: string): { teamKey: string; issueNumber: number } | null {
  // Parse identifier (e.g., "AXO-7" -> teamKey: "AXO", number: 7)
  const parts = identifier.split('-')
  if (parts.length !== 2) {
    return null
  }
  
  const teamKey = parts[0].trim()
  const issueNumberStr = parts[1].trim()
  
  // Validate teamKey: alphanumeric, 1-10 characters (typical Linear team keys)
  // This prevents GraphQL injection by ensuring only safe characters
  if (!/^[A-Z0-9]{1,10}$/i.test(teamKey)) {
    return null
  }
  
  // Validate issueNumber: must be a positive integer
  const issueNumber = parseInt(issueNumberStr, 10)
  if (isNaN(issueNumber) || issueNumber <= 0 || issueNumber > 999999) {
    return null
  }
  
  return { teamKey: teamKey.toUpperCase(), issueNumber }
}

/**
 * Get Linear issue details
 */
async function getLinearIssue(apiKey: string, identifier: string): Promise<LinearIssue | null> {
  const LINEAR_API_URL = 'https://api.linear.app/graphql'
  
  // Validate and sanitize identifier
  const validated = validateIdentifier(identifier)
  if (!validated) {
    console.warn(`⚠️  Invalid Linear identifier format: ${identifier}`)
    return null
  }
  
  const { teamKey, issueNumber } = validated

  // Query issues by team and number
  // teamKey is validated to be alphanumeric only, preventing injection
  // issueNumber is validated to be a safe integer
  const query = `
    query {
      issues(
        filter: {
          team: {
            key: {
              eq: "${teamKey}"
            }
          }
          number: {
            eq: ${issueNumber}
          }
        }
        first: 1
      ) {
        nodes {
          id
          identifier
          title
          description
          url
          state {
            name
          }
          priority
          labels {
            nodes {
              name
            }
          }
        }
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
    
    if (result.errors) {
      console.warn(`⚠️  Linear API error: ${result.errors[0]?.message || 'Unknown error'}`)
      return null
    }
    
    if (result.data?.issues?.nodes?.length > 0) {
      return result.data.issues.nodes[0]
    }
    return null
  } catch (error) {
    console.warn(`⚠️  Error fetching Linear issue: ${error instanceof Error ? error.message : error}`)
    return null
  }
}

/**
 * Detect scope from issue title and description
 */
function detectScope(issue: LinearIssue): 'frontend' | 'backend' | 'fullstack' | 'infra' {
  const text = `${issue.title} ${issue.description || ''}`.toLowerCase()
  
  if (text.includes('api') || text.includes('route') || text.includes('endpoint') || text.includes('database') || text.includes('schema')) {
    if (text.includes('component') || text.includes('ui') || text.includes('page') || text.includes('frontend')) {
      return 'fullstack'
    }
    return 'backend'
  }
  
  if (text.includes('component') || text.includes('ui') || text.includes('page') || text.includes('frontend') || text.includes('design')) {
    return 'frontend'
  }
  
  if (text.includes('infra') || text.includes('deploy') || text.includes('ci/cd') || text.includes('docker')) {
    return 'infra'
  }
  
  return 'fullstack'
}

/**
 * Detect focus area
 */
function detectFocus(issue: LinearIssue, scope: string): 'components' | 'api' | 'database' | 'ui' | 'integration' {
  const text = `${issue.title} ${issue.description || ''}`.toLowerCase()
  
  if (text.includes('component') || text.includes('hook') || text.includes('widget')) {
    return 'components'
  }
  
  if (text.includes('api') || text.includes('route') || text.includes('endpoint')) {
    return 'api'
  }
  
  if (text.includes('database') || text.includes('schema') || text.includes('migration') || text.includes('table')) {
    return 'database'
  }
  
  if (text.includes('ui') || text.includes('design') || text.includes('styling') || text.includes('theme')) {
    return 'ui'
  }
  
  if (text.includes('integrate') || text.includes('connect') || text.includes('sync')) {
    return 'integration'
  }
  
  // Default based on scope
  if (scope === 'frontend') return 'components'
  if (scope === 'backend') return 'api'
  return 'components'
}

/**
 * Generate plan content
 */
function generatePlan(issue: LinearIssue, options: PlanFeatureOptions): string {
  const scope = options.scope || detectScope(issue)
  const focus = options.focus || detectFocus(issue, scope)
  const slug = issue.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50)
  const planId = `${issue.identifier.toLowerCase()}-${slug}`
  
  const rules = getRelevantRules(scope, focus)
  const tasks = generateTasks(issue, scope, focus)
  
  return `# ${issue.title}

**Linear Issue**: [${issue.identifier}](${issue.url})  
**Status**: ${issue.state?.name || 'Unknown'}  
**Priority**: ${getPriorityLabel(issue.priority)}  
**Created**: ${new Date().toISOString().split('T')[0]}

## Overview

${issue.description || 'No description provided. Review Linear ticket for details.'}

## Scope & Focus

- **Scope**: ${scope}
- **Focus Area**: ${focus}
- **Plan ID**: \`${planId}\`

## Requirements

${extractRequirements(issue.description || '')}

## Architecture Considerations

${getArchitectureGuidance(scope, focus)}

## Implementation Plan

${tasks}

## Testing Strategy

${getTestingStrategy(scope, focus)}

## Design System Considerations

${getDesignSystemGuidance(focus)}

## Relevant Rules

The following rules apply to this feature:

${rules.map(r => `- **${r.name}** (${r.path}) - ${r.description}`).join('\n')}

## Dependencies

${getDependencies(issue)}

## Next Steps

1. Review this plan and Linear ticket
2. Create feature branch: \`git checkout -b feature/${planId}\`
3. Start with first task in Implementation Plan
4. Follow rule references for each task
5. Write tests as you implement
6. Update plan as you progress

## Notes

- Use \`/create-commit -l ${issue.identifier}\` to commit with Linear reference
- Reference this plan in commit messages: \`Refs: ${issue.identifier}, Plan: ${planId}\`
- Update plan status as tasks are completed
`
}

/**
 * Get relevant rules based on scope and focus
 */
function getRelevantRules(scope: string, focus: string): Array<{ name: string; path: string; description: string }> {
  const rules: Array<{ name: string; path: string; description: string }> = []
  
  // Always apply
  rules.push({
    name: 'Project Structure',
    path: '.cursor/rules/project-structure.mdc',
    description: 'Component placement and import patterns'
  })
  
  rules.push({
    name: 'Testing Reminders',
    path: '.cursor/rules/testing-reminders.mdc',
    description: 'Testing best practices and patterns'
  })
  
  // Scope-based rules
  if (scope === 'frontend' || scope === 'fullstack') {
    rules.push({
      name: 'UI Components',
      path: '.cursor/rules/ui-components.mdc',
      description: 'Design system component usage'
    })
    rules.push({
      name: 'Design System',
      path: '.cursor/rules/design-system.mdc',
      description: 'Design system patterns and CSS variables'
    })
    rules.push({
      name: 'Tailwind Best Practices',
      path: '.cursor/rules/tailwind-best-practices.mdc',
      description: 'Tailwind CSS patterns and dark mode'
    })
    rules.push({
      name: 'Learning Hub Integration',
      path: '.cursor/rules/learning-hub-integration.mdc',
      description: 'Learning Hub component integration'
    })
  }
  
  if (scope === 'backend' || scope === 'fullstack') {
    rules.push({
      name: 'Architecture',
      path: '.cursor/rules/architecture.mdc',
      description: 'API routes, naming conventions, code organization'
    })
    rules.push({
      name: 'Error Handling',
      path: '.cursor/rules/error-handling.mdc',
      description: 'Centralized API error handling'
    })
    rules.push({
      name: 'Schema Alignment',
      path: '.cursor/rules/schema-alignment.mdc',
      description: 'Drizzle-Zod alignment patterns'
    })
    rules.push({
      name: 'Drizzle ORM',
      path: '.cursor/rules/drizzle-orm.mdc',
      description: 'Database schema and query patterns'
    })
    rules.push({
      name: 'Zod Validation',
      path: '.cursor/rules/zod-validation.mdc',
      description: 'Validation schema patterns'
    })
  }
  
  // Focus-based rules
  if (focus === 'components' || focus === 'ui') {
    rules.push({
      name: 'Type Safety',
      path: '.cursor/rules/type-safety.mdc',
      description: 'TypeScript type inference patterns'
    })
  }
  
  return rules
}

/**
 * Generate implementation tasks
 */
function generateTasks(issue: LinearIssue, scope: string, focus: string): string {
  const tasks: string[] = []
  
  if (scope === 'frontend' || scope === 'fullstack') {
    if (focus === 'components') {
      tasks.push(`### 1. Component Structure
- [ ] Determine component location (reusable vs page-specific)
- [ ] Create component file following project structure rules
- [ ] Define TypeScript interfaces using type inference
- [ ] Reference: \`.cursor/rules/project-structure.mdc\``)
      
      tasks.push(`### 2. Design System Integration
- [ ] Use \`@axori/ui\` components instead of raw HTML
- [ ] Apply CSS variables for colors
- [ ] Implement dark mode with Tailwind \`dark:\` classes
- [ ] Reference: \`.cursor/rules/design-system.mdc\``)
      
      tasks.push(`### 3. Learning Hub Integration
- [ ] Add LearningHubButton if component needs contextual help
- [ ] Create learning snippets in \`apps/web/src/data/learning-hub/\`
- [ ] Link to future Learning Hub pages
- [ ] Reference: \`.cursor/rules/learning-hub-integration.mdc\``)
    }
  }
  
  if (scope === 'backend' || scope === 'fullstack') {
    if (focus === 'api') {
      tasks.push(`### 1. API Route Setup
- [ ] Create route file following naming conventions
- [ ] Use \`withErrorHandling\` wrapper for error handling
- [ ] Reference: \`.cursor/rules/error-handling.mdc\``)
      
      tasks.push(`### 2. Validation & Types
- [ ] Create/update Zod schema using drizzle-zod
- [ ] Use \`InferSelectModel\` and \`InferInsertModel\` for types
- [ ] Reference: \`.cursor/rules/schema-alignment.mdc\``)
    }
    
    if (focus === 'database') {
      tasks.push(`### 1. Schema Definition
- [ ] Define Drizzle schema (single source of truth)
- [ ] Generate Zod schema using drizzle-zod
- [ ] Export types from \`packages/db/src/types.ts\`
- [ ] Reference: \`.cursor/rules/drizzle-orm.mdc\``)
      
      tasks.push(`### 2. Migration
- [ ] Create migration using Drizzle Kit
- [ ] Test migration up and down
- [ ] Reference: \`.cursor/rules/architecture.mdc\``)
    }
  }
  
  tasks.push(`### Testing
- [ ] Write unit tests for utilities/hooks
- [ ] Write integration tests for API routes (if applicable)
- [ ] Write E2E tests for user flows (if applicable)
- [ ] Reference: \`.cursor/rules/testing-reminders.mdc\``)
  
  return tasks.join('\n\n')
}

/**
 * Get architecture guidance
 */
function getArchitectureGuidance(scope: string, focus: string): string {
  if (scope === 'backend' || scope === 'fullstack') {
    if (focus === 'api') {
      return `- Use Hono router patterns
- Follow RESTful conventions
- Use centralized error handling from \`apps/api/src/utils/errors.ts\`
- Validate all inputs with Zod schemas
- Reference: \`.cursor/rules/architecture.mdc\``
    }
    
    if (focus === 'database') {
      return `- Drizzle schema is single source of truth
- Generate Zod schemas with drizzle-zod
- Use type inference (InferSelectModel/InferInsertModel)
- Follow naming conventions (snake_case in DB, camelCase in code)
- Reference: \`.cursor/rules/schema-alignment.mdc\``
    }
  }
  
  if (scope === 'frontend' || scope === 'fullstack') {
    return `- Place reusable components in \`packages/ui/src/components/\`
- Place page-specific components in \`apps/web/src/components/\`
- Use package imports (\`@axori/ui\`, \`@axori/shared\`, etc.)
- Reference: \`.cursor/rules/project-structure.mdc\``
  }
  
  return 'Review architecture rules for guidance.'
}

/**
 * Get testing strategy
 */
function getTestingStrategy(scope: string, focus: string): string {
  const strategies: string[] = []
  
  if (scope === 'frontend' || scope === 'fullstack') {
    if (focus === 'components') {
      strategies.push('- **Unit Tests**: Test component rendering and props')
      strategies.push('- **E2E Tests**: Test user interactions and flows')
    }
  }
  
  if (scope === 'backend' || scope === 'fullstack') {
    if (focus === 'api') {
      strategies.push('- **Integration Tests**: Test API endpoints with database')
      strategies.push('- **Unit Tests**: Test utility functions and validators')
    }
    
    if (focus === 'database') {
      strategies.push('- **Migration Tests**: Verify schema changes')
      strategies.push('- **Integration Tests**: Test queries and relationships')
    }
  }
  
  strategies.push('- Reference: `.cursor/rules/testing-reminders.mdc`')
  
  return strategies.join('\n')
}

/**
 * Get design system guidance
 */
function getDesignSystemGuidance(focus: string): string {
  if (focus === 'components' || focus === 'ui') {
    return `- Use \`@axori/ui\` components (Button, Card, Typography, etc.)
- Use CSS variables: \`bg-[rgb(var(--color-primary))]\`
- Use Tailwind \`dark:\` classes for dark mode
- Extract reusable patterns to \`packages/ui/src/components/\`
- Reference: \`.cursor/rules/design-system.mdc\``
  }
  
  return 'N/A - Not a UI-focused feature'
}

/**
 * Extract requirements from description
 */
function extractRequirements(description: string): string {
  if (!description) {
    return 'Review Linear ticket for detailed requirements.'
  }
  
  // Try to extract bullet points or numbered lists
  const lines = description.split('\n').filter(line => 
    line.trim().startsWith('-') || 
    line.trim().startsWith('*') || 
    line.trim().match(/^\d+\./)
  )
  
  if (lines.length > 0) {
    return lines.join('\n')
  }
  
  return description.substring(0, 500) + (description.length > 500 ? '...' : '')
}

/**
 * Get dependencies
 */
function getDependencies(issue: LinearIssue): string {
  const labels = issue.labels?.nodes?.map(l => l.name) || []
  
  if (labels.length > 0) {
    return `- Labels: ${labels.join(', ')}\n- Check for related Linear issues`
  }
  
  return '- Review Linear ticket for dependencies\n- Check for related issues'
}

/**
 * Get priority label
 */
function getPriorityLabel(priority?: number): string {
  if (!priority) return 'Not set'
  const labels: Record<number, string> = {
    0: 'No Priority',
    1: 'Urgent',
    2: 'High',
    3: 'Medium',
    4: 'Low',
  }
  return labels[priority] || 'Unknown'
}

/**
 * Generate branch name
 */
function generateBranchName(issue: LinearIssue): string {
  const slug = issue.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40)
  
  return `feature/${issue.identifier.toLowerCase()}-${slug}`
}

/**
 * Create branch
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
 * Parse command line arguments
 */
function parseArgs(): PlanFeatureOptions {
  const args = process.argv.slice(2)
  const options: Partial<PlanFeatureOptions> = { branch: true }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--linear':
      case '-l':
        options.linear = args[++i]
        break
      case '--scope':
      case '-s':
        options.scope = args[++i] as PlanFeatureOptions['scope']
        break
      case '--focus':
      case '-f':
        options.focus = args[++i] as PlanFeatureOptions['focus']
        break
      case '--no-branch':
        options.branch = false
        break
    }
  }

  return options as PlanFeatureOptions
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs()

  if (!options.linear) {
    console.error('❌ Linear issue identifier is required')
    console.error('   Usage: tsx .cursor/scripts/plan-feature.ts --linear AXO-123')
    process.exit(1)
  }

  const apiKey = process.env.LINEAR_API_KEY
  if (!apiKey) {
    console.error('❌ LINEAR_API_KEY not set in .env')
    process.exit(1)
  }

  console.log(`🔗 Fetching Linear issue: ${options.linear}...`)
  const issue = await getLinearIssue(apiKey, options.linear)
  
  if (!issue) {
    console.error(`❌ Could not find Linear issue: ${options.linear}`)
    process.exit(1)
  }

  console.log(`✅ Found: ${issue.title}`)

  // Generate plan
  console.log('📝 Generating plan...')
  const planContent = generatePlan(issue, options)
  
  // Create plan file
  const slug = issue.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50)
  const planId = `${issue.identifier.toLowerCase()}-${slug}`
  const planFileName = `${planId}.plan.md`
  const plansDir = join(process.cwd(), '.cursor', 'plans')
  
  mkdirSync(plansDir, { recursive: true })
  const planPath = join(plansDir, planFileName)
  
  writeFileSync(planPath, planContent)
  console.log(`✅ Plan created: ${planPath}`)

  // Create branch if requested
  if (options.branch) {
    const branchName = generateBranchName(issue)
    console.log(`🌿 Creating branch: ${branchName}...`)
    try {
      createBranch(branchName)
    } catch (error) {
      console.warn(`⚠️  Could not create branch: ${error instanceof Error ? error.message : error}`)
      console.warn('   You can create it manually later')
    }
  }

  console.log('\n📋 Next Steps:')
  console.log(`   1. Review plan: ${planPath}`)
  console.log(`   2. Review Linear ticket: ${issue.url}`)
  console.log(`   3. Start implementing following the plan`)
  console.log(`   4. Use /create-commit -l ${issue.identifier} to commit`)
  console.log(`\n💡 Tip: Reference this plan in your commits: Plan: ${planId}`)
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
}

export { getLinearIssue, generatePlan, detectScope, detectFocus }

