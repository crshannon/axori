/**
 * Create a Forge ticket from the command line
 *
 * Usage:
 *   npx tsx packages/db/src/scripts/create-ticket.ts --title "My ticket" --type feature
 *
 * Options:
 *   --title, -t       Ticket title (required)
 *   --description, -d Ticket description
 *   --type            Ticket type: feature, bug, chore, spike (default: feature)
 *   --status, -s      Status: backlog, design, planned, in_progress, in_review, testing, done, blocked (default: backlog)
 *   --priority, -p    Priority: low, medium, high, critical (default: medium)
 *   --estimate, -e    Story points estimate (number)
 *   --labels, -l      Comma-separated labels
 *   --branch          Git branch name
 *   --pr-number       PR number
 *   --pr-url          PR URL
 *   --json            Output created ticket as JSON
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from root
config({ path: resolve(__dirname, "../../../../.env.local") });

import { db } from "../client.js";
import { forgeTickets } from "../schema/index.js";
import { sql } from "drizzle-orm";

const VALID_TYPES = ["feature", "bug", "chore", "spike"] as const;
const VALID_STATUSES = ["backlog", "design", "planned", "in_progress", "in_review", "testing", "done", "blocked"] as const;
const VALID_PRIORITIES = ["low", "medium", "high", "critical"] as const;

async function generateNextIdentifier(): Promise<string> {
  const [result] = await db
    .select({
      maxNum: sql<number>`COALESCE(MAX(SUBSTRING(identifier FROM 7)::int), 0)`,
    })
    .from(forgeTickets);

  const nextNum = (result?.maxNum || 0) + 1;
  return `FORGE-${nextNum.toString().padStart(3, "0")}`;
}

async function main() {
  const { values } = parseArgs({
    options: {
      title: { type: "string", short: "t" },
      description: { type: "string", short: "d" },
      type: { type: "string", default: "feature" },
      status: { type: "string", short: "s", default: "backlog" },
      priority: { type: "string", short: "p", default: "medium" },
      estimate: { type: "string", short: "e" },
      labels: { type: "string", short: "l" },
      branch: { type: "string" },
      "pr-number": { type: "string" },
      "pr-url": { type: "string" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(`
Create a Forge ticket from the command line

Usage:
  npx tsx packages/db/src/scripts/create-ticket.ts --title "My ticket" [options]

Options:
  --title, -t       Ticket title (required)
  --description, -d Ticket description
  --type            Ticket type: feature, bug, chore, spike (default: feature)
  --status, -s      Status: backlog, design, planned, in_progress, in_review, testing, done, blocked (default: backlog)
  --priority, -p    Priority: low, medium, high, critical (default: medium)
  --estimate, -e    Story points estimate (number)
  --labels, -l      Comma-separated labels
  --branch          Git branch name
  --pr-number       PR number
  --pr-url          PR URL
  --json            Output created ticket as JSON
  --help, -h        Show this help message

Example:
  npx tsx packages/db/src/scripts/create-ticket.ts \\
    --title "Add user authentication" \\
    --type feature \\
    --status in_review \\
    --priority high \\
    --labels "auth,security" \\
    --branch "feature/auth" \\
    --pr-number 123 \\
    --pr-url "https://github.com/org/repo/pull/123"
`);
    process.exit(0);
  }

  if (!values.title) {
    console.error("Error: --title is required");
    process.exit(1);
  }

  const ticketType = values.type as typeof VALID_TYPES[number];
  if (!VALID_TYPES.includes(ticketType)) {
    console.error(`Error: Invalid type "${values.type}". Must be one of: ${VALID_TYPES.join(", ")}`);
    process.exit(1);
  }

  const status = values.status as typeof VALID_STATUSES[number];
  if (!VALID_STATUSES.includes(status)) {
    console.error(`Error: Invalid status "${values.status}". Must be one of: ${VALID_STATUSES.join(", ")}`);
    process.exit(1);
  }

  const priority = values.priority as typeof VALID_PRIORITIES[number];
  if (!VALID_PRIORITIES.includes(priority)) {
    console.error(`Error: Invalid priority "${values.priority}". Must be one of: ${VALID_PRIORITIES.join(", ")}`);
    process.exit(1);
  }

  const identifier = await generateNextIdentifier();

  const ticketData = {
    identifier,
    title: values.title,
    description: values.description || null,
    type: ticketType,
    status,
    priority,
    estimate: values.estimate ? parseInt(values.estimate, 10) : null,
    labels: values.labels ? values.labels.split(",").map((l) => l.trim()) : null,
    branchName: values.branch || null,
    prNumber: values["pr-number"] ? parseInt(values["pr-number"], 10) : null,
    prUrl: values["pr-url"] || null,
  };

  const [ticket] = await db.insert(forgeTickets).values(ticketData).returning();

  if (values.json) {
    console.log(JSON.stringify(ticket, null, 2));
  } else {
    console.log(`\nCreated ticket: ${ticket.identifier}`);
    console.log(`  Title:    ${ticket.title}`);
    console.log(`  Type:     ${ticket.type}`);
    console.log(`  Status:   ${ticket.status}`);
    console.log(`  Priority: ${ticket.priority}`);
    if (ticket.estimate) console.log(`  Estimate: ${ticket.estimate} points`);
    if (ticket.labels?.length) console.log(`  Labels:   ${ticket.labels.join(", ")}`);
    if (ticket.branchName) console.log(`  Branch:   ${ticket.branchName}`);
    if (ticket.prUrl) console.log(`  PR:       ${ticket.prUrl}`);
    console.log("");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
