/**
 * Forge Agent API Routes
 *
 * Routes for agent protocols and orchestration
 */

import { Hono } from "hono"
import { z } from "zod"
import { requireAuth } from "../../middleware/permissions"
import { withErrorHandling, validateData, ApiError } from "../../utils/errors"

const router = new Hono()

// =============================================================================
// Protocol Definitions (mirrored from admin app for API use)
// =============================================================================

const PROTOCOLS = {
  opus_full_feature: {
    name: "Opus: Full Feature",
    description: "Complete feature implementation including planning, code, and tests",
    model: "claude-opus-4-5-20251101",
    estimatedTokens: { min: 30000, max: 60000 },
    estimatedCostCents: { min: 100, max: 300 },
    bestFor: ["Complete features", "Complex implementations", "Architecture changes"],
    requiresApproval: false,
  },
  opus_architecture: {
    name: "Opus: Architecture",
    description: "System design and major refactoring tasks",
    model: "claude-opus-4-5-20251101",
    estimatedTokens: { min: 20000, max: 40000 },
    estimatedCostCents: { min: 80, max: 200 },
    bestFor: ["System design", "Major refactors", "Infrastructure changes"],
    requiresApproval: true,
  },
  opus_planning: {
    name: "Opus: Planning",
    description: "Feature planning and ticket breakdown",
    model: "claude-opus-4-5-20251101",
    estimatedTokens: { min: 15000, max: 30000 },
    estimatedCostCents: { min: 50, max: 150 },
    bestFor: ["Feature planning", "Task breakdown", "Complexity analysis"],
    requiresApproval: false,
  },
  sonnet_implementation: {
    name: "Sonnet: Implementation",
    description: "Standard feature implementation",
    model: "claude-sonnet-4-5-20250929",
    estimatedTokens: { min: 10000, max: 25000 },
    estimatedCostCents: { min: 10, max: 50 },
    bestFor: ["Standard features", "Component creation", "API endpoints"],
    requiresApproval: false,
  },
  sonnet_bug_fix: {
    name: "Sonnet: Bug Fix",
    description: "Bug investigation and resolution",
    model: "claude-sonnet-4-5-20250929",
    estimatedTokens: { min: 8000, max: 20000 },
    estimatedCostCents: { min: 8, max: 40 },
    bestFor: ["Bug fixes", "Error investigation", "Regression fixes"],
    requiresApproval: false,
  },
  sonnet_tests: {
    name: "Sonnet: Tests",
    description: "Test writing and coverage improvement",
    model: "claude-sonnet-4-5-20250929",
    estimatedTokens: { min: 10000, max: 25000 },
    estimatedCostCents: { min: 10, max: 50 },
    bestFor: ["Unit tests", "Integration tests", "E2E tests", "Coverage improvement"],
    requiresApproval: false,
  },
  haiku_quick_edit: {
    name: "Haiku: Quick Edit",
    description: "Simple edits, typos, and config changes",
    model: "claude-haiku-4-5-20251001",
    estimatedTokens: { min: 2000, max: 5000 },
    estimatedCostCents: { min: 1, max: 5 },
    bestFor: ["Typos", "Config changes", "Copy updates", "Simple refactors"],
    requiresApproval: false,
  },
  haiku_docs: {
    name: "Haiku: Documentation",
    description: "Documentation updates and improvements",
    model: "claude-haiku-4-5-20251001",
    estimatedTokens: { min: 3000, max: 8000 },
    estimatedCostCents: { min: 1, max: 5 },
    bestFor: ["README updates", "API docs", "Code comments", "Guides"],
    requiresApproval: false,
  },
} as const

type AgentProtocol = keyof typeof PROTOCOLS

/**
 * Suggest protocol based on ticket properties
 */
function suggestProtocol(ticket: {
  type: string
  estimate?: number | null
  labels?: string[] | null
}): AgentProtocol {
  if (ticket.type === "bug") return "sonnet_bug_fix"
  if (ticket.type === "docs") return "haiku_docs"
  if (ticket.type === "chore" && (ticket.estimate || 0) <= 1) {
    return "haiku_quick_edit"
  }
  if (ticket.labels?.includes("architecture")) {
    return "opus_architecture"
  }
  if ((ticket.estimate || 0) >= 5) {
    return "opus_full_feature"
  }
  return "sonnet_implementation"
}

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /forge/agents/protocols
 * List all available agent protocols
 */
router.get(
  "/protocols",
  requireAuth(),
  withErrorHandling(async (c) => {
    const protocols = Object.entries(PROTOCOLS).map(([id, config]) => ({
      id,
      ...config,
    }))
    return c.json(protocols)
  }, { operation: "listAgentProtocols" })
)

/**
 * GET /forge/agents/protocols/:id
 * Get a specific protocol's details
 */
router.get(
  "/protocols/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const id = c.req.param("id") as AgentProtocol
    const protocol = PROTOCOLS[id]

    if (!protocol) {
      throw new ApiError("Protocol not found", 404)
    }

    return c.json({ id, ...protocol })
  }, { operation: "getAgentProtocol" })
)

/**
 * POST /forge/agents/suggest
 * Suggest a protocol for a ticket
 */
router.post(
  "/suggest",
  requireAuth(),
  withErrorHandling(async (c) => {
    const body = await c.req.json()

    const schema = z.object({
      type: z.string(),
      estimate: z.number().nullable().optional(),
      labels: z.array(z.string()).nullable().optional(),
    })

    const validated = validateData(body, schema, { operation: "suggestAgentProtocol" })
    const suggested = suggestProtocol(validated)
    const protocol = PROTOCOLS[suggested]

    return c.json({
      protocolId: suggested,
      protocol: { id: suggested, ...protocol },
      reason: getSuggestionReason(validated, suggested),
    })
  }, { operation: "suggestAgentProtocol" })
)

function getSuggestionReason(
  ticket: { type: string; estimate?: number | null; labels?: string[] | null },
  protocol: AgentProtocol
): string {
  switch (protocol) {
    case "sonnet_bug_fix":
      return "Bug tickets are best handled by Sonnet for efficient investigation and fixes"
    case "haiku_docs":
      return "Documentation tasks are perfect for Haiku's fast, focused edits"
    case "haiku_quick_edit":
      return "Simple chores with low estimates are ideal for Haiku's quick edits"
    case "opus_architecture":
      return "Architecture-labeled tickets benefit from Opus's comprehensive analysis"
    case "opus_full_feature":
      return "High-complexity features (5+ points) require Opus's thorough approach"
    case "sonnet_implementation":
    default:
      return "Standard implementation task - Sonnet provides a good balance of capability and cost"
  }
}

export default router
