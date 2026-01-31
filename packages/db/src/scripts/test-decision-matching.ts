/**
 * Test the decision matching service
 * Run with: npx tsx packages/db/src/scripts/test-decision-matching.ts
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from root
config({ path: resolve(__dirname, "../../../../.env.local") });

import {
  getActiveDecisions,
  matchDecisionsForTicket,
  formatDecisionsForPrompt,
} from "../../../../apps/api/src/services/forge/decisions.js";

async function main() {
  console.log("=== Decision Matching Smoke Test ===\n");

  // First, check what decisions exist
  const allDecisions = await getActiveDecisions();
  console.log(`Active decisions in database: ${allDecisions.length}`);

  if (allDecisions.length === 0) {
    console.log("\n⚠️  No decisions found! Create some via the Admin UI first.");
    console.log("   Go to http://localhost:5173/decisions and add some decisions.\n");
    process.exit(0);
  }

  console.log("\nDecisions available:");
  for (const d of allDecisions) {
    console.log(`  - ${d.identifier}: ${d.decision.substring(0, 60)}${d.decision.length > 60 ? "..." : ""}`);
    if (d.scope?.length) {
      console.log(`    Tags: ${d.scope.join(", ")}`);
    }
  }

  // Test matching with a sample ticket
  const testTicket = {
    title: "Add user authentication with JWT",
    description: "Implement login/logout functionality using JWT tokens. Include refresh token support.",
    type: "feature",
    labels: ["api", "auth", "security"],
  };

  console.log("\n--- Test Ticket ---");
  console.log(`Title: ${testTicket.title}`);
  console.log(`Type: ${testTicket.type}`);
  console.log(`Labels: ${testTicket.labels?.join(", ")}`);

  console.log("\n--- Matching Results ---");

  const matched = await matchDecisionsForTicket(testTicket);

  console.log(`\nMatched ${matched.length} of ${allDecisions.length} decisions:\n`);

  if (matched.length > 0) {
    for (const d of matched) {
      console.log(`  ✓ ${d.identifier}: ${d.decision}`);
    }
  } else {
    console.log("  (No decisions matched this ticket)");
  }

  // Show formatted output
  console.log("\n--- Formatted Prompt Section ---");
  const formatted = formatDecisionsForPrompt(matched);
  if (formatted) {
    console.log(formatted);
  } else {
    console.log("(Empty - no decisions to inject)");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
