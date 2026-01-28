import { Hono } from "hono";
import { stream } from "hono/streaming";
import archiver from "archiver";
import { PassThrough } from "stream";
import {
  db,
  properties,
  propertyDocuments,
  eq,
  and,
} from "@axori/db";
import {
  documentUploadSchema,
  documentUpdateSchema,
  documentListQuerySchema,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
} from "@axori/shared/src/validation";
import {
  generateStoragePath,
  uploadDocument,
  deleteDocument as deleteFromStorage,
  getSignedUrl,
  downloadDocument,
} from "@axori/shared/src/integrations/supabase";
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

// Delete a document (including from storage)
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

    // Delete from Supabase Storage first
    const { error: storageError } = await deleteFromStorage(existing.storagePath);
    if (storageError) {
      console.error("Failed to delete from storage:", storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete the document record
    await db
      .delete(propertyDocuments)
      .where(eq(propertyDocuments.id, id));

    return c.json({
      success: true,
      storagePath: existing.storagePath,
    });
  })
);

// Get a signed URL for downloading/viewing a document
documentsRouter.get(
  "/:id/download-url",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");
    const expiresIn = parseInt(c.req.query("expiresIn") || "3600", 10);

    // Get existing document
    const [document] = await db
      .select()
      .from(propertyDocuments)
      .where(eq(propertyDocuments.id, id))
      .limit(1);

    if (!document) {
      throw new ApiError("Document not found", 404);
    }

    await verifyPropertyAccess(userId, document.propertyId);

    // Generate signed URL
    const { url, error } = await getSignedUrl(document.storagePath, expiresIn);

    if (error) {
      throw new ApiError(`Failed to generate download URL: ${error.message}`, 500);
    }

    return c.json({
      url,
      expiresIn,
      filename: document.originalFilename,
      mimeType: document.mimeType,
    });
  })
);

// Upload a file and create document record in one request
documentsRouter.post(
  "/upload",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);

    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const propertyId = formData.get("propertyId") as string | null;
    const documentType = formData.get("documentType") as string | null;
    const documentYear = formData.get("documentYear") as string | null;
    const description = formData.get("description") as string | null;
    const tags = formData.get("tags") as string | null;
    const enableAiProcessing = formData.get("enableAiProcessing") !== "false";

    if (!file) {
      throw new ApiError("File is required", 400);
    }

    if (!propertyId) {
      throw new ApiError("Property ID is required", 400);
    }

    if (!documentType) {
      throw new ApiError("Document type is required", 400);
    }

    // Verify access
    await verifyPropertyAccess(userId, propertyId);

    // Generate a unique document ID for the storage path
    const documentId = crypto.randomUUID();

    // Generate storage path
    const storagePath = generateStoragePath(
      userId,
      propertyId,
      documentId,
      file.name
    );

    // Upload to Supabase Storage
    const { path, error: uploadError } = await uploadDocument(
      file,
      storagePath,
      file.type
    );

    if (uploadError) {
      throw new ApiError(`Failed to upload file: ${uploadError.message}`, 500);
    }

    // Parse tags
    const parsedTags = tags
      ? tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0)
      : [];

    // Create document record
    const insertData = {
      id: documentId,
      propertyId,
      storagePath: path,
      originalFilename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      documentType: documentType as typeof DOCUMENT_TYPES[number],
      documentYear: documentYear ? parseInt(documentYear, 10) : null,
      description: description || null,
      tags: parsedTags,
      processingStatus: enableAiProcessing ? "pending" : null,
      uploadedBy: userId,
    } as typeof propertyDocuments.$inferInsert;

    const [newDocument] = await db
      .insert(propertyDocuments)
      .values(insertData)
      .returning();

    // Trigger automatic AI processing if enabled
    if (enableAiProcessing) {
      processDocumentAsync(documentId, path, documentType, file.type);
    }

    return c.json({ document: newDocument }, 201);
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
    await db
      .update(propertyDocuments)
      .set({
        processingStatus: "processing",
        aiError: null,
        updatedAt: new Date(),
      })
      .where(eq(propertyDocuments.id, id));

    // Process asynchronously but return immediately
    // In production, this would be a proper job queue
    processDocumentAsync(id, existing.storagePath, existing.documentType, existing.mimeType);

    const [updated] = await db
      .select()
      .from(propertyDocuments)
      .where(eq(propertyDocuments.id, id))
      .limit(1);

    return c.json({
      document: updated,
      message: "AI processing started",
    });
  })
);

// Async document processing function (runs in background)
async function processDocumentAsync(
  documentId: string,
  storagePath: string,
  documentType: string,
  mimeType: string | null
) {
  try {
    // Import extraction service
    const { extractDocumentData } = await import("../services/documentExtraction");

    // Download document from Supabase Storage
    const { blob, error: downloadError } = await downloadDocument(storagePath);

    if (downloadError || !blob) {
      throw new Error(`Failed to download document: ${downloadError?.message || "No data"}`);
    }

    // Convert to buffer
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract data using Claude
    const { extractedData, confidence } = await extractDocumentData(
      documentType as Parameters<typeof extractDocumentData>[0],
      buffer,
      mimeType || "application/pdf",
      storagePath.split("/").pop() || "document"
    );

    // Update document with extracted data
    await db
      .update(propertyDocuments)
      .set({
        processingStatus: "completed",
        aiExtractedData: extractedData,
        aiConfidence: String(confidence),
        aiProcessedAt: new Date(),
        aiError: null,
        updatedAt: new Date(),
      })
      .where(eq(propertyDocuments.id, documentId));

    console.log(`Document ${documentId} processed successfully with confidence ${confidence}`);
  } catch (error) {
    console.error(`Document ${documentId} processing failed:`, error);

    // Update document with error
    await db
      .update(propertyDocuments)
      .set({
        processingStatus: "failed",
        aiError: error instanceof Error ? error.message : "Processing failed",
        updatedAt: new Date(),
      })
      .where(eq(propertyDocuments.id, documentId));
  }
}

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

// Apply extracted data to property
documentsRouter.post(
  "/:id/apply",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");
    const body = await c.req.json();

    // Get document
    const [document] = await db
      .select()
      .from(propertyDocuments)
      .where(eq(propertyDocuments.id, id))
      .limit(1);

    if (!document) {
      throw new ApiError("Document not found", 404);
    }

    await verifyPropertyAccess(userId, document.propertyId);

    if (!document.aiExtractedData) {
      throw new ApiError("No extracted data available to apply", 400);
    }

    // selectedFields is an array of field names to apply
    const { selectedFields } = body as { selectedFields: string[] };
    if (!selectedFields || !Array.isArray(selectedFields) || selectedFields.length === 0) {
      throw new ApiError("No fields selected to apply", 400);
    }

    const extractedData = document.aiExtractedData as Record<string, unknown>;
    const appliedData: Record<string, unknown> = {};
    const actions: string[] = [];

    // Filter to only selected fields
    for (const field of selectedFields) {
      if (field in extractedData && extractedData[field] !== undefined) {
        appliedData[field] = extractedData[field];
      }
    }

    // Apply data based on document type
    switch (document.documentType) {
      case "lease":
        // Could create a tenant record or update lease information
        actions.push(`Lease data extracted: Monthly rent $${appliedData.monthlyRent || "N/A"}`);
        if (appliedData.leaseStartDate || appliedData.leaseEndDate) {
          actions.push(`Lease period: ${appliedData.leaseStartDate || "?"} to ${appliedData.leaseEndDate || "?"}`);
        }
        break;

      case "tax_bill":
        // Could update property tax information
        actions.push(`Tax bill recorded: $${appliedData.totalTaxAmount || "N/A"} for year ${appliedData.taxYear || "N/A"}`);
        if (appliedData.assessedValue) {
          actions.push(`Assessed value: $${appliedData.assessedValue}`);
        }
        break;

      case "insurance_policy":
        // Could update insurance information
        actions.push(`Insurance policy: ${appliedData.policyNumber || "N/A"}`);
        actions.push(`Premium: $${appliedData.premiumAmount || "N/A"} ${appliedData.premiumFrequency || ""}`);
        break;

      case "mortgage_statement":
        // Could update mortgage balance
        actions.push(`Mortgage balance: $${appliedData.principalBalance || "N/A"}`);
        actions.push(`Interest rate: ${appliedData.interestRate || "N/A"}%`);
        break;

      case "hoa_statement":
        actions.push(`HOA dues: $${appliedData.duesAmount || "N/A"} ${appliedData.duesFrequency || ""}`);
        break;

      case "contractor_invoice":
        // Could create an expense transaction
        actions.push(`Contractor expense: $${appliedData.totalAmount || "N/A"}`);
        actions.push(`Description: ${appliedData.description || "N/A"}`);
        break;

      case "1099":
        actions.push(`1099 income for ${appliedData.taxYear || "N/A"}: $${appliedData.grossRents || "N/A"}`);
        break;

      default:
        actions.push("Data reviewed and saved");
    }

    // Mark document as having data applied
    const [updated] = await db
      .update(propertyDocuments)
      .set({
        aiAppliedData: appliedData,
        aiAppliedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(propertyDocuments.id, id))
      .returning();

    return c.json({
      document: updated,
      appliedData,
      actions,
      message: "Data applied successfully",
    });
  })
);

// Get extraction field schema for a document type
documentsRouter.get(
  "/schema/:documentType",
  requireAuth(),
  withErrorHandling(async (c) => {
    const documentType = c.req.param("documentType");

    // Define field schemas for each document type
    const fieldSchemas: Record<string, Array<{ field: string; label: string; type: string }>> = {
      lease: [
        { field: "tenantName", label: "Tenant Name", type: "text" },
        { field: "tenantEmail", label: "Tenant Email", type: "email" },
        { field: "tenantPhone", label: "Tenant Phone", type: "phone" },
        { field: "leaseStartDate", label: "Lease Start Date", type: "date" },
        { field: "leaseEndDate", label: "Lease End Date", type: "date" },
        { field: "monthlyRent", label: "Monthly Rent", type: "currency" },
        { field: "securityDeposit", label: "Security Deposit", type: "currency" },
        { field: "petDeposit", label: "Pet Deposit", type: "currency" },
        { field: "rentDueDay", label: "Rent Due Day", type: "number" },
      ],
      tax_bill: [
        { field: "taxYear", label: "Tax Year", type: "number" },
        { field: "assessedValue", label: "Assessed Value", type: "currency" },
        { field: "landValue", label: "Land Value", type: "currency" },
        { field: "improvementValue", label: "Improvement Value", type: "currency" },
        { field: "totalTaxAmount", label: "Total Tax Amount", type: "currency" },
        { field: "dueDate", label: "Due Date", type: "date" },
        { field: "parcelNumber", label: "Parcel Number", type: "text" },
      ],
      insurance_policy: [
        { field: "policyNumber", label: "Policy Number", type: "text" },
        { field: "carrier", label: "Insurance Carrier", type: "text" },
        { field: "effectiveDate", label: "Effective Date", type: "date" },
        { field: "expirationDate", label: "Expiration Date", type: "date" },
        { field: "premiumAmount", label: "Premium Amount", type: "currency" },
        { field: "premiumFrequency", label: "Premium Frequency", type: "text" },
        { field: "dwellingCoverage", label: "Dwelling Coverage", type: "currency" },
        { field: "liabilityCoverage", label: "Liability Coverage", type: "currency" },
        { field: "deductible", label: "Deductible", type: "currency" },
      ],
      mortgage_statement: [
        { field: "loanNumber", label: "Loan Number", type: "text" },
        { field: "principalBalance", label: "Principal Balance", type: "currency" },
        { field: "interestRate", label: "Interest Rate", type: "percent" },
        { field: "monthlyPayment", label: "Monthly Payment", type: "currency" },
        { field: "escrowBalance", label: "Escrow Balance", type: "currency" },
        { field: "yearToDateInterest", label: "YTD Interest", type: "currency" },
      ],
      hoa_statement: [
        { field: "associationName", label: "Association Name", type: "text" },
        { field: "duesAmount", label: "Dues Amount", type: "currency" },
        { field: "duesFrequency", label: "Dues Frequency", type: "text" },
        { field: "specialAssessments", label: "Special Assessments", type: "currency" },
        { field: "balance", label: "Balance", type: "currency" },
      ],
      contractor_invoice: [
        { field: "vendorName", label: "Vendor Name", type: "text" },
        { field: "invoiceNumber", label: "Invoice Number", type: "text" },
        { field: "invoiceDate", label: "Invoice Date", type: "date" },
        { field: "totalAmount", label: "Total Amount", type: "currency" },
        { field: "laborCost", label: "Labor Cost", type: "currency" },
        { field: "materialsCost", label: "Materials Cost", type: "currency" },
        { field: "description", label: "Description", type: "text" },
        { field: "category", label: "Category", type: "text" },
      ],
      "1099": [
        { field: "taxYear", label: "Tax Year", type: "number" },
        { field: "payerName", label: "Payer Name", type: "text" },
        { field: "grossRents", label: "Gross Rents", type: "currency" },
        { field: "federalTaxWithheld", label: "Federal Tax Withheld", type: "currency" },
      ],
    };

    const schema = fieldSchemas[documentType] || [];

    return c.json({ documentType, fields: schema });
  })
);

// Export documents for a tax year as ZIP
documentsRouter.post(
  "/property/:propertyId/export/:year",
  requireAuth(),
  async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");
    const year = parseInt(c.req.param("year"), 10);

    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      return c.json({ error: "Invalid year" }, 400);
    }

    try {
      await verifyPropertyAccess(userId, propertyId);

      // Get property info for the export
      const [property] = await db
        .select({ nickname: properties.nickname, address: properties.address })
        .from(properties)
        .where(eq(properties.id, propertyId))
        .limit(1);

      const propertyName = property?.nickname || property?.address || "Property";

      // Get documents for this year
      const documents = await db
        .select()
        .from(propertyDocuments)
        .where(
          and(
            eq(propertyDocuments.propertyId, propertyId),
            eq(propertyDocuments.documentYear, year)
          )
        );

      if (documents.length === 0) {
        return c.json({ error: "No documents found for this year" }, 404);
      }

      // Create a summary document
      const summary = generateTaxSummary(propertyName, year, documents);

      // Set headers for ZIP download
      c.header("Content-Type", "application/zip");
      c.header(
        "Content-Disposition",
        `attachment; filename="tax-documents-${year}.zip"`
      );

      // Create archive
      const archive = archiver("zip", { zlib: { level: 9 } });
      const passThrough = new PassThrough();

      archive.pipe(passThrough);

      // Add summary document
      archive.append(summary, { name: `Tax_Summary_${year}.txt` });

      // Group documents by type for organized folder structure
      const byType: Record<string, typeof documents> = {};
      for (const doc of documents) {
        if (!byType[doc.documentType]) {
          byType[doc.documentType] = [];
        }
        byType[doc.documentType].push(doc);
      }

      // Add each document to the archive
      for (const [docType, docs] of Object.entries(byType)) {
        const folderName = DOCUMENT_TYPE_LABELS[docType as keyof typeof DOCUMENT_TYPE_LABELS] || docType;

        for (const doc of docs) {
          try {
            const { blob, error } = await downloadDocument(doc.storagePath);
            if (error || !blob) {
              console.error(`Failed to download ${doc.originalFilename}:`, error);
              continue;
            }

            const arrayBuffer = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            archive.append(buffer, {
              name: `${folderName}/${doc.originalFilename}`,
            });
          } catch (err) {
            console.error(`Error adding ${doc.originalFilename} to archive:`, err);
          }
        }
      }

      // Add extracted data summary if any documents have been processed
      const processedDocs = documents.filter(d => d.aiExtractedData);
      if (processedDocs.length > 0) {
        const extractedDataSummary = generateExtractedDataSummary(year, processedDocs);
        archive.append(extractedDataSummary, { name: `Extracted_Data_${year}.json` });
      }

      archive.finalize();

      // Stream the response
      return stream(c, async (streamWriter) => {
        const reader = passThrough;
        for await (const chunk of reader) {
          await streamWriter.write(chunk);
        }
      });
    } catch (error) {
      console.error("Export failed:", error);
      return c.json(
        { error: error instanceof Error ? error.message : "Export failed" },
        500
      );
    }
  }
);

/**
 * Generate a text summary of documents for tax purposes
 */
function generateTaxSummary(
  propertyName: string,
  year: number,
  documents: Array<{
    documentType: string;
    originalFilename: string;
    processingStatus: string | null;
    aiExtractedData: unknown;
  }>
): string {
  const lines: string[] = [
    "=" .repeat(60),
    `TAX DOCUMENT SUMMARY - ${year}`,
    "=" .repeat(60),
    "",
    `Property: ${propertyName}`,
    `Tax Year: ${year}`,
    `Generated: ${new Date().toISOString()}`,
    `Total Documents: ${documents.length}`,
    "",
    "-".repeat(60),
    "DOCUMENTS BY TYPE",
    "-".repeat(60),
    "",
  ];

  // Group by type
  const byType: Record<string, typeof documents> = {};
  for (const doc of documents) {
    if (!byType[doc.documentType]) {
      byType[doc.documentType] = [];
    }
    byType[doc.documentType].push(doc);
  }

  for (const [type, docs] of Object.entries(byType)) {
    const label = DOCUMENT_TYPE_LABELS[type as keyof typeof DOCUMENT_TYPE_LABELS] || type;
    lines.push(`${label} (${docs.length}):`);
    for (const doc of docs) {
      const status = doc.processingStatus === "completed" ? "[AI Processed]" : "";
      lines.push(`  - ${doc.originalFilename} ${status}`);
    }
    lines.push("");
  }

  lines.push("-".repeat(60));
  lines.push("NOTES FOR CPA");
  lines.push("-".repeat(60));
  lines.push("");
  lines.push("1. All documents have been organized by type for easy reference.");
  lines.push("2. Documents marked [AI Processed] have extracted data available.");
  lines.push("3. See Extracted_Data.json for structured data from processed documents.");
  lines.push("");
  lines.push("=" .repeat(60));
  lines.push("END OF SUMMARY");
  lines.push("=" .repeat(60));

  return lines.join("\n");
}

/**
 * Generate JSON summary of extracted data
 */
function generateExtractedDataSummary(
  year: number,
  documents: Array<{
    documentType: string;
    originalFilename: string;
    aiExtractedData: unknown;
    aiConfidence: string | null;
  }>
): string {
  const summary = {
    taxYear: year,
    generatedAt: new Date().toISOString(),
    documents: documents.map(doc => ({
      filename: doc.originalFilename,
      type: doc.documentType,
      confidence: doc.aiConfidence ? parseFloat(doc.aiConfidence) : null,
      extractedData: doc.aiExtractedData,
    })),
  };

  return JSON.stringify(summary, null, 2);
}

export default documentsRouter;
