#!/usr/bin/env tsx
/**
 * List Linear Projects Script
 * 
 * Fetches all projects from Linear workspace
 */

const LINEAR_API_URL = 'https://api.linear.app/graphql'

async function getProjects(apiKey: string): Promise<Array<{ id: string; name: string; description?: string }>> {
  const query = `
    query {
      projects {
        nodes {
          id
          name
          description
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
    return result.data?.projects?.nodes || []
  } catch (error) {
    console.error('Error fetching projects:', error)
    return []
  }
}

async function main() {
  const apiKey = process.env.LINEAR_API_KEY
  if (!apiKey) {
    console.error('❌ LINEAR_API_KEY environment variable is required')
    process.exit(1)
  }

  console.log('📋 Fetching projects from Linear...\n')
  const projects = await getProjects(apiKey)
  
  if (projects.length === 0) {
    console.log('No projects found.')
    return
  }

  console.log('Available projects:')
  projects.forEach((project, i) => {
    console.log(`  ${i + 1}. ${project.name}`)
    console.log(`     ID: ${project.id}`)
    if (project.description) {
      console.log(`     Description: ${project.description}`)
    }
    console.log('')
  })
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
}

export { getProjects }
