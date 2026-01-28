/**
 * Enhanced Zod schemas for property communications with API-specific validation
 *
 * Extends base schemas with:
 * - Communication type and category constraints
 * - Contact validation
 * - Query parameter schemas
 * - Template management
 */

import { z } from "zod";
import {
  propertyCommunicationInsertSchema,
  propertyContactInsertSchema,
  communicationTemplateInsertSchema,
} from "../base/communications";

// ============================================================================
// Communication Type Constants
// ============================================================================

export const COMMUNICATION_TYPES = [
  "email",
  "phone_call",
  "text_message",
  "in_person",
  "note",
  "formal_notice",
  "portal_message",
] as const;

export type CommunicationType = (typeof COMMUNICATION_TYPES)[number];

export const COMMUNICATION_TYPE_LABELS: Record<CommunicationType, string> = {
  email: "Email",
  phone_call: "Phone Call",
  text_message: "Text Message",
  in_person: "In Person",
  note: "Note",
  formal_notice: "Formal Notice",
  portal_message: "Portal Message",
};

// ============================================================================
// Communication Direction Constants
// ============================================================================

export const COMMUNICATION_DIRECTIONS = ["inbound", "outbound", "internal"] as const;

export type CommunicationDirection = (typeof COMMUNICATION_DIRECTIONS)[number];

export const COMMUNICATION_DIRECTION_LABELS: Record<CommunicationDirection, string> = {
  inbound: "Inbound",
  outbound: "Outbound",
  internal: "Internal",
};

// ============================================================================
// Communication Category Constants
// ============================================================================

export const COMMUNICATION_CATEGORIES = [
  "maintenance",
  "lease",
  "payment",
  "general",
  "urgent",
  "move_in_out",
  "inspection",
  "violation",
  "renewal",
] as const;

export type CommunicationCategory = (typeof COMMUNICATION_CATEGORIES)[number];

export const COMMUNICATION_CATEGORY_LABELS: Record<CommunicationCategory, string> = {
  maintenance: "Maintenance",
  lease: "Lease",
  payment: "Payment",
  general: "General",
  urgent: "Urgent",
  move_in_out: "Move In/Out",
  inspection: "Inspection",
  violation: "Violation",
  renewal: "Renewal",
};

// ============================================================================
// Communication Status Constants
// ============================================================================

export const COMMUNICATION_STATUSES = [
  "draft",
  "sent",
  "delivered",
  "acknowledged",
  "requires_response",
  "resolved",
] as const;

export type CommunicationStatus = (typeof COMMUNICATION_STATUSES)[number];

export const COMMUNICATION_STATUS_LABELS: Record<CommunicationStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  delivered: "Delivered",
  acknowledged: "Acknowledged",
  requires_response: "Requires Response",
  resolved: "Resolved",
};

// ============================================================================
// Contact Type Constants
// ============================================================================

export const CONTACT_TYPES = [
  "tenant",
  "property_manager",
  "contractor",
  "vendor",
  "hoa_contact",
  "utility_company",
  "emergency",
  "other",
] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  tenant: "Tenant",
  property_manager: "Property Manager",
  contractor: "Contractor",
  vendor: "Vendor",
  hoa_contact: "HOA Contact",
  utility_company: "Utility Company",
  emergency: "Emergency Contact",
  other: "Other",
};

// ============================================================================
// Enhanced Communication Schemas
// ============================================================================

// Schema for creating a communication
export const communicationCreateSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),
  type: z.enum(COMMUNICATION_TYPES, {
    errorMap: () => ({ message: "Invalid communication type" }),
  }),
  direction: z.enum(COMMUNICATION_DIRECTIONS, {
    errorMap: () => ({ message: "Invalid communication direction" }),
  }),
  category: z.enum(COMMUNICATION_CATEGORIES).optional().default("general"),
  status: z.enum(COMMUNICATION_STATUSES).optional().default("sent"),
  subject: z.string().min(1, "Subject is required").max(500, "Subject must be 500 characters or less"),
  summary: z.string().max(1000, "Summary must be 1000 characters or less").optional().nullable(),
  content: z.string().max(50000, "Content must be 50000 characters or less").optional().nullable(),
  communicationDate: z.string().datetime().optional(),
  contactName: z.string().max(255).optional().nullable(),
  contactEmail: z.string().email("Invalid email address").optional().nullable(),
  contactPhone: z.string().max(20).optional().nullable(),
  contactRole: z.string().max(100).optional().nullable(),
  contactId: z.string().uuid("Contact ID must be a valid UUID").optional().nullable(),
  transactionId: z.string().uuid("Transaction ID must be a valid UUID").optional().nullable(),
  deliveryMethod: z.string().max(50).optional().nullable(),
  acknowledgmentRequired: z.boolean().optional().default(false),
  attachmentUrls: z.array(z.string().url("Invalid attachment URL")).max(10).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  isPinned: z.boolean().optional().default(false),
});

// Schema for updating a communication
export const communicationUpdateSchema = z.object({
  type: z.enum(COMMUNICATION_TYPES).optional(),
  direction: z.enum(COMMUNICATION_DIRECTIONS).optional(),
  category: z.enum(COMMUNICATION_CATEGORIES).optional(),
  status: z.enum(COMMUNICATION_STATUSES).optional(),
  subject: z.string().min(1).max(500).optional(),
  summary: z.string().max(1000).optional().nullable(),
  content: z.string().max(50000).optional().nullable(),
  communicationDate: z.string().datetime().optional(),
  contactName: z.string().max(255).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().max(20).optional().nullable(),
  contactRole: z.string().max(100).optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  transactionId: z.string().uuid().optional().nullable(),
  deliveryMethod: z.string().max(50).optional().nullable(),
  acknowledgmentRequired: z.boolean().optional(),
  acknowledgedAt: z.string().datetime().optional().nullable(),
  attachmentUrls: z.array(z.string().url()).max(10).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  isPinned: z.boolean().optional(),
});

// Schema for communication list query parameters
export const communicationListQuerySchema = z.object({
  type: z.enum(COMMUNICATION_TYPES).optional(),
  direction: z.enum(COMMUNICATION_DIRECTIONS).optional(),
  category: z.enum(COMMUNICATION_CATEGORIES).optional(),
  status: z.enum(COMMUNICATION_STATUSES).optional(),
  contactId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  isPinned: z.coerce.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sort: z
    .enum(["communicationDate", "createdAt", "subject", "type", "category"])
    .optional()
    .default("communicationDate"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ============================================================================
// Enhanced Contact Schemas
// ============================================================================

// Schema for creating a contact
export const contactCreateSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),
  name: z.string().min(1, "Name is required").max(255, "Name must be 255 characters or less"),
  company: z.string().max(255).optional().nullable(),
  type: z.enum(CONTACT_TYPES, {
    errorMap: () => ({ message: "Invalid contact type" }),
  }),
  role: z.string().max(100).optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  alternatePhone: z.string().max(20).optional().nullable(),
  preferredContactMethod: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().length(2, "State must be 2 characters").optional().nullable(),
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code")
    .optional()
    .nullable(),
  notes: z.string().max(2000).optional().nullable(),
  hoursAvailable: z.string().max(255).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  isPrimary: z.boolean().optional().default(false),
});

// Schema for updating a contact
export const contactUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  company: z.string().max(255).optional().nullable(),
  type: z.enum(CONTACT_TYPES).optional(),
  role: z.string().max(100).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  alternatePhone: z.string().max(20).optional().nullable(),
  preferredContactMethod: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().length(2).optional().nullable(),
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/)
    .optional()
    .nullable(),
  notes: z.string().max(2000).optional().nullable(),
  hoursAvailable: z.string().max(255).optional().nullable(),
  isActive: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
});

// Schema for contact list query parameters
export const contactListQuerySchema = z.object({
  type: z.enum(CONTACT_TYPES).optional(),
  isActive: z.coerce.boolean().optional(),
  isPrimary: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(["name", "company", "type", "createdAt"]).optional().default("name"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

// ============================================================================
// Enhanced Template Schemas
// ============================================================================

// Schema for creating a template
export const templateCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be 255 characters or less"),
  type: z.enum(COMMUNICATION_TYPES, {
    errorMap: () => ({ message: "Invalid communication type" }),
  }),
  category: z.enum(COMMUNICATION_CATEGORIES).optional().default("general"),
  subject: z.string().max(500).optional().nullable(),
  content: z.string().min(1, "Content is required").max(50000, "Content must be 50000 characters or less"),
  isDefault: z.boolean().optional().default(false),
});

// Schema for updating a template
export const templateUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.enum(COMMUNICATION_TYPES).optional(),
  category: z.enum(COMMUNICATION_CATEGORIES).optional(),
  subject: z.string().max(500).optional().nullable(),
  content: z.string().min(1).max(50000).optional(),
  isDefault: z.boolean().optional(),
});

// Schema for template list query parameters
export const templateListQuerySchema = z.object({
  type: z.enum(COMMUNICATION_TYPES).optional(),
  category: z.enum(COMMUNICATION_CATEGORIES).optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(["name", "type", "category", "usageCount", "createdAt"]).optional().default("name"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

// ============================================================================
// Type Inference
// ============================================================================

export type CommunicationCreateInput = z.infer<typeof communicationCreateSchema>;
export type CommunicationUpdateInput = z.infer<typeof communicationUpdateSchema>;
export type CommunicationListQuery = z.infer<typeof communicationListQuerySchema>;

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;
export type ContactListQuery = z.infer<typeof contactListQuerySchema>;

export type TemplateCreateInput = z.infer<typeof templateCreateSchema>;
export type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>;
export type TemplateListQuery = z.infer<typeof templateListQuerySchema>;

// Re-export base schemas for use in API routes
export {
  propertyCommunicationInsertSchema,
  propertyContactInsertSchema,
  communicationTemplateInsertSchema,
};
