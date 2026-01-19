#!/usr/bin/env tsx
/**
 * Setup Linear Labels
 *
 * Creates standard labels in Linear for the Axori team.
 *
 * Prerequisites:
 * - Linear API key set in LINEAR_API_KEY environment variable
 * - Linear team ID set in LINEAR_TEAM_ID environment variable
 *
 * Usage:
 *   LINEAR_API_KEY=xxx LINEAR_TEAM_ID=xxx tsx .cursor/scripts/setup-linear-labels.ts
 */

const REQUIRED_LABELS = [
  'database',
  'frontend',
  'backend',
  'api',
  'billing',
  'ai',
  'user',
  'auth',
]

async function setupLabels() {
  const apiKey = process.env.LINEAR_API_KEY
  const teamId = process.env.LINEAR_TEAM_ID

  if (!apiKey) {
    console.error('❌ LINEAR_API_KEY environment variable is required')
    process.exit(1)
  }

  if (!teamId) {
    console.error('❌ LINEAR_TEAM_ID environment variable is required')
    process.exit(1)
  }

  console.log('🏷️  Setting up Linear labels...\n')

  const LINEAR_API_URL = 'https://api.linear.app/graphql'

  // First, fetch existing labels
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
    const existingLabels = result.data?.team?.labels?.nodes || []
    const existingLabelNames = new Set(
      existingLabels.map((l: { name: string }) => l.name.toLowerCase())
    )

    console.log(`📋 Found ${existingLabels.length} existing label(s)\n`)

    // Create missing labels
    let created = 0
    let skipped = 0

    for (const labelName of REQUIRED_LABELS) {
      if (existingLabelNames.has(labelName.toLowerCase())) {
        console.log(`⏭️  Skipped: ${labelName} (already exists)`)
        skipped++
      } else {
        try {
          const labelId = await createLabel(apiKey, teamId, labelName)
          if (labelId) {
            console.log(`✅ Created: ${labelName}`)
            created++
          } else {
            console.log(`⚠️  Failed to create: ${labelName}`)
          }
        } catch (error) {
          console.log(
            `❌ Error creating ${labelName}: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    console.log(`\n============================================================`)
    console.log(`📊 Summary`)
    console.log(`============================================================`)
    console.log(`✅ Created: ${created}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`============================================================`)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Export functions for use in other scripts
export { createLabel, getLabelColor }

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

if (require.main === module) {
  setupLabels().catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
}
