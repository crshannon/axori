#!/usr/bin/env tsx
/**
 * Create Linear Issue Script
 *
 * Creates a Linear issue from the command line or Cursor context.
 *
 * Prerequisites:
 * - Linear API key set in LINEAR_API_KEY environment variable
 * - Linear team ID set in LINEAR_TEAM_ID environment variable (optional, will prompt)
 *
 * Usage:
 *   LINEAR_API_KEY=xxx tsx .cursor/scripts/create-linear-issue.ts
 *
 * Or with interactive prompts:
 *   LINEAR_API_KEY=xxx tsx .cursor/scripts/create-linear-issue.ts --interactive
 *
 * Or with arguments:
 *   LINEAR_API_KEY=xxx tsx .cursor/scripts/create-linear-issue.ts --title "Fix bug" --description "Description here" --priority high
 */

import { readFileSync } from 'fs'
import { join } from 'path'

interface CreateIssueOptions {
  title: string
  description?: string
  priority?: 'urgent' | 'high' | 'medium' | 'low'
  teamId?: string
  projectId?: string
  labels?: string[]
  assigneeId?: string
  stateId?: string
  parentId?: string
  dueDate?: string // ISO date string (YYYY-MM-DD)
}

interface LinearIssueResponse {
  data?: {
    issueCreate: {
      issue: {
        id: string
        identifier: string
        title: string
        url: string
      }
      success: boolean
    }
  }
  errors?: Array<{
    message: string
    extensions?: {
      code?: string
    }
  }>
}

/**
 * Linear GraphQL API endpoint
 */
const LINEAR_API_URL = 'https://api.linear.app/graphql'

/**
 * Create a Linear issue using GraphQL API
 */
async function createLinearIssue(
  apiKey: string,
  options: CreateIssueOptions
): Promise<{ success: boolean; issueId?: string; issueIdentifier?: string; url?: string; error?: string }> {
  const {
    title,
    description = '',
    priority = 'medium',
    teamId,
    projectId,
    labels = [],
    assigneeId,
    stateId,
  } = options

  if (!teamId) {
    return {
      success: false,
      error: 'Team ID is required. Set LINEAR_TEAM_ID or use --team-id flag.',
    }
  }

  // GraphQL mutation to create an issue
  const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          title
          url
        }
      }
    }
  `

  // Map priority string to Linear priority integer
  // Linear uses: 0 = No priority, 1 = Urgent, 2 = High, 3 = Medium, 4 = Low
  const priorityMap: Record<string, number> = {
    urgent: 1,
    high: 2,
    medium: 3,
    low: 4,
  }

  // Build input object
  const input: Record<string, unknown> = {
    title,
    description,
    teamId,
  }

  // Add priority if provided (0 = no priority, so we skip it)
  if (priority && priorityMap[priority.toLowerCase()]) {
    input.priority = priorityMap[priority.toLowerCase()]
  }

  if (projectId) {
    input.projectId = projectId
  }

  if (labels && labels.length > 0) {
    // Labels should be label IDs, not names
    // Linear expects labelIds as an array of strings
    input.labelIds = labels.filter((id) => id && typeof id === 'string')
  }

  if (assigneeId) {
    input.assigneeId = assigneeId
  }

  if (stateId) {
    input.stateId = stateId
  }

  if (options.parentId) {
    input.parentId = options.parentId
  }

  if (options.dueDate) {
    // Linear expects due date as ISO date string
    input.dueDate = options.dueDate
  }

  try {
    const response = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { input },
      }),
    })

    const result: LinearIssueResponse = await response.json()

    if (result.errors && result.errors.length > 0) {
      const errorMessages = result.errors.map((e) => {
        const message = e.message || 'Unknown error'
        const code = e.extensions?.code || ''
        return code ? `${message} (${code})` : message
      })
      return {
        success: false,
        error: errorMessages.join(', '),
      }
    }

    if (result.data?.issueCreate.success && result.data.issueCreate.issue) {
      const issue = result.data.issueCreate.issue
      return {
        success: true,
        issueId: issue.id,
        issueIdentifier: issue.identifier,
        url: issue.url,
      }
    }

    return {
      success: false,
      error: 'Unknown error creating issue',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create issue',
    }
  }
}

/**
 * Get teams from Linear workspace
 */
async function getTeams(apiKey: string): Promise<Array<{ id: string; name: string; key: string }>> {
  const query = `
    query {
      teams {
        nodes {
          id
          name
          key
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
    return result.data?.teams?.nodes || []
  } catch {
    return []
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): {
  title?: string
  description?: string
  priority?: 'urgent' | 'high' | 'medium' | 'low'
  teamId?: string
  projectId?: string
  labels?: string[]
  assigneeId?: string
  stateId?: string
  interactive: boolean
  fromContext?: boolean
} {
  const args = process.argv.slice(2)
  const options: ReturnType<typeof parseArgs> = {
    interactive: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--title':
      case '-t':
        options.title = args[++i]
        break
      case '--description':
      case '-d':
        options.description = args[++i]
        break
      case '--priority':
      case '-p':
        options.priority = args[++i] as 'urgent' | 'high' | 'medium' | 'low'
        break
      case '--team-id':
        options.teamId = args[++i]
        break
      case '--project-id':
        options.projectId = args[++i]
        break
      case '--labels':
      case '-l':
        options.labels = args[++i].split(',').map((s) => s.trim())
        break
      case '--assignee-id':
        options.assigneeId = args[++i]
        break
      case '--state-id':
        options.stateId = args[++i]
        break
      case '--interactive':
      case '-i':
        options.interactive = true
        break
      case '--from-context':
        options.fromContext = true
        break
    }
  }

  return options
}

/**
 * Main function
 */
async function main() {
  const apiKey = process.env.LINEAR_API_KEY
  if (!apiKey) {
    console.error('❌ LINEAR_API_KEY environment variable is required')
    console.error('   Get your API key from: https://linear.app/settings/api')
    process.exit(1)
  }

  let options = parseArgs()
  const teamId = process.env.LINEAR_TEAM_ID || options.teamId

  // Interactive mode - prompt for missing information
  if (options.interactive || !options.title) {
    // In a real implementation, you'd use readline or a library like inquirer
    // For now, we'll require title as a minimum
    if (!options.title) {
      console.error('❌ Title is required. Use --title "Issue Title" or --interactive')
      process.exit(1)
    }
  }

  // If from context, try to read current file/selection
  if (options.fromContext) {
    // This would be enhanced to read from Cursor context
    // For now, just use provided options
  }

  // If no team ID, try to get teams and use first one
  let finalTeamId = teamId
  if (!finalTeamId) {
    console.log('📋 Fetching teams from Linear...')
    const teams = await getTeams(apiKey)
    if (teams.length === 0) {
      console.error('❌ No teams found. Set LINEAR_TEAM_ID environment variable')
      process.exit(1)
    }
    if (teams.length === 1) {
      finalTeamId = teams[0].id
      console.log(`✅ Using team: ${teams[0].name} (${teams[0].key})`)
    } else {
      console.log('Available teams:')
      teams.forEach((team, i) => {
        console.log(`  ${i + 1}. ${team.name} (${team.key})`)
      })
      console.error('❌ Multiple teams found. Set LINEAR_TEAM_ID or use --team-id')
      process.exit(1)
    }
  }

  console.log('🚀 Creating Linear issue...')
  if (!options.title) {
    console.error('❌ Title is required')
    process.exit(1)
  }
  const result = await createLinearIssue(apiKey, {
    ...options,
    title: options.title,
    teamId: finalTeamId,
  })

  if (result.success) {
    console.log('✅ Issue created successfully!')
    console.log(`   Identifier: ${result.issueIdentifier}`)
    console.log(`   URL: ${result.url}`)
    console.log(`\n   View issue: ${result.url}`)
  } else {
    console.error(`❌ Failed to create issue: ${result.error}`)
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

export { createLinearIssue, getTeams }

