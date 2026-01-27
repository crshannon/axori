import { Hono } from "hono";
import {
  db,
  properties,
  propertyDocuments,
  eq,
  and,
  desc,
  asc,
  sql,
} from "@axori/db";
import { ilike } from "drizzle-orm";
import {
  documentUploadSchema,
  documentUpdateSchema,
  documentListQuerySchema,
  DOCUMENT_TYPES,
} from "@axori/shared/src/validation";
import { z } from "zod";
import {
  withErrorHandling,
  validateData,
  ApiError,
} from "../utils/errors";
import {
  requireAuth,
  getAuthenticatedUserId,
} from "../middleware/permissions";
import {
  getAccessiblePropertyIdsForUser,
} from "@axori/permissions";

const documentsRouter = new Hono();

/**
 * Helper to verify user has access to a property
 */
async function verifyPropertyAccess(userId: string, propertyId: string): Promise<void> {
  // Get the property to find its portfolioId
  const [property] = await db
    .select({ portfolioId: properties.portfolioId })
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1);

  if (!property) {
    throw new ApiError("Property not found", 404);
  }

  // Get accessible property IDs for this user
  const accessiblePropertyIds = await getAccessiblePropertyIdsForUser(
    userId,
    property.portfolioId
  );

  if (!accessiblePropertyIds.includes(propertyId)) {
    throw new ApiError("You don't have access to this property", 403);
  }
}

// Get all documents for a property (with filtering)
documentsRouter.get(
  "/property/:propertyId",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");

    await verifyPropertyAccess(userId, propertyId);

    // Parse query parameters
    const query = documentListQuerySchema.parse({
      type: c.req.query("type"),
      year: c.req.query("year"),
      status: c.req.query("status"),
      search: c.req.query("search"),
      sort: c.req.query("sort"),
      order: c.req.query("order"),
      page: c.req.query("page"),
      limit: c.req.query("limit"),
    });

    // Build conditions
    const conditions = [eq(propertyDocuments.propertyId, propertyId)];

    if (query.type) {
      conditions.push(eq(propertyDocuments.documentType, query.type));
    }

    if (query.year) {
      conditions.push(eq(propertyDocuments.documentYear, query.year));
    }

    if (query.status) {
      conditions.push(eq(propertyDocuments.processingStatus, query.status));
    }

    // Build base query
    let baseQuery = db
      .select()
      .from(propertyDocuments)
      .where(and(...conditions));

    // If search is provided, filter in-memory (Drizzle doesn't support OR easily)
    let results = await baseQuery;

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter(
        (doc) =>
          doc.originalFilename.toLowerCase().includes(searchLower) ||
          doc.description?.toLowerCase().includes(searchLower) ||
          doc.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    const sortField = query.sort || "uploadedAt";
    const sortOrder = query.order || "desc";

    results.sort((a, b) => {
      let aVal: unknown = a[sortField as keyof typeof a];
      let bVal: unknown = b[sortField as keyof typeof b];

      // Handle dates
      if (aVal instanceof Date) aVal = aVal.getTime();
      if (bVal instanceof Date) bVal = bVal.getTime();

      // Handle nulls
      if (aVal === null) aVal = sortOrder === "asc" ? Infinity : -Infinity;
      if (bVal === null) bVal = sortOrder === "asc" ? Infinity : -Infinity;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;
    const totalCount = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    return c.json({
      documents: paginatedResults,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  })
);

// Get a single document by ID
documentsRouter.get(
  "/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");

    const [document] = await db
      .select()
      .from(propertyDocuments)
      .where(eq(propertyDocuments.id, id))
      .limit(1);

    if (!document) {
      throw new ApiError("Document not found", 404);
    }

    await verifyPropertyAccess(userId, document.propertyId);

    return c.json({ document });
  })
);

// Create a new document record (after file upload to Supabase Storage)
documentsRouter.post(
  "/",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const body = await c.req.json();

    // Validate input (extended schema for API)
    const createSchema = documentUploadSchema.extend({
      storagePath: z.string().min(1, "Storage path is required"),
      originalFilename: z.string().min(1, "Filename is required"),
      mimeType: z.string().optional(),
      sizeBytes: z.number().int().positive().optional(),
    });

    const data = validateData(body, createSchema);

    await verifyPropertyAccess(userId, data.propertyId);

    const insertData = {
      propertyId: data.propertyId,
      storagePath: data.storagePath,
      originalFilename: data.originalFilename,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      documentType: data.documentType,
      documentYear: data.documentYear,
      description: data.description,
      tags: data.tags || [],
      processingStatus: data.enableAiProcessing ? "pending" : null,
      uploadedBy: userId,
    } as typeof propertyDocuments.$inferInsert;

    const [newDocument] = await db
      .insert(propertyDocuments)
      .values(insertData)
      .returning();

    return c.json({ document: newDocument }, 201);
  })
);

// Update document metadata
documentsRouter.patch(
  "/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");
    const body = await c.req.json();

    // Get existing document
    const [existing] = await db
      .select()
      .from(propertyDocuments)
      .where(eq(propertyDocuments.id, id))
      .limit(1);

    if (!existing) {
      throw new ApiError("Document not found", 404);
    }

    await verifyPropertyAccess(userId, existing.propertyId);

    const data = validateData(body, documentUpdateSchema);

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.documentType !== undefined) updateData.documentType = data.documentType;
    if (data.documentYear !== undefined) updateData.documentYear = data.documentYear;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tags !== undefined) updateData.tags = data.tags;

    const [updated] = await db
      .update(propertyDocuments)
      .set(updateData)
      .where(eq(propertyDocuments.id, id))
      .returning();

    return c.json({ document: updated });
  })
);

// Delete a document
documentsRouter.delete(
  "/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");

    // Get existing document
    const [existing] = await db
      .select()
      .from(propertyDocuments)
      .where(eq(propertyDocuments.id, id))
      .limit(1);

    if (!existing) {
      throw new ApiError("Document not found", 404);
    }

    await verifyPropertyAccess(userId, existing.propertyId);

    // Delete the document record
    // Note: Caller should also delete the file from Supabase Storage
    await db
      .delete(propertyDocuments)
      .where(eq(propertyDocuments.id, id));

    return c.json({
      success: true,
      storagePath: existing.storagePath, // Return for client to delete from storage
    });
  })
);

// Trigger AI processing for a document
documentsRouter.post(
  "/:id/process",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");

    // Get existing document
    const [existing] = await db
      .select()
      .from(propertyDocuments)
      .where(eq(propertyDocuments.id, id))
      .limit(1);

    if (!existing) {
      throw new ApiError("Document not found", 404);
    }

    await verifyPropertyAccess(userId, existing.propertyId);

    // Update status to processing
    const [updated] = await db
      .update(propertyDocuments)
      .set({
        processingStatus: "processing",
        aiError: null,
        updatedAt: new Date(),
      })
      .where(eq(propertyDocuments.id, id))
      .returning();

    // TODO: Queue AI processing job here
    // For now, just return the updated document
    // In production, this would trigger a background job

    return c.json({
      document: updated,
      message: "AI processing queued",
    });
  })
);

// Get document statistics for a property
documentsRouter.get(
  "/property/:propertyId/stats",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");

    await verifyPropertyAccess(userId, propertyId);

    const documents = await db
      .select()
      .from(propertyDocuments)
      .where(eq(propertyDocuments.propertyId, propertyId));

    // Calculate stats
    const stats = {
      totalCount: documents.length,
      byType: {} as Record<string, number>,
      byYear: {} as Record<string, number>,
      byStatus: {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      },
      totalSizeBytes: 0,
    };

    for (const doc of documents) {
      // By type
      stats.byType[doc.documentType] = (stats.byType[doc.documentType] || 0) + 1;

      // By year
      if (doc.documentYear) {
        const yearKey = String(doc.documentYear);
        stats.byYear[yearKey] = (stats.byYear[yearKey] || 0) + 1;
      }

      // By status
      if (doc.processingStatus) {
        stats.byStatus[doc.processingStatus as keyof typeof stats.byStatus]++;
      }

      // Total size
      if (doc.sizeBytes) {
        stats.totalSizeBytes += doc.sizeBytes;
      }
    }

    return c.json({ stats });
  })
);

// Get documents by year for tax export
documentsRouter.get(
  "/property/:propertyId/tax-year/:year",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");
    const year = parseInt(c.req.param("year"), 10);

    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      throw new ApiError("Invalid year", 400);
    }

    await verifyPropertyAccess(userId, propertyId);

    const documents = await db
      .select()
      .from(propertyDocuments)
      .where(
        and(
          eq(propertyDocuments.propertyId, propertyId),
          eq(propertyDocuments.documentYear, year)
        )
      );

    // Group by document type
    const byType: Record<string, typeof documents> = {};
    for (const doc of documents) {
      if (!byType[doc.documentType]) {
        byType[doc.documentType] = [];
      }
      byType[doc.documentType].push(doc);
    }

    // Identify missing tax-relevant document types
    const taxRelevantTypes = [
      "lease",
      "tax_bill",
      "insurance_policy",
      "mortgage_statement",
      "year_end_report",
      "1099",
    ];

    const missingTypes = taxRelevantTypes.filter((type) => !byType[type]);

    return c.json({
      year,
      documents,
      byType,
      missingTypes,
      summary: {
        totalDocuments: documents.length,
        processedCount: documents.filter((d) => d.processingStatus === "completed").length,
        pendingCount: documents.filter((d) => d.processingStatus === "pending").length,
      },
    });
  })
);

export default documentsRouter;
