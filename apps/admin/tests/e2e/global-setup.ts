/**
 * Global Setup for Admin E2E Tests
 *
 * Runs before all tests to verify environment is properly configured.
 */

import type { FullConfig } from "@playwright/test";

const REQUIRED_ENV_VARS = [
  {
    name: "VITE_CLERK_PUBLISHABLE_KEY",
    description: "Clerk frontend publishable key",
    where: "Clerk Dashboard → API Keys",
  },
];

// eslint-disable-next-line @typescript-eslint/require-await
async function globalSetup(config: FullConfig): Promise<void> {
  console.log("\n");
  console.log("╔" + "═".repeat(62) + "╗");
  console.log("║" + "  Admin E2E Test Environment Check".padEnd(62) + "║");
  console.log("╚" + "═".repeat(62) + "╝");
  console.log("");

  const isCI = !!process.env.CI;
  console.log(`Environment: ${isCI ? "CI" : "Local"}`);

  const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:3002";
  console.log(`Base URL: ${baseURL}`);
  console.log("");

  // Check required environment variables
  const missingRequired = REQUIRED_ENV_VARS.filter(
    (envVar) => !process.env[envVar.name]
  );

  console.log("Required Environment Variables:");
  console.log("─".repeat(64));

  for (const envVar of REQUIRED_ENV_VARS) {
    const isSet = !!process.env[envVar.name];
    const status = isSet ? "✓" : "✗";
    console.log(`  ${status} ${envVar.name}`);
    if (!isSet) {
      console.log(`     └─ ${envVar.description}`);
      console.log(`        Get from: ${envVar.where}`);
    }
  }
  console.log("");

  if (missingRequired.length > 0) {
    console.log("╔" + "═".repeat(62) + "╗");
    console.log(
      "║" +
        "  E2E TESTS CANNOT RUN - Missing Required Configuration".padEnd(62) +
        "║"
    );
    console.log("╚" + "═".repeat(62) + "╝");
    console.log("");
    console.log("To fix this:");
    console.log("   1. Copy .env.local.example to .env.local");
    console.log("   2. Fill in the missing values");
    console.log("   3. Re-run: pnpm --filter @axori/admin test:e2e");
    console.log("");

    throw new Error(
      `E2E tests require environment configuration. Missing: ${missingRequired.map((v) => v.name).join(", ")}.`
    );
  }

  console.log("╔" + "═".repeat(62) + "╗");
  console.log(
    "║" + "  Environment configured - Starting tests...".padEnd(62) + "║"
  );
  console.log("╚" + "═".repeat(62) + "╝");
  console.log("");
}

export default globalSetup;
