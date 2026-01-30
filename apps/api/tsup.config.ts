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
  external: [
    // Database
    "drizzle-orm",
    "drizzle-orm/pg-core",
    "drizzle-orm/postgres-js",
    "postgres",
    // React (for email templates)
    "react",
    "react/jsx-runtime",
    "react-dom",
    "@react-email/components",
    "@react-email/render",
    // Runtime dependencies
    "dotenv",
    "hono",
    "hono/cors",
    "hono/logger",
    "@hono/node-server",
    "@clerk/clerk-sdk-node",
    "stripe",
    "resend",
    "zod",
    "@anthropic-ai/sdk",
    "archiver",
  ],
});
