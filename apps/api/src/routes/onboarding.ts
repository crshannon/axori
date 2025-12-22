import { Hono } from "hono";
import { db } from "@axori/db";
import { users } from "@axori/db/src/schema";
import { eq, and } from "drizzle-orm";
import {
  onboardingUpdateSchema,
  onboardingDataSchema,
} from "@axori/shared/src/validation";

const onboardingRouter = new Hono();

// GET /api/onboarding - Get current user's onboarding status
onboardingRouter.get("/", async (c) => {
  // TODO: Uncomment when Clerk middleware is enabled
  // const { userId: clerkId } = c.req.var.auth || {};
  // For now, get from header or use a temporary solution
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get user's internal ID from clerkId, create if doesn't exist
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    // User doesn't exist, create them
    try {
      [user] = await db
        .insert(users)
        .values({
          clerkId,
          email: `${clerkId}@clerk.user`, // Temporary - should get from Clerk
        })
        .returning();
    } catch (error: any) {
      // If insert fails (e.g., race condition), try to fetch again
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);

      if (!user) {
        console.error("Error creating user:", error);
        return c.json({ error: "Failed to create user" }, 500);
      }
    }
  }

  // Parse onboarding data if it exists
  let onboardingData = null;
  if (user.onboardingData) {
    try {
      onboardingData = JSON.parse(user.onboardingData);
      // Validate parsed data
      onboardingDataSchema.parse(onboardingData);
    } catch (error) {
      // If parsing fails, return null
      onboardingData = null;
    }
  }

  return c.json({
    step: user.onboardingStep,
    completed: user.onboardingCompleted !== null,
    completedAt: user.onboardingCompleted,
    data: onboardingData,
    firstName: user.firstName,
    lastName: user.lastName,
  });
});

// PUT /api/onboarding - Update onboarding progress
onboardingRouter.put("/", async (c) => {
  // TODO: Uncomment when Clerk middleware is enabled
  // const { userId: clerkId } = c.req.var.auth || {};
  // For now, get from header or use a temporary solution
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get user's internal ID from clerkId, create if doesn't exist
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    // User doesn't exist, create them
    try {
      [user] = await db
        .insert(users)
        .values({
          clerkId,
          email: `${clerkId}@clerk.user`, // Temporary - should get from Clerk
        })
        .returning();
    } catch (error: any) {
      // If insert fails (e.g., race condition), try to fetch again
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);

      if (!user) {
        console.error("Error creating user:", error);
        return c.json({ error: "Failed to create user" }, 500);
      }
    }
  }

  const body = await c.req.json();
  const validated = onboardingUpdateSchema.parse(body);

  // Prepare update data
  const updateData: {
    onboardingStep?: string | null;
    onboardingData?: string | null;
    onboardingCompleted?: Date | null;
    firstName?: string | null;
    lastName?: string | null;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  // Update step
  if (validated.step !== undefined) {
    updateData.onboardingStep = validated.step;
  }

  // Update onboarding data (merge with existing)
  if (validated.data) {
    let existingData = {};
    if (user.onboardingData) {
      try {
        existingData = JSON.parse(user.onboardingData);
      } catch {
        existingData = {};
      }
    }
    const mergedData = { ...existingData, ...validated.data };
    updateData.onboardingData = JSON.stringify(mergedData);
  }

  // If step is null (completed), set onboardingCompleted timestamp
  if (validated.step === null && !user.onboardingCompleted) {
    updateData.onboardingCompleted = new Date();
  }

  // Update firstName/lastName if provided
  if (validated.firstName !== undefined) {
    updateData.firstName = validated.firstName || null;
  }
  if (validated.lastName !== undefined) {
    updateData.lastName = validated.lastName || null;
  }

  // Update user
  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, user.id))
    .returning();

  // Parse onboarding data for response
  let onboardingData = null;
  if (updated.onboardingData) {
    try {
      onboardingData = JSON.parse(updated.onboardingData);
    } catch {
      onboardingData = null;
    }
  }

  return c.json({
    step: updated.onboardingStep,
    completed: updated.onboardingCompleted !== null,
    completedAt: updated.onboardingCompleted,
    data: onboardingData,
    firstName: updated.firstName,
    lastName: updated.lastName,
  });
});

export default onboardingRouter;

