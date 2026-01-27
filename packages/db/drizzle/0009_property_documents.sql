-- Migration: Create property_documents table for document management
-- Documents Tab: Enables document upload, storage, and AI-powered extraction
--
-- This table stores document metadata for properties:
--   - File storage info (Supabase Storage path)
--   - Document classification (type, year)
--   - AI processing status and extracted data
--   - User-defined tags and descriptions
--
-- Features:
--   - Support for 20 document types (leases, tax bills, etc.)
--   - AI-powered data extraction with confidence scores
--   - Tax year tracking for CPA exports
--   - User-defined tagging system

-- Create document type enum
DO $$ BEGIN
  CREATE TYPE "document_type" AS ENUM (
    'lease',
    'tax_bill',
    'insurance_policy',
    'insurance_claim',
    'closing_disclosure',
    'deed',
    'title_policy',
    'appraisal',
    'inspection',
    'mortgage_statement',
    'hoa_statement',
    'utility_bill',
    'receipt',
    'contractor_invoice',
    'permit',
    'year_end_report',
    'rent_roll',
    '1099',
    'w9',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create document processing status enum
DO $$ BEGIN
  CREATE TYPE "document_processing_status" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create property_documents table
CREATE TABLE IF NOT EXISTS "property_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,

  -- File Info
  "storage_path" text NOT NULL,
  "original_filename" text NOT NULL,
  "mime_type" text,
  "size_bytes" integer,

  -- Classification
  "document_type" "document_type" NOT NULL,
  "document_year" integer,

  -- AI Processing
  "processing_status" "document_processing_status" DEFAULT 'pending',
  "ai_processed_at" timestamp,
  "ai_extracted_data" jsonb,
  "ai_confidence" numeric(4, 3),
  "ai_error" text,

  -- Metadata
  "description" text,
  "tags" text[],

  -- Audit
  "uploaded_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "uploaded_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS "idx_property_documents_property_id" ON "property_documents" ("property_id");
CREATE INDEX IF NOT EXISTS "idx_property_documents_type" ON "property_documents" ("document_type");
CREATE INDEX IF NOT EXISTS "idx_property_documents_year" ON "property_documents" ("document_year");
CREATE INDEX IF NOT EXISTS "idx_property_documents_processing_status" ON "property_documents" ("processing_status");

-- Add comments for documentation
COMMENT ON TABLE "property_documents" IS 'Stores document metadata for properties. Files are stored in Supabase Storage.';
COMMENT ON COLUMN "property_documents"."storage_path" IS 'Path in Supabase Storage: {user_id}/{property_id}/{document_id}_{filename}';
COMMENT ON COLUMN "property_documents"."document_type" IS 'Classification of document type for filtering and AI extraction';
COMMENT ON COLUMN "property_documents"."document_year" IS 'Tax year the document applies to (for annual documents like tax bills)';
COMMENT ON COLUMN "property_documents"."processing_status" IS 'AI extraction status: pending, processing, completed, or failed';
COMMENT ON COLUMN "property_documents"."ai_extracted_data" IS 'JSON object containing structured data extracted by AI from the document';
COMMENT ON COLUMN "property_documents"."ai_confidence" IS 'AI confidence score for extraction (0.000 to 1.000)';
COMMENT ON COLUMN "property_documents"."tags" IS 'User-defined tags for additional categorization';
