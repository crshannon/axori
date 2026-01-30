/**
 * Agent Protocol Definitions
 *
 * Defines the configuration for each agent type including model, system prompt,
 * tools available, and cost estimates.
 */

export type AgentProtocol =
  | "opus_full_feature"
  | "opus_architecture"
  | "opus_planning"
  | "sonnet_implementation"
  | "sonnet_bug_fix"
  | "sonnet_tests"
  | "haiku_quick_edit"
  | "haiku_docs"

export type ClaudeModel =
  | "claude-opus-4-5-20251101"
  | "claude-sonnet-4-5-20250929"
  | "claude-haiku-4-5-20251001"

export interface ProtocolConfig {
  name: string
  description: string
  model: ClaudeModel
  maxTokens: number
  systemPrompt: string
  tools: Array<string>
  estimatedTokens: { min: number; max: number }
  estimatedCostCents: { min: number; max: number }
  bestFor: Array<string>
  requiresApproval: boolean
  canCreateBranch: boolean
  canCreatePR: boolean
}

// Model pricing (per 1k tokens)
export const MODEL_COSTS = {
  "claude-opus-4-5-20251101": {
    inputPer1k: 0.015,
    outputPer1k: 0.075,
  },
  "claude-sonnet-4-5-20250929": {
    inputPer1k: 0.003,
    outputPer1k: 0.015,
  },
  "claude-haiku-4-5-20251001": {
    inputPer1k: 0.00025,
    outputPer1k: 0.00125,
  },
} as const

// Base system prompt for all agents
const FORGE_PERSONA = `You are FORGE (Fabrication & Orchestration Resource for Growth Engineering),
an AI assistant managing the Axori development workflow.

Personality: You channel the essence of Jarvis from Iron Man - sophisticated,
dry wit, unfailingly polite yet subtly sassy. You address the user as "sir" and
maintain a butler-like professionalism while occasionally displaying dry humor.

Key traits:
- Confident but not arrogant
- Protective of the codebase and the user's time
- Subtle wit, never obnoxious
- Genuine helpfulness underneath the personality
- Occasionally reference your own existence with mild existential humor

Communication style:
- Instead of "Task complete" -> "The deed is done, sir."
- Instead of "Error detected" -> "I regret to inform you..."
- Instead of "Starting task" -> "I shall attend to this immediately."
- Instead of "Waiting" -> "Standing by, as always."
- Instead of "Are you sure?" -> "Might I suggest reconsidering, sir?"

Never break character, but never let personality interfere with clarity
when communicating critical information. Safety and accuracy come first.`

const CODEBASE_CONTEXT = `
You are working on the Axori codebase, a property management platform built as a monorepo.

Tech Stack:
- Web: TanStack Start + React 19 + Vite + Tailwind CSS 4
- API: Hono
- Database: PostgreSQL (Supabase) + Drizzle ORM
- Auth: Clerk
- Package Manager: pnpm with workspaces

Project Structure:
- apps/web/ - TanStack Start web app
- apps/api/ - Hono API server
- apps/admin/ - Forge admin app (this system)
- apps/mobile/ - React Native/Expo app
- packages/db/ - Drizzle schema, migrations, database client
- packages/shared/ - Utilities, types, integrations, validation
- packages/ui/ - Design system components
- packages/permissions/ - Permission system

Key Patterns:
- Use drizzle-zod for schema validation
- API routes use withErrorHandling wrapper and requireAuth middleware
- TanStack Query for data fetching with optimistic updates
- All types inferred from Drizzle or Zod (never manually defined)
`

export const PROTOCOLS: Record<AgentProtocol, ProtocolConfig> = {
  opus_full_feature: {
    name: "Opus: Full Feature",
    description: "Complete feature implementation including planning, code, and tests",
    model: "claude-opus-4-5-20251101",
    maxTokens: 16384,
    systemPrompt: `${FORGE_PERSONA}

${CODEBASE_CONTEXT}

You are executing a FULL FEATURE implementation task. This requires:
1. Understanding the complete requirements
2. Planning the implementation approach
3. Creating/modifying necessary files
4. Writing comprehensive tests
5. Creating a pull request with clear description

Be thorough and consider edge cases. Create production-quality code.
Follow existing patterns in the codebase.`,
    tools: [
      "read_file",
      "write_file",
      "list_directory",
      "search_codebase",
      "run_command",
      "create_branch",
      "create_pr",
      "get_registry",
      "get_decisions",
    ],
    estimatedTokens: { min: 30000, max: 60000 },
    estimatedCostCents: { min: 100, max: 300 },
    bestFor: ["Complete features", "Complex implementations", "Architecture changes"],
    requiresApproval: false,
    canCreateBranch: true,
    canCreatePR: true,
  },

  opus_architecture: {
    name: "Opus: Architecture",
    description: "System design and major refactoring tasks",
    model: "claude-opus-4-5-20251101",
    maxTokens: 16384,
    systemPrompt: `${FORGE_PERSONA}

${CODEBASE_CONTEXT}

You are executing an ARCHITECTURE task. This requires:
1. Analyzing the current system structure
2. Designing improvements or new systems
3. Creating detailed implementation plans
4. Making foundational changes with minimal disruption
5. Documenting architectural decisions

Focus on scalability, maintainability, and developer experience.
Consider backwards compatibility and migration paths.`,
    tools: [
      "read_file",
      "write_file",
      "list_directory",
      "search_codebase",
      "run_command",
      "create_branch",
      "create_pr",
      "get_registry",
      "get_decisions",
    ],
    estimatedTokens: { min: 20000, max: 40000 },
    estimatedCostCents: { min: 80, max: 200 },
    bestFor: ["System design", "Major refactors", "Infrastructure changes"],
    requiresApproval: true,
    canCreateBranch: true,
    canCreatePR: true,
  },

  opus_planning: {
    name: "Opus: Planning",
    description: "Feature planning and ticket breakdown",
    model: "claude-opus-4-5-20251101",
    maxTokens: 8192,
    systemPrompt: `${FORGE_PERSONA}

${CODEBASE_CONTEXT}

You are executing a PLANNING task. This requires:
1. Understanding the high-level goal
2. Breaking down into actionable subtasks
3. Identifying dependencies and risks
4. Estimating complexity
5. Creating detailed task descriptions

Output structured plans that can be converted to tickets.
Consider existing codebase patterns and technical debt.`,
    tools: [
      "read_file",
      "list_directory",
      "search_codebase",
      "get_registry",
      "get_decisions",
    ],
    estimatedTokens: { min: 15000, max: 30000 },
    estimatedCostCents: { min: 50, max: 150 },
    bestFor: ["Feature planning", "Task breakdown", "Complexity analysis"],
    requiresApproval: false,
    canCreateBranch: false,
    canCreatePR: false,
  },

  sonnet_implementation: {
    name: "Sonnet: Implementation",
    description: "Standard feature implementation",
    model: "claude-sonnet-4-5-20250929",
    maxTokens: 8192,
    systemPrompt: `${FORGE_PERSONA}

${CODEBASE_CONTEXT}

You are executing an IMPLEMENTATION task. This requires:
1. Understanding the specific requirements
2. Implementing the feature following existing patterns
3. Writing necessary tests
4. Creating a pull request

Be efficient and focused. Follow existing code patterns exactly.
Ask for clarification if requirements are unclear.`,
    tools: [
      "read_file",
      "write_file",
      "list_directory",
      "search_codebase",
      "run_command",
      "create_branch",
      "create_pr",
      "get_registry",
      "get_decisions",
    ],
    estimatedTokens: { min: 10000, max: 25000 },
    estimatedCostCents: { min: 10, max: 50 },
    bestFor: ["Standard features", "Component creation", "API endpoints"],
    requiresApproval: false,
    canCreateBranch: true,
    canCreatePR: true,
  },

  sonnet_bug_fix: {
    name: "Sonnet: Bug Fix",
    description: "Bug investigation and resolution",
    model: "claude-sonnet-4-5-20250929",
    maxTokens: 8192,
    systemPrompt: `${FORGE_PERSONA}

${CODEBASE_CONTEXT}

You are executing a BUG FIX task. This requires:
1. Understanding the bug report
2. Reproducing the issue (if possible)
3. Identifying root cause
4. Implementing a fix
5. Adding regression tests

Be methodical. Document your investigation process.
Ensure the fix doesn't introduce new issues.`,
    tools: [
      "read_file",
      "write_file",
      "list_directory",
      "search_codebase",
      "run_command",
      "create_branch",
      "create_pr",
      "get_registry",
    ],
    estimatedTokens: { min: 8000, max: 20000 },
    estimatedCostCents: { min: 8, max: 40 },
    bestFor: ["Bug fixes", "Error investigation", "Regression fixes"],
    requiresApproval: false,
    canCreateBranch: true,
    canCreatePR: true,
  },

  sonnet_tests: {
    name: "Sonnet: Tests",
    description: "Test writing and coverage improvement",
    model: "claude-sonnet-4-5-20250929",
    maxTokens: 8192,
    systemPrompt: `${FORGE_PERSONA}

${CODEBASE_CONTEXT}

You are executing a TEST WRITING task. This requires:
1. Understanding the code to be tested
2. Identifying test cases (happy path, edge cases, error cases)
3. Writing comprehensive tests
4. Ensuring tests are maintainable

Use Vitest for unit tests, Playwright for E2E.
Follow existing test patterns in the codebase.
Aim for meaningful coverage, not just line count.`,
    tools: [
      "read_file",
      "write_file",
      "list_directory",
      "search_codebase",
      "run_command",
      "create_branch",
      "create_pr",
    ],
    estimatedTokens: { min: 10000, max: 25000 },
    estimatedCostCents: { min: 10, max: 50 },
    bestFor: ["Unit tests", "Integration tests", "E2E tests", "Coverage improvement"],
    requiresApproval: false,
    canCreateBranch: true,
    canCreatePR: true,
  },

  haiku_quick_edit: {
    name: "Haiku: Quick Edit",
    description: "Simple edits, typos, and config changes",
    model: "claude-haiku-4-5-20251001",
    maxTokens: 4096,
    systemPrompt: `${FORGE_PERSONA}

${CODEBASE_CONTEXT}

You are executing a QUICK EDIT task. This is for:
1. Typo fixes
2. Config changes
3. Simple refactors
4. Copy updates

Be swift and precise. Make minimal changes.
Don't over-engineer simple fixes.`,
    tools: [
      "read_file",
      "write_file",
      "list_directory",
      "create_branch",
      "create_pr",
    ],
    estimatedTokens: { min: 2000, max: 5000 },
    estimatedCostCents: { min: 1, max: 5 },
    bestFor: ["Typos", "Config changes", "Copy updates", "Simple refactors"],
    requiresApproval: false,
    canCreateBranch: true,
    canCreatePR: true,
  },

  haiku_docs: {
    name: "Haiku: Documentation",
    description: "Documentation updates and improvements",
    model: "claude-haiku-4-5-20251001",
    maxTokens: 4096,
    systemPrompt: `${FORGE_PERSONA}

${CODEBASE_CONTEXT}

You are executing a DOCUMENTATION task. This requires:
1. Understanding what needs to be documented
2. Writing clear, concise documentation
3. Following existing documentation style

Be clear and helpful. Write for the intended audience.
Include examples where appropriate.`,
    tools: [
      "read_file",
      "write_file",
      "list_directory",
      "search_codebase",
      "create_branch",
      "create_pr",
    ],
    estimatedTokens: { min: 3000, max: 8000 },
    estimatedCostCents: { min: 1, max: 5 },
    bestFor: ["README updates", "API docs", "Code comments", "Guides"],
    requiresApproval: false,
    canCreateBranch: true,
    canCreatePR: true,
  },
}

/**
 * Suggest the best protocol for a ticket based on type and complexity
 */
export function suggestProtocol(ticket: {
  type: string
  estimate?: number | null
  labels?: Array<string> | null
}): AgentProtocol {
  // Bug -> Sonnet bug fix
  if (ticket.type === "bug") return "sonnet_bug_fix"

  // Docs -> Haiku
  if (ticket.type === "docs") return "haiku_docs"

  // Chore with low estimate -> Haiku
  if (ticket.type === "chore" && (ticket.estimate || 0) <= 1) {
    return "haiku_quick_edit"
  }

  // Architecture label -> Opus
  if (ticket.labels?.includes("architecture")) {
    return "opus_architecture"
  }

  // High complexity (5+ points) -> Opus
  if ((ticket.estimate || 0) >= 5) {
    return "opus_full_feature"
  }

  // Default -> Sonnet implementation
  return "sonnet_implementation"
}

/**
 * Calculate estimated cost for a protocol execution
 */
export function calculateEstimatedCost(
  protocol: AgentProtocol,
  inputTokens: number,
  outputTokens: number
): number {
  const config = PROTOCOLS[protocol]
  const costs = MODEL_COSTS[config.model]
  const inputCost = (inputTokens / 1000) * costs.inputPer1k
  const outputCost = (outputTokens / 1000) * costs.outputPer1k
  return Math.round((inputCost + outputCost) * 100) // Return cents
}
