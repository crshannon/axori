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

*Document created: January 2026*
*Last updated: January 2026*
