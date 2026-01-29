/**
 * GitHub Webhooks for Forge
 *
 * Handles deployment notifications from GitHub Actions workflows
 */

import { Hono } from "hono"
import { z } from "zod"
import { db, forgeTickets, forgeDeployments, forgeReleases, eq, and } from "@axori/db"

const router = new Hono()

// =============================================================================
// Webhook Secret Verification Middleware
// =============================================================================

async function verifyWebhookSecret(c: any, next: () => Promise<void>) {
  const secret = c.req.header("X-Webhook-Secret")
  const expectedSecret = process.env.FORGE_WEBHOOK_SECRET

  if (!expectedSecret) {
    console.warn("FORGE_WEBHOOK_SECRET not configured - skipping verification")
    return next()
  }

  if (secret !== expectedSecret) {
    return c.json({ error: "Invalid webhook secret" }, 401)
  }

  return next()
}

// =============================================================================
// Validation Schemas
// =============================================================================

const previewDeploymentSchema = z.object({
  ticket_id: z.string().optional(),
  preview_url: z.string().url(),
  branch: z.string(),
  status: z.enum(["pending", "building", "deployed", "failed"]),
  commit_sha: z.string(),
})

const stagingDeploymentSchema = z.object({
  environment: z.literal("staging"),
  status: z.enum(["pending", "building", "deployed", "failed"]),
  commit_sha: z.string(),
  branch: z.string(),
})

const productionDeploymentSchema = z.object({
  environment: z.literal("production"),
  status: z.enum(["pending", "building", "deployed", "failed"]),
  commit_sha: z.string(),
  release_tag: z.string().optional(),
  tickets: z.string().optional(), // Comma-separated ticket IDs
  branch: z.string(),
})

// =============================================================================
// Routes
// =============================================================================

/**
 * POST /webhooks/github/preview
 * Handle preview deployment notifications
 */
router.post("/preview", verifyWebhookSecret, async (c) => {
  const body = await c.req.json()
  const parsed = previewDeploymentSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: "Invalid payload", details: parsed.error.issues }, 400)
  }

  const { ticket_id, preview_url, branch, status, commit_sha } = parsed.data

  // Create deployment record
  const [deployment] = await db
    .insert(forgeDeployments)
    .values({
      environment: "preview",
      previewUrl: preview_url,
      status,
      triggeredBy: "github_actions",
      completedAt: status === "deployed" ? new Date() : null,
    })
    .returning()

  // If ticket ID provided, update ticket with preview URL
  if (ticket_id && status === "deployed") {
    // Find ticket by identifier (e.g., AXO-123)
    const [ticket] = await db
      .select()
      .from(forgeTickets)
      .where(eq(forgeTickets.identifier, ticket_id))
      .limit(1)

    if (ticket) {
      await db
        .update(forgeTickets)
        .set({
          previewUrl: preview_url,
          branchName: branch,
          updatedAt: new Date(),
        })
        .where(eq(forgeTickets.id, ticket.id))

      // Link deployment to ticket
      await db
        .update(forgeDeployments)
        .set({ ticketId: ticket.id })
        .where(eq(forgeDeployments.id, deployment.id))
    }
  }

  console.log(`[Forge Webhook] Preview deployment: ${status} for branch ${branch}`)

  return c.json({
    success: true,
    deployment_id: deployment.id,
    message: `Preview deployment recorded: ${status}`,
  })
})

/**
 * POST /webhooks/github/staging
 * Handle staging deployment notifications
 */
router.post("/staging", verifyWebhookSecret, async (c) => {
  const body = await c.req.json()
  const parsed = stagingDeploymentSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: "Invalid payload", details: parsed.error.issues }, 400)
  }

  const { status, commit_sha } = parsed.data

  // Create deployment record
  const [deployment] = await db
    .insert(forgeDeployments)
    .values({
      environment: "staging",
      status,
      triggeredBy: "github_actions",
      completedAt: status === "deployed" ? new Date() : null,
    })
    .returning()

  console.log(`[Forge Webhook] Staging deployment: ${status}`)

  return c.json({
    success: true,
    deployment_id: deployment.id,
    message: `Staging deployment recorded: ${status}`,
  })
})

/**
 * POST /webhooks/github/production
 * Handle production deployment notifications
 */
router.post("/production", verifyWebhookSecret, async (c) => {
  const body = await c.req.json()
  const parsed = productionDeploymentSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: "Invalid payload", details: parsed.error.issues }, 400)
  }

  const { status, commit_sha, release_tag, tickets } = parsed.data

  // Create deployment record
  const [deployment] = await db
    .insert(forgeDeployments)
    .values({
      environment: "production",
      releaseTag: release_tag,
      status,
      triggeredBy: "github_actions",
      completedAt: status === "deployed" ? new Date() : null,
    })
    .returning()

  // If release tag provided, create or update release record
  if (release_tag && status === "deployed") {
    const ticketIds = tickets ? tickets.split(",").filter(Boolean) : []

    // Check if release already exists
    const [existingRelease] = await db
      .select()
      .from(forgeReleases)
      .where(eq(forgeReleases.tag, release_tag))
      .limit(1)

    if (existingRelease) {
      await db
        .update(forgeReleases)
        .set({
          ticketsIncluded: ticketIds,
          publishedAt: new Date(),
        })
        .where(eq(forgeReleases.id, existingRelease.id))
    } else {
      await db.insert(forgeReleases).values({
        tag: release_tag,
        name: `Release ${release_tag}`,
        ticketsIncluded: ticketIds,
        publishedAt: new Date(),
      })
    }

    // Update ticket statuses to 'done' for included tickets
    if (ticketIds.length > 0) {
      for (const ticketId of ticketIds) {
        await db
          .update(forgeTickets)
          .set({
            status: "done",
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(forgeTickets.identifier, ticketId),
              // Only update if in 'testing' or 'in_review' status
              eq(forgeTickets.status, "testing")
            )
          )
      }
    }
  }

  console.log(`[Forge Webhook] Production deployment: ${status} - ${release_tag || "no tag"}`)

  return c.json({
    success: true,
    deployment_id: deployment.id,
    release_tag,
    message: `Production deployment recorded: ${status}`,
  })
})

/**
 * GET /webhooks/github/health
 * Health check endpoint
 */
router.get("/health", (c) => {
  return c.json({ status: "ok", service: "forge-github-webhooks" })
})

export default router
