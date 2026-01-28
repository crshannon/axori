/**
 * Enhanced Zod schemas for property documents with API-specific validation
 *
 * Extends base schemas with:
 * - File upload validation
 * - Document type constraints
 * - Query parameter schemas
 */

import { z } from "zod";
import { propertyDocumentInsertSchema } from "../base/documents";

// ============================================================================
// Document Type Constants
// ============================================================================

export const DOCUMENT_TYPES = [
  "lease",
  "tax_bill",
  "insurance_policy",
  "insurance_claim",
  "closing_disclosure",
  "deed",
  "title_policy",
  "appraisal",
  "inspection",
  "mortgage_statement",
  "hoa_statement",
  "utility_bill",
  "receipt",
  "contractor_invoice",
  "permit",
  "year_end_report",
  "rent_roll",
  "1099",
  "w9",
  "other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const PROCESSING_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

export type ProcessingStatus = (typeof PROCESSING_STATUSES)[number];

// Document type labels for UI display
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  lease: "Lease Agreement",
  tax_bill: "Property Tax Bill",
  insurance_policy: "Insurance Policy",
  insurance_claim: "Insurance Claim",
  closing_disclosure: "Closing Disclosure",
  deed: "Property Deed",
  title_policy: "Title Policy",
  appraisal: "Appraisal Report",
  inspection: "Inspection Report",
  mortgage_statement: "Mortgage Statement",
  hoa_statement: "HOA Statement",
  utility_bill: "Utility Bill",
  receipt: "Receipt",
  contractor_invoice: "Contractor Invoice",
  permit: "Building Permit",
  year_end_report: "Year-End Report",
  rent_roll: "Rent Roll",
  "1099": "1099 Tax Form",
  w9: "W-9 Form",
  other: "Other Document",
};

// Tax-relevant document types
export const TAX_RELEVANT_DOCUMENT_TYPES: DocumentType[] = [
  "lease",
  "tax_bill",
  "insurance_policy",
  "insurance_claim",
  "closing_disclosure",
  "title_policy",
  "mortgage_statement",
  "hoa_statement",
  "utility_bill",
  "receipt",
  "contractor_invoice",
  "permit",
  "year_end_report",
  "rent_roll",
  "1099",
];

// ============================================================================
// File Validation Constants
// ============================================================================

// Maximum file size: 25MB for PDFs, 10MB for images
export const MAX_FILE_SIZE_PDF = 25 * 1024 * 1024; // 25MB
export const MAX_FILE_SIZE_IMAGE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/heic",
  "image/heif",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

// ============================================================================
// Enhanced Document Schemas
// ============================================================================

// Schema for document upload API
export const documentUploadSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),
  documentType: z.enum(DOCUMENT_TYPES, {
    errorMap: () => ({ message: "Invalid document type" }),
  }),
  documentYear: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional()
    .nullable(),
  description: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  enableAiProcessing: z.boolean().optional().default(true),
});

// Schema for document metadata update
export const documentUpdateSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES).optional(),
  documentYear: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional()
    .nullable(),
  description: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

// Schema for document list query parameters
export const documentListQuerySchema = z.object({
  type: z.enum(DOCUMENT_TYPES).optional(),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  status: z.enum(PROCESSING_STATUSES).optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(["uploadedAt", "documentType", "documentYear", "originalFilename"]).optional().default("uploadedAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// Schema for tax export request
export const taxExportSchema = z.object({
  year: z.number().int().min(1900).max(new Date().getFullYear()),
  format: z.enum(["zip", "csv"]).optional().default("zip"),
  documentTypes: z.array(z.enum(DOCUMENT_TYPES)).optional(),
});

// ============================================================================
// AI Extraction Schemas
// ============================================================================

// Base extraction result schema
export const baseExtractionSchema = z.object({
  confidence: z.number().min(0).max(1),
  extractedAt: z.string().datetime(),
});

// Lease extraction schema
export const leaseExtractionSchema = baseExtractionSchema.extend({
  tenantName: z.string().optional(),
  rentAmount: z.number().optional(),
  rentFrequency: z.enum(["monthly", "weekly", "annual"]).optional(),
  leaseStart: z.string().optional(),
  leaseEnd: z.string().optional(),
  securityDeposit: z.number().optional(),
  petDeposit: z.number().optional(),
  lateFee: z.number().optional(),
});

// Tax bill extraction schema
export const taxBillExtractionSchema = baseExtractionSchema.extend({
  taxYear: z.number().optional(),
  assessedValue: z.number().optional(),
  taxAmount: z.number().optional(),
  dueDate: z.string().optional(),
  parcelNumber: z.string().optional(),
});

// Insurance policy extraction schema
export const insurancePolicyExtractionSchema = baseExtractionSchema.extend({
  policyNumber: z.string().optional(),
  carrier: z.string().optional(),
  premiumAnnual: z.number().optional(),
  coverageDwelling: z.number().optional(),
  coverageLiability: z.number().optional(),
  deductible: z.number().optional(),
  effectiveDate: z.string().optional(),
  expirationDate: z.string().optional(),
});

// Year-end report extraction schema
export const yearEndReportExtractionSchema = baseExtractionSchema.extend({
  taxYear: z.number().optional(),
  totalRentCollected: z.number().optional(),
  totalExpenses: z.number().optional(),
  netIncome: z.number().optional(),
  expenseBreakdown: z
    .array(
      z.object({
        category: z.string(),
        amount: z.number(),
      })
    )
    .optional(),
  managementFees: z.number().optional(),
});

// Receipt extraction schema
export const receiptExtractionSchema = baseExtractionSchema.extend({
  vendor: z.string().optional(),
  amount: z.number().optional(),
  date: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
});

// Generic extraction data type
export type ExtractionData =
  | z.infer<typeof leaseExtractionSchema>
  | z.infer<typeof taxBillExtractionSchema>
  | z.infer<typeof insurancePolicyExtractionSchema>
  | z.infer<typeof yearEndReportExtractionSchema>
  | z.infer<typeof receiptExtractionSchema>;

// Schema for applying extracted data to property
export const applyExtractionSchema = z.object({
  fields: z.array(z.string()).min(1, "At least one field must be selected"),
});

// Export the base insert schema for use in API routes
export { propertyDocumentInsertSchema };
