#!/usr/bin/env tsx
/**
 * Test fetching a specific Linear issue
 */

import { config } from 'dotenv'
config()

const apiKey = process.env.LINEAR_API_KEY
if (!apiKey) {
  console.error('LINEAR_API_KEY not set')
  process.exit(1)
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

const identifier = process.argv[2] || 'AXO-7'

// Validate and sanitize identifier
const validated = validateIdentifier(identifier)
if (!validated) {
  console.error(`❌ Invalid Linear identifier format: ${identifier}`)
  console.error('   Expected format: TEAM-NUMBER (e.g., AXO-7)')
  process.exit(1)
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
        url
      }
    }
  }
`

async function test() {
  try {
    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({ query }),
    })

    const result = await response.json()
    
    if (result.errors) {
      console.error('❌ GraphQL Errors:')
      result.errors.forEach((err: any) => {
        console.error(`   ${err.message}`)
      })
    }
    
    if (result.data?.issues?.nodes?.length > 0) {
      console.log('✅ Issue found:')
      console.log(JSON.stringify(result.data.issues.nodes[0], null, 2))
    } else {
      console.log('❌ Issue not found')
      console.log('Full response:', JSON.stringify(result, null, 2))
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

test()

