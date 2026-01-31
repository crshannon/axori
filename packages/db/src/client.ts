// Load environment variables from root .env.local or .env
// Only load in Node.js environment (not in browser)
// Use async function to properly handle ESM dynamic imports
async function loadEnvIfNeeded() {
  // Check if we're in a Node.js environment
  if (typeof window !== 'undefined' || typeof process === 'undefined' || !process.versions?.node) {
    return; // Skip in browser environments
  }

  try {
    // Use dynamic imports for ESM compatibility
    const { config } = await import("dotenv");
    const { resolve, dirname } = await import("path");
    const { existsSync } = await import("fs");
    const { fileURLToPath } = await import("url");

    // Get __dirname equivalent for ESM
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

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
  } catch (_error) {
    // Silently fail in browser environments or if Node.js modules aren't available
    // This is expected when this code is analyzed by Vite for client builds
  }
}

// Only call in Node.js environment - fire and forget since it's for side effects
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
  get(_target, prop: string | symbol) {
    if (!dbInstance) {
      dbInstance = createDb();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (dbInstance as any)[prop];
  },
}) as ReturnType<typeof drizzle>;
