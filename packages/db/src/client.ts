// Load environment variables from root .env.local or .env
import { config } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

// Try to load .env files in order of precedence
// Check multiple possible locations since __dirname varies based on how the code is executed
const cwd = process.cwd();
const envPaths = [
  resolve(__dirname, "../../../.env.local"), // Root .env.local (from packages/db/src)
  resolve(__dirname, "../../../.env"), // Root .env (from packages/db/src)
  resolve(__dirname, "../../.env.local"), // Root .env.local (from packages/db/dist)
  resolve(__dirname, "../../.env"), // Root .env (from packages/db/dist)
  resolve(cwd, ".env.local"), // Root .env.local (if cwd is root)
  resolve(cwd, ".env"), // Root .env (if cwd is root)
  resolve(cwd, "../../.env.local"), // Root .env.local (if cwd is packages/db)
  resolve(cwd, "../../.env"), // Root .env (if cwd is packages/db)
];

// Load the first existing .env file
let envLoaded = false;
for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    envLoaded = true;
    break;
  }
}

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });


