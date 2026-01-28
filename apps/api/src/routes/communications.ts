import { Hono } from "hono";
import {
  db,
  properties,
  propertyCommunications,
  propertyContacts,
  communicationTemplates,
  eq,
  and,
  desc,
  asc,
} from "@axori/db";
import {
  communicationCreateSchema,
  communicationUpdateSchema,
  communicationListQuerySchema,
  contactCreateSchema,
  contactUpdateSchema,
  contactListQuerySchema,
  templateCreateSchema,
  templateUpdateSchema,
  templateListQuerySchema,
} from "@axori/shared/src/validation";
import {
  withErrorHandling,
  validateData,
  ApiError,
} from "../utils/errors";
import {
  requireAuth,
  getAuthenticatedUserId,
} from "../middleware/permissions";
import { getAccessiblePropertyIdsForUser } from "@axori/permissions";

const communicationsRouter = new Hono();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Helper to verify user has access to a property
 */
async function verifyPropertyAccess(userId: string, propertyId: string): Promise<void> {
  const [property] = await db
    .select({ portfolioId: properties.portfolioId })
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1);

  if (!property) {
    throw new ApiError("Property not found", 404);
  }

  const accessiblePropertyIds = await getAccessiblePropertyIdsForUser(
    userId,
    property.portfolioId
  );

  if (!accessiblePropertyIds.includes(propertyId)) {
    throw new ApiError("You don't have access to this property", 403);
  }
}

/**
 * Get user's internal ID from the users table
 */
async function getUserInternalId(userId: string): Promise<string> {
  const { users } = await import("@axori/db");
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  return user.id;
}

// ============================================================================
// Communications Routes
// ============================================================================

// Get all communications for a property
communicationsRouter.get(
  "/property/:propertyId",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");

    await verifyPropertyAccess(userId, propertyId);

    const query = communicationListQuerySchema.parse({
      type: c.req.query("type"),
      direction: c.req.query("direction"),
      category: c.req.query("category"),
      status: c.req.query("status"),
      contactId: c.req.query("contactId"),
      search: c.req.query("search"),
      isPinned: c.req.query("isPinned"),
      startDate: c.req.query("startDate"),
      endDate: c.req.query("endDate"),
      sort: c.req.query("sort"),
      order: c.req.query("order"),
      page: c.req.query("page"),
      limit: c.req.query("limit"),
    });

    // Build conditions
    const conditions = [eq(propertyCommunications.propertyId, propertyId)];

    if (query.type) {
      conditions.push(eq(propertyCommunications.type, query.type));
    }
    if (query.direction) {
      conditions.push(eq(propertyCommunications.direction, query.direction));
    }
    if (query.category) {
      conditions.push(eq(propertyCommunications.category, query.category));
    }
    if (query.status) {
      conditions.push(eq(propertyCommunications.status, query.status));
    }
    if (query.contactId) {
      conditions.push(eq(propertyCommunications.contactId, query.contactId));
    }
    if (query.isPinned !== undefined) {
      conditions.push(eq(propertyCommunications.isPinned, query.isPinned));
    }

    // Base query
    let results = await db
      .select()
      .from(propertyCommunications)
      .where(and(...conditions));

    // Filter by search (in-memory for subject/summary)
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter(
        (comm) =>
          comm.subject.toLowerCase().includes(searchLower) ||
          comm.summary?.toLowerCase().includes(searchLower) ||
          comm.contactName?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by date range
    if (query.startDate) {
      const startDate = new Date(query.startDate);
      results = results.filter((comm) => comm.communicationDate >= startDate);
    }
    if (query.endDate) {
      const endDate = new Date(query.endDate);
      results = results.filter((comm) => comm.communicationDate <= endDate);
    }

    // Sort
    const sortField = query.sort || "communicationDate";
    const sortOrder = query.order || "desc";

    results.sort((a, b) => {
      let aVal: unknown = a[sortField as keyof typeof a];
      let bVal: unknown = b[sortField as keyof typeof b];

      if (aVal instanceof Date) aVal = aVal.getTime();
      if (bVal instanceof Date) bVal = bVal.getTime();

      if (aVal === null) aVal = sortOrder === "asc" ? Infinity : -Infinity;
      if (bVal === null) bVal = sortOrder === "asc" ? Infinity : -Infinity;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;
    const totalCount = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    return c.json({
      communications: paginatedResults,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  })
);

// Get a single communication by ID
communicationsRouter.get(
  "/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");

    const [communication] = await db
      .select()
      .from(propertyCommunications)
      .where(eq(propertyCommunications.id, id))
      .limit(1);

    if (!communication) {
      throw new ApiError("Communication not found", 404);
    }

    await verifyPropertyAccess(userId, communication.propertyId);

    return c.json({ communication });
  })
);

// Create a new communication
communicationsRouter.post(
  "/",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const body = await c.req.json();

    const data = validateData(body, communicationCreateSchema);

    await verifyPropertyAccess(userId, data.propertyId);

    const userInternalId = await getUserInternalId(userId);

    const insertData = {
      propertyId: data.propertyId,
      type: data.type,
      direction: data.direction,
      category: data.category || "general",
      status: data.status || "sent",
      subject: data.subject,
      summary: data.summary,
      content: data.content,
      communicationDate: data.communicationDate ? new Date(data.communicationDate) : new Date(),
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      contactRole: data.contactRole,
      contactId: data.contactId,
      transactionId: data.transactionId,
      deliveryMethod: data.deliveryMethod,
      acknowledgmentRequired: data.acknowledgmentRequired,
      attachmentUrls: data.attachmentUrls,
      tags: data.tags,
      isPinned: data.isPinned,
      createdBy: userInternalId,
      updatedBy: userInternalId,
    } as typeof propertyCommunications.$inferInsert;

    const [newCommunication] = await db
      .insert(propertyCommunications)
      .values(insertData)
      .returning();

    return c.json({ communication: newCommunication }, 201);
  })
);

// Update a communication
communicationsRouter.patch(
  "/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");
    const body = await c.req.json();

    const [existing] = await db
      .select()
      .from(propertyCommunications)
      .where(eq(propertyCommunications.id, id))
      .limit(1);

    if (!existing) {
      throw new ApiError("Communication not found", 404);
    }

    await verifyPropertyAccess(userId, existing.propertyId);

    const data = validateData(body, communicationUpdateSchema);
    const userInternalId = await getUserInternalId(userId);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
      updatedBy: userInternalId,
    };

    if (data.type !== undefined) updateData.type = data.type;
    if (data.direction !== undefined) updateData.direction = data.direction;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.communicationDate !== undefined) updateData.communicationDate = new Date(data.communicationDate);
    if (data.contactName !== undefined) updateData.contactName = data.contactName;
    if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
    if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone;
    if (data.contactRole !== undefined) updateData.contactRole = data.contactRole;
    if (data.contactId !== undefined) updateData.contactId = data.contactId;
    if (data.transactionId !== undefined) updateData.transactionId = data.transactionId;
    if (data.deliveryMethod !== undefined) updateData.deliveryMethod = data.deliveryMethod;
    if (data.acknowledgmentRequired !== undefined) updateData.acknowledgmentRequired = data.acknowledgmentRequired;
    if (data.acknowledgedAt !== undefined) updateData.acknowledgedAt = data.acknowledgedAt ? new Date(data.acknowledgedAt) : null;
    if (data.attachmentUrls !== undefined) updateData.attachmentUrls = data.attachmentUrls;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;

    const [updated] = await db
      .update(propertyCommunications)
      .set(updateData)
      .where(eq(propertyCommunications.id, id))
      .returning();

    return c.json({ communication: updated });
  })
);

// Delete a communication
communicationsRouter.delete(
  "/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");

    const [existing] = await db
      .select()
      .from(propertyCommunications)
      .where(eq(propertyCommunications.id, id))
      .limit(1);

    if (!existing) {
      throw new ApiError("Communication not found", 404);
    }

    await verifyPropertyAccess(userId, existing.propertyId);

    await db
      .delete(propertyCommunications)
      .where(eq(propertyCommunications.id, id));

    return c.json({ success: true });
  })
);

// ============================================================================
// Contacts Routes
// ============================================================================

// Get all contacts for a property
communicationsRouter.get(
  "/property/:propertyId/contacts",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");

    await verifyPropertyAccess(userId, propertyId);

    const query = contactListQuerySchema.parse({
      type: c.req.query("type"),
      isActive: c.req.query("isActive"),
      isPrimary: c.req.query("isPrimary"),
      search: c.req.query("search"),
      sort: c.req.query("sort"),
      order: c.req.query("order"),
      page: c.req.query("page"),
      limit: c.req.query("limit"),
    });

    const conditions = [eq(propertyContacts.propertyId, propertyId)];

    if (query.type) {
      conditions.push(eq(propertyContacts.type, query.type));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(propertyContacts.isActive, query.isActive));
    }
    if (query.isPrimary !== undefined) {
      conditions.push(eq(propertyContacts.isPrimary, query.isPrimary));
    }

    let results = await db
      .select()
      .from(propertyContacts)
      .where(and(...conditions));

    // Filter by search
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchLower) ||
          contact.company?.toLowerCase().includes(searchLower) ||
          contact.email?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    const sortField = query.sort || "name";
    const sortOrder = query.order || "asc";

    results.sort((a, b) => {
      let aVal: unknown = a[sortField as keyof typeof a];
      let bVal: unknown = b[sortField as keyof typeof b];

      if (aVal instanceof Date) aVal = aVal.getTime();
      if (bVal instanceof Date) bVal = bVal.getTime();

      if (aVal === null) aVal = sortOrder === "asc" ? "zzz" : "";
      if (bVal === null) bVal = sortOrder === "asc" ? "zzz" : "";

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 50;
    const offset = (page - 1) * limit;
    const totalCount = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    return c.json({
      contacts: paginatedResults,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  })
);

// Get a single contact by ID
communicationsRouter.get(
  "/contacts/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");

    const [contact] = await db
      .select()
      .from(propertyContacts)
      .where(eq(propertyContacts.id, id))
      .limit(1);

    if (!contact) {
      throw new ApiError("Contact not found", 404);
    }

    await verifyPropertyAccess(userId, contact.propertyId);

    return c.json({ contact });
  })
);

// Create a new contact
communicationsRouter.post(
  "/contacts",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const body = await c.req.json();

    const data = validateData(body, contactCreateSchema);

    await verifyPropertyAccess(userId, data.propertyId);

    const insertData = {
      propertyId: data.propertyId,
      name: data.name,
      company: data.company,
      type: data.type,
      role: data.role,
      email: data.email,
      phone: data.phone,
      alternatePhone: data.alternatePhone,
      preferredContactMethod: data.preferredContactMethod,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      notes: data.notes,
      hoursAvailable: data.hoursAvailable,
      isActive: data.isActive ?? true,
      isPrimary: data.isPrimary ?? false,
    } as typeof propertyContacts.$inferInsert;

    const [newContact] = await db
      .insert(propertyContacts)
      .values(insertData)
      .returning();

    return c.json({ contact: newContact }, 201);
  })
);

// Update a contact
communicationsRouter.patch(
  "/contacts/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");
    const body = await c.req.json();

    const [existing] = await db
      .select()
      .from(propertyContacts)
      .where(eq(propertyContacts.id, id))
      .limit(1);

    if (!existing) {
      throw new ApiError("Contact not found", 404);
    }

    await verifyPropertyAccess(userId, existing.propertyId);

    const data = validateData(body, contactUpdateSchema);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.alternatePhone !== undefined) updateData.alternatePhone = data.alternatePhone;
    if (data.preferredContactMethod !== undefined) updateData.preferredContactMethod = data.preferredContactMethod;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.hoursAvailable !== undefined) updateData.hoursAvailable = data.hoursAvailable;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isPrimary !== undefined) updateData.isPrimary = data.isPrimary;

    const [updated] = await db
      .update(propertyContacts)
      .set(updateData)
      .where(eq(propertyContacts.id, id))
      .returning();

    return c.json({ contact: updated });
  })
);

// Delete a contact
communicationsRouter.delete(
  "/contacts/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");

    const [existing] = await db
      .select()
      .from(propertyContacts)
      .where(eq(propertyContacts.id, id))
      .limit(1);

    if (!existing) {
      throw new ApiError("Contact not found", 404);
    }

    await verifyPropertyAccess(userId, existing.propertyId);

    await db
      .delete(propertyContacts)
      .where(eq(propertyContacts.id, id));

    return c.json({ success: true });
  })
);

// ============================================================================
// Templates Routes (User-level, not property-level)
// ============================================================================

// Get all templates for a user
communicationsRouter.get(
  "/templates",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);

    const query = templateListQuerySchema.parse({
      type: c.req.query("type"),
      category: c.req.query("category"),
      search: c.req.query("search"),
      sort: c.req.query("sort"),
      order: c.req.query("order"),
      page: c.req.query("page"),
      limit: c.req.query("limit"),
    });

    const conditions = [eq(communicationTemplates.userId, userId)];

    if (query.type) {
      conditions.push(eq(communicationTemplates.type, query.type));
    }
    if (query.category) {
      conditions.push(eq(communicationTemplates.category, query.category));
    }

    let results = await db
      .select()
      .from(communicationTemplates)
      .where(and(...conditions));

    // Filter by search
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter(
        (template) =>
          template.name.toLowerCase().includes(searchLower) ||
          template.subject?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    const sortField = query.sort || "name";
    const sortOrder = query.order || "asc";

    results.sort((a, b) => {
      let aVal: unknown = a[sortField as keyof typeof a];
      let bVal: unknown = b[sortField as keyof typeof b];

      if (aVal instanceof Date) aVal = aVal.getTime();
      if (bVal instanceof Date) bVal = bVal.getTime();

      if (aVal === null) aVal = sortOrder === "asc" ? "zzz" : "";
      if (bVal === null) bVal = sortOrder === "asc" ? "zzz" : "";

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 50;
    const offset = (page - 1) * limit;
    const totalCount = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    return c.json({
      templates: paginatedResults,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  })
);

// Get a single template by ID
communicationsRouter.get(
  "/templates/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");

    const [template] = await db
      .select()
      .from(communicationTemplates)
      .where(
        and(
          eq(communicationTemplates.id, id),
          eq(communicationTemplates.userId, userId)
        )
      )
      .limit(1);

    if (!template) {
      throw new ApiError("Template not found", 404);
    }

    return c.json({ template });
  })
);

// Create a new template
communicationsRouter.post(
  "/templates",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const body = await c.req.json();

    const data = validateData(body, templateCreateSchema);

    const insertData = {
      userId,
      name: data.name,
      type: data.type,
      category: data.category || "general",
      subject: data.subject,
      content: data.content,
      isDefault: data.isDefault ?? false,
    } as typeof communicationTemplates.$inferInsert;

    const [newTemplate] = await db
      .insert(communicationTemplates)
      .values(insertData)
      .returning();

    return c.json({ template: newTemplate }, 201);
  })
);

// Update a template
communicationsRouter.patch(
  "/templates/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");
    const body = await c.req.json();

    const [existing] = await db
      .select()
      .from(communicationTemplates)
      .where(
        and(
          eq(communicationTemplates.id, id),
          eq(communicationTemplates.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new ApiError("Template not found", 404);
    }

    const data = validateData(body, templateUpdateSchema);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    const [updated] = await db
      .update(communicationTemplates)
      .set(updateData)
      .where(eq(communicationTemplates.id, id))
      .returning();

    return c.json({ template: updated });
  })
);

// Delete a template
communicationsRouter.delete(
  "/templates/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");

    const [existing] = await db
      .select()
      .from(communicationTemplates)
      .where(
        and(
          eq(communicationTemplates.id, id),
          eq(communicationTemplates.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new ApiError("Template not found", 404);
    }

    await db
      .delete(communicationTemplates)
      .where(eq(communicationTemplates.id, id));

    return c.json({ success: true });
  })
);

// Increment template usage count
communicationsRouter.post(
  "/templates/:id/use",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");

    const [existing] = await db
      .select()
      .from(communicationTemplates)
      .where(
        and(
          eq(communicationTemplates.id, id),
          eq(communicationTemplates.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new ApiError("Template not found", 404);
    }

    const [updated] = await db
      .update(communicationTemplates)
      .set({
        usageCount: (existing.usageCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(communicationTemplates.id, id))
      .returning();

    return c.json({ template: updated });
  })
);

// ============================================================================
// Statistics Routes
// ============================================================================

// Get communication statistics for a property
communicationsRouter.get(
  "/property/:propertyId/stats",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");

    await verifyPropertyAccess(userId, propertyId);

    const communications = await db
      .select()
      .from(propertyCommunications)
      .where(eq(propertyCommunications.propertyId, propertyId));

    const contacts = await db
      .select()
      .from(propertyContacts)
      .where(eq(propertyContacts.propertyId, propertyId));

    // Calculate stats
    const stats = {
      communications: {
        total: communications.length,
        byType: {} as Record<string, number>,
        byDirection: {} as Record<string, number>,
        byCategory: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        pinned: 0,
        requiresAcknowledgment: 0,
        acknowledged: 0,
      },
      contacts: {
        total: contacts.length,
        active: contacts.filter((c) => c.isActive).length,
        byType: {} as Record<string, number>,
        primary: contacts.filter((c) => c.isPrimary).length,
      },
      recentActivity: {
        last7Days: 0,
        last30Days: 0,
      },
    };

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const comm of communications) {
      stats.communications.byType[comm.type] = (stats.communications.byType[comm.type] || 0) + 1;
      stats.communications.byDirection[comm.direction] = (stats.communications.byDirection[comm.direction] || 0) + 1;
      stats.communications.byCategory[comm.category] = (stats.communications.byCategory[comm.category] || 0) + 1;
      stats.communications.byStatus[comm.status] = (stats.communications.byStatus[comm.status] || 0) + 1;

      if (comm.isPinned) stats.communications.pinned++;
      if (comm.acknowledgmentRequired) stats.communications.requiresAcknowledgment++;
      if (comm.acknowledgedAt) stats.communications.acknowledged++;

      if (comm.communicationDate >= sevenDaysAgo) stats.recentActivity.last7Days++;
      if (comm.communicationDate >= thirtyDaysAgo) stats.recentActivity.last30Days++;
    }

    for (const contact of contacts) {
      stats.contacts.byType[contact.type] = (stats.contacts.byType[contact.type] || 0) + 1;
    }

    return c.json({ stats });
  })
);

export default communicationsRouter;
