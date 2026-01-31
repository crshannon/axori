/**
 * Decision Matching Service
 *
 * Matches relevant decisions to tickets using Haiku for intelligent selection.
 */

import { db, forgeDecisions, eq } from "@axori/db";
import type { ForgeDecision } from "@axori/db/types";
import Anthropic from "@anthropic-ai/sdk";

// =============================================================================
// Types
// =============================================================================

interface TicketContext {
  title: string;
  description: string | null;
  type: string | null;
  labels: Array<string> | null;
}

// =============================================================================
// Client
// =============================================================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic();
  }
  return anthropicClient;
}

// =============================================================================
// Functions
// =============================================================================

/**
 * Get all active decisions from the database
 */
export async function getActiveDecisions(): Promise<Array<ForgeDecision>> {
  return db
    .select()
    .from(forgeDecisions)
    .where(eq(forgeDecisions.active, true));
}

/**
 * Match decisions to a ticket using Haiku
 *
 * Uses a small, fast model to pick which decisions are relevant
 * to the given ticket context.
 */
export async function matchDecisionsForTicket(
  context: TicketContext
): Promise<Array<ForgeDecision>> {
  const allDecisions = await getActiveDecisions();

  // If no decisions, return empty
  if (allDecisions.length === 0) {
    return [];
  }

  // If only a few decisions, include all of them
  if (allDecisions.length <= 5) {
    return allDecisions;
  }

  try {
    const client = getAnthropicClient();

    // Build the prompt for Haiku
    const decisionsList = allDecisions
      .map(
        (d) =>
          `- ${d.identifier}: ${d.decision}${d.scope?.length ? ` [tags: ${d.scope.join(", ")}]` : ""}`
      )
      .join("\n");

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are helping select relevant coding decisions for a development task.

Given this ticket:
- Title: ${context.title}
- Description: ${context.description || "None"}
- Type: ${context.type || "Unknown"}
- Labels: ${context.labels?.join(", ") || "None"}

Which of these decisions are relevant to this work? Return ONLY a JSON array of decision identifiers (e.g., ["DEC-001", "DEC-003"]). Return at most 7 decisions. If none are relevant, return [].

Decisions:
${decisionsList}

Respond with just the JSON array, no explanation.`,
        },
      ],
    });

    // Parse the response
    const content = response.content[0];
    if (content.type !== "text") {
      console.warn("[matchDecisions] Unexpected response type:", content.type);
      return allDecisions.slice(0, 5); // Fallback to first 5
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = content.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    }

    const matchedIds = JSON.parse(jsonText) as Array<string>;

    if (!Array.isArray(matchedIds)) {
      console.warn("[matchDecisions] Invalid response format:", jsonText);
      return allDecisions.slice(0, 5);
    }

    // Filter to matched decisions
    const matched = allDecisions.filter((d) =>
      matchedIds.includes(d.identifier)
    );

    console.log(
      `[matchDecisions] Matched ${matched.length}/${allDecisions.length} decisions for "${context.title}"`
    );

    return matched;
  } catch (error) {
    console.error("[matchDecisions] Error matching decisions:", error);
    // Fallback: return first 5 decisions on error
    return allDecisions.slice(0, 5);
  }
}

/**
 * Format decisions for injection into agent prompt
 */
export function formatDecisionsForPrompt(
  decisions: Array<ForgeDecision>
): string {
  if (decisions.length === 0) {
    return "";
  }

  const decisionLines = decisions
    .map((d) => `- ${d.identifier}: ${d.decision}`)
    .join("\n");

  return `## Decisions to Follow

These are established conventions for this codebase:

${decisionLines}

Follow these unless you have a specific reason to deviate.

`;
}
