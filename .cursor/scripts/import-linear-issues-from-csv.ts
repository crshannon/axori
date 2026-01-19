#!/usr/bin/env tsx
/**
 * Import Linear Issues from CSV
 *
 * Batch imports issues from a CSV file into Linear.
 *
 * CSV Format:
 *   Title,Description,Priority,Status,Labels,Estimate,Project
 *
 * Prerequisites:
 * - Linear API key set in LINEAR_API_KEY environment variable
 * - Linear team ID set in LINEAR_TEAM_ID environment variable (optional, will auto-detect)
 *
 * Usage:
 *   LINEAR_API_KEY=xxx tsx .cursor/scripts/import-linear-issues-from-csv.ts \
 *     --csv "linear/property hub.csv" \
 *     --project-id "property-hub-f8f5d1322dfe"
 *
 * Options:
 *   --csv <path>          Path to CSV file (default: linear/property hub.csv)
 *   --project-id <id>     Linear project ID (required)
 *   --team-id <id>        Linear team ID (optional, will auto-detect)
 *   --dry-run             Preview what would be created without actually creating issues
 *   --delay <ms>          Delay between issue creation in milliseconds (default: 500)
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { createLinearIssue, getTeams } from './create-linear-issue'

interface CSVRow {
  Title: string
  Description?: string
  Priority?: string
  Status?: string
  Labels?: string
  Estimate?: string
  Project?: string
  'Project ID'?: string // Linear export format
  'Parent issue'?: string // Parent issue identifier (e.g., AXO-123)
  'Related issues'?: string // Comma-separated issue identifiers
  'Due Date'?: string // ISO date or date string
  Assignee?: string // Email or user identifier
  Requirements?: string // Requirements section (can be appended to description)
  'Acceptance Criteria'?: string // Acceptance criteria (can be appended to description)
  [key: string]: string | undefined // Allow other columns from Linear exports
}

interface ImportResult {
  created: number
  skipped: number
  duplicates: number
  errors: Array<{ row: number; title: string; error: string }>
  issues: Array<{ identifier: string; url: string; title: string }>
  duplicateIssues: Array<{ identifier: string; url: string; title: string }>
}

/**
 * Parse CSV file and return rows
 */
function parseCSV(filePath: string): CSVRow[] {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter((line) => line.trim())

  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row')
  }

  // Parse header
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))

  // Parse data rows
  const rows: CSVRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    // Handle CSV with quoted fields that may contain commas
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim()) // Add last value

    // Map values to headers
    const row: Partial<CSVRow> = {}
    headers.forEach((header, index) => {
      let value = values[index]?.replace(/^"|"$/g, '') || ''
      // Convert escaped newlines (\n) to actual newlines
      value = value.replace(/\\n/g, '\n')
      // Convert escaped tabs (\t) to actual tabs
      value = value.replace(/\\t/g, '\t')
      // Convert escaped quotes (\") to actual quotes
      value = value.replace(/\\"/g, '"')
        ; (row as any)[header] = value
    })

    // Only add row if it has a title
    if (row.Title) {
      rows.push(row as CSVRow)
    }
  }

  return rows
}

/**
 * Normalize priority string to Linear priority
 * Handles both our format and Linear's export format
 */
function normalizePriority(priority: string): 'urgent' | 'high' | 'medium' | 'low' {
  if (!priority) return 'medium' // default

  const normalized = priority.toLowerCase().trim()

  // Handle Linear's export format
  if (normalized === 'no priority' || normalized === '') return 'medium'
  if (normalized === 'urgent') return 'urgent'
  if (normalized === 'high') return 'high'
  if (normalized === 'medium') return 'medium'
  if (normalized === 'low') return 'low'

  return 'medium' // default
}

/**
 * Parse labels from comma-separated string
 */
function parseLabels(labelsString: string): string[] {
  if (!labelsString) return []
  return labelsString
    .split(',')
    .map((label) => label.trim())
    .filter((label) => label.length > 0)
}

/**
 * Check if an issue with the given title already exists in Linear
 */
async function checkIssueExists(
  apiKey: string,
  teamId: string,
  projectId: string,
  title: string
): Promise<{ exists: boolean; identifier?: string; url?: string }> {
  const LINEAR_API_URL = 'https://api.linear.app/graphql'

  // Query to search for issues by title in the team and project
  const query = `
    query SearchIssues($filter: IssueFilter) {
      issues(filter: $filter, first: 1) {
        nodes {
          id
          identifier
          title
          url
        }
      }
    }
  `

  const variables = {
    filter: {
      team: { id: { eq: teamId } },
      project: { id: { eq: projectId } },
      title: { eq: title },
    },
  }

  try {
    const response = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({ query, variables }),
    })

    const result = await response.json()
    const issues = result.data?.issues?.nodes || []

    if (issues.length > 0) {
      const issue = issues[0]
      return {
        exists: true,
        identifier: issue.identifier,
        url: issue.url,
      }
    }

    return { exists: false }
  } catch (error) {
    // If the query fails, we'll assume it doesn't exist and try to create it
    // This prevents the import from failing due to API issues
    console.warn(`Warning: Could not check for duplicate issue "${title}": ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { exists: false }
  }
}

/**
 * Get label IDs from Linear by name
 * Fetches existing labels for the team and returns matching IDs
 */
async function getLabelIds(
  apiKey: string,
  teamId: string,
  labelNames: string[]
): Promise<string[]> {
  if (labelNames.length === 0) return []

  const LINEAR_API_URL = 'https://api.linear.app/graphql'

  // Query to get all labels for the team
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

    // Find matching label IDs
    const labelIds: string[] = []
    const missingLabels: string[] = []

    labelNames.forEach((name) => {
      const normalizedName = name.trim().toLowerCase()
      const labelId = labelMap.get(normalizedName)
      if (labelId) {
        labelIds.push(labelId)
      } else {
        missingLabels.push(name)
      }
    })

    if (missingLabels.length > 0) {
      console.log(`⚠️  Warning: Labels not found in Linear: ${missingLabels.join(', ')}`)
      const availableLabels = labels.map((l: { name: string }) => l.name)
      if (availableLabels.length > 0) {
        console.log(`   Available labels: ${availableLabels.join(', ')}`)
      }
      console.log(`   Attempting to create missing labels...`)

      // Try to create missing labels
      for (const labelName of missingLabels) {
        try {
          const createdLabelId = await createLabel(apiKey, teamId, labelName)
          if (createdLabelId) {
            labelIds.push(createdLabelId)
            console.log(`   ✅ Created label: ${labelName}`)
          }
        } catch (error) {
          console.log(`   ⚠️  Could not create label "${labelName}": ${error instanceof Error ? error.message : 'Unknown error'}`)
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
  const LINEAR_API_URL = 'https://api.linear.app/graphql'

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

  // Generate a color based on label name (for consistency)
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
 * Returns a hex color code
 */
function getLabelColor(labelName: string): string {
  const colorMap: Record<string, string> = {
    database: '#9333EA', // Purple
    frontend: '#3B82F6', // Blue
    backend: '#10B981', // Green
    api: '#F59E0B', // Amber
    billing: '#EF4444', // Red
    ai: '#8B5CF6', // Violet
    user: '#06B6D4', // Cyan
    auth: '#EC4899', // Pink
    // Default colors for common categories
    feature: '#3B82F6',
    bug: '#EF4444',
    improvement: '#10B981',
  }

  const normalized = labelName.toLowerCase().trim()
  return colorMap[normalized] || '#6B7280' // Default gray
}

/**
 * Get project ID from project key or UUID
 * If the provided ID looks like a key (contains hyphens but not UUID format), look it up
 */
async function resolveProjectId(
  apiKey: string,
  projectIdOrKey: string
): Promise<string | null> {
  // If it's already a UUID format (contains 4 hyphens), return as-is
  if (projectIdOrKey.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return projectIdOrKey
  }

  // Otherwise, try to look it up as a project key or search all projects
  const LINEAR_API_URL = 'https://api.linear.app/graphql'

  // First try direct lookup by key
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

    // Try to find by key (case-insensitive)
    const found = projects.find(
      (p: { key: string; name: string }) =>
        p.key.toLowerCase() === projectIdOrKey.toLowerCase() ||
        p.name.toLowerCase().includes(projectIdOrKey.toLowerCase())
    )

    if (found) {
      return found.id
    }

    console.warn(`Warning: Could not find project with key/name "${projectIdOrKey}"`)
    console.warn(`   Available projects: ${projects.map((p: { key: string; name: string }) => `${p.name} (${p.key})`).join(', ') || 'none'}`)
    return null
  } catch (error) {
    console.warn(`Warning: Could not look up project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return null
  }
}

/**
 * Resolve issue ID from identifier (e.g., "AXO-123")
 */
async function resolveIssueId(
  apiKey: string,
  teamId: string,
  issueIdentifier: string
): Promise<string | null> {
  const LINEAR_API_URL = 'https://api.linear.app/graphql'

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
    const issue = result.data?.issue

    if (issue && issue.id) {
      return issue.id
    }

    return null
  } catch (error) {
    return null
  }
}

/**
 * Resolve user ID from email or identifier
 */
async function resolveUserId(
  apiKey: string,
  emailOrId: string
): Promise<string | null> {
  const LINEAR_API_URL = 'https://api.linear.app/graphql'

  // If it's already a UUID, return as-is
  if (emailOrId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return emailOrId
  }

  // Try to find by email
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

    // Find by email (case-insensitive)
    const found = users.find(
      (u: { email: string }) => u.email.toLowerCase() === emailOrId.toLowerCase()
    )

    if (found) {
      return found.id
    }

    return null
  } catch (error) {
    return null
  }
}

/**
 * Format date string to ISO format (YYYY-MM-DD)
 */
function formatDate(dateString: string): string | null {
  if (!dateString) return null

  try {
    // Try parsing various date formats
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return null
    }
    return date.toISOString().split('T')[0] // YYYY-MM-DD
  } catch {
    return null
  }
}

/**
 * Combine description with requirements and acceptance criteria
 */
function buildDescription(
  description: string,
  requirements?: string,
  acceptanceCriteria?: string
): string {
  let fullDescription = description || ''

  if (requirements) {
    if (fullDescription) {
      fullDescription += '\n\n'
    }
    fullDescription += `**Requirements:**\n\n${requirements}`
  }

  if (acceptanceCriteria) {
    if (fullDescription) {
      fullDescription += '\n\n'
    }
    fullDescription += `**Acceptance Criteria**\n\n${acceptanceCriteria}`
  }

  return fullDescription
}

/**
 * Link related issues to the created issue
 */
async function linkRelatedIssues(
  apiKey: string,
  issueId: string,
  relatedIssueIdentifiers: string[],
  teamId: string
): Promise<void> {
  if (relatedIssueIdentifiers.length === 0) return

  const LINEAR_API_URL = 'https://api.linear.app/graphql'

  // Resolve all related issue IDs
  const relatedIssueIds: string[] = []
  for (const identifier of relatedIssueIdentifiers) {
    const resolved = await resolveIssueId(apiKey, teamId, identifier.trim())
    if (resolved) {
      relatedIssueIds.push(resolved)
    } else {
      console.warn(`⚠️  Warning: Could not find related issue: ${identifier}`)
    }
  }

  if (relatedIssueIds.length === 0) return

  // Create issue relations for each related issue
  // Linear requires creating relations one at a time
  let linkedCount = 0
  for (const relatedIssueId of relatedIssueIds) {
    const mutation = `
      mutation CreateIssueRelation($input: IssueRelationCreateInput!) {
        issueRelationCreate(input: $input) {
          success
          issueRelation {
            id
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
          query: mutation,
          variables: {
            input: {
              issueId,
              relatedIssueId,
              type: 'relates', // Linear relation type: BLOCKS, BLOCKED_BY, DUPLICATE, RELATES
            },
          },
        }),
      })

      const result = await response.json()
      if (result.errors && result.errors.length > 0) {
        console.warn(`⚠️  Warning: Could not link related issue: ${result.errors.map((e: any) => e.message).join(', ')}`)
      } else if (result.data?.issueRelationCreate?.success) {
        linkedCount++
      }
    } catch (error) {
      console.warn(`⚠️  Warning: Could not link related issue: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (linkedCount > 0) {
    console.log(`🔗 Linked ${linkedCount} related issue(s)`)
  }
}

/**
 * Get the "Backlog" state ID for a team
 */
async function getBacklogStateId(
  apiKey: string,
  teamId: string
): Promise<string | null> {
  const LINEAR_API_URL = 'https://api.linear.app/graphql'

  const query = `
    query GetTeamStates($teamId: String!) {
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

    // Find "Backlog" state (case-insensitive)
    const backlogState = states.find(
      (state: { name: string }) => state.name.toLowerCase() === 'backlog'
    )

    if (backlogState) {
      return backlogState.id
    }

    // If no "Backlog" state found, try to find the first "backlog" type state
    const backlogTypeState = states.find(
      (state: { type: string }) => state.type === 'backlog'
    )

    if (backlogTypeState) {
      return backlogTypeState.id
    }

    console.warn(`Warning: Could not find "Backlog" state. Available states: ${states.map((s: { name: string }) => s.name).join(', ')}`)
    return null
  } catch (error) {
    console.warn(`Warning: Could not fetch team states: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return null
  }
}

/**
 * Import issues from CSV
 */
async function importIssuesFromCSV(
  csvPath: string,
  projectId: string,
  teamId: string,
  apiKey: string,
  dryRun: boolean = false,
  delayMs: number = 500
): Promise<ImportResult> {
  console.log(`📄 Reading CSV file: ${csvPath}`)
  const rows = parseCSV(csvPath)
  console.log(`✅ Found ${rows.length} issues to import\n`)

  const result: ImportResult = {
    created: 0,
    skipped: 0,
    duplicates: 0,
    errors: [],
    issues: [],
    duplicateIssues: [],
  }

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No issues will be created\n')
  }

  // Resolve project ID (might be a key, not UUID)
  console.log('📋 Resolving project ID...')
  let resolvedProjectId = await resolveProjectId(apiKey, projectId)
  if (!resolvedProjectId) {
    // If lookup failed, try using it as-is (might be a valid UUID or key that Linear accepts)
    console.log(`⚠️  Could not look up project, using as-is: ${projectId}`)
    resolvedProjectId = projectId
  } else {
    console.log(`✅ Resolved project ID: ${resolvedProjectId}\n`)
  }

  // Get Backlog state ID (all issues should start in Backlog)
  console.log('📋 Fetching Backlog state...')
  const backlogStateId = await getBacklogStateId(apiKey, teamId)
  if (backlogStateId) {
    console.log(`✅ Using Backlog state: ${backlogStateId}\n`)
  } else {
    console.log(`⚠️  Warning: Could not find Backlog state. Issues will be created in default state.\n`)
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // +2 because CSV has header and is 1-indexed

    try {
      // Parse row data
      // Support both our format and Linear's export format
      const title = (row.Title || '').trim()
      const description = (row.Description || '').trim()
      const requirements = row.Requirements || ''
      const acceptanceCriteria = row['Acceptance Criteria'] || ''
      const priority = normalizePriority(row.Priority || 'medium')
      const labelsString = row.Labels || ''
      const estimate = row.Estimate ? parseInt(row.Estimate, 10) : undefined
      const parentIssueIdentifier = row['Parent issue'] || ''
      const relatedIssuesString = row['Related issues'] || ''
      const dueDateString = row['Due Date'] || ''
      const assigneeString = row.Assignee || ''

      if (!title) {
        result.skipped++
        console.log(`⏭️  Row ${rowNum}: Skipped (no title)`)
        continue
      }

      // Use Project ID from row if available, otherwise use resolved projectId
      const rowProjectId = (row as any)['Project ID'] || row.Project
      const finalProjectId = rowProjectId || resolvedProjectId

      // Build full description with requirements and acceptance criteria
      const fullDescription = buildDescription(description, requirements, acceptanceCriteria)

      // Parse related issues (for linking after creation)
      const relatedIssueIdentifiers = relatedIssuesString
        ? relatedIssuesString.split(',').map((id) => id.trim()).filter((id) => id.length > 0)
        : []

      // Resolve parent issue ID if specified
      let parentIssueId: string | undefined = undefined
      if (parentIssueIdentifier && !dryRun) {
        console.log(`🔗 Resolving parent issue: ${parentIssueIdentifier}`)
        const resolved = await resolveIssueId(apiKey, teamId, parentIssueIdentifier.trim())
        if (resolved) {
          parentIssueId = resolved
          console.log(`✅ Found parent issue: ${parentIssueIdentifier}`)
        } else {
          console.warn(`⚠️  Warning: Could not find parent issue: ${parentIssueIdentifier}`)
        }
        // Add delay after parent lookup
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      }

      // Resolve assignee ID if specified
      let assigneeId: string | undefined = undefined
      if (assigneeString && !dryRun) {
        console.log(`👤 Resolving assignee: ${assigneeString}`)
        const resolved = await resolveUserId(apiKey, assigneeString.trim())
        if (resolved) {
          assigneeId = resolved
          console.log(`✅ Found assignee: ${assigneeString}`)
        } else {
          console.warn(`⚠️  Warning: Could not find assignee: ${assigneeString}`)
        }
        // Add delay after assignee lookup
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      }

      // Format due date
      const dueDate = dueDateString ? formatDate(dueDateString) || undefined : undefined
      if (dueDateString && !dueDate) {
        console.warn(`⚠️  Warning: Could not parse due date: ${dueDateString}`)
      }

      // Check for duplicates (skip in dry-run mode to save API calls)
      if (!dryRun) {
        console.log(`🔍 Checking for duplicate: ${title}`)
        // Resolve project ID if it's a key
        const checkProjectId = rowProjectId ? await resolveProjectId(apiKey, rowProjectId) || resolvedProjectId : resolvedProjectId
        const duplicateCheck = await checkIssueExists(apiKey, teamId, checkProjectId, title)

        if (duplicateCheck.exists) {
          result.duplicates++
          result.duplicateIssues.push({
            identifier: duplicateCheck.identifier || 'Unknown',
            url: duplicateCheck.url || '',
            title,
          })
          console.log(`⏭️  Row ${rowNum}: Skipped (duplicate exists: ${duplicateCheck.identifier})`)

          // Add delay after duplicate check to avoid rate limiting
          if (i < rows.length - 1 && delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs))
          }
          continue
        }
      }

      // Get label IDs if labels are specified
      const labelNames = parseLabels(labelsString)
      let labelIds: string[] = []
      if (labelNames.length > 0 && !dryRun) {
        console.log(`🏷️  Looking up labels: ${labelNames.join(', ')}`)
        labelIds = await getLabelIds(apiKey, teamId, labelNames)
        if (labelIds.length > 0) {
          console.log(`✅ Found ${labelIds.length} label(s)`)
        }
        // Add delay after label lookup
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      }

      if (dryRun) {
        console.log(`📝 Would create: ${title}`)
        console.log(`   Priority: ${priority}`)
        console.log(`   Labels: ${labelNames.join(', ') || 'none'}`)
        console.log(`   Estimate: ${estimate || 'none'}`)
        console.log(`   Project: ${finalProjectId}`)
        console.log(`   State: Backlog`)
        if (parentIssueIdentifier) {
          console.log(`   Parent: ${parentIssueIdentifier}`)
        }
        if (assigneeString) {
          console.log(`   Assignee: ${assigneeString}`)
        }
        if (dueDate) {
          console.log(`   Due Date: ${dueDate}`)
        }
        if (relatedIssuesString) {
          console.log(`   Related: ${relatedIssuesString}`)
        }
        if (requirements) {
          console.log(`   Requirements: Included`)
        }
        if (acceptanceCriteria) {
          console.log(`   Acceptance Criteria: Included`)
        }
        console.log()
        result.created++
        continue
      }

      // Resolve project ID if it's a key (for this specific row)
      let rowResolvedProjectId = resolvedProjectId
      if (rowProjectId && rowProjectId !== resolvedProjectId) {
        const resolved = await resolveProjectId(apiKey, rowProjectId)
        if (resolved) {
          rowResolvedProjectId = resolved
        }
      }

      // Create issue
      console.log(`🚀 Creating issue ${i + 1}/${rows.length}: ${title}`)
      const issueResult = await createLinearIssue(apiKey, {
        title,
        description: fullDescription || undefined,
        priority,
        teamId,
        projectId: rowResolvedProjectId,
        labels: labelIds.length > 0 ? labelIds : undefined, // Only pass if we have labels
        stateId: backlogStateId || undefined, // Set to Backlog state
        parentId: parentIssueId,
        assigneeId: assigneeId,
        dueDate: dueDate,
      })

      if (issueResult.success && issueResult.issueIdentifier && issueResult.issueId) {
        result.created++
        result.issues.push({
          identifier: issueResult.issueIdentifier,
          url: issueResult.url || '',
          title,
        })
        console.log(`✅ Created: ${issueResult.issueIdentifier} - ${title}`)

        // Link related issues if specified
        if (relatedIssueIdentifiers.length > 0) {
          console.log(`🔗 Linking ${relatedIssueIdentifiers.length} related issue(s)...`)
          await linkRelatedIssues(apiKey, issueResult.issueId, relatedIssueIdentifiers, teamId)
          // Add delay after linking
          if (delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs))
          }
        }
      } else {
        result.errors.push({
          row: rowNum,
          title,
          error: issueResult.error || 'Unknown error',
        })
        console.log(`❌ Failed: ${issueResult.error}`)
      }

      // Add delay between requests to avoid rate limiting
      if (i < rows.length - 1 && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    } catch (error) {
      result.errors.push({
        row: rowNum,
        title: row.Title || 'Unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      console.log(`❌ Error on row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return result
}

/**
 * Parse command line arguments
 */
function parseArgs(): {
  csv?: string
  projectId?: string
  teamId?: string
  dryRun: boolean
  delay: number
} {
  const args = process.argv.slice(2)
  const options: ReturnType<typeof parseArgs> = {
    dryRun: false,
    delay: 500,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--csv':
        options.csv = args[++i]
        break
      case '--project-id':
        options.projectId = args[++i]
        break
      case '--team-id':
        options.teamId = args[++i]
        break
      case '--dry-run':
        options.dryRun = true
        break
      case '--delay':
        const delayArg = args[++i]
        if (delayArg === undefined) {
          console.error(`❌ Error: --delay requires a value`)
          process.exit(1)
        }
        const delayValue = parseInt(delayArg, 10)
        options.delay = isNaN(delayValue) ? 500 : delayValue
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

  const options = parseArgs()
  const csvPath = options.csv || join(process.cwd(), 'linear', 'property hub.csv')
  const projectId = options.projectId || process.env.LINEAR_PROJECT_ID

  if (!projectId) {
    console.error('❌ Project ID is required. Use --project-id or set LINEAR_PROJECT_ID')
    console.error('   Example: --project-id "property-hub-f8f5d1322dfe"')
    process.exit(1)
  }

  // Get team ID
  let teamId = options.teamId || process.env.LINEAR_TEAM_ID
  if (!teamId) {
    console.log('📋 Fetching teams from Linear...')
    const teams = await getTeams(apiKey)
    if (teams.length === 0) {
      console.error('❌ No teams found. Set LINEAR_TEAM_ID environment variable')
      process.exit(1)
    }
    if (teams.length === 1) {
      teamId = teams[0].id
      console.log(`✅ Using team: ${teams[0].name} (${teams[0].key})\n`)
    } else {
      console.log('Available teams:')
      teams.forEach((team, i) => {
        console.log(`  ${i + 1}. ${team.name} (${team.key})`)
      })
      console.error('\n❌ Multiple teams found. Set LINEAR_TEAM_ID or use --team-id')
      process.exit(1)
    }
  }

  console.log('📊 Import Configuration:')
  console.log(`   CSV File: ${csvPath}`)
  console.log(`   Project ID: ${projectId}`)
  console.log(`   Team ID: ${teamId}`)
  console.log(`   Dry Run: ${options.dryRun ? 'Yes' : 'No'}`)
  console.log(`   Delay: ${options.delay}ms\n`)

  try {
    const result = await importIssuesFromCSV(
      csvPath,
      projectId,
      teamId,
      apiKey,
      options.dryRun,
      options.delay
    )

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Import Summary')
    console.log('='.repeat(60))
    console.log(`✅ Created: ${result.created}`)
    console.log(`⏭️  Skipped: ${result.skipped}`)
    console.log(`🔄 Duplicates: ${result.duplicates}`)
    console.log(`❌ Errors: ${result.errors.length}`)

    if (result.issues.length > 0) {
      console.log('\n📋 Created Issues:')
      result.issues.forEach((issue) => {
        console.log(`   ${issue.identifier}: ${issue.title}`)
        if (issue.url) {
          console.log(`      ${issue.url}`)
        }
      })
    }

    if (result.duplicateIssues.length > 0) {
      console.log('\n🔄 Duplicate Issues (skipped):')
      result.duplicateIssues.forEach((issue) => {
        console.log(`   ${issue.identifier}: ${issue.title}`)
        if (issue.url) {
          console.log(`      ${issue.url}`)
        }
      })
    }

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:')
      result.errors.forEach((error) => {
        console.log(`   Row ${error.row}: ${error.title}`)
        console.log(`      ${error.error}`)
      })
    }

    console.log('\n' + '='.repeat(60))

    if (result.errors.length > 0) {
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Import failed:', error)
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

export { importIssuesFromCSV, parseCSV }

