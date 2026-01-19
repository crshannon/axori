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
  projectId?: string // Can be UUID, project key, or project name
  labels?: string[] // Can be label names or IDs (will be resolved)
  assigneeId?: string // Can be user ID or email address
  stateId?: string
  parentId?: string // Can be issue ID or identifier (e.g., "AXO-123")
  dueDate?: string // ISO date string (YYYY-MM-DD) or any date format
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
 * Get label IDs from label names or IDs
 */
async function getLabelIds(
  apiKey: string,
  teamId: string,
  labelNamesOrIds: string[]
): Promise<string[]> {
  if (labelNamesOrIds.length === 0) return []

  const query = `
    query GetTeamLabels($teamId: String!) {
      team(id: $teamId) {
        labels {
          nodes {
            id
            name
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
      body: JSON.stringify({
        query,
        variables: { teamId },
      }),
    })

    const result = await response.json()
    const labels = result.data?.team?.labels?.nodes || []

    // Create a map of label name (lowercase) to ID
    const labelMap = new Map<string, string>()
    labels.forEach((label: { id: string; name: string }) => {
      labelMap.set(label.name.toLowerCase(), label.id)
    })

    // Resolve label IDs
    const labelIds: string[] = []
    const missingLabels: string[] = []

    for (const nameOrId of labelNamesOrIds) {
      // If it looks like a UUID, use it directly
      if (nameOrId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        labelIds.push(nameOrId)
      } else {
        // Try to find by name
        const normalizedName = nameOrId.trim().toLowerCase()
        const labelId = labelMap.get(normalizedName)
        if (labelId) {
          labelIds.push(labelId)
        } else {
          missingLabels.push(nameOrId)
        }
      }
    }

    // Try to create missing labels
    if (missingLabels.length > 0) {
      for (const labelName of missingLabels) {
        try {
          const createdLabelId = await createLabel(apiKey, teamId, labelName)
          if (createdLabelId) {
            labelIds.push(createdLabelId)
          }
        } catch (error) {
          // Continue even if label creation fails
          console.warn(`Warning: Could not create label "${labelName}"`)
        }
      }
    }

    return labelIds
  } catch (error) {
    console.warn(`Warning: Could not fetch labels: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return []
  }
}

/**
 * Create a label in Linear
 */
async function createLabel(
  apiKey: string,
  teamId: string,
  labelName: string
): Promise<string | null> {
  const mutation = `
    mutation CreateLabel($teamId: String!, $name: String!, $color: String) {
      issueLabelCreate(
        input: {
          teamId: $teamId
          name: $name
          color: $color
        }
      ) {
        success
        issueLabel {
          id
          name
        }
      }
    }
  `

  const color = getLabelColor(labelName)

  try {
    const response = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          teamId,
          name: labelName.trim(),
          color,
        },
      }),
    })

    const result = await response.json()

    if (result.errors) {
      throw new Error(result.errors.map((e: any) => e.message).join(', '))
    }

    if (result.data?.issueLabelCreate?.success) {
      return result.data.issueLabelCreate.issueLabel.id
    }

    return null
  } catch (error) {
    throw error
  }
}

/**
 * Get a color for a label based on its name
 */
function getLabelColor(labelName: string): string {
  const colorMap: Record<string, string> = {
    database: '#9333EA',
    frontend: '#3B82F6',
    backend: '#10B981',
    api: '#F59E0B',
    billing: '#EF4444',
    ai: '#8B5CF6',
    user: '#06B6D4',
    auth: '#EC4899',
    feature: '#3B82F6',
    bug: '#EF4444',
    improvement: '#10B981',
  }

  const normalized = labelName.toLowerCase().trim()
  return colorMap[normalized] || '#6B7280'
}

/**
 * Resolve project ID from UUID, key, or name
 */
async function resolveProjectId(
  apiKey: string,
  projectIdOrKey: string
): Promise<string | null> {
  // If it's already a UUID format, return as-is
  if (projectIdOrKey.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return projectIdOrKey
  }

  // Try to look it up as a project key
  const queryByKey = `
    query GetProject($key: String!) {
      project(key: $key) {
        id
        key
        name
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
      body: JSON.stringify({
        query: queryByKey,
        variables: { key: projectIdOrKey },
      }),
    })

    const result = await response.json()
    const project = result.data?.project

    if (project && project.id) {
      return project.id
    }

    // If not found by key, try searching all projects
    const queryAll = `
      query {
        projects {
          nodes {
            id
            key
            name
          }
        }
      }
    `

    const allResponse = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({ query: queryAll }),
    })

    const allResult = await allResponse.json()
    const projects = allResult.data?.projects?.nodes || []

    // Try to find by key or name (case-insensitive)
    const found = projects.find(
      (p: { key: string; name: string }) =>
        p.key.toLowerCase() === projectIdOrKey.toLowerCase() ||
        p.name.toLowerCase().includes(projectIdOrKey.toLowerCase())
    )

    return found ? found.id : null
  } catch (error) {
    return null
  }
}

/**
 * Resolve user ID from email or ID
 */
async function resolveUserId(
  apiKey: string,
  emailOrId: string
): Promise<string | null> {
  // If it looks like a UUID, return as-is
  if (emailOrId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return emailOrId
  }

  // If it doesn't look like an email, return as-is (might be a username)
  if (!emailOrId.includes('@')) {
    return emailOrId
  }

  // Look up user by email
  const query = `
    query {
      users {
        nodes {
          id
          email
          name
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
    const users = result.data?.users?.nodes || []

    const user = users.find((u: { email: string }) => u.email.toLowerCase() === emailOrId.toLowerCase())
    return user ? user.id : null
  } catch (error) {
    return null
  }
}

/**
 * Resolve issue ID from identifier (e.g., "AXO-123")
 */
async function resolveIssueId(
  apiKey: string,
  issueIdentifier: string
): Promise<string | null> {
  // If it looks like a UUID, return as-is
  if (issueIdentifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return issueIdentifier
  }

  const query = `
    query GetIssue($identifier: String!) {
      issue(identifier: $identifier) {
        id
        identifier
        title
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
      body: JSON.stringify({
        query,
        variables: { identifier: issueIdentifier },
      }),
    })

    const result = await response.json()
    return result.data?.issue?.id || null
  } catch (error) {
    return null
  }
}

/**
 * Get Backlog state ID for a team
 */
async function getBacklogStateId(
  apiKey: string,
  teamId: string
): Promise<string | null> {
  const query = `
    query GetTeamWorkflowStates($teamId: String!) {
      team(id: $teamId) {
        states {
          nodes {
            id
            name
            type
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
      body: JSON.stringify({
        query,
        variables: { teamId },
      }),
    })

    const result = await response.json()
    const states = result.data?.team?.states?.nodes || []

    // Find Backlog state (usually type is "backlog" or name contains "Backlog")
    const backlogState = states.find(
      (state: { name: string; type: string }) =>
        state.type === 'backlog' || state.name.toLowerCase().includes('backlog')
    )

    return backlogState ? backlogState.id : null
  } catch (error) {
    return null
  }
}

/**
 * Format date string to ISO format
 */
function formatDate(dateString: string): string | null {
  if (!dateString) return null

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    return date.toISOString().split('T')[0] // Return YYYY-MM-DD format
  } catch {
    return null
  }
}

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
    parentId,
    dueDate,
  } = options

  if (!teamId) {
    return {
      success: false,
      error: 'Team ID is required. Set LINEAR_TEAM_ID or use --team-id flag.',
    }
  }

  // Resolve project ID if provided
  let finalProjectId = projectId
  if (finalProjectId) {
    const resolved = await resolveProjectId(apiKey, finalProjectId)
    if (resolved) {
      finalProjectId = resolved
    } else {
      console.warn(`Warning: Could not resolve project "${projectId}", using as-is`)
    }
  }

  // Resolve label IDs from names
  let labelIds: string[] = []
  if (labels && labels.length > 0) {
    labelIds = await getLabelIds(apiKey, teamId, labels)
  }

  // Resolve assignee ID from email if needed
  let finalAssigneeId = assigneeId
  if (finalAssigneeId) {
    const resolved = await resolveUserId(apiKey, finalAssigneeId)
    if (resolved) {
      finalAssigneeId = resolved
    } else {
      console.warn(`Warning: Could not resolve assignee "${assigneeId}", using as-is`)
    }
  }

  // Resolve parent issue ID if provided
  let finalParentId = parentId
  if (finalParentId) {
    const resolved = await resolveIssueId(apiKey, finalParentId)
    if (resolved) {
      finalParentId = resolved
    } else {
      console.warn(`Warning: Could not resolve parent issue "${parentId}", using as-is`)
    }
  }

  // Resolve state ID (default to Backlog if not provided)
  let finalStateId = stateId
  if (!finalStateId) {
    finalStateId = await getBacklogStateId(apiKey, teamId) || undefined
  }

  // Format due date
  let finalDueDate = dueDate
  if (finalDueDate) {
    const formatted = formatDate(finalDueDate)
    if (formatted) {
      finalDueDate = formatted
    } else {
      console.warn(`Warning: Could not parse due date "${dueDate}"`)
      finalDueDate = undefined
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

  if (finalProjectId) {
    input.projectId = finalProjectId
  }

  if (labelIds.length > 0) {
    input.labelIds = labelIds
  }

  if (finalAssigneeId) {
    input.assigneeId = finalAssigneeId
  }

  if (finalStateId) {
    input.stateId = finalStateId
  }

  if (finalParentId) {
    input.parentId = finalParentId
  }

  if (finalDueDate) {
    input.dueDate = finalDueDate
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
  parentId?: string
  dueDate?: string
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
      case '--assignee':
      case '--assignee-id':
        options.assigneeId = args[++i]
        break
      case '--parent':
      case '--parent-id':
        options.parentId = args[++i]
        break
      case '--due-date':
        options.dueDate = args[++i]
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
    title: options.title,
    description: options.description,
    priority: options.priority,
    teamId: finalTeamId,
    projectId: options.projectId,
    labels: options.labels,
    assigneeId: options.assigneeId,
    parentId: options.parentId,
    dueDate: options.dueDate,
    stateId: options.stateId,
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

export {
  createLinearIssue,
  getTeams,
  getLabelIds,
  resolveProjectId,
  resolveUserId,
  resolveIssueId,
  getBacklogStateId,
}

