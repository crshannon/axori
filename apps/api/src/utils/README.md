# API Error Handling Utilities

Centralized error handling utilities to avoid hunting for schema/type/Zod errors in API routes.

## Overview

The `errors.ts` module provides:

1. **Consistent error logging** - All validation and API errors are logged with context
2. **Automatic Zod error handling** - Validation failures are automatically formatted and logged
3. **Database error detection** - PostgreSQL error codes are handled appropriately
4. **Type-safe validation wrappers** - Use `validateData` or `validateRequest` for consistent error handling

## Usage

### Basic Pattern: Using `withErrorHandling` Wrapper

Wrap route handlers for automatic error handling:

```ts
import { withErrorHandling } from "../utils/errors";

router.post(
  "/",
  withErrorHandling(
    async (c) => {
      const body = await c.req.json();
      const validated = mySchema.parse(body);
      // ... handler logic
      return c.json({ data: result }, 201);
    },
    { operation: "createResource" }
  )
);
```

### Validation Pattern: Using `validateData`

For validating non-request data (e.g., nested objects):

```ts
import { validateData } from "../utils/errors";

// In your route handler
if (rentalIncome) {
  const rentalIncomeData = validateData(
    { propertyId: id, ...rentalIncome },
    propertyRentalIncomeInsertSchema,
    { operation: "updatePropertyRentalIncome" }
  );
  // ... use validated data
}
```

### Manual Error Handling Pattern

For more complex error handling within a try-catch:

```ts
import { handleError } from "../utils/errors";

try {
  // ... your logic
} catch (error) {
  const handled = handleError(error, {
    operation: "updateProperty",
    params: { id },
  });

  const responseBody: Record<string, unknown> = { error: handled.error };
  if ("details" in handled) {
    responseBody.details = handled.details;
  }
  if ("message" in handled && handled.message) {
    responseBody.message = handled.message;
  }

  return c.json(
    responseBody,
    handled.statusCode as 400 | 401 | 404 | 409 | 500
  );
}
```

## Error Logging

All errors are automatically logged with context:

```
[VALIDATION ERROR] {
  route: "/api/properties/123",
  operation: "updateProperty",
  errors: [...],
  receivedData: {...}
}

[API ERROR] {
  route: "/api/properties/123",
  operation: "updateProperty",
  errorMessage: "...",
  errorStack: "...",
  errorType: "ApiError"
}
```

## Migration Guide

### Before (manual error handling):

```ts
router.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validated = mySchema.parse(body);
    // ... logic
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation failed", details: error.errors }, 400);
    }
    console.error("Error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
```

### After (using utilities):

```ts
router.post(
  "/",
  withErrorHandling(
    async (c) => {
      const body = await c.req.json();
      const validated = validateData(body, mySchema, {
        operation: "createResource",
      });
      // ... logic
      return c.json({ data: result }, 201);
    },
    { operation: "createResource" }
  )
);
```

## Benefits

1. **No more hunting** - All validation errors are logged with full context
2. **Consistent responses** - Error responses follow the same format
3. **Better debugging** - Error logs include route, operation, and received data
4. **Type safety** - Validated data is properly typed
5. **Database errors** - PostgreSQL error codes are automatically handled
