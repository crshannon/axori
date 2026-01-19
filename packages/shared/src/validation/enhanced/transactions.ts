/**
 * Enhanced Zod schemas for property transactions with API-specific validation
 *
 * These schemas provide API-specific validation while maintaining alignment with
 * the Drizzle table definition as the single source of truth.
 *
 * Note: We use a standalone schema here instead of extending the drizzle-generated
 * schema due to Zod version compatibility issues with .extend() on drizzle-generated schemas.
 * The schema structure mirrors the Drizzle table definition exactly.
 */

import { propertyTransactionSelectSchema } from "../base/transactions";
import { z } from "zod";

// ============================================================================
// Enhanced Property Transaction Schemas
// ============================================================================

/**
 * Property transaction insert schema for API usage
 *
 * This schema accepts numbers for numeric fields (API format) instead of strings (DB format).
 * The API route handles converting numbers to strings for the database.
 *
 * Schema structure mirrors the propertyTransactions Drizzle table definition:
 * - Single source of truth: Drizzle table definition in @axori/db/src/schema
 * - Type safety: API receives numbers, DB stores strings
 * - Field structure: Matches Drizzle schema exactly
 *
 * - amount: Must be positive number (converted to string in DB)
 * - transactionDate: ISO date string format (YYYY-MM-DD)
 * - Type-specific validation: vendor required for expenses, payer required for income
 */
export const propertyTransactionInsertApiSchema = z.object({
  // Note: propertyId comes from URL path, not body
  // Transaction Type & Details
  type: z.enum(["income", "expense", "capital"]),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  amount: z.number().positive("Amount must be positive"),
  category: z.enum([
    "rent", "parking", "laundry", "pet_rent", "storage", "utility_reimbursement", "late_fees", "application_fees",
    "acquisition", "property_tax", "insurance", "hoa", "management", "repairs", "maintenance", "capex",
    "utilities", "legal", "accounting", "marketing", "travel", "office", "bank_fees", "licenses", "other"
  ]),
  subcategory: z.string().optional().nullable(),
  // Party Information
  vendor: z.string().optional().nullable(), // For expenses: who was paid
  payer: z.string().optional().nullable(), // For income: who paid
  description: z.string().optional().nullable(),
  // Recurring
  isRecurring: z.boolean().optional(),
  recurrenceFrequency: z.enum(["monthly", "quarterly", "annually", "weekly", "biweekly"]).optional().nullable(),
  recurrenceEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  // Tax
  isTaxDeductible: z.boolean().optional(),
  taxCategory: z.string().optional().nullable(),
  // Document Link
  documentId: z.string().uuid().optional().nullable(),
  // Source Tracking
  source: z.enum(["manual", "appfolio", "plaid", "document_ai"]).optional(),
  externalId: z.string().optional().nullable(),
  // Review Workflow
  notes: z.string().optional().nullable(),
  reviewStatus: z.enum(["pending", "approved", "flagged", "excluded"]).optional(),
  isExcluded: z.boolean().optional(),
}).strict().refine(
  (data) => {
    // If expense, vendor should be provided
    if (data.type === "expense" && (!data.vendor || !data.vendor.trim())) {
      return false;
    }
    // If income, payer should be provided
    if (data.type === "income" && (!data.payer || !data.payer.trim())) {
      return false;
    }
    return true;
  },
  {
    message: "Vendor is required for expenses, payer is required for income",
    path: ["vendor"], // Error will show on vendor field
  }
);

/**
 * Property transaction update schema for API usage
 * All fields optional except id
 */
export const propertyTransactionUpdateApiSchema = z.object({
  // Note: propertyId and id come from URL path, not body
  id: z.string().uuid("Transaction ID must be a valid UUID"),
  // Transaction Type & Details - all optional for updates
  type: z.enum(["income", "expense", "capital"]).optional(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  category: z.enum([
    "rent", "parking", "laundry", "pet_rent", "storage", "utility_reimbursement", "late_fees", "application_fees",
    "acquisition", "property_tax", "insurance", "hoa", "management", "repairs", "maintenance", "capex",
    "utilities", "legal", "accounting", "marketing", "travel", "office", "bank_fees", "licenses", "other"
  ]).optional(),
  subcategory: z.string().optional().nullable(),
  // Party Information
  vendor: z.string().optional().nullable(),
  payer: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  // Recurring
  isRecurring: z.boolean().optional(),
  recurrenceFrequency: z.enum(["monthly", "quarterly", "annually", "weekly", "biweekly"]).optional().nullable(),
  recurrenceEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  // Tax
  isTaxDeductible: z.boolean().optional(),
  taxCategory: z.string().optional().nullable(),
  // Document Link
  documentId: z.string().uuid().optional().nullable(),
  // Source Tracking
  source: z.enum(["manual", "appfolio", "plaid", "document_ai"]).optional(),
  externalId: z.string().optional().nullable(),
  // Review Workflow
  notes: z.string().optional().nullable(),
  reviewStatus: z.enum(["pending", "approved", "flagged", "excluded"]).optional(),
  isExcluded: z.boolean().optional(),
}).strict().refine(
  (data) => {
    // If type is being updated to expense and vendor is not provided, fail
    if (data.type === "expense" && (!data.vendor || !data.vendor.trim())) {
      return false;
    }
    // If type is being updated to income and payer is not provided, fail
    if (data.type === "income" && (!data.payer || !data.payer.trim())) {
      return false;
    }
    return true;
  },
  {
    message: "Vendor is required for expenses, payer is required for income",
  }
);

/**
 * Property transaction select schema (no changes needed, just re-export)
 */
export const propertyTransactionSelectApiSchema = propertyTransactionSelectSchema;

