import { Hono } from "hono";
import {
  db,
  properties,
  propertyBankAccounts,
  eq,
  and,
} from "@axori/db";
import {
  propertyBankAccountCreateSchema,
  propertyBankAccountUpdateSchema,
} from "@axori/shared/src/validation";
import { z } from "zod";
import {
  withErrorHandling,
  validateData,
  ApiError,
} from "../utils/errors";
import {
  requireAuth,
  getAuthenticatedUserId,
} from "../middleware/permissions";
import {
  getAccessiblePropertyIdsForUser,
} from "@axori/permissions";

const bankAccountsRouter = new Hono();

/**
 * Helper to verify user has access to a property
 */
async function verifyPropertyAccess(userId: string, propertyId: string): Promise<void> {
  // Get the property to find its portfolioId
  const [property] = await db
    .select({ portfolioId: properties.portfolioId })
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1);

  if (!property) {
    throw new ApiError("Property not found", 404);
  }

  // Get accessible property IDs for this user
  const accessiblePropertyIds = await getAccessiblePropertyIdsForUser(
    userId,
    property.portfolioId
  );

  if (!accessiblePropertyIds.includes(propertyId)) {
    throw new ApiError("You don't have access to this property", 403);
  }
}

// Get all bank accounts for a property
bankAccountsRouter.get(
  "/property/:propertyId",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");

    await verifyPropertyAccess(userId, propertyId);

    const accounts = await db
      .select()
      .from(propertyBankAccounts)
      .where(
        and(
          eq(propertyBankAccounts.propertyId, propertyId),
          eq(propertyBankAccounts.isActive, true)
        )
      );

    return c.json({ bankAccounts: accounts });
  })
);

// Get a single bank account by ID
bankAccountsRouter.get(
  "/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");

    const [account] = await db
      .select()
      .from(propertyBankAccounts)
      .where(eq(propertyBankAccounts.id, id))
      .limit(1);

    if (!account) {
      throw new ApiError("Bank account not found", 404);
    }

    await verifyPropertyAccess(userId, account.propertyId);

    return c.json({ bankAccount: account });
  })
);

// Create a new bank account (manual entry)
bankAccountsRouter.post(
  "/",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const body = await c.req.json();

    const data = validateData(body, propertyBankAccountCreateSchema);

    await verifyPropertyAccess(userId, data.propertyId);

    // If this is marked as primary, unset any existing primary accounts
    if (data.isPrimary) {
      await db
        .update(propertyBankAccounts)
        .set({ isPrimary: false })
        .where(eq(propertyBankAccounts.propertyId, data.propertyId));
    }

    const insertData = {
      propertyId: data.propertyId,
      accountName: data.accountName,
      accountType: data.accountType,
      institutionName: data.institutionName,
      mask: data.mask,
      currentBalance: data.currentBalance,
      availableBalance: data.availableBalance,
      maintenanceTarget: data.maintenanceTarget,
      capexTarget: data.capexTarget,
      lifeSupportTarget: data.lifeSupportTarget,
      lifeSupportMonths: data.lifeSupportMonths,
      isPrimary: data.isPrimary ?? false,
      isActive: true,
      createdBy: userId,
      lastSynced: new Date(),
    } as typeof propertyBankAccounts.$inferInsert;

    const [newAccount] = await db
      .insert(propertyBankAccounts)
      .values(insertData)
      .returning();

    return c.json({ bankAccount: newAccount }, 201);
  })
);

// Update a bank account
bankAccountsRouter.patch(
  "/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");
    const body = await c.req.json();

    // Get existing account
    const [existing] = await db
      .select()
      .from(propertyBankAccounts)
      .where(eq(propertyBankAccounts.id, id))
      .limit(1);

    if (!existing) {
      throw new ApiError("Bank account not found", 404);
    }

    await verifyPropertyAccess(userId, existing.propertyId);

    const data = validateData({ id, ...body }, propertyBankAccountUpdateSchema);

    // If setting as primary, unset others first
    if (data.isPrimary) {
      await db
        .update(propertyBankAccounts)
        .set({ isPrimary: false })
        .where(
          and(
            eq(propertyBankAccounts.propertyId, existing.propertyId),
            eq(propertyBankAccounts.id, id) // Exclude current one (will be set below)
          )
        );
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.accountName !== undefined) updateData.accountName = data.accountName;
    if (data.accountType !== undefined) updateData.accountType = data.accountType;
    if (data.institutionName !== undefined) updateData.institutionName = data.institutionName;
    if (data.mask !== undefined) updateData.mask = data.mask;
    if (data.currentBalance !== undefined) updateData.currentBalance = data.currentBalance;
    if (data.availableBalance !== undefined) updateData.availableBalance = data.availableBalance;
    if (data.maintenanceTarget !== undefined) updateData.maintenanceTarget = data.maintenanceTarget;
    if (data.capexTarget !== undefined) updateData.capexTarget = data.capexTarget;
    if (data.lifeSupportTarget !== undefined) updateData.lifeSupportTarget = data.lifeSupportTarget;
    if (data.lifeSupportMonths !== undefined) updateData.lifeSupportMonths = data.lifeSupportMonths;
    if (data.isPrimary !== undefined) updateData.isPrimary = data.isPrimary;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // If balance was updated, update lastSynced
    if (data.currentBalance !== undefined || data.availableBalance !== undefined) {
      updateData.lastSynced = new Date();
    }

    const [updated] = await db
      .update(propertyBankAccounts)
      .set(updateData)
      .where(eq(propertyBankAccounts.id, id))
      .returning();

    return c.json({ bankAccount: updated });
  })
);

// Soft delete (deactivate) a bank account
bankAccountsRouter.delete(
  "/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");

    // Get existing account
    const [existing] = await db
      .select()
      .from(propertyBankAccounts)
      .where(eq(propertyBankAccounts.id, id))
      .limit(1);

    if (!existing) {
      throw new ApiError("Bank account not found", 404);
    }

    await verifyPropertyAccess(userId, existing.propertyId);

    // Soft delete - set isActive to false
    const [updated] = await db
      .update(propertyBankAccounts)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(propertyBankAccounts.id, id))
      .returning();

    return c.json({ bankAccount: updated });
  })
);

// Update balance (manual sync)
bankAccountsRouter.patch(
  "/:id/balance",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");
    const body = await c.req.json();

    // Get existing account
    const [existing] = await db
      .select()
      .from(propertyBankAccounts)
      .where(eq(propertyBankAccounts.id, id))
      .limit(1);

    if (!existing) {
      throw new ApiError("Bank account not found", 404);
    }

    await verifyPropertyAccess(userId, existing.propertyId);

    const balanceSchema = z.object({
      currentBalance: z.union([z.string(), z.number()]).optional().nullable(),
      availableBalance: z.union([z.string(), z.number()]).optional().nullable(),
    });

    const data = validateData(body, balanceSchema);

    const [updated] = await db
      .update(propertyBankAccounts)
      .set({
        currentBalance: data.currentBalance !== undefined
          ? String(data.currentBalance)
          : existing.currentBalance,
        availableBalance: data.availableBalance !== undefined
          ? String(data.availableBalance)
          : existing.availableBalance,
        lastSynced: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(propertyBankAccounts.id, id))
      .returning();

    return c.json({ bankAccount: updated });
  })
);

// Update allocation targets
bankAccountsRouter.patch(
  "/:id/allocations",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const id = c.req.param("id");
    const body = await c.req.json();

    // Get existing account
    const [existing] = await db
      .select()
      .from(propertyBankAccounts)
      .where(eq(propertyBankAccounts.id, id))
      .limit(1);

    if (!existing) {
      throw new ApiError("Bank account not found", 404);
    }

    await verifyPropertyAccess(userId, existing.propertyId);

    const allocationSchema = z.object({
      maintenanceTarget: z.union([z.string(), z.number()]).optional(),
      capexTarget: z.union([z.string(), z.number()]).optional(),
      lifeSupportTarget: z.union([z.string(), z.number()]).optional(),
      lifeSupportMonths: z.number().int().min(1).max(24).optional().nullable(),
    });

    const data = validateData(body, allocationSchema);

    const [updated] = await db
      .update(propertyBankAccounts)
      .set({
        maintenanceTarget: data.maintenanceTarget !== undefined
          ? String(data.maintenanceTarget)
          : existing.maintenanceTarget,
        capexTarget: data.capexTarget !== undefined
          ? String(data.capexTarget)
          : existing.capexTarget,
        lifeSupportTarget: data.lifeSupportTarget !== undefined
          ? String(data.lifeSupportTarget)
          : existing.lifeSupportTarget,
        lifeSupportMonths: data.lifeSupportMonths ?? existing.lifeSupportMonths,
        updatedAt: new Date(),
      })
      .where(eq(propertyBankAccounts.id, id))
      .returning();

    return c.json({ bankAccount: updated });
  })
);

export default bankAccountsRouter;
