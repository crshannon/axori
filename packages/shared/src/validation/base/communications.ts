/**
 * Base Zod schemas auto-generated from Drizzle schema for property communications
 *
 * These schemas are generated using drizzle-zod from the Drizzle schema definitions.
 * Custom validation enhancements are added in the enhanced/ directory.
 */

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  propertyCommunications,
  propertyContacts,
  communicationTemplates,
} from "@axori/db/src/schema";

// ============================================================================
// Property Communications
// ============================================================================

export const propertyCommunicationInsertSchema = createInsertSchema(propertyCommunications);
export const propertyCommunicationSelectSchema = createSelectSchema(propertyCommunications);

// ============================================================================
// Property Contacts
// ============================================================================

export const propertyContactInsertSchema = createInsertSchema(propertyContacts);
export const propertyContactSelectSchema = createSelectSchema(propertyContacts);

// ============================================================================
// Communication Templates
// ============================================================================

export const communicationTemplateInsertSchema = createInsertSchema(communicationTemplates);
export const communicationTemplateSelectSchema = createSelectSchema(communicationTemplates);
