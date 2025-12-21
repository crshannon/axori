import { Hono } from "hono";
import { db } from "@axori/db";
import { properties } from "@axori/db/src/schema";
import { eq } from "drizzle-orm";

const propertiesRouter = new Hono();

propertiesRouter.get("/", async (c) => {
  const allProperties = await db.select().from(properties);
  return c.json({ properties: allProperties });
});

propertiesRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const property = await db.select().from(properties).where(eq(properties.id, id)).limit(1);

  if (!property || property.length === 0) {
    return c.json({ error: "Property not found" }, 404);
  }

  return c.json({ property: property[0] });
});

export default propertiesRouter;

