/**
 * Learning Hub API Routes
 *
 * Provides endpoints for learning hub progress tracking, bookmarks, and achievements.
 * All routes require authentication.
 */

import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@axori/db";
import {
  userLearningProgress,
  userLearningBookmarks,
  userLearningAchievements,
  userQuizAttempts,
} from "@axori/db/src/schema";
import { requireAuth, getAuthenticatedUserId } from "../middleware/permissions";
import { withErrorHandling } from "../utils/errors";

const learningHubRouter = new Hono();

// =====================================================
// PROGRESS ROUTES
// =====================================================

// GET /api/learning-hub/progress - Get all progress for current user
learningHubRouter.get(
  "/progress",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);

    const progress = await db
      .select()
      .from(userLearningProgress)
      .where(eq(userLearningProgress.userId, userId))
      .orderBy(desc(userLearningProgress.updatedAt));

    return c.json({ progress });
  }, { operation: "getLearningProgress" })
);

// GET /api/learning-hub/progress/:contentType/:slug - Get specific progress
learningHubRouter.get(
  "/progress/:contentType/:slug",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const contentType = c.req.param("contentType") as "term" | "article" | "path" | "lesson" | "quiz";
    const slug = c.req.param("slug");

    const [record] = await db
      .select()
      .from(userLearningProgress)
      .where(
        and(
          eq(userLearningProgress.userId, userId),
          eq(userLearningProgress.contentType, contentType),
          eq(userLearningProgress.contentSlug, slug)
        )
      )
      .limit(1);

    if (!record) {
      return c.json({ progress: null });
    }

    return c.json({ progress: record });
  }, { operation: "getLearningProgressItem" })
);

// POST /api/learning-hub/progress - Create or update progress
learningHubRouter.post(
  "/progress",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const body = await c.req.json();
    const { contentType, contentSlug, status, progressData } = body;

    if (!contentType || !contentSlug) {
      return c.json({ error: "contentType and contentSlug are required" }, 400);
    }

    // Check if record exists
    const [existing] = await db
      .select()
      .from(userLearningProgress)
      .where(
        and(
          eq(userLearningProgress.userId, userId),
          eq(userLearningProgress.contentType, contentType),
          eq(userLearningProgress.contentSlug, contentSlug)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(userLearningProgress)
        .set({
          status: status || existing.status,
          progressData: progressData !== undefined ? progressData : existing.progressData,
          completedAt: status === "completed" ? new Date() : existing.completedAt,
          updatedAt: new Date(),
        })
        .where(eq(userLearningProgress.id, existing.id))
        .returning();

      return c.json({ progress: updated });
    }

    // Create new
    const [created] = await db
      .insert(userLearningProgress)
      .values({
        userId,
        contentType,
        contentSlug,
        status: status || "viewed",
        progressData: progressData || null,
        completedAt: status === "completed" ? new Date() : null,
      })
      .returning();

    return c.json({ progress: created }, 201);
  }, { operation: "upsertLearningProgress" })
);

// =====================================================
// BOOKMARKS ROUTES
// =====================================================

// GET /api/learning-hub/bookmarks - Get all bookmarks for current user
learningHubRouter.get(
  "/bookmarks",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const contentType = c.req.query("contentType");

    let query = db
      .select()
      .from(userLearningBookmarks)
      .where(eq(userLearningBookmarks.userId, userId))
      .orderBy(desc(userLearningBookmarks.createdAt));

    if (contentType) {
      query = db
        .select()
        .from(userLearningBookmarks)
        .where(
          and(
            eq(userLearningBookmarks.userId, userId),
            eq(userLearningBookmarks.contentType, contentType as "term" | "article" | "path" | "lesson" | "quiz")
          )
        )
        .orderBy(desc(userLearningBookmarks.createdAt));
    }

    const bookmarks = await query;

    return c.json({ bookmarks });
  }, { operation: "getLearningBookmarks" })
);

// POST /api/learning-hub/bookmarks - Add a bookmark
learningHubRouter.post(
  "/bookmarks",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const body = await c.req.json();
    const { contentType, contentSlug } = body;

    if (!contentType || !contentSlug) {
      return c.json({ error: "contentType and contentSlug are required" }, 400);
    }

    // Check if already bookmarked
    const [existing] = await db
      .select()
      .from(userLearningBookmarks)
      .where(
        and(
          eq(userLearningBookmarks.userId, userId),
          eq(userLearningBookmarks.contentType, contentType),
          eq(userLearningBookmarks.contentSlug, contentSlug)
        )
      )
      .limit(1);

    if (existing) {
      return c.json({ bookmark: existing });
    }

    const [created] = await db
      .insert(userLearningBookmarks)
      .values({
        userId,
        contentType,
        contentSlug,
      })
      .returning();

    return c.json({ bookmark: created }, 201);
  }, { operation: "addLearningBookmark" })
);

// DELETE /api/learning-hub/bookmarks/:contentType/:slug - Remove a bookmark
learningHubRouter.delete(
  "/bookmarks/:contentType/:slug",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const contentType = c.req.param("contentType") as "term" | "article" | "path" | "lesson" | "quiz";
    const slug = c.req.param("slug");

    await db
      .delete(userLearningBookmarks)
      .where(
        and(
          eq(userLearningBookmarks.userId, userId),
          eq(userLearningBookmarks.contentType, contentType),
          eq(userLearningBookmarks.contentSlug, slug)
        )
      );

    return c.json({ success: true });
  }, { operation: "removeLearningBookmark" })
);

// =====================================================
// ACHIEVEMENTS ROUTES
// =====================================================

// GET /api/learning-hub/achievements - Get all achievements for current user
learningHubRouter.get(
  "/achievements",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);

    const achievements = await db
      .select()
      .from(userLearningAchievements)
      .where(eq(userLearningAchievements.userId, userId))
      .orderBy(desc(userLearningAchievements.unlockedAt));

    return c.json({ achievements });
  }, { operation: "getLearningAchievements" })
);

// POST /api/learning-hub/achievements - Unlock an achievement
learningHubRouter.post(
  "/achievements",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const body = await c.req.json();
    const { achievementId, metadata } = body;

    if (!achievementId) {
      return c.json({ error: "achievementId is required" }, 400);
    }

    // Check if already unlocked
    const [existing] = await db
      .select()
      .from(userLearningAchievements)
      .where(
        and(
          eq(userLearningAchievements.userId, userId),
          eq(userLearningAchievements.achievementId, achievementId)
        )
      )
      .limit(1);

    if (existing) {
      return c.json({ achievement: existing });
    }

    const [created] = await db
      .insert(userLearningAchievements)
      .values({
        userId,
        achievementId,
        metadata: metadata || null,
      })
      .returning();

    return c.json({ achievement: created }, 201);
  }, { operation: "unlockLearningAchievement" })
);

// =====================================================
// QUIZ ROUTES
// =====================================================

// GET /api/learning-hub/quizzes/:slug/attempts - Get quiz attempts for a specific quiz
learningHubRouter.get(
  "/quizzes/:slug/attempts",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const slug = c.req.param("slug");

    const attempts = await db
      .select()
      .from(userQuizAttempts)
      .where(
        and(
          eq(userQuizAttempts.userId, userId),
          eq(userQuizAttempts.quizSlug, slug)
        )
      )
      .orderBy(desc(userQuizAttempts.completedAt));

    return c.json({ attempts });
  }, { operation: "getQuizAttempts" })
);

// POST /api/learning-hub/quizzes/:slug/attempts - Submit a quiz attempt
learningHubRouter.post(
  "/quizzes/:slug/attempts",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const slug = c.req.param("slug");
    const body = await c.req.json();
    const { score, maxScore, answers } = body;

    if (score === undefined || maxScore === undefined || !answers) {
      return c.json({ error: "score, maxScore, and answers are required" }, 400);
    }

    const [created] = await db
      .insert(userQuizAttempts)
      .values({
        userId,
        quizSlug: slug,
        score,
        maxScore,
        answers,
      })
      .returning();

    return c.json({ attempt: created }, 201);
  }, { operation: "submitQuizAttempt" })
);

// =====================================================
// STATS ROUTE
// =====================================================

// GET /api/learning-hub/stats - Get learning stats for current user
learningHubRouter.get(
  "/stats",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);

    // Get progress counts
    const progress = await db
      .select()
      .from(userLearningProgress)
      .where(eq(userLearningProgress.userId, userId));

    const termsViewed = progress.filter((p) => p.contentType === "term").length;
    const articlesRead = progress.filter((p) => p.contentType === "article" && p.status === "completed").length;
    const pathsCompleted = progress.filter((p) => p.contentType === "path" && p.status === "completed").length;
    const pathsInProgress = progress.filter((p) => p.contentType === "path" && p.status === "in_progress").length;

    // Get bookmark count
    const bookmarks = await db
      .select()
      .from(userLearningBookmarks)
      .where(eq(userLearningBookmarks.userId, userId));

    // Get achievement count
    const achievements = await db
      .select()
      .from(userLearningAchievements)
      .where(eq(userLearningAchievements.userId, userId));

    return c.json({
      stats: {
        termsViewed,
        articlesRead,
        pathsCompleted,
        pathsInProgress,
        totalBookmarks: bookmarks.length,
        achievementsUnlocked: achievements.length,
      },
    });
  }, { operation: "getLearningStats" })
);

export default learningHubRouter;
