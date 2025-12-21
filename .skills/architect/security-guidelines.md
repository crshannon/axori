# Security Guidelines

This guide ensures user data privacy, proper authorization, and data isolation across the application.

## Core Security Principle

**User information must remain private when accessed at an individual user level.** All user-scoped data must be isolated and protected with proper authentication and authorization.

## User Data Isolation

### Schema Design for User-Owned Resources

Every table that contains user-specific data must include a foreign key to the users table:

```typescript
// ✅ CORRECT - Includes user foreign key
export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),  // Required!
  address: text("address").notNull(),
  // ... other fields
});

// ❌ WRONG - No user association
export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  address: text("address").notNull(),
  // Missing userId - security vulnerability!
});
```

### Using clerkId vs userId

The application uses Clerk for authentication. You can reference users by either:

1. **`userId`** (internal UUID) - Use for foreign keys and joins
2. **`clerkId`** (Clerk's external ID) - Use for authentication lookups

```typescript
// Schema with both options
export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),  // For joins
  // clerkId available via users.clerkId relationship
  // ...
});
```

## API Route Security

### Authentication Middleware

All user-scoped API endpoints must use Clerk authentication middleware:

```typescript
// apps/api/src/index.ts
import { clerkMiddleware } from "@clerk/clerk-sdk-node/hono";

const app = new Hono();

// Apply authentication to all /api routes
app.use("/api/*", clerkMiddleware());
```

### Protecting User-Scoped Endpoints

Every endpoint that returns or modifies user data must:

1. **Extract authenticated user** from request
2. **Filter queries** by user ID
3. **Validate ownership** before mutations

```typescript
// ✅ CORRECT - Filters by authenticated user
propertiesRouter.get("/", async (c) => {
  const { userId } = c.req.var.auth;  // From Clerk middleware
  
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get user's internal ID from clerkId
  const [user] = await db.select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Filter by user's internal ID
  const userProperties = await db.select()
    .from(properties)
    .where(eq(properties.userId, user.id));

  return c.json({ properties: userProperties });
});

// ❌ WRONG - Exposes all users' data
propertiesRouter.get("/", async (c) => {
  const allProperties = await db.select().from(properties);
  return c.json({ properties: allProperties });  // Security vulnerability!
});
```

### Individual Resource Access

When accessing a single resource, always verify ownership:

```typescript
// ✅ CORRECT - Verifies ownership
propertiesRouter.get("/:id", async (c) => {
  const { userId } = c.req.var.auth;
  const propertyId = c.req.param("id");

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get user's internal ID
  const [user] = await db.select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Query with user filter
  const [property] = await db.select()
    .from(properties)
    .where(and(
      eq(properties.id, propertyId),
      eq(properties.userId, user.id)  // Critical: filter by user
    ))
    .limit(1);

  if (!property) {
    return c.json({ error: "Property not found" }, 404);
  }

  return c.json({ property });
});
```

### Mutations (Create, Update, Delete)

Always validate ownership and set user ID from auth context:

```typescript
// ✅ CORRECT - Creates with authenticated user's ID
propertiesRouter.post("/", async (c) => {
  const { userId } = c.req.var.auth;

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get user's internal ID
  const [user] = await db.select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const data = await c.req.json();
  
  // Validate with Zod
  const validated = propertyInsertSchema.parse(data);

  // Set userId from auth context (never trust client)
  const [property] = await db.insert(properties)
    .values({
      ...validated,
      userId: user.id,  // Set from auth, not from request
    })
    .returning();

  return c.json({ property }, 201);
});

// ✅ CORRECT - Updates with ownership check
propertiesRouter.put("/:id", async (c) => {
  const { userId } = c.req.var.auth;
  const propertyId = c.req.param("id");

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get user's internal ID
  const [user] = await db.select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Verify ownership
  const [existing] = await db.select()
    .from(properties)
    .where(and(
      eq(properties.id, propertyId),
      eq(properties.userId, user.id)
    ))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Property not found" }, 404);
  }

  const data = await c.req.json();
  const validated = propertyUpdateSchema.parse(data);

  const [updated] = await db.update(properties)
    .set(validated)
    .where(eq(properties.id, propertyId))
    .returning();

  return c.json({ property: updated });
});
```

## Authorization Patterns

### Helper Function Pattern

Create reusable helper functions for common authorization checks:

```typescript
// apps/api/src/utils/auth.ts
import { db } from "@axori/db";
import { users } from "@axori/db/src/schema";
import { eq } from "drizzle-orm";

export async function getAuthenticatedUser(clerkId: string) {
  const [user] = await db.select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  
  return user || null;
}

export async function requireAuth(c: Context) {
  const { userId } = c.req.var.auth;
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await getAuthenticatedUser(userId);
  
  if (!user) {
    throw new Error("User not found");
  }

  return user;
}
```

### Using Helpers

```typescript
propertiesRouter.get("/", async (c) => {
  try {
    const user = await requireAuth(c);
    
    const userProperties = await db.select()
      .from(properties)
      .where(eq(properties.userId, user.id));

    return c.json({ properties: userProperties });
  } catch (error) {
    return c.json({ error: error.message }, 401);
  }
});
```

## Security Checklist for New Features

When adding a new user-scoped feature:

- [ ] Schema includes `userId` foreign key (references users table)
- [ ] API route uses Clerk authentication middleware
- [ ] All queries filter by authenticated user's ID
- [ ] Mutations set `userId` from auth context (never from request)
- [ ] Individual resource access verifies ownership
- [ ] Error messages don't leak information about other users' data
- [ ] Zod schemas don't include `userId` in insert schemas (set from auth)
- [ ] Tests verify unauthorized users can't access other users' data

## Common Security Vulnerabilities

### ❌ Exposing All Users' Data

```typescript
// VULNERABILITY: Returns all properties regardless of user
app.get("/api/properties", async (c) => {
  const allProperties = await db.select().from(properties);
  return c.json({ properties: allProperties });
});
```

**Fix**: Always filter by authenticated user's ID.

### ❌ Trusting Client-Supplied User ID

```typescript
// VULNERABILITY: Client can set any userId
app.post("/api/properties", async (c) => {
  const data = await c.req.json();
  // data.userId could be any user's ID!
  await db.insert(properties).values(data);
});
```

**Fix**: Always set `userId` from authenticated session, never from request body.

### ❌ Missing Ownership Verification

```typescript
// VULNERABILITY: User can update any property
app.put("/api/properties/:id", async (c) => {
  const id = c.req.param("id");
  const data = await c.req.json();
  // No check if property belongs to authenticated user!
  await db.update(properties).set(data).where(eq(properties.id, id));
});
```

**Fix**: Always verify ownership before allowing mutations.

### ❌ Missing Authentication

```typescript
// VULNERABILITY: No authentication required
app.get("/api/properties", async (c) => {
  // Anyone can access this endpoint
  const properties = await db.select().from(properties);
  return c.json({ properties });
});
```

**Fix**: Require authentication middleware on all user-scoped endpoints.

## Error Handling

### Don't Leak Information

```typescript
// ❌ BAD - Leaks information about other users' data
if (!property) {
  return c.json({ error: `Property ${id} belongs to user ${property.userId}` }, 404);
}

// ✅ GOOD - Generic error message
if (!property) {
  return c.json({ error: "Property not found" }, 404);
}
```

## Testing Security

Always test that:
1. Unauthenticated requests are rejected
2. Users can only access their own data
3. Users cannot access other users' data
4. Users cannot modify other users' data
5. Mutations set user ID from auth context

## Summary

- **Always** include `userId` foreign key in user-scoped schemas
- **Always** use Clerk authentication middleware on protected routes
- **Always** filter queries by authenticated user's ID
- **Never** trust client-supplied user IDs
- **Always** verify ownership before mutations
- **Never** expose other users' data in responses

