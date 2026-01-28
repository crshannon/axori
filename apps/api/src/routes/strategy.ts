import { Hono } from "hono";
import {
  db,
  properties,
  propertyStrategies,
  brrrrPhases,
  brrrrPhaseHistory,
  rehabScopeItems,
  eq,
  and,
  desc,
} from "@axori/db";
import {
  propertyStrategyInsertApiSchema,
  propertyStrategyUpdateApiSchema,
  brrrrPhaseInsertApiSchema,
  brrrrPhaseTransitionSchema,
  rehabScopeItemInsertApiSchema,
  rehabScopeItemUpdateApiSchema,
  PRIMARY_STRATEGIES,
  EXIT_METHODS,
  HOLD_PERIODS,
  BRRRR_PHASES,
  REHAB_CATEGORIES,
  REHAB_STATUSES,
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
import {
  getAccessiblePropertyIdsForUser,
} from "@axori/permissions";

const strategyRouter = new Hono();

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
 * Convert numeric API values to string format for database
 */
function toDbNumeric(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value.toString();
}

// ============================================================================
// Property Strategy Routes
// ============================================================================

// Get strategy for a property
strategyRouter.get(
  "/property/:propertyId",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");

    await verifyPropertyAccess(userId, propertyId);

    const [strategy] = await db
      .select()
      .from(propertyStrategies)
      .where(eq(propertyStrategies.propertyId, propertyId))
      .limit(1);

    // Also fetch BRRRR phase if strategy is BRRRR
    let brrrrPhase: typeof brrrrPhases.$inferSelect | null = null;
    if (strategy?.primaryStrategy === "brrrr") {
      const [phase] = await db
        .select()
        .from(brrrrPhases)
        .where(eq(brrrrPhases.propertyId, propertyId))
        .limit(1);
      brrrrPhase = phase || null;
    }

    // Fetch rehab items if applicable
    let rehabItems: typeof rehabScopeItems.$inferSelect[] = [];
    if (strategy?.primaryStrategy === "brrrr" || strategy?.primaryStrategy === "value_add" || strategy?.primaryStrategy === "fix_and_flip") {
      rehabItems = await db
        .select()
        .from(rehabScopeItems)
        .where(eq(rehabScopeItems.propertyId, propertyId))
        .orderBy(desc(rehabScopeItems.createdAt));
    }

    return c.json({
      strategy: strategy || null,
      brrrrPhase,
      rehabItems,
    });
  })
);

// Create or update strategy for a property (upsert)
strategyRouter.put(
  "/property/:propertyId",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");
    const body = await c.req.json();

    await verifyPropertyAccess(userId, propertyId);

    // Check if strategy exists
    const [existing] = await db
      .select()
      .from(propertyStrategies)
      .where(eq(propertyStrategies.propertyId, propertyId))
      .limit(1);

    let result;
    if (existing) {
      // Update existing strategy
      const validated = validateData(body, propertyStrategyUpdateApiSchema);

      // Build update object, converting numbers to strings for DB
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (validated.primaryStrategy !== undefined) updateData.primaryStrategy = validated.primaryStrategy;
      if (validated.strategyVariant !== undefined) updateData.strategyVariant = validated.strategyVariant;
      if (validated.holdPeriod !== undefined) updateData.holdPeriod = validated.holdPeriod;
      if (validated.targetExitYear !== undefined) updateData.targetExitYear = validated.targetExitYear;
      if (validated.holdYearsMin !== undefined) updateData.holdYearsMin = validated.holdYearsMin;
      if (validated.holdYearsMax !== undefined) updateData.holdYearsMax = validated.holdYearsMax;
      if (validated.exitMethod !== undefined) updateData.exitMethod = validated.exitMethod;
      if (validated.exitPriceTarget !== undefined) updateData.exitPriceTarget = toDbNumeric(validated.exitPriceTarget);
      if (validated.exitEquityTarget !== undefined) updateData.exitEquityTarget = toDbNumeric(validated.exitEquityTarget);
      if (validated.exitCapRateFloor !== undefined) updateData.exitCapRateFloor = toDbNumeric(validated.exitCapRateFloor);
      if (validated.exitCashFlowFloor !== undefined) updateData.exitCashFlowFloor = toDbNumeric(validated.exitCashFlowFloor);
      if (validated.exitLifeEvent !== undefined) updateData.exitLifeEvent = validated.exitLifeEvent;
      if (validated.is1031Replacement !== undefined) updateData.is1031Replacement = validated.is1031Replacement;
      if (validated.sourcePropertyId !== undefined) updateData.sourcePropertyId = validated.sourcePropertyId;
      if (validated.exchangeDeadline !== undefined) updateData.exchangeDeadline = validated.exchangeDeadline;
      if (validated.identificationDeadline !== undefined) updateData.identificationDeadline = validated.identificationDeadline;
      if (validated.futureRentalIntent !== undefined) updateData.futureRentalIntent = validated.futureRentalIntent;
      if (validated.plannedConversionDate !== undefined) updateData.plannedConversionDate = validated.plannedConversionDate;
      if (validated.targetMonthlyCashFlow !== undefined) updateData.targetMonthlyCashFlow = toDbNumeric(validated.targetMonthlyCashFlow);
      if (validated.targetEquity !== undefined) updateData.targetEquity = toDbNumeric(validated.targetEquity);
      if (validated.targetCashOnCash !== undefined) updateData.targetCashOnCash = toDbNumeric(validated.targetCashOnCash);
      if (validated.targetPayoffDate !== undefined) updateData.targetPayoffDate = validated.targetPayoffDate;
      if (validated.weightFinancialPerformance !== undefined) updateData.weightFinancialPerformance = validated.weightFinancialPerformance;
      if (validated.weightEquityVelocity !== undefined) updateData.weightEquityVelocity = validated.weightEquityVelocity;
      if (validated.weightOperationalHealth !== undefined) updateData.weightOperationalHealth = validated.weightOperationalHealth;
      if (validated.weightMarketPosition !== undefined) updateData.weightMarketPosition = validated.weightMarketPosition;
      if (validated.weightRiskFactors !== undefined) updateData.weightRiskFactors = validated.weightRiskFactors;

      const [updated] = await db
        .update(propertyStrategies)
        .set(updateData)
        .where(eq(propertyStrategies.propertyId, propertyId))
        .returning();

      result = updated;

      // If strategy changed to BRRRR, ensure BRRRR phase exists
      if (validated.primaryStrategy === "brrrr") {
        await initializeBrrrrPhase(propertyId);
      }
    } else {
      // Create new strategy
      const validated = validateData(
        { ...body, propertyId },
        propertyStrategyInsertApiSchema
      );

      const [created] = await db
        .insert(propertyStrategies)
        .values({
          propertyId,
          primaryStrategy: validated.primaryStrategy,
          strategyVariant: validated.strategyVariant,
          holdPeriod: validated.holdPeriod,
          targetExitYear: validated.targetExitYear,
          holdYearsMin: validated.holdYearsMin,
          holdYearsMax: validated.holdYearsMax,
          exitMethod: validated.exitMethod,
          exitPriceTarget: toDbNumeric(validated.exitPriceTarget),
          exitEquityTarget: toDbNumeric(validated.exitEquityTarget),
          exitCapRateFloor: toDbNumeric(validated.exitCapRateFloor),
          exitCashFlowFloor: toDbNumeric(validated.exitCashFlowFloor),
          exitLifeEvent: validated.exitLifeEvent,
          is1031Replacement: validated.is1031Replacement,
          sourcePropertyId: validated.sourcePropertyId,
          exchangeDeadline: validated.exchangeDeadline,
          identificationDeadline: validated.identificationDeadline,
          futureRentalIntent: validated.futureRentalIntent,
          plannedConversionDate: validated.plannedConversionDate,
          targetMonthlyCashFlow: toDbNumeric(validated.targetMonthlyCashFlow),
          targetEquity: toDbNumeric(validated.targetEquity),
          targetCashOnCash: toDbNumeric(validated.targetCashOnCash),
          targetPayoffDate: validated.targetPayoffDate,
          weightFinancialPerformance: validated.weightFinancialPerformance,
          weightEquityVelocity: validated.weightEquityVelocity,
          weightOperationalHealth: validated.weightOperationalHealth,
          weightMarketPosition: validated.weightMarketPosition,
          weightRiskFactors: validated.weightRiskFactors,
        })
        .returning();

      result = created;

      // If strategy is BRRRR, initialize the BRRRR phase tracker
      if (validated.primaryStrategy === "brrrr") {
        await initializeBrrrrPhase(propertyId);
      }
    }

    return c.json({ strategy: result }, existing ? 200 : 201);
  })
);

// Delete strategy for a property
strategyRouter.delete(
  "/property/:propertyId",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");

    await verifyPropertyAccess(userId, propertyId);

    // Delete cascades to brrrrPhases, brrrrPhaseHistory, rehabScopeItems
    await db
      .delete(propertyStrategies)
      .where(eq(propertyStrategies.propertyId, propertyId));

    return c.json({ success: true });
  })
);

// ============================================================================
// BRRRR Phase Routes
// ============================================================================

// Get BRRRR phase for a property
strategyRouter.get(
  "/property/:propertyId/brrrr",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");

    await verifyPropertyAccess(userId, propertyId);

    const [phase] = await db
      .select()
      .from(brrrrPhases)
      .where(eq(brrrrPhases.propertyId, propertyId))
      .limit(1);

    if (!phase) {
      return c.json({ brrrrPhase: null, history: [] });
    }

    // Get phase history
    const history = await db
      .select()
      .from(brrrrPhaseHistory)
      .where(eq(brrrrPhaseHistory.propertyId, propertyId))
      .orderBy(desc(brrrrPhaseHistory.transitionedAt));

    return c.json({ brrrrPhase: phase, history });
  })
);

// Transition BRRRR phase
strategyRouter.post(
  "/property/:propertyId/brrrr/transition",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");
    const body = await c.req.json();

    await verifyPropertyAccess(userId, propertyId);

    const validated = validateData(body, brrrrPhaseTransitionSchema);

    // Get current phase
    const [currentPhase] = await db
      .select()
      .from(brrrrPhases)
      .where(eq(brrrrPhases.propertyId, propertyId))
      .limit(1);

    if (!currentPhase) {
      throw new ApiError("BRRRR tracking not initialized for this property", 404);
    }

    const previousPhase = currentPhase.currentPhase;

    // Validate phase transition is logical
    const phaseOrder = ["acquisition", "rehab", "rent", "refinance", "stabilized"];
    const currentIndex = phaseOrder.indexOf(previousPhase);
    const newIndex = phaseOrder.indexOf(validated.toPhase);

    if (newIndex < currentIndex && !validated.notes?.includes("rollback")) {
      throw new ApiError(
        `Cannot transition from ${previousPhase} to ${validated.toPhase} without rollback note`,
        400
      );
    }

    // Create history record
    await db
      .insert(brrrrPhaseHistory)
      .values({
        propertyId,
        fromPhase: previousPhase,
        toPhase: validated.toPhase,
        notes: validated.notes,
      });

    // Update current phase with new data
    const updateData: Record<string, unknown> = {
      currentPhase: validated.toPhase,
      phaseStartDate: validated.transitionDate || new Date().toISOString().split("T")[0],
      updatedAt: new Date(),
    };

    // Update phase-specific dates and values
    switch (validated.toPhase) {
      case "rehab":
        updateData.rehabStartDate = validated.transitionDate || new Date().toISOString().split("T")[0];
        break;
      case "rent":
        updateData.rehabActualEndDate = validated.transitionDate || new Date().toISOString().split("T")[0];
        break;
      case "refinance":
        updateData.appraisalDate = validated.transitionDate || new Date().toISOString().split("T")[0];
        break;
      case "stabilized":
        updateData.cycleCompleteDate = validated.transitionDate || new Date().toISOString().split("T")[0];
        updateData.refinanceCloseDate = validated.transitionDate || new Date().toISOString().split("T")[0];
        break;
    }

    // Update actual values if provided
    if (validated.actualCost !== undefined && validated.actualCost !== null) {
      updateData.rehabBudgetSpent = toDbNumeric(validated.actualCost);
    }
    if (validated.actualArv !== undefined && validated.actualArv !== null) {
      updateData.appraisalValue = toDbNumeric(validated.actualArv);
    }

    const [updated] = await db
      .update(brrrrPhases)
      .set(updateData)
      .where(eq(brrrrPhases.propertyId, propertyId))
      .returning();

    return c.json({
      brrrrPhase: updated,
      transition: {
        from: previousPhase,
        to: validated.toPhase,
      },
    });
  })
);

// Update BRRRR metrics (without transitioning phase)
strategyRouter.patch(
  "/property/:propertyId/brrrr",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");
    const body = await c.req.json();

    await verifyPropertyAccess(userId, propertyId);

    const [existing] = await db
      .select()
      .from(brrrrPhases)
      .where(eq(brrrrPhases.propertyId, propertyId))
      .limit(1);

    if (!existing) {
      throw new ApiError("BRRRR tracking not initialized for this property", 404);
    }

    // Validate partial update
    const validated = validateData(body, brrrrPhaseInsertApiSchema.partial());

    // Build update object with DB field names
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Map API field names to DB field names
    if (validated.arvEstimate !== undefined) {
      updateData.arvEstimate = toDbNumeric(validated.arvEstimate);
    }
    if (validated.rehabBudget !== undefined) {
      updateData.rehabBudget = toDbNumeric(validated.rehabBudget);
    }
    if (validated.allInCost !== undefined) {
      updateData.allInCost = toDbNumeric(validated.allInCost);
    }
    if (validated.targetEquityCapture !== undefined) {
      updateData.targetEquityCapture = toDbNumeric(validated.targetEquityCapture);
    }
    if (validated.rehabStartDate !== undefined) {
      updateData.rehabStartDate = validated.rehabStartDate;
    }
    if (validated.rehabTargetEndDate !== undefined) {
      updateData.rehabTargetEndDate = validated.rehabTargetEndDate;
    }
    if (validated.rehabActualEndDate !== undefined) {
      updateData.rehabActualEndDate = validated.rehabActualEndDate;
    }
    if (validated.rehabBudgetSpent !== undefined) {
      updateData.rehabBudgetSpent = toDbNumeric(validated.rehabBudgetSpent);
    }
    if (validated.holdingCosts !== undefined) {
      updateData.holdingCosts = toDbNumeric(validated.holdingCosts);
    }
    if (validated.listedDate !== undefined) {
      updateData.listedDate = validated.listedDate;
    }
    if (validated.leasedDate !== undefined) {
      updateData.leasedDate = validated.leasedDate;
    }
    if (validated.achievedRent !== undefined) {
      updateData.achievedRent = toDbNumeric(validated.achievedRent);
    }
    if (validated.marketRentAtLease !== undefined) {
      updateData.marketRentAtLease = toDbNumeric(validated.marketRentAtLease);
    }
    if (validated.appraisalDate !== undefined) {
      updateData.appraisalDate = validated.appraisalDate;
    }
    if (validated.appraisalValue !== undefined) {
      updateData.appraisalValue = toDbNumeric(validated.appraisalValue);
    }
    if (validated.newLoanAmount !== undefined) {
      updateData.newLoanAmount = toDbNumeric(validated.newLoanAmount);
    }
    if (validated.cashOutAmount !== undefined) {
      updateData.cashOutAmount = toDbNumeric(validated.cashOutAmount);
    }
    if (validated.newInterestRate !== undefined) {
      updateData.newInterestRate = toDbNumeric(validated.newInterestRate);
    }
    if (validated.newMonthlyPayment !== undefined) {
      updateData.newMonthlyPayment = toDbNumeric(validated.newMonthlyPayment);
    }
    if (validated.capitalLeftInDeal !== undefined) {
      updateData.capitalLeftInDeal = toDbNumeric(validated.capitalLeftInDeal);
    }
    if (validated.refinanceCloseDate !== undefined) {
      updateData.refinanceCloseDate = validated.refinanceCloseDate;
    }

    const [updated] = await db
      .update(brrrrPhases)
      .set(updateData)
      .where(eq(brrrrPhases.propertyId, propertyId))
      .returning();

    return c.json({ brrrrPhase: updated });
  })
);

// ============================================================================
// Rehab Scope Routes
// ============================================================================

// Get all rehab scope items for a property
strategyRouter.get(
  "/property/:propertyId/rehab-scope",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");

    await verifyPropertyAccess(userId, propertyId);

    const items = await db
      .select()
      .from(rehabScopeItems)
      .where(eq(rehabScopeItems.propertyId, propertyId))
      .orderBy(desc(rehabScopeItems.createdAt));

    // Calculate totals
    let totalEstimated = 0;
    let totalActual = 0;
    const byCategory: Record<string, { estimated: number; actual: number; count: number }> = {};

    for (const item of items) {
      const estimated = parseFloat(item.estimatedCost || "0");
      const actual = parseFloat(item.actualCost || "0");

      totalEstimated += estimated;
      totalActual += actual;

      if (!byCategory[item.category]) {
        byCategory[item.category] = { estimated: 0, actual: 0, count: 0 };
      }
      byCategory[item.category].estimated += estimated;
      byCategory[item.category].actual += actual;
      byCategory[item.category].count++;
    }

    return c.json({
      items,
      totals: {
        estimated: totalEstimated,
        actual: totalActual,
        variance: totalActual - totalEstimated,
      },
      byCategory,
    });
  })
);

// Create a rehab scope item
strategyRouter.post(
  "/property/:propertyId/rehab-scope",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");
    const body = await c.req.json();

    await verifyPropertyAccess(userId, propertyId);

    const validated = validateData(
      { ...body, propertyId },
      rehabScopeItemInsertApiSchema
    );

    const [created] = await db
      .insert(rehabScopeItems)
      .values({
        propertyId,
        category: validated.category,
        description: validated.description,
        estimatedCost: toDbNumeric(validated.estimatedCost) || "0",
        actualCost: toDbNumeric(validated.actualCost),
        status: validated.status || "planned",
        notes: validated.notes,
        contractorName: validated.vendorName,
        completedDate: validated.completedAt,
      })
      .returning();

    return c.json({ item: created }, 201);
  })
);

// Update a rehab scope item
strategyRouter.patch(
  "/property/:propertyId/rehab-scope/:itemId",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");
    const itemId = c.req.param("itemId");
    const body = await c.req.json();

    await verifyPropertyAccess(userId, propertyId);

    // Verify item belongs to this property
    const [existing] = await db
      .select()
      .from(rehabScopeItems)
      .where(and(
        eq(rehabScopeItems.id, itemId),
        eq(rehabScopeItems.propertyId, propertyId)
      ))
      .limit(1);

    if (!existing) {
      throw new ApiError("Rehab scope item not found", 404);
    }

    const validated = validateData(body, rehabScopeItemUpdateApiSchema);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validated.category !== undefined) updateData.category = validated.category;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.estimatedCost !== undefined) updateData.estimatedCost = toDbNumeric(validated.estimatedCost);
    if (validated.actualCost !== undefined) updateData.actualCost = toDbNumeric(validated.actualCost);
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.notes !== undefined) updateData.notes = validated.notes;
    if (validated.vendorName !== undefined) updateData.contractorName = validated.vendorName;
    if (validated.completedAt !== undefined) {
      updateData.completedDate = validated.completedAt;
    }

    const [updated] = await db
      .update(rehabScopeItems)
      .set(updateData)
      .where(eq(rehabScopeItems.id, itemId))
      .returning();

    return c.json({ item: updated });
  })
);

// Delete a rehab scope item
strategyRouter.delete(
  "/property/:propertyId/rehab-scope/:itemId",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const propertyId = c.req.param("propertyId");
    const itemId = c.req.param("itemId");

    await verifyPropertyAccess(userId, propertyId);

    // Verify item belongs to this property
    const [existing] = await db
      .select()
      .from(rehabScopeItems)
      .where(and(
        eq(rehabScopeItems.id, itemId),
        eq(rehabScopeItems.propertyId, propertyId)
      ))
      .limit(1);

    if (!existing) {
      throw new ApiError("Rehab scope item not found", 404);
    }

    await db
      .delete(rehabScopeItems)
      .where(eq(rehabScopeItems.id, itemId));

    return c.json({ success: true });
  })
);

// ============================================================================
// Utility Routes
// ============================================================================

// Get available enum values for forms
strategyRouter.get(
  "/enums",
  requireAuth(),
  withErrorHandling(async (c) => {
    return c.json({
      primaryStrategies: PRIMARY_STRATEGIES,
      exitMethods: EXIT_METHODS,
      holdPeriods: HOLD_PERIODS,
      brrrrPhases: BRRRR_PHASES,
      rehabCategories: REHAB_CATEGORIES,
      rehabStatuses: REHAB_STATUSES,
    });
  })
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Initialize BRRRR phase tracking for a property
 */
async function initializeBrrrrPhase(propertyId: string): Promise<void> {
  // Check if already exists
  const [existing] = await db
    .select()
    .from(brrrrPhases)
    .where(eq(brrrrPhases.propertyId, propertyId))
    .limit(1);

  if (existing) {
    return; // Already initialized
  }

  await db
    .insert(brrrrPhases)
    .values({
      propertyId,
      currentPhase: "acquisition",
    });
}

export default strategyRouter;
