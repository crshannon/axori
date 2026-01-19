-- Migration: Add lease_start_date and lease_end_date columns to property_rental_income table
-- These columns allow tracking lease dates for rental properties

ALTER TABLE "property_rental_income" 
  ADD COLUMN IF NOT EXISTS "lease_start_date" date,
  ADD COLUMN IF NOT EXISTS "lease_end_date" date;

