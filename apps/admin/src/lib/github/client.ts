/**
 * GitHub Client
 *
 * Handles GitHub operations like creating branches, commits, and PRs
 * using the GitHub REST API.
 */

export interface GitHubConfig {
  token: string
  owner: string
  repo: string
}

export interface GitHubBranch {
  name: string
  sha: string
  protected: boolean
}

export interface GitHubCommit {
  sha: string
  message: string
  url: string
}

export interface GitHubPullRequest {
  number: number
  url: string
  html_url: string
  title: string
  state: "open" | "closed" | "merged"
  head: { ref: string; sha: string }
  base: { ref: string }
}

export interface GitHubContent {
  name: string
  path: string
  sha: string
  size: number
  type: "file" | "dir"
  content?: string
  encoding?: string
}

/**
 * GitHub API client class
 */
export class GitHubClient {
  private token: string
  private owner: string
  private repo: string
  private baseUrl = "https://api.github.com"

  constructor(config?: Partial<GitHubConfig>) {
    this.token = config?.token || process.env.GITHUB_TOKEN || ""
    this.owner = config?.owner || process.env.GITHUB_OWNER || "axori"
    this.repo = config?.repo || process.env.GITHUB_REPO || "axori-platform"

    if (!this.token) {
      console.warn("GITHUB_TOKEN not set - GitHub operations will fail")
    }
  }

  /**
   * Make authenticated request to GitHub API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}/repos/${this.owner}/${this.repo}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        `GitHub API error: ${response.status} ${error.message || response.statusText}`
      )
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return response.json() as Promise<T>
  }

  // =============================================================================
  // BRANCH OPERATIONS
  // =============================================================================

  /**
   * Get the default branch
   */
  async getDefaultBranch(): Promise<string> {
    const repo = await this.request<{ default_branch: string }>("")
    return repo.default_branch
  }

  /**
   * Get branch by name
   */
  async getBranch(branchName: string): Promise<GitHubBranch | null> {
    try {
      const branch = await this.request<{
        name: string
        commit: { sha: string }
        protected: boolean
      }>(`/branches/${branchName}`)
      return {
        name: branch.name,
        sha: branch.commit.sha,
        protected: branch.protected,
      }
    } catch {
      return null
    }
  }

  /**
   * Create a new branch from the default branch
   */
  async createBranch(branchName: string, baseBranch?: string): Promise<GitHubBranch> {
    // Get the base branch SHA
    const base = baseBranch || (await this.getDefaultBranch())
    const baseBranchData = await this.getBranch(base)

    if (!baseBranchData) {
      throw new Error(`Base branch '${base}' not found`)
    }

    // Create the new branch ref
    await this.request(`/git/refs`, {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseBranchData.sha,
      }),
    })

    return {
      name: branchName,
      sha: baseBranchData.sha,
      protected: false,
    }
  }

  /**
   * Delete a branch
   */
  async deleteBranch(branchName: string): Promise<void> {
    await this.request(`/git/refs/heads/${branchName}`, {
      method: "DELETE",
    })
  }

  // =============================================================================
  // FILE OPERATIONS
  // =============================================================================

  /**
   * Get file contents
   */
  async getFileContent(path: string, ref?: string): Promise<string | null> {
    try {
      const params = ref ? `?ref=${ref}` : ""
      const content = await this.request<GitHubContent>(`/contents/${path}${params}`)

      if (content.type !== "file" || !content.content) {
        return null
      }

      // Decode base64 content
      return Buffer.from(content.content, "base64").toString("utf-8")
    } catch {
      return null
    }
  }

  /**
   * Create or update a file
   */
  async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    branch: string
  ): Promise<GitHubCommit> {
    // Check if file exists to get SHA
    let sha: string | undefined
    try {
      const existing = await this.request<GitHubContent>(`/contents/${path}?ref=${branch}`)
      sha = existing.sha
    } catch {
      // File doesn't exist, which is fine
    }

    const result = await this.request<{
      commit: { sha: string; message: string; html_url: string }
    }>(`/contents/${path}`, {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: Buffer.from(content).toString("base64"),
        branch,
        sha,
      }),
    })

    return {
      sha: result.commit.sha,
      message: result.commit.message,
      url: result.commit.html_url,
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(path: string, message: string, branch: string): Promise<void> {
    const existing = await this.request<GitHubContent>(`/contents/${path}?ref=${branch}`)

    await this.request(`/contents/${path}`, {
      method: "DELETE",
      body: JSON.stringify({
        message,
        sha: existing.sha,
        branch,
      }),
    })
  }

  /**
   * List directory contents
   */
  async listDirectory(path: string, ref?: string): Promise<Array<GitHubContent>> {
    const params = ref ? `?ref=${ref}` : ""
    return this.request<Array<GitHubContent>>(`/contents/${path}${params}`)
  }

  // =============================================================================
  // PULL REQUEST OPERATIONS
  // =============================================================================

  /**
   * Create a pull request
   */
  async createPullRequest(options: {
    title: string
    body: string
    head: string
    base?: string
    draft?: boolean
  }): Promise<GitHubPullRequest> {
    const base = options.base || (await this.getDefaultBranch())

    return this.request<GitHubPullRequest>(`/pulls`, {
      method: "POST",
      body: JSON.stringify({
        title: options.title,
        body: options.body,
        head: options.head,
        base,
        draft: options.draft ?? false,
      }),
    })
  }

  /**
   * Get pull request by number
   */
  async getPullRequest(number: number): Promise<GitHubPullRequest> {
    return this.request<GitHubPullRequest>(`/pulls/${number}`)
  }

  /**
   * Update pull request
   */
  async updatePullRequest(
    number: number,
    options: { title?: string; body?: string; state?: "open" | "closed" }
  ): Promise<GitHubPullRequest> {
    return this.request<GitHubPullRequest>(`/pulls/${number}`, {
      method: "PATCH",
      body: JSON.stringify(options),
    })
  }

  /**
   * List pull requests for a branch
   */
  async listPullRequests(head?: string): Promise<Array<GitHubPullRequest>> {
    const params = head ? `?head=${this.owner}:${head}` : ""
    return this.request<Array<GitHubPullRequest>>(`/pulls${params}`)
  }

  /**
   * Add comment to pull request
   */
  async addPullRequestComment(number: number, body: string): Promise<void> {
    await this.request(`/issues/${number}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    })
  }

  // =============================================================================
  // SEARCH OPERATIONS
  // =============================================================================

  /**
   * Search code in repository
   */
  async searchCode(
    query: string,
    options?: { path?: string; extension?: string }
  ): Promise<Array<{ path: string; url: string }>> {
    let searchQuery = `${query} repo:${this.owner}/${this.repo}`
    if (options?.path) searchQuery += ` path:${options.path}`
    if (options?.extension) searchQuery += ` extension:${options.extension}`

    const result = await this.request<{
      items: Array<{ path: string; html_url: string }>
    }>(`${this.baseUrl}/search/code?q=${encodeURIComponent(searchQuery)}`)

    return result.items.map((item) => ({
      path: item.path,
      url: item.html_url,
    }))
  }
}

/**
 * Create a singleton instance
 */
let clientInstance: GitHubClient | null = null

export function getGitHubClient(): GitHubClient {
  if (!clientInstance) {
    clientInstance = new GitHubClient()
  }
  return clientInstance
}
