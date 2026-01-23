#!/usr/bin/env tsx
/**
 * Linear Utilities Script
 *
 * Utility script for common Linear operations like getting sub-issues and starting work.
 *
 * Usage:
 *   LINEAR_API_KEY=xxx tsx .cursor/scripts/linear-utils.ts get-sub-issues AXO-118
 *   LINEAR_API_KEY=xxx tsx .cursor/scripts/linear-utils.ts start-work AXO-118
 */

const LINEAR_API_URL = 'https://api.linear.app/graphql'

interface LinearIssue {
  id: string
  identifier: string
  title: string
  url: string
  state: {
    id: string
    name: string
    type: string
  }
  assignee?: {
    id: string
    name: string
    email: string
  }
  priority: number
  description?: string
}

interface LinearResponse<T> {
  data?: T
  errors?: Array<{
    message: string
    extensions?: {
      code?: string
    }
  }>
}

/**
 * Get an issue by identifier (e.g., "AXO-118")
 */
async function getIssueByIdentifier(
  apiKey: string,
  identifier: string
): Promise<LinearIssue | null> {
  const query = `
    query GetIssue($identifier: String!) {
      issue(id: $identifier) {
        id
        identifier
        title
        url
        state {
          id
          name
          type
        }
        assignee {
          id
          name
          email
        }
        priority
        description
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
        variables: { identifier },
      }),
    })

    const result: LinearResponse<{ issue: LinearIssue | null }> = await response.json()

    if (result.errors && result.errors.length > 0) {
      console.error('❌ API Error:', result.errors[0].message)
      return null
    }

    return result.data?.issue || null
  } catch (error) {
    console.error('❌ Error fetching issue:', error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * Get sub-issues (child issues) for a given issue
 */
async function getSubIssues(
  apiKey: string,
  issueId: string
): Promise<LinearIssue[]> {
  const query = `
    query GetSubIssues($issueId: String!) {
      issue(id: $issueId) {
        id
        identifier
        title
        children {
          nodes {
            id
            identifier
            title
            url
            state {
              id
              name
              type
            }
            assignee {
              id
              name
              email
            }
            priority
            description
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
        variables: { issueId },
      }),
    })

    const result: LinearResponse<{
      issue: {
        id: string
        identifier: string
        title: string
        children: {
          nodes: LinearIssue[]
        }
      }
    }> = await response.json()

    if (result.errors && result.errors.length > 0) {
      console.error('❌ API Error:', result.errors[0].message)
      return []
    }

    return result.data?.issue?.children?.nodes || []
  } catch (error) {
    console.error('❌ Error fetching sub-issues:', error instanceof Error ? error.message : error)
    return []
  }
}

/**
 * Start work on an issue (update state to "In Progress" or similar)
 */
async function startWork(apiKey: string, issueId: string): Promise<boolean> {
  // First, get available workflow states
  const statesQuery = `
    query GetWorkflowStates($issueId: String!) {
      issue(id: $issueId) {
        team {
          states {
            nodes {
              id
              name
              type
            }
          }
        }
      }
    }
  `

  try {
    const statesResponse = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({
        query: statesQuery,
        variables: { issueId },
      }),
    })

    const statesResult: LinearResponse<{
      issue: {
        team: {
          states: {
            nodes: Array<{ id: string; name: string; type: string }>
          }
        }
      }
    }> = await statesResponse.json()

    if (statesResult.errors || !statesResult.data?.issue?.team?.states?.nodes) {
      console.error('❌ Error fetching workflow states')
      return false
    }

    // Find "In Progress" or "Started" state
    const states = statesResult.data.issue.team.states.nodes
    const inProgressState = states.find(
      (s) =>
        s.type === 'started' ||
        s.name.toLowerCase().includes('in progress') ||
        s.name.toLowerCase().includes('started')
    )

    if (!inProgressState) {
      console.error('❌ Could not find "In Progress" state')
      console.log('Available states:')
      states.forEach((s) => {
        console.log(`  - ${s.name} (${s.type})`)
      })
      return false
    }

    // Update issue state
    const updateMutation = `
      mutation UpdateIssueState($issueId: String!, $stateId: String!) {
        issueUpdate(id: $issueId, input: { stateId: $stateId }) {
          success
          issue {
            id
            identifier
            title
            state {
              id
              name
            }
          }
        }
      }
    `

    const updateResponse = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({
        query: updateMutation,
        variables: {
          issueId,
          stateId: inProgressState.id,
        },
      }),
    })

    const updateResult: LinearResponse<{
      issueUpdate: {
        success: boolean
        issue: {
          id: string
          identifier: string
          title: string
          state: {
            id: string
            name: string
          }
        }
      }
    }> = await updateResponse.json()

    if (updateResult.errors && updateResult.errors.length > 0) {
      console.error('❌ Error updating issue:', updateResult.errors[0].message)
      return false
    }

    if (updateResult.data?.issueUpdate.success) {
      console.log(`✅ Started work on ${updateResult.data.issueUpdate.issue.identifier}`)
      console.log(`   State: ${updateResult.data.issueUpdate.issue.state.name}`)
      return true
    }

    return false
  } catch (error) {
    console.error('❌ Error starting work:', error instanceof Error ? error.message : error)
    return false
  }
}

/**
 * Main CLI handler
 */
async function main() {
  const apiKey = process.env.LINEAR_API_KEY
  if (!apiKey) {
    console.error('❌ LINEAR_API_KEY environment variable is required')
    console.error('   Get your API key from: https://linear.app/settings/api')
    process.exit(1)
  }

  const command = process.argv[2]
  const identifier = process.argv[3]

  if (!command) {
    console.error('❌ Command is required')
    console.error('\nAvailable commands:')
    console.error('  get-sub-issues <identifier>  - Get all sub-issues for an issue')
    console.error('  start-work <identifier>       - Start work on an issue')
    process.exit(1)
  }

  if (!identifier) {
    console.error('❌ Issue identifier is required (e.g., AXO-118)')
    process.exit(1)
  }

  if (command === 'get-sub-issues') {
    console.log(`📋 Fetching sub-issues for ${identifier}...\n`)

    // First, get the issue to get its ID
    const issue = await getIssueByIdentifier(apiKey, identifier)
    if (!issue) {
      console.error(`❌ Issue ${identifier} not found`)
      process.exit(1)
    }

    console.log(`📌 Parent Issue: ${issue.identifier} - ${issue.title}`)
    console.log(`   State: ${issue.state.name}\n`)

    // Get sub-issues
    const subIssues = await getSubIssues(apiKey, issue.id)

    if (subIssues.length === 0) {
      console.log('No sub-issues found.')
      process.exit(0)
    }

    console.log(`Found ${subIssues.length} sub-issue(s):\n`)

    subIssues.forEach((subIssue, index) => {
      const priorityLabels: Record<number, string> = {
        1: '🔴 Urgent',
        2: '🟠 High',
        3: '🟡 Medium',
        4: '🟢 Low',
      }
      const priorityLabel = priorityLabels[subIssue.priority] || '⚪ No Priority'

      console.log(`${index + 1}. ${subIssue.identifier} - ${subIssue.title}`)
      console.log(`   State: ${subIssue.state.name} (${subIssue.state.type})`)
      console.log(`   Priority: ${priorityLabel}`)
      if (subIssue.assignee) {
        console.log(`   Assignee: ${subIssue.assignee.name}`)
      }
      console.log(`   URL: ${subIssue.url}`)
      console.log('')
    })

    // Output as JSON for programmatic use
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(subIssues, null, 2))
    }
  } else if (command === 'start-work') {
    console.log(`🚀 Starting work on ${identifier}...\n`)

    const issue = await getIssueByIdentifier(apiKey, identifier)
    if (!issue) {
      console.error(`❌ Issue ${identifier} not found`)
      process.exit(1)
    }

    const success = await startWork(apiKey, issue.id)
    if (!success) {
      process.exit(1)
    }
  } else {
    console.error(`❌ Unknown command: ${command}`)
    console.error('\nAvailable commands:')
    console.error('  get-sub-issues <identifier>  - Get all sub-issues for an issue')
    console.error('  start-work <identifier>       - Start work on an issue')
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

export { getIssueByIdentifier, getSubIssues, startWork }
