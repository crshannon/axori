/**
 * Base Zod schemas auto-generated from Drizzle schema
 *
 * These schemas are generated using drizzle-zod from the Drizzle schema definitions.
 * They serve as the foundation and can be enhanced with custom validation in the
 * enhanced/ directory for API-specific requirements.
 */

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  properties,
  propertyCharacteristics,
  propertyValuation,
  propertyAcquisition,
  propertyRentalIncome,
  propertyOperatingExpenses,
  propertyManagement,
} from "@axori/db/src/schema";

// ============================================================================
// Properties
// ============================================================================

export const propertyInsertSchema = createInsertSchema(properties);
export const propertySelectSchema = createSelectSchema(properties);

// ============================================================================
// Property Characteristics
// ============================================================================

export const propertyCharacteristicsInsertSchema = createInsertSchema(propertyCharacteristics);
export const propertyCharacteristicsSelectSchema = createSelectSchema(propertyCharacteristics);

// ============================================================================
// Property Valuation
// ============================================================================

export const propertyValuationInsertSchema = createInsertSchema(propertyValuation);
export const propertyValuationSelectSchema = createSelectSchema(propertyValuation);

// ============================================================================
// Property Acquisition
// ============================================================================

export const propertyAcquisitionInsertSchema = createInsertSchema(propertyAcquisition);
export const propertyAcquisitionSelectSchema = createSelectSchema(propertyAcquisition);

// ============================================================================
// Property Rental Income
// ============================================================================

export const propertyRentalIncomeInsertSchema = createInsertSchema(propertyRentalIncome);
export const propertyRentalIncomeSelectSchema = createSelectSchema(propertyRentalIncome);

// ============================================================================
// Property Operating Expenses
// ============================================================================

export const propertyOperatingExpensesInsertSchema = createInsertSchema(propertyOperatingExpenses);
export const propertyOperatingExpensesSelectSchema = createSelectSchema(propertyOperatingExpenses);

// ============================================================================
// Property Management
// ============================================================================

export const propertyManagementInsertSchema = createInsertSchema(propertyManagement);
export const propertyManagementSelectSchema = createSelectSchema(propertyManagement);

