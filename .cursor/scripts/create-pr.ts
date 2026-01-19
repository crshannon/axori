#!/usr/bin/env tsx
/**
 * Create GitHub Pull Request Script
 * 
 * Creates a GitHub pull request from the current branch to a target branch.
 * 
 * Prerequisites:
 * - GitHub token set in GITHUB_TOKEN environment variable
 * - Git repository with remote configured
 * - Current branch with commits
 * 
 * Usage:
 *   GITHUB_TOKEN=xxx tsx .cursor/scripts/create-pr.ts
 * 
 * Or with arguments:
 *   GITHUB_TOKEN=xxx tsx .cursor/scripts/create-pr.ts --base main --title "PR Title" --body "Description"
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'

interface CreatePROptions {
  base: string
  head?: string
  title: string
  body?: string
  draft?: boolean
  reviewers?: string[]
  labels?: string[]
}

interface GitHubPRResponse {
  number: number
  html_url: string
  state: string
  title: string
}

/**
 * Get current git branch
 */
function getCurrentBranch(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    throw new Error('Not in a git repository or no branch checked out')
  }
}

/**
 * Get git remote URL and extract owner/repo
 */
function getGitHubRepo(): { owner: string; repo: string } | null {
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim()
    
    // Handle both SSH and HTTPS URLs
    // SSH: git@github.com:owner/repo.git
    // HTTPS: https://github.com/owner/repo.git
    const match = remoteUrl.match(/(?:github\.com[/:]|git@github\.com:)([^/]+)\/([^/]+?)(?:\.git)?$/)
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Check if there are commits to push
 */
function hasCommitsToPush(branch: string, base: string): boolean {
  try {
    execSync(`git rev-list --count ${base}..${branch}`, { encoding: 'utf-8' })
    return true
  } catch {
    return false
  }
}

/**
 * Create a GitHub pull request
 */
async function createPR(
  token: string,
  owner: string,
  repo: string,
  options: CreatePROptions
): Promise<{ success: boolean; prNumber?: number; prUrl?: string; error?: string }> {
  const {
    base,
    head,
    title,
    body = '',
    draft = false,
    reviewers = [],
    labels = [],
  } = options

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls`

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        title,
        body,
        head,
        base,
        draft,
      }),
    })

    const result: GitHubPRResponse = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.title || `GitHub API error: ${response.statusText}`,
      }
    }

    // Add reviewers if provided
    if (reviewers.length > 0) {
      try {
        await fetch(`${apiUrl}/${result.number}/requested_reviewers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({
            reviewers,
          }),
        })
      } catch (error) {
        console.warn(`Warning: Could not add reviewers: ${error instanceof Error ? error.message : error}`)
      }
    }

    // Add labels if provided
    if (labels.length > 0) {
      try {
        await fetch(`${apiUrl}/${result.number}/labels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({
            labels,
          }),
        })
      } catch (error) {
        console.warn(`Warning: Could not add labels: ${error instanceof Error ? error.message : error}`)
      }
    }

    return {
      success: true,
      prNumber: result.number,
      prUrl: result.html_url,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create PR',
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): {
  base?: string
  head?: string
  title?: string
  body?: string
  draft?: boolean
  reviewers?: string[]
  labels?: string[]
} {
  const args = process.argv.slice(2)
  const options: ReturnType<typeof parseArgs> = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--base':
      case '-b':
        options.base = args[++i]
        break
      case '--head':
      case '-h':
        options.head = args[++i]
        break
      case '--title':
      case '-t':
        options.title = args[++i]
        break
      case '--body':
      case '-d':
        options.body = args[++i]
        break
      case '--draft':
        options.draft = true
        break
      case '--reviewers':
      case '-r':
        options.reviewers = args[++i].split(',').map((s) => s.trim())
        break
      case '--labels':
      case '-l':
        options.labels = args[++i].split(',').map((s) => s.trim())
        break
    }
  }

  return options
}

/**
 * Main function
 */
async function main() {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    console.error('❌ GITHUB_TOKEN environment variable is required')
    console.error('   Get your token from: https://github.com/settings/tokens')
    console.error('   Required scopes: repo (for private repos) or public_repo (for public repos)')
    process.exit(1)
  }

  // Get git info
  const currentBranch = getCurrentBranch()
  const repo = getGitHubRepo()

  if (!repo) {
    console.error('❌ Could not determine GitHub repository')
    console.error('   Make sure you have a git remote configured: git remote add origin <url>')
    process.exit(1)
  }

  const options = parseArgs()
  const base = options.base || 'main'
  const head = options.head || currentBranch

  // Check if we need to push first
  try {
    const hasUnpushedCommits = execSync(`git rev-list --count origin/${head}..${head} 2>/dev/null || echo 0`, {
      encoding: 'utf-8',
    }).trim()
    
    if (hasUnpushedCommits !== '0') {
      console.log('📤 Pushing branch to remote...')
      execSync(`git push -u origin ${head}`, { stdio: 'inherit' })
    }
  } catch (error) {
    console.warn(`⚠️  Warning: Could not push branch: ${error instanceof Error ? error.message : error}`)
    console.warn('   You may need to push manually: git push -u origin <branch>')
  }

  // Check if there are commits to create PR with
  if (!hasCommitsToPush(head, base)) {
    console.error(`❌ No commits found between ${base} and ${head}`)
    console.error('   Make sure you have commits on your branch')
    process.exit(1)
  }

  // Get title (required)
  if (!options.title) {
    console.error('❌ Title is required. Use --title "PR Title"')
    process.exit(1)
  }

  console.log(`🚀 Creating pull request...`)
  console.log(`   Repository: ${repo.owner}/${repo.repo}`)
  console.log(`   Base: ${base}`)
  console.log(`   Head: ${head}`)
  console.log(`   Title: ${options.title}`)

  const result = await createPR(token, repo.owner, repo.repo, {
    base,
    head,
    title: options.title,
    body: options.body || '',
    draft: options.draft || false,
    reviewers: options.reviewers || [],
    labels: options.labels || [],
  })

  if (result.success) {
    console.log('✅ Pull request created successfully!')
    console.log(`   PR #${result.prNumber}`)
    console.log(`   URL: ${result.prUrl}`)
    console.log(`\n   View PR: ${result.prUrl}`)
  } else {
    console.error(`❌ Failed to create PR: ${result.error}`)
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

export { createPR, getCurrentBranch, getGitHubRepo }

