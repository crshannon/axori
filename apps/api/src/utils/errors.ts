/**
 * Error Handling Utilities
 *
 * Centralized error handling for API routes to avoid hunting for
 * schema/type/Zod errors in the future.
 */

import { z } from "zod";
import { Context } from "hono";
import { tracking, errorContextToProperties } from "./tracking";

export interface ErrorContext {
  route?: string;
  method?: string;
  operation?: string;
  data?: unknown;
  params?: Record<string, string>;
  userId?: string;
}

/**
 * Enhanced error with context for better debugging
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public context?: ErrorContext,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Handles Zod validation errors with detailed logging
 */
export function handleZodError(
  error: z.ZodError,
  context?: ErrorContext
): { error: string; details: z.ZodIssue[]; statusCode: number } {
  const logContext = {
    route: context?.route,
    operation: context?.operation,
    errors: error.errors,
    receivedData: context?.data ? JSON.stringify(context.data, null, 2) : undefined,
  };

  console.error("[VALIDATION ERROR]", logContext);

  // Track validation errors
  tracking.captureException(error, {
    ...errorContextToProperties(context),
    errorType: "ValidationError",
    validationErrors: error.errors,
    errorCount: error.errors.length,
  });

  return {
    error: "Validation failed",
    details: error.errors,
    statusCode: 400,
  };
}

export type ErrorResponse =
  | { error: string; details: z.ZodIssue[]; statusCode: number }
  | { error: string; message?: string; statusCode: number };

/**
 * Handles generic errors with logging
 */
export function handleError(
  error: unknown,
  context?: ErrorContext
): ErrorResponse {
  const logContext = {
    ...context,
    errorMessage: error instanceof Error ? error.message : String(error),
    errorStack: error instanceof Error ? error.stack : undefined,
    errorType: error?.constructor?.name,
  };

  console.error("[API ERROR]", logContext);

  // Track errors
  const errorInstance = error instanceof Error ? error : new Error(String(error));
  tracking.captureException(errorInstance, {
    ...errorContextToProperties(context),
    errorType: error?.constructor?.name || "UnknownError",
  });

  // Database errors (PostgreSQL error codes)
  if (error && typeof error === "object" && "code" in error) {
    const dbError = error as { code: string; message?: string };
    if (dbError.code === "23505") {
      // Unique constraint violation
      return {
        error: "Duplicate entry",
        message: dbError.message || "A record with this value already exists",
        statusCode: 409,
      };
    }
    if (dbError.code === "23503") {
      // Foreign key constraint violation
      return {
        error: "Reference error",
        message: dbError.message || "Referenced record does not exist",
        statusCode: 400,
      };
    }
  }

  // Zod errors
  if (error instanceof z.ZodError) {
    return handleZodError(error, context);
  }

  // API errors
  if (error instanceof ApiError) {
    return {
      error: error.message,
      message: error.originalError instanceof Error ? error.originalError.message : undefined,
      statusCode: error.statusCode,
    };
  }

  // Generic errors
  return {
    error: "Internal server error",
    message: error instanceof Error ? error.message : String(error),
    statusCode: 500,
  };
}

/**
 * Wrapper for route handlers that provides consistent error handling
 *
 * @example
 * ```ts
 * router.get("/:id", withErrorHandling(async (c) => {
 *   const id = c.req.param("id");
 *   const validated = mySchema.parse(await c.req.json());
 *   // ... handler logic
 * }, { operation: "getProperty" }));
 * ```
 */
export function withErrorHandling(
  handler: (c: Context) => Promise<Response> | Response,
  context?: Omit<ErrorContext, "route" | "method">
) {
  return async (c: Context): Promise<Response> => {
    try {
      return await handler(c);
    } catch (error) {
      const errorContext: ErrorContext = {
        ...context,
        route: c.req.path,
        method: c.req.method,
      };

      const handled = handleError(error, errorContext);

      const responseBody: {
        error: string
        details?: z.ZodIssue[]
        message?: string
      } = {
        error: handled.error,
      }

      if ('details' in handled) {
        responseBody.details = handled.details
      }
      if ('message' in handled) {
        responseBody.message = handled.message
      }

      return c.json(
        responseBody,
        handled.statusCode as 400 | 409 | 500
      );
    }
  };
}

/**
 * Validates request body with Zod schema and returns typed data
 * Throws ApiError on validation failure
 *
 * @example
 * ```ts
 * const body = await validateRequest(c, mySchema, { operation: "createProperty" });
 * ```
 */
export async function validateRequest<T>(
  c: Context,
  schema: z.ZodSchema<T>,
  context?: Pick<ErrorContext, "operation">
): Promise<T> {
  try {
    const body = await c.req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorContext: ErrorContext = {
        ...context,
        route: c.req.path,
        method: c.req.method,
      };

      const handled = handleZodError(error, errorContext);
      throw new ApiError(handled.error, handled.statusCode, errorContext, error);
    }
    throw error;
  }
}

/**
 * Validates data with Zod schema and returns typed data
 * Throws ApiError on validation failure (for non-request data)
 *
 * Works with any zod-like schema (including drizzle-zod generated schemas)
 *
 * @example
 * ```ts
 * const validated = validateData(myData, mySchema, { operation: "updateProperty" });
 * ```
 */
export function validateData<T>(
  data: unknown,
  schema: z.ZodType<T> | { parse: (data: unknown) => T },
  context?: Pick<ErrorContext, "operation">
): T {
  try {
    // Support both z.ZodType and drizzle-zod generated schemas
    if ("parse" in schema && typeof schema.parse === "function") {
      return schema.parse(data);
    }
    throw new Error("Invalid schema: must have parse method");
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorContext: ErrorContext = {
        ...context,
        data,
      };

      const handled = handleZodError(error, errorContext);
      throw new ApiError(handled.error, handled.statusCode, errorContext, error);
    }
    throw error;
  }
}

