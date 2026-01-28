/**
 * Email Capture API Routes
 *
 * Public endpoints for capturing email signups (waitlist/coming soon).
 * These routes do NOT require authentication.
 */

import { Hono } from "hono";
import { db, eq } from "@axori/db";
import { emailCaptures } from "@axori/db/src/schema";
import { withErrorHandling, ApiError } from "../utils/errors";
import { emailCaptureInsertSchema } from "@axori/shared/src/validation";
import { sendComingSoonEmail } from "../utils/email";
import { tracking } from "../utils/tracking";

const emailCapturesRouter = new Hono();

/**
 * POST /api/email-captures
 *
 * Capture an email signup for the waitlist.
 * - Validates input
 * - Upserts to database (graceful duplicate handling)
 * - Sends confirmation email
 * - Returns success response
 */
emailCapturesRouter.post(
  "/",
  withErrorHandling(
    async (c) => {
      const body = await c.req.json();

      // Validate input
      const parseResult = emailCaptureInsertSchema.safeParse(body);
      if (!parseResult.success) {
        const errors = parseResult.error.errors.map((e) => e.message).join(", ");
        throw new ApiError(`Validation failed: ${errors}`, 400, { operation: "captureEmail" });
      }

      const data = parseResult.data;

      // Get request metadata
      const ipAddress =
        c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
        c.req.header("x-real-ip") ||
        null;
      const userAgent = c.req.header("user-agent") || null;
      const referrer = c.req.header("referer") || null;

      // Check if email already exists
      const [existingCapture] = await db
        .select()
        .from(emailCaptures)
        .where(eq(emailCaptures.email, data.email))
        .limit(1);

      if (existingCapture) {
        // Email already captured - return success without sending duplicate email
        // Update the record with latest UTM params if provided
        if (data.utmSource || data.utmMedium || data.utmCampaign) {
          await db
            .update(emailCaptures)
            .set({
              utmSource: data.utmSource || existingCapture.utmSource,
              utmMedium: data.utmMedium || existingCapture.utmMedium,
              utmCampaign: data.utmCampaign || existingCapture.utmCampaign,
              utmContent: data.utmContent || existingCapture.utmContent,
              utmTerm: data.utmTerm || existingCapture.utmTerm,
              updatedAt: new Date(),
            })
            .where(eq(emailCaptures.id, existingCapture.id));
        }

        return c.json({
          success: true,
          message: "You're already on the list! We'll be in touch soon.",
          isExisting: true,
        });
      }

      // Insert new email capture
      const [newCapture] = await db
        .insert(emailCaptures)
        .values({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName || null,
          source: data.source || "homepage",
          campaign: data.campaign || null,
          utmSource: data.utmSource || null,
          utmMedium: data.utmMedium || null,
          utmCampaign: data.utmCampaign || null,
          utmContent: data.utmContent || null,
          utmTerm: data.utmTerm || null,
          status: "pending",
          ipAddress,
          userAgent,
          referrer,
        })
        .returning();

      // Track signup event in PostHog (for analytics/attribution)
      tracking.capture({
        event: "waitlist_signup",
        distinctId: data.email, // Use email as distinct ID for anonymous users
        properties: {
          source: data.source,
          campaign: data.campaign,
          // UTM params for attribution
          utm_source: data.utmSource,
          utm_medium: data.utmMedium,
          utm_campaign: data.utmCampaign,
          utm_content: data.utmContent,
          utm_term: data.utmTerm,
          // Additional context
          referrer,
          $set: {
            // Set user properties in PostHog
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName,
            signup_source: data.source,
          },
        },
      });

      // Send confirmation email
      const emailResult = await sendComingSoonEmail({
        to: data.email,
        firstName: data.firstName,
      });

      // Update status to notified if email was sent successfully
      if (emailResult.success) {
        await db
          .update(emailCaptures)
          .set({
            status: "notified",
            updatedAt: new Date(),
          })
          .where(eq(emailCaptures.id, newCapture.id));
      }

      return c.json(
        {
          success: true,
          message: `Thanks, ${data.firstName}! Check your inbox for a confirmation email.`,
          isExisting: false,
          emailSent: emailResult.success,
        },
        201
      );
    },
    { operation: "captureEmail" }
  )
);

/**
 * GET /api/email-captures/stats
 *
 * Get basic stats about email captures (for admin dashboard).
 * TODO: Add admin authentication when implemented.
 */
emailCapturesRouter.get(
  "/stats",
  withErrorHandling(
    async (c) => {
      // For now, return basic stats without auth
      // In production, add admin auth check here
      const authHeader = c.req.header("Authorization");
      const adminKey = process.env.ADMIN_API_KEY;

      // Simple admin key check (replace with proper auth later)
      if (adminKey && authHeader !== `Bearer ${adminKey}`) {
        throw new ApiError("Unauthorized", 401, { operation: "getEmailCaptureStats" });
      }

      const allCaptures = await db.select().from(emailCaptures);

      const stats = {
        total: allCaptures.length,
        byStatus: {
          pending: allCaptures.filter((c) => c.status === "pending").length,
          notified: allCaptures.filter((c) => c.status === "notified").length,
          converted: allCaptures.filter((c) => c.status === "converted").length,
          unsubscribed: allCaptures.filter((c) => c.status === "unsubscribed")
            .length,
        },
        bySource: allCaptures.reduce(
          (acc, c) => {
            const source = c.source || "unknown";
            acc[source] = (acc[source] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        recentSignups: allCaptures
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 10)
          .map((c) => ({
            firstName: c.firstName,
            email: c.email.replace(/(.{2}).*@/, "$1***@"), // Partially mask email
            source: c.source,
            createdAt: c.createdAt,
          })),
      };

      return c.json(stats);
    },
    { operation: "getEmailCaptureStats" }
  )
);

export default emailCapturesRouter;
