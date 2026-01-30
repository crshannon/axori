import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // Bundle internal workspace packages
  noExternal: ["@axori/db", "@axori/shared", "@axori/permissions"],
  // Keep these external - resolved from node_modules at runtime
  // IMPORTANT: Every non-builtin import from bundled packages must be listed here
  // AND added as a direct dependency in package.json for pnpm deploy to include it
  external: [
    // Database (from @axori/db)
    "drizzle-orm",
    "drizzle-orm/pg-core",
    "drizzle-orm/postgres-js",
    "drizzle-orm/postgres-js/migrator",
    "postgres",
    // Validation (from @axori/shared)
    "drizzle-zod",
    "zod",
    // Supabase (from @axori/shared)
    "@supabase/supabase-js",
    // React (for email templates)
    "react",
    "react/jsx-runtime",
    "react-dom",
    "@react-email/components",
    "@react-email/render",
    // Hono framework
    "hono",
    "hono/cors",
    "hono/logger",
    "hono/streaming",
    "@hono/node-server",
    // Auth
    "@clerk/clerk-sdk-node",
    "@clerk/clerk-sdk-node/hono",
    // Other runtime dependencies
    "dotenv",
    "stripe",
    "resend",
    "@anthropic-ai/sdk",
    "archiver",
  ],
});
