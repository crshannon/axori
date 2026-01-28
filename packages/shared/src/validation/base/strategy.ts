/**
 * Base Zod schemas auto-generated from Drizzle schema
 *
 * These schemas are generated using drizzle-zod from the Drizzle schema definitions.
 * They serve as the foundation and can be enhanced with custom validation in the
 * enhanced/ directory for API-specific requirements.
 */

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  propertyStrategies,
  brrrrPhases,
  brrrrPhaseHistory,
  rehabScopeItems,
} from "@axori/db/src/schema";

// ============================================================================
// Property Strategy
// ============================================================================

export const propertyStrategyInsertSchema = createInsertSchema(propertyStrategies);
export const propertyStrategySelectSchema = createSelectSchema(propertyStrategies);

// ============================================================================
// BRRRR Phase
// ============================================================================

export const brrrrPhaseInsertSchema = createInsertSchema(brrrrPhases);
export const brrrrPhaseSelectSchema = createSelectSchema(brrrrPhases);

// ============================================================================
// BRRRR Phase History
// ============================================================================

export const brrrrPhaseHistoryInsertSchema = createInsertSchema(brrrrPhaseHistory);
export const brrrrPhaseHistorySelectSchema = createSelectSchema(brrrrPhaseHistory);

// ============================================================================
// Rehab Scope Items
// ============================================================================

export const rehabScopeItemInsertSchema = createInsertSchema(rehabScopeItems);
export const rehabScopeItemSelectSchema = createSelectSchema(rehabScopeItems);
