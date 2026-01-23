#!/usr/bin/env tsx
/**
 * Linear Utilities for Issue Management
 *
 * Provides utilities for managing Linear issues, including:
 * - Fetching sub-issues of a parent issue
 * - Getting workflow states
 * - Updating issue status (In Progress, Done, etc.)
 * - Batch status updates for sub-issues
 *
 * Prerequisites:
 * - Linear API key set in LINEAR_API_KEY environment variable
 *
 * Usage:
 *   # Get sub-issues
 *   tsx .cursor/scripts/linear-utils.ts get-sub-issues AXO-118
 *
 *   # List workflow states
 *   tsx .cursor/scripts/linear-utils.ts list-states
 *
 *   # Update issue status
 *   tsx .cursor/scripts/linear-utils.ts update-status AXO-118 "In Progress"
 *
 *   # Start work on parent + all sub-issues
 *   tsx .cursor/scripts/linear-utils.ts start-work AXO-118
 *
 *   # Complete parent + all sub-issues
 *   tsx .cursor/scripts/linear-utils.ts complete AXO-118
 */

import { resolve } from "path";
import { existsSync, readFileSync } from "fs";

// Load .env from repo root
function loadEnv(): void {
  const cwd = process.cwd();
  for (const f of [".env.local", ".env"]) {
    const p = resolve(cwd, f);
    if (existsSync(p)) {
      const buf = readFileSync(p, "utf-8");
      for (const line of buf.split("\n")) {
        const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
        if (m && !process.env[m[1]]) {
          const v = m[2].replace(/^["']|["']$/g, "").trim();
          process.env[m[1]] = v;
        }
      }
      break;
    }
  }
}

loadEnv();

const LINEAR_API_URL = "https://api.linear.app/graphql";

// ============================================================================
// Types
// ============================================================================

interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  url: string;
  state: {
    id: string;
    name: string;
    type: string;
  };
  parent?: {
    id: string;
    identifier: string;
  };
  children?: {
    nodes: LinearIssue[];
  };
}

interface WorkflowState {
  id: string;
  name: string;
  type: string; // "backlog" | "unstarted" | "started" | "completed" | "canceled"
  position: number;
}

interface LinearApiResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: { code?: string };
  }>;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Execute a GraphQL query against the Linear API
 */
async function linearQuery<T>(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result: LinearApiResponse<T> = await response.json();

  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors.map((e) => e.message).join(", "));
  }

  if (!result.data) {
    throw new Error("No data returned from Linear API");
  }

  return result.data;
}

/**
 * Get an issue by its identifier (e.g., "AXO-118")
 */
export async function getIssue(
  apiKey: string,
  identifier: string
): Promise<LinearIssue | null> {
  const query = `
    query GetIssue($identifier: String!) {
      issue(id: $identifier) {
        id
        identifier
        title
        url
        state {
          id
          name
          type
        }
        parent {
          id
          identifier
        }
        children {
          nodes {
            id
            identifier
            title
            url
            state {
              id
              name
              type
            }
          }
        }
      }
    }
  `;

  try {
    const data = await linearQuery<{ issue: LinearIssue }>(apiKey, query, {
      identifier,
    });
    return data.issue;
  } catch {
    return null;
  }
}

/**
 * Get all sub-issues (children) of a parent issue
 */
export async function getSubIssues(
  apiKey: string,
  parentIdentifier: string
): Promise<LinearIssue[]> {
  const issue = await getIssue(apiKey, parentIdentifier);
  if (!issue) {
    throw new Error(`Issue ${parentIdentifier} not found`);
  }
  return issue.children?.nodes || [];
}

/**
 * Get workflow states for a team
 */
export async function getWorkflowStates(
  apiKey: string,
  teamId?: string
): Promise<WorkflowState[]> {
  const query = teamId
    ? `
    query GetStates($teamId: String!) {
      team(id: $teamId) {
        states {
          nodes {
            id
            name
            type
            position
          }
        }
      }
    }
  `
    : `
    query GetStates {
      teams {
        nodes {
          states {
            nodes {
              id
              name
              type
              position
            }
          }
        }
      }
    }
  `;

  const data = await linearQuery<{
    team?: { states: { nodes: WorkflowState[] } };
    teams?: { nodes: Array<{ states: { nodes: WorkflowState[] } }> };
  }>(apiKey, query, teamId ? { teamId } : undefined);

  if (data.team) {
    return data.team.states.nodes;
  }

  if (data.teams?.nodes?.[0]) {
    return data.teams.nodes[0].states.nodes;
  }

  return [];
}

/**
 * Find a workflow state by name (case-insensitive, partial match)
 */
export async function findStateByName(
  apiKey: string,
  stateName: string,
  teamId?: string
): Promise<WorkflowState | null> {
  const states = await getWorkflowStates(apiKey, teamId);
  const lowerName = stateName.toLowerCase();

  // Try exact match first
  let state = states.find((s) => s.name.toLowerCase() === lowerName);
  if (state) return state;

  // Try partial match
  state = states.find((s) => s.name.toLowerCase().includes(lowerName));
  if (state) return state;

  // Try type match (started = in progress, completed = done)
  if (lowerName.includes("progress") || lowerName === "started") {
    state = states.find((s) => s.type === "started");
  } else if (lowerName.includes("done") || lowerName.includes("complete")) {
    state = states.find((s) => s.type === "completed");
  } else if (lowerName.includes("backlog")) {
    state = states.find((s) => s.type === "backlog");
  } else if (lowerName.includes("todo") || lowerName.includes("unstarted")) {
    state = states.find((s) => s.type === "unstarted");
  } else if (lowerName.includes("cancel")) {
    state = states.find((s) => s.type === "canceled");
  }

  return state || null;
}

/**
 * Update an issue's status
 */
export async function updateIssueStatus(
  apiKey: string,
  issueId: string,
  stateId: string
): Promise<boolean> {
  const mutation = `
    mutation UpdateIssue($issueId: String!, $stateId: String!) {
      issueUpdate(id: $issueId, input: { stateId: $stateId }) {
        success
        issue {
          id
          identifier
          state {
            name
          }
        }
      }
    }
  `;

  try {
    const data = await linearQuery<{
      issueUpdate: {
        success: boolean;
        issue: { id: string; identifier: string; state: { name: string } };
      };
    }>(apiKey, mutation, { issueId, stateId });
    return data.issueUpdate.success;
  } catch (error) {
    console.error(`Failed to update issue: ${error}`);
    return false;
  }
}

/**
 * Update status by issue identifier (e.g., "AXO-118") and state name
 */
export async function updateIssueStatusByName(
  apiKey: string,
  identifier: string,
  stateName: string
): Promise<boolean> {
  const issue = await getIssue(apiKey, identifier);
  if (!issue) {
    console.error(`Issue ${identifier} not found`);
    return false;
  }

  const state = await findStateByName(apiKey, stateName);
  if (!state) {
    console.error(`State "${stateName}" not found`);
    return false;
  }

  return updateIssueStatus(apiKey, issue.id, state.id);
}

/**
 * Start work on an issue and all its sub-issues
 * Sets status to "In Progress" or equivalent
 */
export async function startWork(
  apiKey: string,
  parentIdentifier: string
): Promise<{ success: number; failed: number; issues: string[] }> {
  const issue = await getIssue(apiKey, parentIdentifier);
  if (!issue) {
    throw new Error(`Issue ${parentIdentifier} not found`);
  }

  const inProgressState = await findStateByName(apiKey, "in progress");
  if (!inProgressState) {
    throw new Error('Could not find "In Progress" state');
  }

  const results = { success: 0, failed: 0, issues: [] as string[] };

  // Update parent issue
  const parentSuccess = await updateIssueStatus(
    apiKey,
    issue.id,
    inProgressState.id
  );
  if (parentSuccess) {
    results.success++;
    results.issues.push(issue.identifier);
  } else {
    results.failed++;
  }

  // Update sub-issues
  const subIssues = issue.children?.nodes || [];
  for (const subIssue of subIssues) {
    // Only update if not already completed or canceled
    if (
      subIssue.state.type !== "completed" &&
      subIssue.state.type !== "canceled"
    ) {
      const success = await updateIssueStatus(
        apiKey,
        subIssue.id,
        inProgressState.id
      );
      if (success) {
        results.success++;
        results.issues.push(subIssue.identifier);
      } else {
        results.failed++;
      }
    }
  }

  return results;
}

/**
 * Complete an issue and all its sub-issues
 * Sets status to "Done" or equivalent
 */
export async function completeWork(
  apiKey: string,
  parentIdentifier: string
): Promise<{ success: number; failed: number; issues: string[] }> {
  const issue = await getIssue(apiKey, parentIdentifier);
  if (!issue) {
    throw new Error(`Issue ${parentIdentifier} not found`);
  }

  const doneState = await findStateByName(apiKey, "done");
  if (!doneState) {
    throw new Error('Could not find "Done" state');
  }

  const results = { success: 0, failed: 0, issues: [] as string[] };

  // Update sub-issues first
  const subIssues = issue.children?.nodes || [];
  for (const subIssue of subIssues) {
    if (subIssue.state.type !== "canceled") {
      const success = await updateIssueStatus(apiKey, subIssue.id, doneState.id);
      if (success) {
        results.success++;
        results.issues.push(subIssue.identifier);
      } else {
        results.failed++;
      }
    }
  }

  // Update parent issue
  const parentSuccess = await updateIssueStatus(apiKey, issue.id, doneState.id);
  if (parentSuccess) {
    results.success++;
    results.issues.push(issue.identifier);
  } else {
    results.failed++;
  }

  return results;
}

/**
 * Update a specific sub-issue's status
 */
export async function updateSubIssueStatus(
  apiKey: string,
  parentIdentifier: string,
  subIssueIndex: number,
  stateName: string
): Promise<boolean> {
  const subIssues = await getSubIssues(apiKey, parentIdentifier);
  if (subIssueIndex < 0 || subIssueIndex >= subIssues.length) {
    console.error(
      `Invalid sub-issue index. Parent has ${subIssues.length} sub-issues.`
    );
    return false;
  }

  const subIssue = subIssues[subIssueIndex];
  return updateIssueStatusByName(apiKey, subIssue.identifier, stateName);
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    console.error("❌ LINEAR_API_KEY environment variable is required");
    process.exit(1);
  }

  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "get-sub-issues": {
      const identifier = args[0];
      if (!identifier) {
        console.error("Usage: linear-utils.ts get-sub-issues <issue-id>");
        process.exit(1);
      }

      console.log(`📋 Fetching sub-issues for ${identifier}...\n`);
      const issue = await getIssue(apiKey, identifier);

      if (!issue) {
        console.error(`❌ Issue ${identifier} not found`);
        process.exit(1);
      }

      console.log(`Parent: ${issue.identifier} - ${issue.title}`);
      console.log(`Status: ${issue.state.name}\n`);

      const subIssues = issue.children?.nodes || [];
      if (subIssues.length === 0) {
        console.log("No sub-issues found.");
      } else {
        console.log(`Sub-issues (${subIssues.length}):`);
        subIssues.forEach((sub, i) => {
          console.log(
            `  ${i + 1}. ${sub.identifier} - ${sub.title} [${sub.state.name}]`
          );
        });
      }
      break;
    }

    case "list-states": {
      console.log("📋 Fetching workflow states...\n");
      const states = await getWorkflowStates(apiKey);

      if (states.length === 0) {
        console.log("No states found.");
      } else {
        console.log("Workflow States:");
        states
          .sort((a, b) => a.position - b.position)
          .forEach((state) => {
            console.log(`  - ${state.name} (${state.type})`);
            console.log(`    ID: ${state.id}`);
          });
      }
      break;
    }

    case "update-status": {
      const [identifier, stateName] = args;
      if (!identifier || !stateName) {
        console.error(
          'Usage: linear-utils.ts update-status <issue-id> "<state-name>"'
        );
        process.exit(1);
      }

      console.log(`🔄 Updating ${identifier} to "${stateName}"...`);
      const success = await updateIssueStatusByName(apiKey, identifier, stateName);

      if (success) {
        console.log(`✅ Successfully updated ${identifier} to "${stateName}"`);
      } else {
        console.error(`❌ Failed to update ${identifier}`);
        process.exit(1);
      }
      break;
    }

    case "start-work": {
      const identifier = args[0];
      if (!identifier) {
        console.error("Usage: linear-utils.ts start-work <parent-issue-id>");
        process.exit(1);
      }

      console.log(`🚀 Starting work on ${identifier} and sub-issues...\n`);
      const results = await startWork(apiKey, identifier);

      console.log(
        `✅ Updated ${results.success} issue(s) to "In Progress":`
      );
      results.issues.forEach((id) => console.log(`   - ${id}`));

      if (results.failed > 0) {
        console.log(`\n⚠️  ${results.failed} issue(s) failed to update`);
      }
      break;
    }

    case "complete": {
      const identifier = args[0];
      if (!identifier) {
        console.error("Usage: linear-utils.ts complete <parent-issue-id>");
        process.exit(1);
      }

      console.log(`✅ Completing ${identifier} and sub-issues...\n`);
      const results = await completeWork(apiKey, identifier);

      console.log(`✅ Updated ${results.success} issue(s) to "Done":`);
      results.issues.forEach((id) => console.log(`   - ${id}`));

      if (results.failed > 0) {
        console.log(`\n⚠️  ${results.failed} issue(s) failed to update`);
      }
      break;
    }

    case "help":
    default:
      console.log(`
Linear Utilities - Manage Linear issues from the command line

Commands:
  get-sub-issues <issue-id>           Get all sub-issues of a parent issue
  list-states                         List all workflow states
  update-status <issue-id> <state>    Update an issue's status
  start-work <parent-issue-id>        Set parent + sub-issues to "In Progress"
  complete <parent-issue-id>          Set parent + sub-issues to "Done"

Examples:
  tsx .cursor/scripts/linear-utils.ts get-sub-issues AXO-118
  tsx .cursor/scripts/linear-utils.ts start-work AXO-118
  tsx .cursor/scripts/linear-utils.ts update-status AXO-118-1 "In Progress"
  tsx .cursor/scripts/linear-utils.ts complete AXO-118
      `);
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Error:", error.message || error);
    process.exit(1);
  });
}
