/**
 * Clear stuck tickets (tickets with agent assigned but no running execution)
 * Run with: npx tsx packages/db/src/scripts/clear-stuck-tickets.ts
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from root
config({ path: resolve(__dirname, "../../../../.env.local") });

import { db } from "../client.js";
import { forgeAgentExecutions, forgeTickets } from "../schema/index.js";
import { eq, sql, isNotNull } from "drizzle-orm";

async function clearStuckTickets() {
  console.log("Checking for stuck tickets...\n");

  // Find tickets with assigned agents
  const ticketsWithAgents = await db
    .select()
    .from(forgeTickets)
    .where(isNotNull(forgeTickets.assignedAgent));

  if (ticketsWithAgents.length === 0) {
    console.log("No tickets with assigned agents found.");
    process.exit(0);
  }

  console.log(`Found ${ticketsWithAgents.length} ticket(s) with assigned agents:\n`);

  for (const ticket of ticketsWithAgents) {
    console.log(`  Ticket: ${ticket.identifier} - ${ticket.title}`);
    console.log(`  Agent: ${ticket.assignedAgent}`);
    console.log(`  Session: ${ticket.agentSessionId || 'none'}`);

    // Check if there's an active execution
    if (ticket.agentSessionId) {
      const [execution] = await db
        .select()
        .from(forgeAgentExecutions)
        .where(eq(forgeAgentExecutions.id, ticket.agentSessionId))
        .limit(1);

      if (execution) {
        console.log(`  Execution status: ${execution.status}`);
      } else {
        console.log(`  Execution not found (orphaned session)`);
      }
    }

    console.log("");
  }

  // Clear all agent assignments
  console.log("Clearing all agent assignments...\n");

  for (const ticket of ticketsWithAgents) {
    await db
      .update(forgeTickets)
      .set({
        assignedAgent: null,
        agentSessionId: null,
        updatedAt: new Date(),
      })
      .where(eq(forgeTickets.id, ticket.id));

    console.log(`  Cleared: ${ticket.identifier}`);
  }

  // Also mark any running/pending executions as failed
  const activeExecutions = await db
    .select()
    .from(forgeAgentExecutions)
    .where(sql`${forgeAgentExecutions.status} IN ('running', 'pending')`);

  if (activeExecutions.length > 0) {
    console.log(`\nMarking ${activeExecutions.length} active execution(s) as failed...`);
    for (const exec of activeExecutions) {
      await db
        .update(forgeAgentExecutions)
        .set({
          status: "failed",
          completedAt: new Date(),
          executionLog: "Manually cleared stuck execution",
        })
        .where(eq(forgeAgentExecutions.id, exec.id));
      console.log(`  Failed: ${exec.id.slice(0, 8)}...`);
    }
  }

  console.log("\nDone!");
  process.exit(0);
}

clearStuckTickets().catch(console.error);
