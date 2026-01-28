// Load environment variables from root .env.local or .env
import { config } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

// Try to load .env files in order of precedence
// Check both relative to __dirname (for compiled code) and process.cwd() (for tsx watch)
const cwd = process.cwd();
const envPaths = [
  resolve(__dirname, "../../.env.local"), // Root .env.local (from src/)
  resolve(__dirname, "../../.env"), // Root .env (from src/)
  resolve(cwd, "../../.env.local"), // Root .env.local (from cwd)
  resolve(cwd, "../../.env"), // Root .env (from cwd)
  resolve(cwd, ".env.local"), // Current dir .env.local
  resolve(cwd, ".env"), // Current dir .env
  resolve(__dirname, "../.env.local"), // apps/.env.local
  resolve(__dirname, "../.env"), // apps/.env
  resolve(__dirname, ".env.local"), // apps/api/.env.local
  resolve(__dirname, ".env"), // apps/api/.env
];

// Load the first existing .env file
let loaded = false;
for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    console.log(`✓ Loaded environment variables from ${envPath}`);
    loaded = true;
    break;
  }
}

if (!loaded) {
  console.warn("⚠️  No .env file found. Make sure DATABASE_URL is set in your environment.");
}

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
// Clerk middleware setup - uncomment when ready
// import { clerkMiddleware } from "@clerk/clerk-sdk-node/hono";

// Initialize tracking
import { tracking } from "./utils/tracking";
import { initializePostHog } from "./utils/tracking/providers/posthog";

const posthogProvider = initializePostHog();
if (posthogProvider) {
  tracking.initialize(posthogProvider, true);
  console.log("✓ PostHog tracking initialized");
} else {
  console.log("⚠️  Tracking disabled (no PostHog API key)");
}

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
  })
);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
import propertiesRouter from "./routes/properties";
import onboardingRouter from "./routes/onboarding";
import usersRouter from "./routes/users";
import marketsRouter from "./routes/markets";
import mapboxRouter from "./routes/mapbox";
import portfoliosRouter from "./routes/portfolios";
import permissionsRouter from "./routes/permissions";
import portfolioMembersRouter from "./routes/portfolio-members";
import bankAccountsRouter from "./routes/bank-accounts";
import documentsRouter from "./routes/documents";
import strategyRouter from "./routes/strategy";
app.route("/api/properties", propertiesRouter);
app.route("/api/onboarding", onboardingRouter);
app.route("/api/users", usersRouter);
app.route("/api/markets", marketsRouter);
app.route("/api/mapbox", mapboxRouter);
app.route("/api/portfolios", portfoliosRouter);
app.route("/api/permissions", permissionsRouter);
app.route("/api/portfolio-members", portfolioMembersRouter);
app.route("/api/bank-accounts", bankAccountsRouter);
app.route("/api/documents", documentsRouter);
app.route("/api/strategy", strategyRouter);

const port = Number(process.env.PORT) || 3001;

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`🚀 API server running on http://localhost:${info.port}`);
});

