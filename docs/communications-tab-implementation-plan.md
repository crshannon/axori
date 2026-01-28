# Communications Tab Implementation Plan

**Document Version**: 1.0
**Feature**: Property Communications Hub
**Status**: Planning
**Target Tab**: `/property-hub/$propertyId/communications`

---

## Executive Summary

The Communications Tab will centralize all property-related communication tracking, providing a unified interface for logging interactions with property managers, tenants, contractors, and storing internal notes. This plan outlines the technical implementation across database schema, API design, and frontend components.

---

## 1. Schema Design

### 1.1 New Tables

#### `property_communications` - Communication Log Entries

```typescript
// packages/db/src/schema/index.ts

export const communicationTypeEnum = pgEnum("communication_type", [
  "email",
  "phone_call",
  "text_message",
  "in_person",
  "note",
  "formal_notice",
  "portal_message", // For PM portal messages (AppFolio, etc.)
])

export const communicationDirectionEnum = pgEnum("communication_direction", [
  "inbound",
  "outbound",
  "internal", // For notes/reminders
])

export const communicationCategoryEnum = pgEnum("communication_category", [
  "maintenance",
  "lease",
  "payment",
  "general",
  "urgent",
  "move_in_out",
  "inspection",
  "violation",
  "renewal",
])

export const communicationStatusEnum = pgEnum("communication_status", [
  "draft",
  "sent",
  "delivered",
  "acknowledged",
  "requires_response",
  "resolved",
])

export const propertyCommunications = pgTable(
  "property_communications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),

    // Core fields
    type: communicationTypeEnum("type").notNull(),
    direction: communicationDirectionEnum("direction").notNull(),
    category: communicationCategoryEnum("category").notNull().default("general"),
    status: communicationStatusEnum("status").notNull().default("sent"),

    // Communication details
    subject: text("subject").notNull(),
    summary: text("summary"), // Brief description
    content: text("content"), // Full notes/body

    // Date tracking
    communicationDate: timestamp("communication_date").notNull().defaultNow(),

    // Contact information (denormalized for flexibility)
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    contactRole: text("contact_role"), // e.g., "Tenant", "Property Manager", "Contractor"

    // Linkable entities (optional associations)
    contactId: uuid("contact_id").references(() => propertyContacts.id, { onDelete: "set null" }),
    leaseId: uuid("lease_id"), // Future: reference to leases table
    maintenanceRequestId: uuid("maintenance_request_id"), // Future: reference to maintenance requests
    transactionId: uuid("transaction_id").references(() => propertyTransactions.id, { onDelete: "set null" }),

    // For formal notices
    deliveryMethod: text("delivery_method"), // e.g., "certified_mail", "hand_delivered", "email"
    acknowledgmentRequired: boolean("acknowledgment_required").default(false),
    acknowledgedAt: timestamp("acknowledged_at"),

    // Metadata
    attachmentUrls: text("attachment_urls").array(), // Array of file URLs
    tags: text("tags").array(), // Custom tags for filtering
    isPinned: boolean("is_pinned").default(false), // For important communications

    // Audit
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    propertyIdIdx: index("idx_property_communications_property_id").on(table.propertyId),
    communicationDateIdx: index("idx_property_communications_date").on(table.communicationDate),
    categoryIdx: index("idx_property_communications_category").on(table.category),
    typeIdx: index("idx_property_communications_type").on(table.type),
    statusIdx: index("idx_property_communications_status").on(table.status),
    contactIdIdx: index("idx_property_communications_contact_id").on(table.contactId),
    // Composite index for common queries
    propertyDateIdx: index("idx_property_communications_property_date").on(
      table.propertyId,
      table.communicationDate
    ),
  })
)
```

#### `property_contacts` - Contact Directory

```typescript
export const contactTypeEnum = pgEnum("contact_type", [
  "tenant",
  "property_manager",
  "contractor",
  "vendor",
  "hoa_contact",
  "utility_company",
  "emergency",
  "other",
])

export const propertyContacts = pgTable(
  "property_contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),

    // Contact info
    name: text("name").notNull(),
    company: text("company"), // Company/organization name
    type: contactTypeEnum("type").notNull(),
    role: text("role"), // Specific role (e.g., "Maintenance Lead", "Leasing Agent")

    // Contact methods
    email: text("email"),
    phone: text("phone"),
    alternatePhone: text("alternate_phone"),
    preferredContactMethod: text("preferred_contact_method"), // "email", "phone", "text"

    // Address (optional)
    address: text("address"),
    city: text("city"),
    state: text("state"),
    zipCode: text("zip_code"),

    // Availability
    notes: text("notes"),
    hoursAvailable: text("hours_available"), // e.g., "Mon-Fri 9-5"

    // Status
    isActive: boolean("is_active").default(true),
    isPrimary: boolean("is_primary").default(false), // Primary contact for this type

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    propertyIdIdx: index("idx_property_contacts_property_id").on(table.propertyId),
    typeIdx: index("idx_property_contacts_type").on(table.type),
    isActiveIdx: index("idx_property_contacts_is_active").on(table.isActive),
  })
)
```

#### `communication_templates` - Notice Templates

```typescript
export const templateCategoryEnum = pgEnum("template_category", [
  "rent_reminder",
  "late_rent_notice",
  "lease_violation",
  "entry_notice",
  "lease_renewal",
  "move_out",
  "maintenance_scheduled",
  "general",
])

export const communicationTemplates = pgTable(
  "communication_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Can be property-specific or portfolio-wide or user-wide
    propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
    portfolioId: uuid("portfolio_id").references(() => portfolios.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),

    // Template details
    name: text("name").notNull(),
    category: templateCategoryEnum("category").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(), // Supports placeholders like {{tenant_name}}, {{property_address}}

    // Metadata
    isSystemTemplate: boolean("is_system_template").default(false), // Built-in templates
    isActive: boolean("is_active").default(true),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("idx_communication_templates_category").on(table.category),
    userIdIdx: index("idx_communication_templates_user_id").on(table.userId),
    portfolioIdIdx: index("idx_communication_templates_portfolio_id").on(table.portfolioId),
  })
)
```

### 1.2 Drizzle Relations

```typescript
export const propertyCommunicationsRelations = relations(propertyCommunications, ({ one }) => ({
  property: one(properties, {
    fields: [propertyCommunications.propertyId],
    references: [properties.id],
  }),
  contact: one(propertyContacts, {
    fields: [propertyCommunications.contactId],
    references: [propertyContacts.id],
  }),
  transaction: one(propertyTransactions, {
    fields: [propertyCommunications.transactionId],
    references: [propertyTransactions.id],
  }),
  createdByUser: one(users, {
    fields: [propertyCommunications.createdBy],
    references: [users.id],
  }),
}))

export const propertyContactsRelations = relations(propertyContacts, ({ one, many }) => ({
  property: one(properties, {
    fields: [propertyContacts.propertyId],
    references: [properties.id],
  }),
  communications: many(propertyCommunications),
}))

// Add to existing properties relations
export const propertiesRelations = relations(properties, ({ many }) => ({
  // ... existing relations
  communications: many(propertyCommunications),
  contacts: many(propertyContacts),
}))
```

### 1.3 Type Exports

```typescript
// packages/db/src/types/index.ts
export type PropertyCommunication = InferSelectModel<typeof propertyCommunications>
export type PropertyCommunicationInsert = InferInsertModel<typeof propertyCommunications>

export type PropertyContact = InferSelectModel<typeof propertyContacts>
export type PropertyContactInsert = InferInsertModel<typeof propertyContacts>

export type CommunicationTemplate = InferSelectModel<typeof communicationTemplates>
export type CommunicationTemplateInsert = InferInsertModel<typeof communicationTemplates>
```

---

## 2. Validation Schemas

### 2.1 Base Schemas (Drizzle-Zod Generated)

```typescript
// packages/shared/src/validation/base/communications.ts
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { propertyCommunications, propertyContacts } from "@axori/db/src/schema"

export const propertyCommunicationInsertSchema = createInsertSchema(propertyCommunications)
export const propertyCommunicationSelectSchema = createSelectSchema(propertyCommunications)

export const propertyContactInsertSchema = createInsertSchema(propertyContacts)
export const propertyContactSelectSchema = createSelectSchema(propertyContacts)
```

### 2.2 Form Schemas

```typescript
// packages/shared/src/validation/form/communications.ts
import { z } from "zod"

export const communicationTypeOptions = [
  { value: "email", label: "Email" },
  { value: "phone_call", label: "Phone Call" },
  { value: "text_message", label: "Text Message" },
  { value: "in_person", label: "In Person" },
  { value: "note", label: "Internal Note" },
  { value: "formal_notice", label: "Formal Notice" },
  { value: "portal_message", label: "Portal Message" },
] as const

export const communicationCategoryOptions = [
  { value: "maintenance", label: "Maintenance" },
  { value: "lease", label: "Lease" },
  { value: "payment", label: "Payment" },
  { value: "general", label: "General" },
  { value: "urgent", label: "Urgent" },
  { value: "move_in_out", label: "Move In/Out" },
  { value: "inspection", label: "Inspection" },
  { value: "violation", label: "Violation" },
  { value: "renewal", label: "Renewal" },
] as const

export const communicationFormSchema = z.object({
  type: z.enum(["email", "phone_call", "text_message", "in_person", "note", "formal_notice", "portal_message"]),
  direction: z.enum(["inbound", "outbound", "internal"]),
  category: z.enum(["maintenance", "lease", "payment", "general", "urgent", "move_in_out", "inspection", "violation", "renewal"]),

  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  summary: z.string().max(500, "Summary too long").optional(),
  content: z.string().optional(),

  communicationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),

  // Contact fields
  contactId: z.string().uuid().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  contactRole: z.string().optional(),

  // Formal notice fields
  deliveryMethod: z.string().optional(),
  acknowledgmentRequired: z.boolean().default(false),

  // Linkages
  transactionId: z.string().uuid().optional(),

  // Metadata
  tags: z.array(z.string()).default([]),
  isPinned: z.boolean().default(false),
})

export type CommunicationFormData = z.infer<typeof communicationFormSchema>

export const defaultCommunicationFormValues: CommunicationFormData = {
  type: "note",
  direction: "internal",
  category: "general",
  subject: "",
  summary: "",
  content: "",
  communicationDate: new Date().toISOString().split("T")[0],
  contactId: undefined,
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  contactRole: "",
  deliveryMethod: undefined,
  acknowledgmentRequired: false,
  transactionId: undefined,
  tags: [],
  isPinned: false,
}

// Contact form schema
export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  company: z.string().max(100).optional(),
  type: z.enum(["tenant", "property_manager", "contractor", "vendor", "hoa_contact", "utility_company", "emergency", "other"]),
  role: z.string().max(100).optional(),

  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  preferredContactMethod: z.enum(["email", "phone", "text"]).optional(),

  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),

  notes: z.string().max(1000).optional(),
  hoursAvailable: z.string().max(100).optional(),

  isActive: z.boolean().default(true),
  isPrimary: z.boolean().default(false),
})

export type ContactFormData = z.infer<typeof contactFormSchema>
```

---

## 3. API Design

### 3.1 Communications Endpoints

```typescript
// apps/api/src/routes/communications.ts

/**
 * GET /api/properties/:propertyId/communications
 * List communications with filtering and pagination
 *
 * Query params:
 * - type: communication type filter
 * - category: category filter
 * - direction: inbound/outbound/internal
 * - status: status filter
 * - startDate: filter from date
 * - endDate: filter to date
 * - search: search in subject/content
 * - contactId: filter by contact
 * - page: page number (default 1)
 * - pageSize: items per page (default 20)
 * - sortBy: field to sort (default: communicationDate)
 * - sortOrder: asc/desc (default: desc)
 */
GET /api/properties/:propertyId/communications

/**
 * GET /api/properties/:propertyId/communications/:communicationId
 * Get single communication detail
 */
GET /api/properties/:propertyId/communications/:communicationId

/**
 * POST /api/properties/:propertyId/communications
 * Create new communication log entry
 */
POST /api/properties/:propertyId/communications

/**
 * PUT /api/properties/:propertyId/communications/:communicationId
 * Update communication
 */
PUT /api/properties/:propertyId/communications/:communicationId

/**
 * DELETE /api/properties/:propertyId/communications/:communicationId
 * Delete communication
 */
DELETE /api/properties/:propertyId/communications/:communicationId

/**
 * POST /api/properties/:propertyId/communications/:communicationId/acknowledge
 * Mark formal notice as acknowledged
 */
POST /api/properties/:propertyId/communications/:communicationId/acknowledge
```

### 3.2 Contacts Endpoints

```typescript
/**
 * GET /api/properties/:propertyId/contacts
 * List contacts for property
 *
 * Query params:
 * - type: contact type filter
 * - isActive: boolean filter
 * - search: search in name/company/email
 */
GET /api/properties/:propertyId/contacts

/**
 * GET /api/properties/:propertyId/contacts/:contactId
 * Get single contact
 */
GET /api/properties/:propertyId/contacts/:contactId

/**
 * POST /api/properties/:propertyId/contacts
 * Create new contact
 */
POST /api/properties/:propertyId/contacts

/**
 * PUT /api/properties/:propertyId/contacts/:contactId
 * Update contact
 */
PUT /api/properties/:propertyId/contacts/:contactId

/**
 * DELETE /api/properties/:propertyId/contacts/:contactId
 * Delete contact
 */
DELETE /api/properties/:propertyId/contacts/:contactId
```

### 3.3 Templates Endpoints

```typescript
/**
 * GET /api/templates
 * List templates (system + user's custom)
 *
 * Query params:
 * - category: template category
 * - propertyId: property-specific templates
 * - portfolioId: portfolio-specific templates
 */
GET /api/templates

/**
 * POST /api/templates
 * Create custom template
 */
POST /api/templates

/**
 * PUT /api/templates/:templateId
 * Update custom template
 */
PUT /api/templates/:templateId

/**
 * DELETE /api/templates/:templateId
 * Delete custom template
 */
DELETE /api/templates/:templateId
```

### 3.4 Response Types

```typescript
// Communications list response
interface CommunicationsResponse {
  communications: PropertyCommunication[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    byCategory: Record<string, number>
    byType: Record<string, number>
    requiresResponse: number
  }
}

// Contacts list response
interface ContactsResponse {
  contacts: PropertyContact[]
  grouped: {
    tenants: PropertyContact[]
    propertyManagers: PropertyContact[]
    contractors: PropertyContact[]
    vendors: PropertyContact[]
    other: PropertyContact[]
  }
}
```

---

## 4. Component Architecture

### 4.1 Component Tree

```
communications.tsx (Route)
├── CommunicationsHeader
│   ├── QuickLogButtons (Phone, Email, Note shortcuts)
│   └── SearchAndFilter
│       ├── SearchInput
│       ├── CategoryFilter
│       ├── TypeFilter
│       └── DateRangeFilter
│
├── CommunicationsLayout (12-col grid)
│   ├── InboxIntelligence (4 cols) - existing card, enhanced
│   │   ├── EmailForwardingConfig
│   │   └── ExtractionStatus
│   │
│   ├── ContactDirectory (4 cols)
│   │   ├── QuickContactList
│   │   │   ├── ContactTypeSection (Tenants)
│   │   │   ├── ContactTypeSection (PM)
│   │   │   └── ContactTypeSection (Vendors)
│   │   └── AddContactButton
│   │
│   ├── NoticeCenter (4 cols)
│   │   ├── PendingNotices
│   │   ├── NoticeTemplateQuickAccess
│   │   └── RecentNotices
│   │
│   └── CommunicationFeed (12 cols)
│       ├── PinnedCommunications
│       ├── CommunicationList
│       │   └── CommunicationCard
│       │       ├── TypeIcon
│       │       ├── ContactBadge
│       │       ├── CategoryBadge
│       │       ├── DirectionIndicator
│       │       └── QuickActions (pin, edit, link)
│       └── LoadMorePagination
│
└── SystemGeneratedTasks (12 cols) - existing card, kept

Drawers:
├── AddCommunicationDrawer
│   ├── QuickLogForm (simplified for calls/notes)
│   └── DetailedForm (full fields for notices)
│
├── CommunicationDetailDrawer
│   ├── CommunicationHeader
│   ├── ContentSection
│   ├── LinkedEntities
│   └── ActivityTimeline
│
├── ContactDrawer
│   └── ContactForm
│
└── TemplateDrawer
    └── TemplateForm
```

### 4.2 Key Component Specifications

#### CommunicationCard

```tsx
interface CommunicationCardProps {
  communication: PropertyCommunication
  onEdit: (id: string) => void
  onPin: (id: string) => void
  onViewDetail: (id: string) => void
  onLinkTransaction: (id: string) => void
}

// Visual indicators:
// - Type icons: Mail, Phone, MessageSquare, User, FileText, Bell
// - Direction: Arrow indicators (←inbound, →outbound, ●internal)
// - Category: Colored badges matching existing design
// - Status: Visual state for requires_response, acknowledged, etc.
// - Pinned: Star/pin icon with highlight
```

#### QuickLogButtons

```tsx
// Floating action or header buttons for rapid logging
// One-click opens pre-configured drawer:
// - "Log Call" → type=phone_call, direction=outbound
// - "Log Email" → type=email, direction=outbound
// - "Add Note" → type=note, direction=internal
// - "Send Notice" → type=formal_notice, direction=outbound
```

#### ContactDirectory

```tsx
interface ContactDirectoryProps {
  propertyId: string
  contacts: PropertyContact[]
  onSelectContact: (contact: PropertyContact) => void
  onAddContact: () => void
  onEditContact: (id: string) => void
}

// Features:
// - Grouped by type with expandable sections
// - Primary contact highlighted
// - Click to populate communication form
// - Quick call/email actions
// - Search within contacts
```

### 4.3 Drawer Specifications

#### AddCommunicationDrawer

```tsx
// Mode: "quick" | "detailed"
// Quick mode: Minimal fields for rapid logging
// Detailed mode: Full form for formal notices

interface AddCommunicationDrawerProps extends DrawerComponentProps {
  propertyId: string
  communicationId?: string // For edit mode
  prefillType?: CommunicationType
  prefillContact?: PropertyContact
  mode?: "quick" | "detailed"
}

// Form sections:
// 1. Communication Type & Direction (visual selector)
// 2. Contact Selection (dropdown or manual entry)
// 3. Subject & Content
// 4. Category & Tags
// 5. Formal Notice Fields (conditional)
// 6. Link to Transaction (optional)
```

---

## 5. State Management (TanStack Query)

### 5.1 Query Hooks

```typescript
// apps/web/src/hooks/api/useCommunications.ts

// List communications with filters
export function usePropertyCommunications(
  propertyId: string | null,
  filters?: CommunicationFilters
)

// Single communication
export function usePropertyCommunication(
  propertyId: string | null,
  communicationId: string | null
)

// Communication summary/stats
export function useCommunicationStats(propertyId: string | null)

// apps/web/src/hooks/api/useContacts.ts

// List contacts
export function usePropertyContacts(
  propertyId: string | null,
  filters?: ContactFilters
)

// Single contact
export function usePropertyContact(
  propertyId: string | null,
  contactId: string | null
)

// Grouped contacts (optimized for directory view)
export function usePropertyContactsGrouped(propertyId: string | null)
```

### 5.2 Mutation Hooks

```typescript
// Communications mutations
export function useCreateCommunication()
export function useUpdateCommunication()
export function useDeleteCommunication()
export function usePinCommunication()
export function useAcknowledgeCommunication()

// Contacts mutations
export function useCreateContact()
export function useUpdateContact()
export function useDeleteContact()
```

### 5.3 Form Hooks

```typescript
// apps/web/src/hooks/forms/useCommunicationForm.ts
export function useCommunicationForm(options: {
  propertyId: string
  communicationId?: string
  prefillType?: CommunicationType
  prefillContact?: PropertyContact
  onSuccess?: () => void
  onClose?: () => void
})

// apps/web/src/hooks/forms/useContactForm.ts
export function useContactForm(options: {
  propertyId: string
  contactId?: string
  onSuccess?: () => void
  onClose?: () => void
})
```

---

## 6. Implementation Phases

### Phase 1: Foundation (Database & API)
**Priority: High | Effort: Medium**

1. Add schema tables to `packages/db/src/schema/index.ts`
2. Generate and run migration: `pnpm db:generate && pnpm db:push`
3. Create Zod validation schemas in `packages/shared/src/validation/`
4. Implement API routes in `apps/api/src/routes/communications.ts`
5. Add permission checks using existing `withPermission` middleware
6. Write unit tests for API routes

**Deliverables:**
- Database tables created
- API endpoints functional
- Basic CRUD operations working

### Phase 2: Core UI Components
**Priority: High | Effort: Medium**

1. Create `CommunicationCard` component
2. Create `CommunicationFeed` with infinite scroll
3. Create `ContactDirectory` component
4. Create search and filter controls
5. Update `communications.tsx` route with real data

**Deliverables:**
- Communication list displaying
- Contact directory functional
- Search and filter working

### Phase 3: Drawer System
**Priority: High | Effort: Medium**

1. Register new drawers in `registry.ts`
2. Create `AddCommunicationDrawer`
3. Create `CommunicationDetailDrawer`
4. Create `ContactDrawer`
5. Create form hooks with validation

**Deliverables:**
- Create/edit communications working
- Create/edit contacts working
- Full CRUD flow complete

### Phase 4: Quick Log & UX Polish
**Priority: Medium | Effort: Low**

1. Add `QuickLogButtons` component
2. Implement pin functionality
3. Add keyboard shortcuts
4. Polish animations and transitions
5. Add empty states and loading skeletons

**Deliverables:**
- One-click logging for calls/notes
- Pin important communications
- Polished user experience

### Phase 5: Notices & Templates
**Priority: Medium | Effort: Medium**

1. Create `NoticeCenter` component
2. Implement notice tracking (sent, delivered, acknowledged)
3. Create system templates (seed data)
4. Add template management UI
5. Add template variable substitution

**Deliverables:**
- Formal notice tracking
- Built-in notice templates
- Custom template creation

### Phase 6: Integrations & Advanced Features (Future)
**Priority: Low | Effort: High**

1. Email forwarding integration
2. AppFolio API integration
3. Link communications to maintenance requests
4. Auto-categorization via AI
5. Communication analytics dashboard

---

## 7. File Structure

```
apps/
  api/
    src/
      routes/
        communications.ts        # New: Communication & contact routes

  web/
    src/
      routes/
        _authed/
          property-hub.$propertyId/
            communications.tsx   # Existing: Update with real implementation

      components/
        property-hub/
          property-details/
            communications/      # New directory
              CommunicationsHeader.tsx
              CommunicationFeed.tsx
              CommunicationCard.tsx
              ContactDirectory.tsx
              NoticeCenter.tsx
              QuickLogButtons.tsx
              SearchAndFilter.tsx
              index.ts

        drawers/
          AddCommunicationDrawer.tsx    # New
          CommunicationDetailDrawer.tsx # New
          ContactDrawer.tsx             # New
          TemplateDrawer.tsx            # New (Phase 5)

      hooks/
        api/
          useCommunications.ts   # New
          useContacts.ts         # New
          useTemplates.ts        # New (Phase 5)

        forms/
          useCommunicationForm.ts # New
          useContactForm.ts       # New

      lib/
        drawer/
          registry.ts            # Update: Register new drawers

packages/
  db/
    src/
      schema/
        index.ts                 # Update: Add new tables
      types/
        index.ts                 # Update: Export new types

  shared/
    src/
      validation/
        base/
          communications.ts      # New
        form/
          communications.ts      # New
        index.ts                 # Update: Export new schemas
```

---

## 8. Open Questions

### Design Decisions Needed

1. **Communication Scope**: Should communications be linkable to specific lease periods, or always property-wide?
   - *Recommendation*: Start property-wide, add lease association as optional field for future use

2. **Multi-Tenant Communications**: When a property has multiple tenants, how do we handle communications?
   - *Recommendation*: Contact system handles individual tenants; communication can tag multiple contacts

3. **Portfolio-Wide Communications**: How to handle PM updates that apply to multiple properties?
   - *Recommendation*: Phase 6 feature - create "portfolio communication" type that links to multiple properties

4. **Template Ownership**: Should templates be user-level, portfolio-level, or property-level?
   - *Recommendation*: All three with inheritance (system → portfolio → property → user)

5. **Attachment Storage**: Where should communication attachments be stored?
   - *Recommendation*: Use existing file storage pattern (if exists), otherwise Supabase Storage

### Technical Clarifications Needed

1. Does the existing `propertyManagement` table contact info need migration to `property_contacts`?
   - *Recommendation*: Create a migration that copies PM contacts to new table, keep old fields for backwards compatibility

2. Integration with existing "System Generated Tasks" UI - keep separate or merge?
   - *Recommendation*: Keep separate for now; tasks are action items, communications are history

3. Should communications feed integrate with property history/audit log?
   - *Recommendation*: Communications should be separate but could feed into a unified activity timeline view

---

## 9. Success Metrics

### Phase 1-3 (MVP)
- [ ] Can create, view, edit, delete communications
- [ ] Can manage property contacts
- [ ] Search and filter functional
- [ ] Drawer-based forms working
- [ ] Permission checks in place

### Phase 4-5 (Full Feature)
- [ ] Quick log buttons reduce time to log call by 80%
- [ ] Notice templates cover common use cases
- [ ] Pinned communications persist and display prominently
- [ ] Users can track formal notice acknowledgment

### Future (Phase 6+)
- [ ] Email forwarding auto-logs communications
- [ ] AppFolio sync reduces manual entry
- [ ] AI categorization accuracy > 90%

---

## 10. Technical Notes

### Consistency with Existing Patterns

- Use existing `withErrorHandling` wrapper for API routes
- Follow `usePropertyTransactions` pattern for query hooks
- Use drawer registry pattern for new drawers
- Follow `transactionFormSchema` pattern for validation
- Use `DrawerSectionTitle` component for form sections
- Match existing Card styling and animations

### Performance Considerations

- Implement cursor-based pagination for communication feed
- Consider virtual scrolling for large communication lists
- Cache contact directory (changes less frequently)
- Debounce search input
- Lazy load communication content (show summary first)

### Security Notes

- All endpoints require authentication
- Property-level permission check on all operations
- Sanitize user input for communication content
- Rate limit communication creation
- Audit log all formal notice actions

---

---

## 11. Email Processing Architecture (Inbox Intelligence)

The "Inbox Intelligence" feature allows users to forward emails to a property-specific address, which then automatically:
1. Ingests the email and attachments
2. Extracts content from PDFs/images via OCR
3. Analyzes intent and categorizes the communication
4. Creates actionable tasks when appropriate
5. Logs everything to the communication history

### 11.1 Current State

**What exists:**
- Perplexity AI client (`packages/shared/src/integrations/ai.ts`) - can be used for intent analysis
- Resend email client - for **sending** emails only
- React Email templates for transactional emails

**What's missing:**
- Inbound email receiving infrastructure
- Document/attachment processing (OCR)
- Background job queue for async processing
- AI pipeline for categorization and task extraction

### 11.2 Email Ingestion Options

#### Option A: Resend Inbound Webhooks (Recommended for MVP)
Resend supports inbound email processing via webhooks.

```
User forwards email → prop-{propertyId}@inbound.axori.com
                              ↓
                    Resend receives email
                              ↓
                    Webhook POST to /api/webhooks/email
                              ↓
                    Process & store in database
```

**Pros:**
- Already using Resend for outbound
- Simple webhook integration
- Handles email parsing, attachments
- No separate email infrastructure needed

**Cons:**
- Cost per email received
- Dependent on Resend's parsing

**Setup Required:**
1. Configure Resend inbound domain (e.g., `inbound.axori.com`)
2. Create webhook endpoint in API
3. Verify webhook signatures for security

#### Option B: Postmark Inbound Streams
Similar to Resend but with more robust inbound features.

#### Option C: SendGrid Inbound Parse
Industry standard, more complex setup.

#### Option D: Self-hosted (Mailgun/SES)
Most control, most complexity.

**Recommendation:** Start with Resend for consistency, evaluate if volume/cost becomes an issue.

### 11.3 Database Schema Additions

```typescript
// Additional schema for email processing

export const emailProcessingStatusEnum = pgEnum("email_processing_status", [
  "received",      // Email received, not yet processed
  "processing",    // Currently being processed
  "processed",     // Successfully processed
  "failed",        // Processing failed
  "manual_review", // Requires human review
])

export const inboundEmails = pgTable(
  "inbound_emails",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),

    // Raw email data
    messageId: text("message_id").notNull().unique(), // For deduplication
    fromEmail: text("from_email").notNull(),
    fromName: text("from_name"),
    toEmail: text("to_email").notNull(),
    subject: text("subject"),
    textBody: text("text_body"),
    htmlBody: text("html_body"),
    rawHeaders: jsonb("raw_headers"),

    // Processing state
    status: emailProcessingStatusEnum("status").notNull().default("received"),
    processingError: text("processing_error"),
    processedAt: timestamp("processed_at"),

    // AI Analysis results
    aiAnalysis: jsonb("ai_analysis"), // Structured extraction results
    confidence: real("confidence"), // AI confidence score 0-1
    suggestedCategory: communicationCategoryEnum("suggested_category"),
    suggestedTasks: jsonb("suggested_tasks"), // Array of task suggestions

    // Link to created communication entry
    communicationId: uuid("communication_id").references(() => propertyCommunications.id),

    // Timestamps
    receivedAt: timestamp("received_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    propertyIdIdx: index("idx_inbound_emails_property_id").on(table.propertyId),
    statusIdx: index("idx_inbound_emails_status").on(table.status),
    messageIdIdx: index("idx_inbound_emails_message_id").on(table.messageId),
  })
)

export const emailAttachments = pgTable(
  "email_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    emailId: uuid("email_id")
      .notNull()
      .references(() => inboundEmails.id, { onDelete: "cascade" }),

    // File info
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(), // bytes
    storageUrl: text("storage_url"), // Supabase Storage URL

    // OCR processing
    ocrStatus: text("ocr_status"), // "pending", "processing", "completed", "failed", "skipped"
    ocrText: text("ocr_text"), // Extracted text from OCR
    ocrConfidence: real("ocr_confidence"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdIdx: index("idx_email_attachments_email_id").on(table.emailId),
  })
)
```

### 11.4 Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EMAIL PROCESSING PIPELINE                        │
└─────────────────────────────────────────────────────────────────────────┘

Step 1: INGESTION (Webhook Handler)
┌─────────────────────────────────────────────────────────────────────────┐
│  POST /api/webhooks/email                                                │
│  ├── Verify webhook signature                                            │
│  ├── Parse property ID from recipient address                            │
│  ├── Check for duplicate (messageId)                                     │
│  ├── Store raw email in `inbound_emails` (status: "received")           │
│  ├── Store attachments metadata in `email_attachments`                   │
│  ├── Upload attachment files to Supabase Storage                         │
│  └── Return 200 OK (async processing continues)                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Step 2: DOCUMENT PROCESSING (Background Job - Future)
┌─────────────────────────────────────────────────────────────────────────┐
│  For MVP: Process inline (acceptable for low volume)                     │
│  For Scale: Use pg-boss or similar job queue                            │
│                                                                          │
│  For each attachment:                                                    │
│  ├── If PDF → Extract text (pdf-parse library)                          │
│  ├── If image → OCR (Tesseract.js or cloud OCR API)                     │
│  ├── Store extracted text in `email_attachments.ocr_text`               │
│  └── Update status accordingly                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Step 3: AI ANALYSIS (Intent & Entity Extraction)
┌─────────────────────────────────────────────────────────────────────────┐
│  Use existing Perplexity client or add OpenAI/Anthropic                  │
│                                                                          │
│  Input: email body + attachment text + property context                  │
│                                                                          │
│  AI Prompt Structure:                                                    │
│  ───────────────────                                                     │
│  "Analyze this email forwarded to a property management system.          │
│   Property: {address}, Type: {type}, Management: {pm/self}               │
│                                                                          │
│   Email:                                                                 │
│   From: {from}                                                           │
│   Subject: {subject}                                                     │
│   Body: {body}                                                           │
│   Attachments: {attachment_summaries}                                    │
│                                                                          │
│   Extract:                                                               │
│   1. Category (maintenance/lease/payment/general/urgent/etc)             │
│   2. Sender role (tenant/contractor/pm/vendor/unknown)                   │
│   3. Key entities (amounts, dates, names, addresses)                     │
│   4. Suggested tasks (if action needed)                                  │
│   5. Priority level (low/medium/high/urgent)                             │
│   6. Summary (1-2 sentences)                                             │
│                                                                          │
│   Return as JSON."                                                       │
│                                                                          │
│  Output stored in `inbound_emails.ai_analysis`                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Step 4: COMMUNICATION CREATION
┌─────────────────────────────────────────────────────────────────────────┐
│  Create entry in `property_communications`:                              │
│  ├── type: "email"                                                       │
│  ├── direction: "inbound"                                                │
│  ├── category: AI suggested (or "general" if low confidence)            │
│  ├── subject: email subject                                              │
│  ├── content: email body                                                 │
│  ├── contactName: from name                                              │
│  ├── contactEmail: from email                                            │
│  ├── attachmentUrls: links to stored files                              │
│  └── Link back to inbound_email record                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Step 5: TASK CREATION (If AI suggests tasks)
┌─────────────────────────────────────────────────────────────────────────┐
│  For each suggested task from AI:                                        │
│  ├── Create in `property_tasks` table (new table, or use existing)      │
│  ├── Link to communication                                               │
│  ├── Set status: "pending_review" (user must confirm)                   │
│  └── Notify user of new tasks                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### 11.5 API Endpoints for Email Processing

```typescript
/**
 * POST /api/webhooks/email
 * Resend webhook endpoint for inbound emails
 * - Verifies signature
 * - Ingests email and triggers processing
 */
POST /api/webhooks/email

/**
 * GET /api/properties/:propertyId/emails
 * List inbound emails for a property
 * - Includes processing status
 * - Filterable by status, date range
 */
GET /api/properties/:propertyId/emails

/**
 * GET /api/properties/:propertyId/emails/:emailId
 * Get single email with full details
 * - Includes AI analysis
 * - Includes attachment info
 */
GET /api/properties/:propertyId/emails/:emailId

/**
 * POST /api/properties/:propertyId/emails/:emailId/reprocess
 * Manually trigger reprocessing of an email
 * - Useful if AI analysis failed or was incorrect
 */
POST /api/properties/:propertyId/emails/:emailId/reprocess

/**
 * PUT /api/properties/:propertyId/emails/:emailId/review
 * Mark email as reviewed, optionally override category
 * - For "manual_review" status emails
 */
PUT /api/properties/:propertyId/emails/:emailId/review
```

### 11.6 OCR Strategy

**For MVP (Low Volume):**
```typescript
// Use pdf-parse for PDFs (server-side, no external API)
import pdf from 'pdf-parse'

async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer)
  return data.text
}

// Use Tesseract.js for images (client-side or server-side)
import Tesseract from 'tesseract.js'

async function extractImageText(imageUrl: string): Promise<string> {
  const result = await Tesseract.recognize(imageUrl, 'eng')
  return result.data.text
}
```

**For Scale (High Volume):**
- Google Cloud Vision API
- AWS Textract
- Azure Computer Vision

These provide:
- Better accuracy
- Handwriting recognition
- Table/form extraction
- Document structure analysis

### 11.7 AI Provider Considerations

**Current: Perplexity**
- Good for general reasoning
- Has web search capability (not needed here)
- May be overkill for structured extraction

**Recommended: Add OpenAI or Anthropic**
```typescript
// packages/shared/src/integrations/ai.ts

export class AnthropicClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async analyzeEmail(params: EmailAnalysisParams): Promise<EmailAnalysis> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Fast & cheap for extraction
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: buildEmailAnalysisPrompt(params)
        }]
      })
    })
    // Parse and validate response...
  }
}
```

**Why Claude Haiku for this use case:**
- Very fast (~0.5s response)
- Very cheap (~$0.00025 per email)
- Excellent at structured extraction
- Good at following JSON output format

### 11.8 Email Address Routing

**Address Format:** `prop-{propertyId}@inbound.axori.com`

**Webhook Handler Logic:**
```typescript
// Extract property ID from recipient address
function parsePropertyIdFromEmail(toAddress: string): string | null {
  const match = toAddress.match(/^prop-([a-f0-9-]+)@inbound\.axori\.com$/i)
  return match ? match[1] : null
}

// Validate property exists and user has access
async function validatePropertyAccess(
  propertyId: string,
  fromEmail: string
): Promise<boolean> {
  // Option 1: Allow any email (user forwarded it, so it's intentional)
  // Option 2: Check if fromEmail matches a known contact
  // Option 3: Check if fromEmail is a portfolio member

  // Recommendation: Option 1 for MVP, add allow-listing later
  const property = await db.query.properties.findFirst({
    where: eq(properties.id, propertyId)
  })
  return !!property
}
```

### 11.9 Implementation Phases for Email Processing

#### Phase 6a: Basic Email Ingestion
- Set up Resend inbound domain
- Create webhook endpoint
- Store raw emails in database
- Display in UI (raw, no processing)

#### Phase 6b: Document Extraction
- Implement PDF text extraction
- Implement basic image OCR
- Store extracted text
- Display in email detail view

#### Phase 6c: AI Categorization
- Add Anthropic/OpenAI client
- Implement email analysis prompt
- Auto-categorize incoming emails
- Show AI suggestions in UI

#### Phase 6d: Task Generation
- Create property_tasks table
- Generate tasks from AI suggestions
- Add task review UI
- Connect tasks to communications

#### Phase 6e: Polish & Scale
- Add background job queue
- Implement retry logic
- Add confidence thresholds
- Allow manual corrections that improve AI

### 11.10 Cost Estimation

| Component | Cost per Email | Notes |
|-----------|---------------|-------|
| Resend Inbound | ~$0.001 | Estimate based on outbound pricing |
| Supabase Storage | ~$0.0001 | Attachment storage, minimal |
| Claude Haiku | ~$0.00025 | ~500 input tokens, ~200 output |
| OCR (if cloud) | ~$0.001-0.01 | Varies by provider/complexity |
| **Total MVP** | **~$0.002-0.003** | Per email processed |

At 1,000 emails/month: ~$2-3/month
At 10,000 emails/month: ~$20-30/month

### 11.11 Phase 6f: Abuse Prevention & Rate Limiting

This phase should be implemented **before** or **alongside** Phase 6a. Do not launch email ingestion without these protections.

#### Rate Limiting Strategy

```typescript
// packages/shared/src/security/rate-limiter.ts

interface RateLimitConfig {
  // Per-property limits
  emailsPerPropertyPerHour: number    // Default: 50
  emailsPerPropertyPerDay: number     // Default: 200

  // Per-sender limits (prevents single bad actor)
  emailsPerSenderPerHour: number      // Default: 20
  emailsPerSenderPerDay: number       // Default: 50

  // Global circuit breaker
  totalEmailsPerMinute: number        // Default: 100

  // Attachment limits
  maxAttachmentSizeMB: number         // Default: 25
  maxAttachmentsPerEmail: number      // Default: 10
  maxTotalAttachmentSizeMB: number    // Default: 50
}

interface RateLimitResult {
  allowed: boolean
  reason?: 'property_hourly' | 'property_daily' | 'sender_hourly' |
           'sender_daily' | 'global_limit' | 'attachment_size'
  retryAfterSeconds?: number
  currentCount?: number
  limit?: number
}
```

#### Rate Limit Implementation

```typescript
// Using Redis for distributed rate limiting (recommended)
// Or Supabase + pg for simpler setup

export const emailRateLimits = pgTable(
  "email_rate_limits",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // What we're limiting
    limitType: text("limit_type").notNull(), // "property", "sender", "global"
    limitKey: text("limit_key").notNull(),   // propertyId, senderEmail, or "global"

    // Time window
    windowStart: timestamp("window_start").notNull(),
    windowType: text("window_type").notNull(), // "hour", "day", "minute"

    // Count
    count: integer("count").notNull().default(0),

    // For cleanup
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => ({
    lookupIdx: index("idx_rate_limits_lookup").on(
      table.limitType,
      table.limitKey,
      table.windowType,
      table.windowStart
    ),
    expiresIdx: index("idx_rate_limits_expires").on(table.expiresAt),
  })
)

async function checkRateLimit(
  propertyId: string,
  senderEmail: string,
  attachmentSizes: number[]
): Promise<RateLimitResult> {
  const config = getRateLimitConfig()
  const now = new Date()

  // Check in order of most likely to fail

  // 1. Global circuit breaker (protects entire system)
  const globalCount = await getCount('global', 'global', 'minute', now)
  if (globalCount >= config.totalEmailsPerMinute) {
    await alertOps('Global rate limit triggered - possible attack')
    return { allowed: false, reason: 'global_limit', retryAfterSeconds: 60 }
  }

  // 2. Sender limits (stops individual bad actors)
  const senderHourly = await getCount('sender', senderEmail, 'hour', now)
  if (senderHourly >= config.emailsPerSenderPerHour) {
    return {
      allowed: false,
      reason: 'sender_hourly',
      currentCount: senderHourly,
      limit: config.emailsPerSenderPerHour
    }
  }

  // 3. Property limits (prevents flooding a single property)
  const propertyHourly = await getCount('property', propertyId, 'hour', now)
  if (propertyHourly >= config.emailsPerPropertyPerHour) {
    return {
      allowed: false,
      reason: 'property_hourly',
      currentCount: propertyHourly,
      limit: config.emailsPerPropertyPerHour
    }
  }

  // 4. Attachment size limits
  const totalSize = attachmentSizes.reduce((a, b) => a + b, 0)
  if (totalSize > config.maxTotalAttachmentSizeMB * 1024 * 1024) {
    return { allowed: false, reason: 'attachment_size' }
  }

  // All checks passed - increment counters
  await incrementCounters(propertyId, senderEmail)

  return { allowed: true }
}
```

#### Abuse Detection Patterns

```typescript
// Detect and flag suspicious patterns

interface AbuseSignal {
  type: 'velocity_spike' | 'known_spam_pattern' | 'malformed_address' |
        'suspicious_attachment' | 'repeated_failures' | 'spoofed_sender'
  severity: 'low' | 'medium' | 'high' | 'critical'
  details: Record<string, unknown>
}

async function detectAbuse(email: InboundEmail): Promise<AbuseSignal[]> {
  const signals: AbuseSignal[] = []

  // 1. Velocity spike detection
  const recentCount = await getRecentEmailCount(email.propertyId, '5 minutes')
  if (recentCount > 10) {
    signals.push({
      type: 'velocity_spike',
      severity: 'high',
      details: { count: recentCount, window: '5 minutes' }
    })
  }

  // 2. Known spam patterns in subject/body
  const spamPatterns = [
    /\bcrypto\b.*\binvest/i,
    /\bprince\b.*\bnigeria/i,
    /\bviagra\b/i,
    /\blottery\b.*\bwinner/i,
    // Add more patterns
  ]
  for (const pattern of spamPatterns) {
    if (pattern.test(email.subject || '') || pattern.test(email.textBody || '')) {
      signals.push({
        type: 'known_spam_pattern',
        severity: 'high',
        details: { pattern: pattern.source }
      })
    }
  }

  // 3. Malformed property address (attack attempt)
  if (!isValidUUID(email.toAddress.split('@')[0].replace('prop-', ''))) {
    signals.push({
      type: 'malformed_address',
      severity: 'critical',
      details: { address: email.toAddress }
    })
  }

  // 4. Suspicious attachment types
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.js', '.vbs', '.ps1']
  for (const attachment of email.attachments || []) {
    const ext = attachment.filename.toLowerCase().slice(-4)
    if (dangerousExtensions.some(d => attachment.filename.toLowerCase().endsWith(d))) {
      signals.push({
        type: 'suspicious_attachment',
        severity: 'critical',
        details: { filename: attachment.filename }
      })
    }
  }

  // 5. Sender reputation check (if we have history)
  const senderHistory = await getSenderHistory(email.fromEmail)
  if (senderHistory.failedProcessingRate > 0.5 && senderHistory.totalEmails > 5) {
    signals.push({
      type: 'repeated_failures',
      severity: 'medium',
      details: { failRate: senderHistory.failedProcessingRate }
    })
  }

  return signals
}
```

#### Response to Abuse

```typescript
async function handleAbuseSignals(
  email: InboundEmail,
  signals: AbuseSignal[]
): Promise<'process' | 'quarantine' | 'reject'> {

  // Critical signals = immediate reject
  if (signals.some(s => s.severity === 'critical')) {
    await logSecurityEvent('email_rejected', { email, signals })
    return 'reject'
  }

  // High severity = quarantine for review
  if (signals.some(s => s.severity === 'high')) {
    await quarantineEmail(email, signals)
    await notifySecurityTeam(email, signals)
    return 'quarantine'
  }

  // Medium/low = process but flag
  if (signals.length > 0) {
    await flagEmailForReview(email, signals)
  }

  return 'process'
}
```

#### Quarantine System

```typescript
export const emailQuarantine = pgTable(
  "email_quarantine",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    inboundEmailId: uuid("inbound_email_id").references(() => inboundEmails.id),

    // Why it was quarantined
    reason: text("reason").notNull(),
    signals: jsonb("signals").notNull(), // Array of AbuseSignal

    // Review status
    status: text("status").notNull().default("pending"), // pending, released, deleted
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    reviewNotes: text("review_notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
)
```

---

## 12. Data Security & Privacy Architecture

This section is **non-negotiable** for a property management platform handling sensitive tenant, financial, and legal data.

### 12.1 Data Classification

| Classification | Examples | Handling Requirements |
|---------------|----------|----------------------|
| **Critical** | SSNs, bank account numbers, passwords | Encrypted, never logged, strict access |
| **Sensitive** | Lease terms, rent amounts, tenant names, addresses | Encrypted at rest, audit logged |
| **Internal** | Communication logs, task status, property notes | Standard protection, role-based access |
| **Public** | Property addresses (already public record) | Standard protection |

### 12.2 Multi-Tenancy Isolation

**The #1 security risk**: User A seeing User B's data.

```typescript
// EVERY database query must be scoped to the user's accessible properties

// BAD - No tenant isolation ❌
const communications = await db.query.propertyCommunications.findMany({
  where: eq(propertyCommunications.category, 'maintenance')
})

// GOOD - Properly isolated ✓
const communications = await db.query.propertyCommunications.findMany({
  where: and(
    eq(propertyCommunications.propertyId, propertyId),
    // User must have access to this property
    inArray(propertyCommunications.propertyId, userAccessiblePropertyIds)
  )
})
```

#### Isolation Enforcement Pattern

```typescript
// packages/shared/src/security/tenant-isolation.ts

/**
 * CRITICAL: Use this for ALL property-scoped queries
 * Enforces that users can only access their own properties
 */
export async function withPropertyAccess<T>(
  userId: string,
  propertyId: string,
  operation: () => Promise<T>
): Promise<T> {
  // 1. Verify user has access to this property
  const hasAccess = await verifyPropertyAccess(userId, propertyId)

  if (!hasAccess) {
    await logSecurityEvent('unauthorized_access_attempt', {
      userId,
      propertyId,
      timestamp: new Date(),
    })
    throw new ForbiddenError('Access denied to this property')
  }

  // 2. Execute operation
  return operation()
}

/**
 * Get all property IDs a user can access
 * Used for list queries
 */
export async function getUserPropertyIds(userId: string): Promise<string[]> {
  const portfolioMemberships = await db.query.portfolioMembers.findMany({
    where: eq(portfolioMembers.userId, userId),
    with: {
      portfolio: {
        with: {
          properties: {
            columns: { id: true }
          }
        }
      }
    }
  })

  return portfolioMemberships.flatMap(
    m => m.portfolio.properties.map(p => p.id)
  )
}
```

#### Row-Level Security (RLS) in Supabase

```sql
-- Enable RLS on all sensitive tables
ALTER TABLE property_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_emails ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see communications for properties they have access to
CREATE POLICY "Users can view own property communications"
ON property_communications
FOR SELECT
USING (
  property_id IN (
    SELECT p.id FROM properties p
    JOIN portfolios pf ON p.portfolio_id = pf.id
    JOIN portfolio_members pm ON pf.id = pm.portfolio_id
    WHERE pm.user_id = auth.uid()
  )
);

-- Similar policies for INSERT, UPDATE, DELETE with role checks
```

### 12.3 PII Detection & Handling

```typescript
// packages/shared/src/security/pii-detector.ts

interface PIIMatch {
  type: 'ssn' | 'credit_card' | 'bank_account' | 'phone' | 'email' | 'address'
  value: string      // The matched value
  redacted: string   // Redacted version for logs
  position: { start: number; end: number }
  confidence: number
}

const PII_PATTERNS = {
  ssn: {
    pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    redact: (match: string) => 'XXX-XX-' + match.slice(-4).replace(/-/g, ''),
    confidence: 0.9
  },
  credit_card: {
    pattern: /\b(?:\d{4}[- ]?){3}\d{4}\b/g,
    redact: (match: string) => 'XXXX-XXXX-XXXX-' + match.slice(-4),
    confidence: 0.85
  },
  bank_account: {
    pattern: /\b\d{8,17}\b/g, // Very loose - needs context
    redact: (match: string) => 'XXXXXXXX' + match.slice(-4),
    confidence: 0.5 // Low confidence, needs context
  },
  phone: {
    pattern: /\b(?:\+1[- ]?)?\(?[0-9]{3}\)?[- ]?[0-9]{3}[- ]?[0-9]{4}\b/g,
    redact: (match: string) => '(XXX) XXX-' + match.slice(-4),
    confidence: 0.8
  }
}

export function detectPII(text: string): PIIMatch[] {
  const matches: PIIMatch[] = []

  for (const [type, config] of Object.entries(PII_PATTERNS)) {
    const regex = new RegExp(config.pattern)
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        type: type as PIIMatch['type'],
        value: match[0],
        redacted: config.redact(match[0]),
        position: { start: match.index, end: match.index + match[0].length },
        confidence: config.confidence
      })
    }
  }

  return matches
}

/**
 * Redact PII from text for safe logging
 */
export function redactPII(text: string): string {
  const matches = detectPII(text)
  let redacted = text

  // Replace from end to start to preserve positions
  for (const match of matches.sort((a, b) => b.position.start - a.position.start)) {
    redacted =
      redacted.slice(0, match.position.start) +
      match.redacted +
      redacted.slice(match.position.end)
  }

  return redacted
}
```

#### PII in Email Processing

```typescript
// In the email processing pipeline

async function processInboundEmail(email: RawInboundEmail) {
  // 1. Detect PII in email content
  const bodyPII = detectPII(email.textBody || '')
  const subjectPII = detectPII(email.subject || '')

  // 2. Store PII detection results (but NOT the actual PII values in logs)
  await db.insert(inboundEmails).values({
    ...email,
    piiDetected: bodyPII.length > 0 || subjectPII.length > 0,
    piiTypes: [...new Set([...bodyPII, ...subjectPII].map(p => p.type))],
    // The actual content is stored encrypted (see 12.4)
  })

  // 3. NEVER log PII
  logger.info('Processing email', {
    propertyId: email.propertyId,
    from: redactPII(email.fromEmail), // Redact even email addresses in logs
    subject: redactPII(email.subject || ''),
    piiDetected: bodyPII.length + subjectPII.length,
    // NEVER log: email.textBody, email.htmlBody, attachments
  })

  // 4. If critical PII detected (SSN, credit card), flag for review
  const criticalPII = [...bodyPII, ...subjectPII].filter(
    p => ['ssn', 'credit_card', 'bank_account'].includes(p.type) &&
         p.confidence > 0.7
  )

  if (criticalPII.length > 0) {
    await flagForSecurityReview(email.id, 'critical_pii_detected', criticalPII)
  }
}
```

### 12.4 Encryption Strategy

#### At Rest

```typescript
// All sensitive fields encrypted before storage

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY! // 32 bytes
const ALGORITHM = 'aes-256-gcm'

export function encryptField(plaintext: string): EncryptedField {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    version: 1 // For key rotation
  }
}

export function decryptField(encrypted: EncryptedField): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(encrypted.iv, 'hex')
  )

  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'))

  let decrypted = decipher.update(encrypted.ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

#### Fields to Encrypt

| Table | Encrypted Fields |
|-------|-----------------|
| `inbound_emails` | `text_body`, `html_body`, `raw_headers` |
| `email_attachments` | `ocr_text` (may contain PII from documents) |
| `property_communications` | `content` (full notes/body) |
| `property_contacts` | `phone`, `alternate_phone`, `email`, `address` |

#### In Transit

- All API endpoints over HTTPS only
- Webhook endpoints verify signatures
- Internal service communication over TLS

### 12.5 Audit Logging

```typescript
// packages/shared/src/security/audit.ts

export const securityAuditLog = pgTable(
  "security_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // What happened
    eventType: text("event_type").notNull(),
    eventCategory: text("event_category").notNull(), // auth, data_access, admin, security

    // Who did it
    userId: uuid("user_id").references(() => users.id),
    userEmail: text("user_email"), // Denormalized for deleted users
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    // What was affected
    resourceType: text("resource_type"), // property, communication, contact, etc.
    resourceId: uuid("resource_id"),
    propertyId: uuid("property_id"), // For property-scoped events

    // Details
    details: jsonb("details"), // Additional context (redacted)
    result: text("result").notNull(), // success, failure, blocked

    // Timestamp with high precision
    createdAt: timestamp("created_at", { precision: 6 }).defaultNow().notNull(),
  },
  (table) => ({
    eventTypeIdx: index("idx_audit_event_type").on(table.eventType),
    userIdIdx: index("idx_audit_user_id").on(table.userId),
    resourceIdx: index("idx_audit_resource").on(table.resourceType, table.resourceId),
    createdAtIdx: index("idx_audit_created_at").on(table.createdAt),
  })
)

// Events to log
type AuditEventType =
  // Authentication
  | 'login_success' | 'login_failure' | 'logout' | 'password_reset'
  // Data Access
  | 'view_communication' | 'view_contact' | 'view_email' | 'export_data'
  // Data Modification
  | 'create_communication' | 'update_communication' | 'delete_communication'
  | 'create_contact' | 'update_contact' | 'delete_contact'
  // Admin Actions
  | 'invite_user' | 'remove_user' | 'change_role'
  // Security Events
  | 'unauthorized_access_attempt' | 'rate_limit_exceeded' | 'suspicious_activity'
  | 'pii_detected' | 'email_quarantined' | 'email_rejected'

async function auditLog(event: {
  type: AuditEventType
  category: 'auth' | 'data_access' | 'data_modification' | 'admin' | 'security'
  userId?: string
  resourceType?: string
  resourceId?: string
  propertyId?: string
  details?: Record<string, unknown>
  result: 'success' | 'failure' | 'blocked'
  request?: Request
}) {
  await db.insert(securityAuditLog).values({
    eventType: event.type,
    eventCategory: event.category,
    userId: event.userId,
    userEmail: event.userId ? await getUserEmail(event.userId) : null,
    ipAddress: event.request ? getClientIP(event.request) : null,
    userAgent: event.request?.headers.get('user-agent'),
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    propertyId: event.propertyId,
    details: event.details ? redactPIIFromObject(event.details) : null,
    result: event.result,
  })

  // Critical security events also alert immediately
  if (event.category === 'security' && event.result !== 'success') {
    await alertSecurityTeam(event)
  }
}
```

### 12.6 Data Retention & Deletion

```typescript
// Retention policies by data type

const RETENTION_POLICIES = {
  // Communications kept indefinitely (legal/compliance)
  communications: null, // No auto-delete

  // Inbound emails: raw data can be purged after processing
  inbound_emails_raw: 90, // 90 days, then purge HTML/raw headers
  inbound_emails_processed: null, // Keep processed data indefinitely

  // Audit logs: long retention for compliance
  audit_logs: 365 * 7, // 7 years

  // Rate limit data: short-lived
  rate_limits: 7, // 7 days

  // Quarantined emails: review or auto-delete
  quarantine: 30, // 30 days, then auto-delete if not reviewed
}

// Right to Deletion (GDPR/CCPA)
async function handleDataDeletionRequest(userId: string) {
  // 1. Log the request (this log is NOT deleted)
  await auditLog({
    type: 'data_deletion_request',
    category: 'admin',
    userId,
    result: 'success'
  })

  // 2. Identify all user data
  const userProperties = await getUserPropertyIds(userId)

  // 3. For owned portfolios: anonymize or transfer
  // 4. For shared portfolios: remove membership
  // 5. Delete personal profile data
  // 6. Anonymize audit logs (keep logs, remove PII)

  // NOTE: Some data may be retained for legal compliance
  // Communicate this clearly to the user
}
```

### 12.7 Security Headers & API Protection

```typescript
// apps/api/src/middleware/security.ts

import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { cors } from 'hono/cors'

export function applySecurityMiddleware(app: Hono) {
  // CORS - restrict to known origins
  app.use('*', cors({
    origin: [
      process.env.WEB_URL!,
      process.env.MOBILE_URL!, // If applicable
    ],
    credentials: true,
  }))

  // Security headers
  app.use('*', secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
  }))

  // Request size limits (prevent payload attacks)
  app.use('*', async (c, next) => {
    const contentLength = c.req.header('content-length')
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) { // 50MB max
      return c.json({ error: 'Payload too large' }, 413)
    }
    await next()
  })
}
```

### 12.8 Secrets Management

```typescript
// Environment variables checklist

// REQUIRED - Must be set in production
const REQUIRED_SECRETS = [
  'DATABASE_URL',           // Database connection
  'DATA_ENCRYPTION_KEY',    // 32-byte hex for field encryption
  'CLERK_SECRET_KEY',       // Authentication
  'RESEND_API_KEY',         // Email
  'RESEND_WEBHOOK_SECRET',  // Webhook verification
]

// Validate on startup
function validateSecrets() {
  const missing = REQUIRED_SECRETS.filter(s => !process.env[s])
  if (missing.length > 0) {
    console.error('Missing required secrets:', missing)
    process.exit(1)
  }

  // Validate key lengths
  const encKey = process.env.DATA_ENCRYPTION_KEY!
  if (encKey.length !== 64) { // 32 bytes = 64 hex chars
    console.error('DATA_ENCRYPTION_KEY must be 32 bytes (64 hex characters)')
    process.exit(1)
  }
}

// Key rotation support
// All encrypted fields include a 'version' to support key rotation
```

### 12.9 Compliance Considerations

| Regulation | Relevant Requirements | How We Address |
|------------|----------------------|----------------|
| **GDPR** | Right to access, right to deletion, data minimization | Audit logs, deletion handlers, encrypt PII |
| **CCPA** | Consumer data rights, disclosure requirements | Same as GDPR + California-specific notices |
| **SOC 2** | Security, availability, confidentiality | Audit logging, encryption, access controls |
| **Fair Housing** | Don't discriminate in communications | AI analysis should not use protected characteristics |

### 12.10 Security Implementation Phases

#### Phase 0 (Before any Communications work)
- [ ] Enable RLS on all relevant tables
- [ ] Implement tenant isolation middleware
- [ ] Set up audit logging infrastructure
- [ ] Configure security headers

#### Phase 1-5 (Alongside Communications MVP)
- [ ] Implement field encryption for sensitive data
- [ ] Add PII detection to all text inputs
- [ ] Set up rate limiting (basic)
- [ ] Create security review process for flagged items

#### Phase 6 (Email Processing)
- [ ] Implement full rate limiting with Redis
- [ ] Add abuse detection patterns
- [ ] Create quarantine system
- [ ] Webhook signature verification

#### Phase 7 (Security Hardening)
- [ ] Penetration testing
- [ ] Security audit of AI prompts (prevent prompt injection)
- [ ] Implement key rotation
- [ ] SOC 2 preparation

---

*Document created: January 2026*
*Last updated: January 2026*
