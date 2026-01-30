/**
 * Forge Planning API Routes
 *
 * Endpoints for AI-assisted task decomposition and planning.
 * This is the integration point for Claude Code → Forge workflow.
 *
 * The planning endpoint takes a high-level requirement and:
 * 1. Uses Claude to analyze and decompose the task
 * 2. Creates well-scoped tickets automatically
 * 3. Suggests optimal protocols for each ticket
 */

import { Hono } from "hono";
import { z } from "zod";
import { db, forgeTickets, sql } from "@axori/db";
import { requireAuth } from "../../middleware/permissions";
import { withErrorHandling, validateData, ApiError } from "../../utils/errors";
import { getAnthropicClient } from "../../services/forge/anthropic";
import { getRateLimiter, estimateProtocolTokens } from "../../services/forge/rate-limiter";

const router = new Hono();

// =============================================================================
// Types
// =============================================================================

// Ticket type must match the database enum
type TicketType = "design" | "feature" | "bug" | "chore" | "refactor" | "docs" | "spike";

interface DecomposedTask {
  title: string;
  description: string;
  type: TicketType;
  priority: "low" | "medium" | "high" | "critical";
  estimation: number; // Story points 1-13
  suggestedProtocol: string;
  dependencies: Array<number>; // Indices of tasks this depends on
  labels: Array<string>;
}

interface PlanningResult {
  summary: string;
  approach: string;
  tasks: Array<DecomposedTask>;
  totalEstimation: number;
  estimatedTokens: number;
  warnings: Array<string>;
}

// =============================================================================
// Validation Schemas
// =============================================================================

// Enum matching database schema
const ticketTypeEnum = z.enum(["design", "feature", "bug", "chore", "refactor", "docs", "spike"]);

const planRequestSchema = z.object({
  requirement: z.string().min(10, "Requirement must be at least 10 characters"),
  context: z.string().optional(), // Additional context (e.g., from CLAUDE.md, codebase analysis)
  maxTasks: z.number().int().min(1).max(20).default(10),
  projectId: z.string().uuid().optional(), // Parent project for created tickets
  milestoneId: z.string().uuid().optional(), // Milestone for created tickets
  dryRun: z.boolean().default(false), // If true, don't create tickets, just return plan
});

const createFromPlanSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      type: ticketTypeEnum,
      priority: z.enum(["low", "medium", "high", "critical"]),
      estimation: z.number().int().min(1).max(13),
      suggestedProtocol: z.string(),
      labels: z.array(z.string()).default([]),
    })
  ),
  projectId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
});

// =============================================================================
// Planning Prompt
// =============================================================================

const PLANNING_SYSTEM_PROMPT = `You are an expert software architect helping decompose requirements into well-scoped development tasks.

Your job is to:
1. Analyze the requirement thoroughly
2. Design a clean implementation approach
3. Break it down into small, focused tasks (2-8 story points each)
4. Suggest the optimal agent protocol for each task

CRITICAL GUIDELINES:
- Each task should be independently executable
- Tasks should be small enough for a focused AI agent (2-5 story points ideal)
- Include clear acceptance criteria in descriptions
- Order tasks by dependency (what needs to happen first)
- Use appropriate protocols:
  * haiku_quick_edit (1-2 pts): Config changes, typos, simple edits
  * haiku_docs (2-3 pts): Documentation updates
  * sonnet_implementation (3-5 pts): New features, components, endpoints
  * sonnet_bug_fix (3-5 pts): Bug investigations and fixes
  * sonnet_tests (3-5 pts): Writing test suites
  * opus_planning (5-8 pts): Complex architecture decisions (planning only)

Valid ticket types: design, feature, bug, chore, refactor, docs, spike

Output your response as a JSON object with this structure:
{
  "summary": "Brief summary of the requirement",
  "approach": "High-level implementation approach",
  "tasks": [
    {
      "title": "Short descriptive title",
      "description": "Detailed description with acceptance criteria",
      "type": "feature|bug|chore|docs|design|refactor|spike",
      "priority": "low|medium|high|critical",
      "estimation": 3,
      "suggestedProtocol": "sonnet_implementation",
      "dependencies": [],
      "labels": ["relevant", "labels"]
    }
  ],
  "warnings": ["Any concerns or risks to flag"]
}`;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate the next ticket identifier
 */
async function generateNextIdentifier(): Promise<string> {
  const [result] = await db
    .select({
      maxNum: sql<number>`COALESCE(MAX(CAST(SUBSTRING(identifier FROM 7) AS INTEGER)), 0)`,
    })
    .from(forgeTickets)
    .where(sql`identifier LIKE 'FORGE-%'`);

  const nextNum = (result?.maxNum || 0) + 1;
  return `FORGE-${nextNum.toString().padStart(3, "0")}`;
}

/**
 * Parse planning response from Claude
 */
function parsePlanningResponse(text: string): PlanningResult {
  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Valid ticket types
    const validTypes: Array<TicketType> = ["design", "feature", "bug", "chore", "refactor", "docs", "spike"];

    // Map legacy type names to valid ones
    const typeMapping: Record<string, TicketType> = {
      documentation: "docs",
    };

    // Validate and transform
    const tasks: Array<DecomposedTask> = (parsed.tasks || []).map(
      (t: Record<string, unknown>) => {
        let taskType = String(t.type || "feature");
        // Map legacy types
        if (typeMapping[taskType]) {
          taskType = typeMapping[taskType];
        }
        // Validate type
        if (!validTypes.includes(taskType as TicketType)) {
          taskType = "feature";
        }

        return {
          title: String(t.title || "Untitled task"),
          description: String(t.description || ""),
          type: taskType as TicketType,
          priority: ["low", "medium", "high", "critical"].includes(
            String(t.priority)
          )
            ? (t.priority as DecomposedTask["priority"])
            : "medium",
          estimation: Math.min(13, Math.max(1, Number(t.estimation) || 3)),
          suggestedProtocol: String(t.suggestedProtocol || "sonnet_implementation"),
          dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
          labels: Array.isArray(t.labels)
            ? t.labels.map((l: unknown) => String(l))
            : [],
        };
      }
    );

    const totalEstimation = tasks.reduce((sum, t) => sum + t.estimation, 0);
    const estimatedTokens = tasks.reduce(
      (sum, t) => sum + estimateProtocolTokens(t.suggestedProtocol),
      0
    );

    return {
      summary: String(parsed.summary || ""),
      approach: String(parsed.approach || ""),
      tasks,
      totalEstimation,
      estimatedTokens,
      warnings: Array.isArray(parsed.warnings)
        ? parsed.warnings.map((w: unknown) => String(w))
        : [],
    };
  } catch (error) {
    throw new ApiError(
      `Failed to parse planning response: ${error instanceof Error ? error.message : "Unknown error"}`,
      500
    );
  }
}

// =============================================================================
// Routes
// =============================================================================

/**
 * POST /forge/planning/decompose
 * Decompose a high-level requirement into tasks
 */
router.post(
  "/decompose",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const body = await c.req.json();
      const validated = validateData(body, planRequestSchema, {
        operation: "decomposePlan",
      });

      const client = getAnthropicClient();
      if (!client.isConfigured()) {
        throw new ApiError("Anthropic API not configured", 503);
      }

      // Check rate limiter
      const rateLimiter = getRateLimiter();
      const estimatedTokens = 5000; // Planning is relatively light
      await rateLimiter.waitForCapacity("planning", estimatedTokens);

      // Build the planning prompt
      const userMessage = `## Requirement
${validated.requirement}

${validated.context ? `## Additional Context\n${validated.context}\n` : ""}
## Constraints
- Maximum ${validated.maxTasks} tasks
- Each task should be 2-8 story points
- Order by dependencies

Please analyze this requirement and provide a task decomposition.`;

      // Call Claude for planning
      const response = await client.sendMessage({
        model: "claude-sonnet-4-5-20250929", // Sonnet for cost efficiency
        max_tokens: 4096,
        system: PLANNING_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });

      // Record token usage
      rateLimiter.recordUsage(
        "planning",
        response.usage.input_tokens + response.usage.output_tokens
      );

      // Parse response
      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      const plan = parsePlanningResponse(text);

      // If not dry run, create the tickets
      if (!validated.dryRun) {
        const createdTickets: Array<{ id: string; identifier: string; title: string }> = [];

        for (const task of plan.tasks) {
          const identifier = await generateNextIdentifier();

          const [ticket] = await db
            .insert(forgeTickets)
            .values({
              identifier,
              title: task.title,
              description: task.description,
              type: task.type,
              priority: task.priority,
              estimate: task.estimation,
              status: "backlog",
              phase: "planning",
              labels: task.labels,
              projectId: validated.projectId,
              milestoneId: validated.milestoneId,
            })
            .returning({ id: forgeTickets.id, identifier: forgeTickets.identifier, title: forgeTickets.title });

          createdTickets.push(ticket);
        }

        return c.json({
          ...plan,
          createdTickets,
          message: `Created ${createdTickets.length} tickets from plan`,
        });
      }

      return c.json({
        ...plan,
        dryRun: true,
        message: "Dry run - no tickets created",
      });
    },
    { operation: "decomposePlan" }
  )
);

/**
 * POST /forge/planning/create-tickets
 * Create tickets from a previously generated plan
 */
router.post(
  "/create-tickets",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const body = await c.req.json();
      const validated = validateData(body, createFromPlanSchema, {
        operation: "createTicketsFromPlan",
      });

      const createdTickets: Array<{ id: string; identifier: string; title: string }> = [];

      for (const task of validated.tasks) {
        const identifier = await generateNextIdentifier();

        const [ticket] = await db
          .insert(forgeTickets)
          .values({
            identifier,
            title: task.title,
            description: task.description,
            type: task.type,
            priority: task.priority,
            estimate: task.estimation,
            status: "backlog",
            phase: "planning",
            labels: task.labels,
            projectId: validated.projectId,
            milestoneId: validated.milestoneId,
          })
          .returning({ id: forgeTickets.id, identifier: forgeTickets.identifier, title: forgeTickets.title });

        createdTickets.push(ticket);
      }

      return c.json({
        createdTickets,
        message: `Created ${createdTickets.length} tickets`,
      });
    },
    { operation: "createTicketsFromPlan" }
  )
);

/**
 * GET /forge/planning/estimate
 * Get token/cost estimates for a set of tasks
 */
router.get(
  "/estimate",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const protocols = c.req.query("protocols")?.split(",") || [];

      if (protocols.length === 0) {
        // Return estimates for all protocols
        const allProtocols = [
          "opus_full_feature",
          "opus_architecture",
          "opus_planning",
          "sonnet_implementation",
          "sonnet_bug_fix",
          "sonnet_tests",
          "haiku_quick_edit",
          "haiku_docs",
        ];

        const estimates = allProtocols.map((p) => ({
          protocol: p,
          estimatedTokens: estimateProtocolTokens(p),
        }));

        return c.json({ estimates });
      }

      const estimates = protocols.map((p) => ({
        protocol: p,
        estimatedTokens: estimateProtocolTokens(p),
      }));

      const total = estimates.reduce((sum, e) => sum + e.estimatedTokens, 0);

      return c.json({
        estimates,
        total,
        estimatedMinutes: Math.ceil(total / 25000), // At 25k TPM effective limit
      });
    },
    { operation: "estimatePlan" }
  )
);

/**
 * GET /forge/planning/rate-status
 * Get current rate limiting status
 */
router.get(
  "/rate-status",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const rateLimiter = getRateLimiter();
      const status = rateLimiter.getStatus();

      return c.json({
        ...status,
        recommendation:
          status.percentUsed > 80
            ? "Consider waiting before starting new executions"
            : status.percentUsed > 50
              ? "Moderate usage - smaller tasks recommended"
              : "Capacity available for new executions",
      });
    },
    { operation: "getRateStatus" }
  )
);

export default router;
