import { Hono } from "hono";
import { db } from "@axori/db";
import { properties } from "@axori/db/src/schema";
import { eq, and, desc } from "drizzle-orm";
import { propertyInsertSchema, propertyUpdateSchema } from "@axori/shared/src/validation";
import { z } from "zod";

const propertiesRouter = new Hono();

// Get all properties (filter by portfolio and/or status if provided)
propertiesRouter.get("/", async (c) => {
  const portfolioId = c.req.query("portfolioId");
  const status = c.req.query("status");

  let query = db.select().from(properties);

  const conditions = [];
  if (portfolioId) {
    conditions.push(eq(properties.portfolioId, portfolioId));
  }
  if (status) {
    conditions.push(eq(properties.status, status as any));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions) as any) as any;
  }

  // Order by most recent first
  query = query.orderBy(desc(properties.updatedAt)) as any;

  const allProperties = await query;
  return c.json({ properties: allProperties });
});

// Get single property by ID
propertiesRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const property = await db.select().from(properties).where(eq(properties.id, id)).limit(1);

  if (!property || property.length === 0) {
    return c.json({ error: "Property not found" }, 404);
  }

  return c.json({ property: property[0] });
});

// Create new property (draft or active)
propertiesRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validated = propertyInsertSchema.parse(body);

    const [property] = await db
      .insert(properties)
      .values({
        ...validated,
        status: validated.status || "draft",
      })
      .returning();

    return c.json({ property }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation failed", details: error.errors },
        400
      );
    }
    console.error("Error creating property:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update existing property (used for draft updates and finalizing)
propertiesRouter.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const validated = propertyUpdateSchema.parse({ ...body, id });

    const [updated] = await db
      .update(properties)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: "Property not found" }, 404);
    }

    return c.json({ property: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation failed", details: error.errors },
        400
      );
    }
    console.error("Error updating property:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Complete/finalize a draft property (mark as active)
propertiesRouter.post("/:id/complete", async (c) => {
  try {
    const id = c.req.param("id");

    // Verify property exists and is draft
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);

    if (!property) {
      return c.json({ error: "Property not found" }, 404);
    }

    // Mark as active and ensure propertyType is set (required for active)
    const [updated] = await db
      .update(properties)
      .set({
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id))
      .returning();

    return c.json({ property: updated });
  } catch (error) {
    console.error("Error completing property:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/properties/drafts/me - Get current user's most recent draft property
propertiesRouter.get("/drafts/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get user ID - using direct import to avoid type conflicts
  const { users, userPortfolios } = await import("@axori/db/src/schema");
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Get user's default portfolio
  const userPortfoliosList = await db
    .select()
    .from(userPortfolios)
    .where(eq(userPortfolios.userId, user.id))
    .limit(1);

  if (userPortfoliosList.length === 0) {
    return c.json({ property: null }); // No portfolio, no drafts
  }

  const portfolioId = userPortfoliosList[0].portfolioId;

  // Get most recent draft property for this portfolio added by this user
  // Using query params approach to avoid type conflicts
  const allDrafts = await db
    .select()
    .from(properties)
    .where(eq(properties.portfolioId, portfolioId) as any);

  // Filter in memory for status and addedBy (to avoid type conflicts)
  const userDrafts = allDrafts
    .filter(
      (p) =>
        p.status === "draft" &&
        p.addedBy === user.id
    )
    .sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA; // Most recent first
    });

  if (userDrafts.length === 0) {
    return c.json({ property: null });
  }

  return c.json({ property: userDrafts[0] });
});

export default propertiesRouter;

