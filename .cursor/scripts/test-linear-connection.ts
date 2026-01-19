#!/usr/bin/env tsx
/**
 * Test Linear Connection Script
 * 
 * Tests your Linear API key and displays available teams.
 * 
 * Usage:
 *   LINEAR_API_KEY=xxx tsx .cursor/scripts/test-linear-connection.ts
 */

const LINEAR_API_URL = 'https://api.linear.app/graphql'

async function testConnection(apiKey: string) {
  const query = `
    query {
      viewer {
        id
        name
        email
      }
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

    if (result.errors) {
      console.error('❌ API Error:', result.errors[0].message)
      return false
    }

    console.log('✅ Connection successful!')
    console.log(`\n👤 Logged in as: ${result.data.viewer.name} (${result.data.viewer.email})`)
    
    const teams = result.data.teams.nodes
    if (teams.length === 0) {
      console.log('\n⚠️  No teams found in your workspace')
      return false
    }

    console.log(`\n📋 Available teams (${teams.length}):`)
    teams.forEach((team: { id: string; name: string; key: string }, index: number) => {
      console.log(`   ${index + 1}. ${team.name} (${team.key})`)
      console.log(`      ID: ${team.id}`)
    })

    if (teams.length === 1) {
      console.log(`\n💡 You can set LINEAR_TEAM_ID=${teams[0].id} in your .env file`)
    } else {
      console.log(`\n💡 Set LINEAR_TEAM_ID to one of the team IDs above in your .env file`)
    }

    return true
  } catch (error) {
    console.error('❌ Connection failed:', error instanceof Error ? error.message : error)
    return false
  }
}

async function main() {
  const apiKey = process.env.LINEAR_API_KEY

  if (!apiKey) {
    console.error('❌ LINEAR_API_KEY environment variable is not set')
    console.error('\n📝 To set it up:')
    console.error('   1. Add to your .env file:')
    console.error('      LINEAR_API_KEY=lin_api_...')
    console.error('   2. Or export it:')
    console.error('      export LINEAR_API_KEY=lin_api_...')
    console.error('\n🔑 Get your API key from: https://linear.app/settings/api')
    process.exit(1)
  }

  if (!apiKey.startsWith('lin_api_')) {
    console.warn('⚠️  Warning: API key should start with "lin_api_"')
    console.warn('   Make sure you copied the full key from Linear settings')
  }

  console.log('🔌 Testing Linear API connection...\n')
  const success = await testConnection(apiKey)

  if (success) {
    console.log('\n✅ Setup complete! You can now create Linear issues.')
    console.log('\n📖 Example usage:')
    console.log('   LINEAR_API_KEY=xxx tsx .cursor/scripts/create-linear-issue.ts \\')
    console.log('     --title "My Issue" \\')
    console.log('     --description "Issue description" \\')
    console.log('     --priority high')
  } else {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})

