// Load environment variables from root .env.local or .env
// Only load in Node.js environment (not in browser)
// Use a function to avoid top-level Node.js module imports that Vite tries to bundle
function loadEnvIfNeeded() {
  // Check if we're in a Node.js environment
  if (typeof window !== 'undefined' || typeof process === 'undefined' || !process.versions?.node) {
    return; // Skip in browser environments
  }

  try {
    // Use require to avoid static analysis by Vite
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { config } = require("dotenv");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resolve } = require("path");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { existsSync } = require("fs");

    // Try to load .env files in order of precedence
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
    for (const envPath of envPaths) {
      if (existsSync(envPath)) {
        config({ path: envPath });
        break;
      }
    }
  } catch (error) {
    // Silently fail in browser environments or if Node.js modules aren't available
    // This is expected when this code is analyzed by Vite for client builds
  }
}

// Only call in Node.js environment
loadEnvIfNeeded();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Only initialize database connection in Node.js environment
// In browser environments, accessing db will throw a helpful error
function createDb() {
  // Check if we're in a Node.js environment
  if (typeof window !== 'undefined') {
    throw new Error(
      "@axori/db can only be used in server-side code. " +
      "For client-side code, import types from '@axori/db/types' instead."
    );
  }

  if (typeof process === 'undefined' || !process.versions?.node) {
    throw new Error(
      "@axori/db requires a Node.js environment. " +
      "For client-side code, import types from '@axori/db/types' instead."
    );
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Disable prefetch as it is not supported for "Transaction" pool mode
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

// Lazy initialization - only create when accessed
let dbInstance: ReturnType<typeof drizzle> | null = null;

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    if (!dbInstance) {
      dbInstance = createDb();
    }
    return (dbInstance as any)[prop];
  },
}) as ReturnType<typeof drizzle>;


