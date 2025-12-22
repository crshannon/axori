import { Hono } from "hono";
import { db } from "@axori/db";
import { users } from "@axori/db/src/schema";
import { eq } from "drizzle-orm";

const usersRouter = new Hono();

// POST /api/users - Create or get user
usersRouter.post("/", async (c) => {
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  const { email, firstName, lastName } = body;

  if (!email) {
    return c.json({ error: "Email is required" }, 400);
  }

  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (existingUser) {
    // User exists, return it
    return c.json({
      id: existingUser.id,
      email: existingUser.email,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      clerkId: existingUser.clerkId,
    });
  }

  // Create new user
  try {
    const [newUser] = await db
      .insert(users)
      .values({
        clerkId,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
      })
      .returning();

    return c.json(
      {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        clerkId: newUser.clerkId,
      },
      201
    );
  } catch (error: any) {
    // Handle unique constraint violation (email or clerkId already exists)
    if (error.code === "23505") {
      // Try to find the existing user
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);

      if (existing) {
        return c.json({
          id: existing.id,
          email: existing.email,
          firstName: existing.firstName,
          lastName: existing.lastName,
          clerkId: existing.clerkId,
        });
      }
    }
    console.error("Error creating user:", error);
    return c.json({ error: "Failed to create user" }, 500);
  }
});

// GET /api/users/me - Get current user
usersRouter.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    clerkId: user.clerkId,
  });
});

export default usersRouter;

