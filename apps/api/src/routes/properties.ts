import { Hono } from "hono";
import {
  db,
  properties,
  propertyCharacteristics,
  propertyValuation,
  propertyAcquisition,
  propertyRentalIncome,
  propertyOperatingExpenses,
  propertyManagement,
  loans,
  propertyTransactions,
  propertyDepreciation,
  propertyImprovements,
  costSegregationStudies,
  annualDepreciationRecords,
  users,
  userPortfolios,
  eq,
  and,
  desc,
} from "@axori/db";
import { gte, lte, sql } from "drizzle-orm";
import {
  propertyInsertSchema,
  propertyUpdateSchema,
  propertyCharacteristicsInsertSchema,
  propertyValuationInsertSchema,
  propertyRentalIncomeInsertSchema,
  propertyOperatingExpensesInsertSchema,
  propertyManagementInsertSchema,
  // Use enhanced schemas for API validation
  loanInsertApiSchema,
  loanUpdateApiSchema,
  propertyAcquisitionInsertApiSchema,
  propertyTransactionInsertApiSchema,
  propertyTransactionUpdateApiSchema,
} from "@axori/shared/src/validation";
import { RentcastClient } from "@axori/shared/src/integrations/rentcast";
import { transformRentcastToAxori } from "@axori/shared/src/integrations/data-transformers";
import { z } from "zod";
import {
  withErrorHandling,
  validateData,
  handleError,
} from "../utils/errors";
import {
  withPermission,
  requireAuth,
  getAuthenticatedUserId,
  getUserFromRequest,
} from "../middleware/permissions";
import {
  getAccessiblePropertyIdsForUser,
  canViewProperty,
  canEditProperty,
  canDeleteProperty,
  getUserPortfolioMembership,
} from "@axori/permissions";

const propertiesRouter = new Hono();

// Get all properties (filter by portfolio and/or status if provided)
// Excludes archived properties by default (soft delete)
// Protected: Only returns properties the user has access to
propertiesRouter.get(
  "/",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const portfolioId = c.req.query("portfolioId");
    const status = c.req.query("status");
    const includeArchived = c.req.query("includeArchived") === "true";

    // Check if portfolioId is a valid UUID format
    const isValidPortfolioId = portfolioId && portfolioId.trim() !== "" && portfolioId.length > 10;

    if (isValidPortfolioId) {
      // Get accessible property IDs for this user in this portfolio
      const accessiblePropertyIds = await getAccessiblePropertyIdsForUser(userId, portfolioId);

      if (accessiblePropertyIds.length === 0) {
        return c.json({ properties: [] });
      }

      // Filter by accessible properties
      const allProperties = await db
        .select()
        .from(properties)
        .where(eq(properties.portfolioId, portfolioId));

      // Filter to only accessible properties
      let filtered = allProperties.filter((p) =>
        accessiblePropertyIds.includes(p.id)
      );

      if (status) {
        filtered = filtered.filter((p) => p.status === status);
      } else if (!includeArchived) {
        filtered = filtered.filter((p) => p.status !== "archived");
      }

      // Sort by most recent first
      filtered.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });

      return c.json({ properties: filtered });
    } else {
      // Get all portfolios user has access to
      const userPortfoliosList = await db
        .select({ portfolioId: userPortfolios.portfolioId })
        .from(userPortfolios)
        .where(eq(userPortfolios.userId, userId));

      if (userPortfoliosList.length === 0) {
        return c.json({ properties: [] });
      }

      const portfolioIds = userPortfoliosList.map((up) => up.portfolioId);

      // Get all properties from these portfolios
      const allProperties = await db.select().from(properties);

      // Filter to portfolios user has access to
      let filtered = allProperties.filter((p) =>
        portfolioIds.includes(p.portfolioId)
      );

      if (status) {
        filtered = filtered.filter((p) => p.status === status);
      } else if (!includeArchived) {
        filtered = filtered.filter((p) => p.status !== "archived");
      }

      // Sort by most recent first
      filtered.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });

      return c.json({ properties: filtered });
    }
  }, { operation: "listProperties" })
);

// Fetch or update Rentcast data for a property
// GET /api/properties/:id/rentcast-data
// Checks cache (1 week old) and fetches from Rentcast if needed
// In local environment (NODE_ENV=local), returns mock data instead of making API calls
// NOTE: This must come before /:id route to avoid route matching conflicts
// Protected: Requires view permission on the property
propertiesRouter.get(
  "/:id/rentcast-data",
  withPermission({ propertyPermission: "view", propertyIdParam: "id" }),
  async (c) => {
    const id = c.req.param("id");
    const isLocal = process.env.NODE_ENV === "local";
    const apiKey = process.env.RENTCAST_API_KEY;

    if (!apiKey) {
      return c.json({ error: "Rentcast API key not configured" }, 500);
    }

    // Get property
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);

  if (!property) {
    return c.json({ error: "Property not found" }, 404);
  }

  // Check if we have cached data that's less than 1 week old
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  if (
    property.rentcastData &&
    typeof property.rentcastData === 'string' &&
    property.rentcastData !== 'undefined' &&
    property.rentcastFetchedAt &&
    new Date(property.rentcastFetchedAt) > oneWeekAgo
  ) {
    // Return cached data
    try {
      return c.json({
        data: JSON.parse(property.rentcastData),
        cached: true,
        fetchedAt: property.rentcastFetchedAt,
      });
    } catch (error) {
      // If parsing fails, fall through to fetch fresh data
      console.error('Error parsing cached rentcast data:', error);
    }
  }

  // In local mode, return mock data instead of making API calls
  if (isLocal) {
    try {
      // Import mock data directly as TypeScript module for type safety
      const { mockRentcastPropertyRecord: mockData } = await import(
        "@axori/shared/src/mocks/rentcast-property-record"
      );

      // Transform Rentcast data into Axori schema
      const { propertyData, metadata } = transformRentcastToAxori(mockData);

      // Store mock data in database for consistency
      await db
        .update(properties)
        .set({
          rentcastData: JSON.stringify(mockData),
          rentcastFetchedAt: new Date(),
          updatedAt: new Date(),
        })
      .where(eq(properties.id, id));

      // Save Rentcast data to property_characteristics (upsert)
      const [existingCharacteristics] = await db
        .select()
        .from(propertyCharacteristics)
        .where(eq(propertyCharacteristics.propertyId, id))
        .limit(1);

      // propertyType is required, bathrooms is numeric (string), others are integer (number)
      const characteristicsData = {
        propertyId: id,
        propertyType: propertyData.propertyType || "Single Family",
        bedrooms: propertyData.bedrooms ?? undefined,
        bathrooms: propertyData.bathrooms != null ? String(propertyData.bathrooms) : undefined,
        squareFeet: propertyData.squareFootage ?? undefined,
        lotSizeSqft: propertyData.lotSize ?? undefined,
        yearBuilt: propertyData.yearBuilt ?? undefined,
        rentcastPropertyId: mockData.id ?? undefined,
      };

      if (existingCharacteristics) {
        await db
          .update(propertyCharacteristics)
          .set({ ...characteristicsData, updatedAt: new Date() })
          .where(eq(propertyCharacteristics.propertyId, id));
      } else {
        await db
          .insert(propertyCharacteristics)
          .values(characteristicsData);
      }

      console.log(
        `[MOCK MODE] Returning mock Rentcast data for property ${id}`
      );

      return c.json({
        data: mockData,
        transformed: propertyData,
        metadata,
        cached: false,
        fetchedAt: new Date().toISOString(),
        mock: true, // Indicate this is mock data
      });
    } catch (error: any) {
      console.error("Error loading mock Rentcast data:", error);
      return c.json(
        { error: "Failed to load mock Rentcast data", details: error.message },
        500
      );
    }
  }

  // Production mode: fetch from real Rentcast API
  if (!apiKey) {
    return c.json({ error: "Rentcast API key not configured" }, 500);
  }

  try {
    const rentcastClient = new RentcastClient(apiKey);
    const rentcastData = await rentcastClient.getPropertyDetails(
      property.address,
      property.city,
      property.state,
      property.zipCode
    );

    // Transform Rentcast data into Axori schema
    const { propertyData, metadata } = transformRentcastToAxori(rentcastData);

    // Update property with transformed data + store raw response for caching
    await db
      .update(properties)
      .set({
        rentcastData: JSON.stringify(rentcastData), // Store raw response
        rentcastFetchedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id));

    // Save Rentcast data to property_characteristics (upsert)
    const [existingCharacteristics] = await db
      .select()
      .from(propertyCharacteristics)
      .where(eq(propertyCharacteristics.propertyId, id))
      .limit(1);

    // propertyType is required, so we need a default if missing
    // propertyType is required, bathrooms is numeric (string), others are integer (number)
    const characteristicsData = {
      propertyId: id,
      propertyType: propertyData.propertyType || "Single Family",
      bedrooms: propertyData.bedrooms ?? undefined,
      bathrooms: propertyData.bathrooms != null ? String(propertyData.bathrooms) : undefined,
      squareFeet: propertyData.squareFootage ?? undefined,
      lotSizeSqft: propertyData.lotSize ?? undefined,
      yearBuilt: propertyData.yearBuilt ?? undefined,
      rentcastPropertyId: rentcastData.id ?? undefined,
    };

    if (existingCharacteristics) {
      await db
        .update(propertyCharacteristics)
        .set({ ...characteristicsData, updatedAt: new Date() })
        .where(eq(propertyCharacteristics.propertyId, id));
    } else {
      await db
        .insert(propertyCharacteristics)
        .values(characteristicsData);
    }

    return c.json({
      data: rentcastData, // Return raw response
      transformed: propertyData, // Also return transformed data
      metadata, // Include metadata
      cached: false,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching Rentcast data:", error);
    return c.json(
      { error: "Failed to fetch property data from Rentcast", details: error.message },
      500
    );
  }
  }
);

// Get single property by ID (with all normalized data joined)
// Protected: Requires view permission on the property
propertiesRouter.get(
  "/:id",
  withPermission({ propertyPermission: "view", propertyIdParam: "id" }),
  withErrorHandling(async (c) => {
    const id = c.req.param("id");

    // Get property
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);

    if (!property) {
      return c.json({ error: "Property not found" }, 404);
    }

    // Join all normalized tables
    const [characteristics] = await db
      .select()
      .from(propertyCharacteristics)
      .where(eq(propertyCharacteristics.propertyId, id))
      .limit(1);

  const [valuation] = await db
    .select()
    .from(propertyValuation)
    .where(eq(propertyValuation.propertyId, id))
    .limit(1);

  const [acquisition] = await db
    .select()
    .from(propertyAcquisition)
    .where(eq(propertyAcquisition.propertyId, id))
    .limit(1);

  const [rentalIncome] = await db
    .select()
    .from(propertyRentalIncome)
    .where(eq(propertyRentalIncome.propertyId, id))
    .limit(1);

  const [operatingExpenses] = await db
    .select()
    .from(propertyOperatingExpenses)
    .where(eq(propertyOperatingExpenses.propertyId, id))
    .limit(1);

  const [management] = await db
    .select()
    .from(propertyManagement)
    .where(eq(propertyManagement.propertyId, id))
    .limit(1);

  // Get all active loans for the property (not just primary)
  const propertyLoans = await db
    .select()
    .from(loans)
    .where(and(
      eq(loans.propertyId, id),
      eq(loans.status, "active")
    ));

    // Return property with all normalized data
    return c.json({
      property: {
        ...property,
        characteristics: characteristics || null,
        valuation: valuation || null,
        acquisition: acquisition || null,
        rentalIncome: rentalIncome || null,
        operatingExpenses: operatingExpenses || null,
        management: management || null,
        loans: propertyLoans || [], // Return all active loans
      },
    });
  }, { operation: "getProperty" })
);

// Create new property (draft or active)
// Protected: Requires add_properties permission on the portfolio
propertiesRouter.post(
  "/",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const body = await c.req.json();

    // Portfolio ID is required for permission check
    if (!body.portfolioId) {
      return c.json({ error: "Portfolio ID is required" }, 400);
    }

    // Check if user has permission to add properties to this portfolio
    const membership = await getUserPortfolioMembership(userId, body.portfolioId);
    if (!membership) {
      return c.json({ error: "You don't have access to this portfolio" }, 403);
    }

    // Members and above can add properties
    const canAdd = ["owner", "admin", "member"].includes(membership.role);
    if (!canAdd) {
      return c.json({ error: "You don't have permission to add properties to this portfolio" }, 403);
    }

    // Use validateData wrapper for consistent error logging
    const validated = validateData(body, propertyInsertSchema as { parse: typeof propertyInsertSchema.parse }, {
      operation: "createProperty",
    });

    const [property] = await db
      .insert(properties)
      .values({
        ...validated,
        userId: userId, // Set the owner to the current user
        addedBy: userId, // Set addedBy to current user
        status: validated.status || "draft",
      })
      .returning();

    return c.json({ property }, 201);
  }, { operation: "createProperty" })
);

// Update existing property (used for draft updates and finalizing)
// Accepts property core data + optional normalized table data
// Protected: Requires edit permission on the property
propertiesRouter.put(
  "/:id",
  withPermission({ propertyPermission: "edit", propertyIdParam: "id" }),
  async (c) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();

      // Separate core property data from normalized data
      const {
        characteristics,
        valuation,
        acquisition,
        rentalIncome,
        operatingExpenses,
        management,
        loan,
        ...propertyData
      } = body;

      // Validate and update core property data
      const validated = propertyUpdateSchema.parse({ ...propertyData, id });

      const [updated] = await db
        .update(properties)
        .set({
          ...validated,
          updatedAt: new Date(),
        })
        .where(eq(properties.id, id))
        .returning();

      if (!updated) {
        return c.json({ error: "Property not found" }, 404);
      }

    // Update or insert characteristics
    if (characteristics) {
      const characteristicsData = propertyCharacteristicsInsertSchema.parse({
        propertyId: id,
        ...characteristics,
      });

      // Check if record exists
      const [existing] = await db
        .select()
        .from(propertyCharacteristics)
        .where(eq(propertyCharacteristics.propertyId, id))
        .limit(1);

      // Convert null to undefined and ensure propertyType is present (required field)
      // bathrooms is numeric (string), others are integer (number)
      // Note: Zod schema may have different field names (lotSize vs lotSizeSqft)
      const characteristicsDataForDb: {
        propertyId: string;
        propertyType: string;
        bedrooms?: number;
        bathrooms?: string;
        squareFeet?: number;
        lotSizeSqft?: number;
        yearBuilt?: number;
        rentcastPropertyId?: string;
        [key: string]: unknown;
      } = {
        propertyId: id,
        propertyType: characteristicsData.propertyType || "Single Family",
      };
      if (characteristicsData.bedrooms != null) characteristicsDataForDb.bedrooms = characteristicsData.bedrooms;
      if (characteristicsData.bathrooms != null) characteristicsDataForDb.bathrooms = String(characteristicsData.bathrooms);
      if (characteristicsData.squareFeet != null) characteristicsDataForDb.squareFeet = characteristicsData.squareFeet;
      // Handle both lotSize (from Zod) and lotSizeSqft (database field)
      const lotSize = (characteristicsData as { lotSize?: number; lotSizeSqft?: number }).lotSize ?? (characteristicsData as { lotSize?: number; lotSizeSqft?: number }).lotSizeSqft;
      if (lotSize != null) characteristicsDataForDb.lotSizeSqft = lotSize;
      if (characteristicsData.yearBuilt != null) characteristicsDataForDb.yearBuilt = characteristicsData.yearBuilt;
      // Note: rentcastPropertyId is not in the base schema - skip if present
      // TODO: Add rentcastPropertyId to propertyCharacteristics schema if needed

      if (existing) {
        await db
          .update(propertyCharacteristics)
          .set({ ...characteristicsDataForDb, updatedAt: new Date() })
          .where(eq(propertyCharacteristics.propertyId, id));
      } else {
        await db.insert(propertyCharacteristics).values(characteristicsDataForDb);
      }
    }

    // Update or insert valuation
    if (valuation) {
      const valuationData = propertyValuationInsertSchema.parse({
        propertyId: id,
        ...valuation,
      });

      const [existing] = await db
        .select()
        .from(propertyValuation)
        .where(eq(propertyValuation.propertyId, id))
        .limit(1);

      if (existing) {
        await db
          .update(propertyValuation)
          .set({ ...valuationData, updatedAt: new Date() })
          .where(eq(propertyValuation.propertyId, id));
      } else {
        await db.insert(propertyValuation).values(valuationData);
      }
    }

    // Update or insert acquisition
    if (acquisition) {
      // Use enhanced API schema that accepts numbers (converts to strings for DB)
      const acquisitionData = propertyAcquisitionInsertApiSchema.parse({
        propertyId: id,
        ...acquisition,
      });

      const [existing] = await db
        .select()
        .from(propertyAcquisition)
        .where(eq(propertyAcquisition.propertyId, id))
        .limit(1);

      // Convert Date objects to strings and numbers to strings for numeric database columns
      const acquisitionDataForDb: Record<string, unknown> = {
        propertyId: acquisitionData.propertyId,
      };

      // Convert dates (base schema validates as strings)
      if (acquisitionData.purchaseDate != null) {
        acquisitionDataForDb.purchaseDate = typeof acquisitionData.purchaseDate === 'string'
          ? acquisitionData.purchaseDate
          : String(acquisitionData.purchaseDate);
      }
      // Note: closingDate is not in the base schema - skip if present
      // TODO: Add closingDate to propertyAcquisition schema if needed

      // Convert numeric fields to strings for database (numeric columns in DB)
      if (acquisitionData.purchasePrice != null) {
        acquisitionDataForDb.purchasePrice = String(acquisitionData.purchasePrice);
      }
      if (acquisitionData.closingCostsTotal != null) {
        acquisitionDataForDb.closingCostsTotal = String(acquisitionData.closingCostsTotal);
      }
      if (acquisitionData.downPaymentAmount != null) {
        acquisitionDataForDb.downPaymentAmount = String(acquisitionData.downPaymentAmount);
      }
      if (acquisitionData.earnestMoney != null) {
        acquisitionDataForDb.earnestMoney = String(acquisitionData.earnestMoney);
      }
      if (acquisitionData.sellerCredits != null) {
        acquisitionDataForDb.sellerCredits = String(acquisitionData.sellerCredits);
      }
      if (acquisitionData.buyerAgentCommission != null) {
        acquisitionDataForDb.buyerAgentCommission = String(acquisitionData.buyerAgentCommission);
      }

      // Copy other string/text fields as-is
      if (acquisitionData.acquisitionMethod != null) {
        acquisitionDataForDb.acquisitionMethod = acquisitionData.acquisitionMethod;
      }
      if (acquisitionData.downPaymentSource != null) {
        acquisitionDataForDb.downPaymentSource = acquisitionData.downPaymentSource;
      }
      // Note: taxParcelId is not in the base schema - skip if present
      // TODO: Add taxParcelId to propertyAcquisition schema if needed

      if (existing) {
        await db
          .update(propertyAcquisition)
          .set({ ...acquisitionDataForDb, updatedAt: new Date() } as typeof propertyAcquisition.$inferInsert)
          .where(eq(propertyAcquisition.propertyId, id));
      } else {
        await db.insert(propertyAcquisition).values(acquisitionDataForDb as typeof propertyAcquisition.$inferInsert);
      }
    }

    // Update or insert rental income
    if (rentalIncome) {
      const rentalIncomeData = propertyRentalIncomeInsertSchema.parse({
        propertyId: id,
        ...rentalIncome,
      });

      const [existing] = await db
        .select()
        .from(propertyRentalIncome)
        .where(eq(propertyRentalIncome.propertyId, id))
        .limit(1);

      if (existing) {
        await db
          .update(propertyRentalIncome)
          .set({ ...rentalIncomeData, updatedAt: new Date() })
          .where(eq(propertyRentalIncome.propertyId, id));
      } else {
        await db.insert(propertyRentalIncome).values(rentalIncomeData);
      }
    }

    // Update or insert operating expenses
    if (operatingExpenses) {
      // Convert numbers to strings before validation (schema expects strings)
      const preprocessedOperatingExpenses: Record<string, unknown> = {
        propertyId: id,
      };

      // Convert all numeric fields to strings
      const numericFields = [
        'vacancyRate',
        'managementRate',
        'maintenanceRate',
        'capexRate',
        'propertyTaxAnnual',
        'insuranceAnnual',
        'hoaMonthly',
        'waterSewerMonthly',
        'trashMonthly',
        'electricMonthly',
        'gasMonthly',
        'internetMonthly',
        'lawnCareMonthly',
        'snowRemovalMonthly',
        'pestControlMonthly',
        'poolMaintenanceMonthly',
        'alarmMonitoringMonthly',
        'otherExpensesMonthly',
        'managementFlatFee',
      ];

      for (const [key, value] of Object.entries(operatingExpenses)) {
        if (value != null) {
          if (numericFields.includes(key) && typeof value === 'number') {
            preprocessedOperatingExpenses[key] = String(value);
          } else {
            preprocessedOperatingExpenses[key] = value;
          }
        }
      }

      const operatingExpensesData = propertyOperatingExpensesInsertSchema.parse(
        preprocessedOperatingExpenses,
      );

      const [existing] = await db
        .select()
        .from(propertyOperatingExpenses)
        .where(eq(propertyOperatingExpenses.propertyId, id))
        .limit(1);

      // Convert numbers to strings for numeric database columns
      // Note: Base schema uses different field names than legacy code
      const operatingExpensesDataForDb: Record<string, unknown> = {
        propertyId: id, // Use id from route param, not from validated data
      };

      // Convert all numeric fields to strings (matching base schema field names)
      if (operatingExpensesData.vacancyRate != null) {
        operatingExpensesDataForDb.vacancyRate = String(operatingExpensesData.vacancyRate);
      }
      if (operatingExpensesData.managementRate != null) {
        operatingExpensesDataForDb.managementRate = String(operatingExpensesData.managementRate);
      }
      if (operatingExpensesData.maintenanceRate != null) {
        operatingExpensesDataForDb.maintenanceRate = String(operatingExpensesData.maintenanceRate);
      }
      if (operatingExpensesData.capexRate != null) {
        operatingExpensesDataForDb.capexRate = String(operatingExpensesData.capexRate);
      }
      if (operatingExpensesData.propertyTaxAnnual != null) {
        operatingExpensesDataForDb.propertyTaxAnnual = String(operatingExpensesData.propertyTaxAnnual);
      }
      if (operatingExpensesData.insuranceAnnual != null) {
        operatingExpensesDataForDb.insuranceAnnual = String(operatingExpensesData.insuranceAnnual);
      }
      if (operatingExpensesData.hoaMonthly != null) {
        operatingExpensesDataForDb.hoaMonthly = String(operatingExpensesData.hoaMonthly);
      }
      if (operatingExpensesData.waterSewerMonthly != null) {
        operatingExpensesDataForDb.waterSewerMonthly = String(operatingExpensesData.waterSewerMonthly);
      }
      if (operatingExpensesData.trashMonthly != null) {
        operatingExpensesDataForDb.trashMonthly = String(operatingExpensesData.trashMonthly);
      }
      if (operatingExpensesData.electricMonthly != null) {
        operatingExpensesDataForDb.electricMonthly = String(operatingExpensesData.electricMonthly);
      }
      if (operatingExpensesData.gasMonthly != null) {
        operatingExpensesDataForDb.gasMonthly = String(operatingExpensesData.gasMonthly);
      }
      if (operatingExpensesData.internetMonthly != null) {
        operatingExpensesDataForDb.internetMonthly = String(operatingExpensesData.internetMonthly);
      }
      if (operatingExpensesData.managementFlatFee != null) {
        operatingExpensesDataForDb.managementFlatFee = String(operatingExpensesData.managementFlatFee);
      }
      if (operatingExpensesData.lawnCareMonthly != null) {
        operatingExpensesDataForDb.lawnCareMonthly = String(operatingExpensesData.lawnCareMonthly);
      }
      if (operatingExpensesData.snowRemovalMonthly != null) {
        operatingExpensesDataForDb.snowRemovalMonthly = String(operatingExpensesData.snowRemovalMonthly);
      }
      if (operatingExpensesData.pestControlMonthly != null) {
        operatingExpensesDataForDb.pestControlMonthly = String(operatingExpensesData.pestControlMonthly);
      }
      if (operatingExpensesData.otherExpensesMonthly != null) {
        operatingExpensesDataForDb.otherExpensesMonthly = String(operatingExpensesData.otherExpensesMonthly);
      }
      if (operatingExpensesData.otherExpensesDescription != null) {
        operatingExpensesDataForDb.otherExpensesDescription = operatingExpensesData.otherExpensesDescription;
      }

      if (existing) {
        await db
          .update(propertyOperatingExpenses)
          .set({ ...operatingExpensesDataForDb, updatedAt: new Date() })
          .where(eq(propertyOperatingExpenses.propertyId, id));
      } else {
        await db.insert(propertyOperatingExpenses).values(operatingExpensesDataForDb as typeof propertyOperatingExpenses.$inferInsert);
      }
    }

    // Update or insert property management
    if (management) {
      const managementData = propertyManagementInsertSchema.parse({
        propertyId: id,
        ...management,
      });

      const [existing] = await db
        .select()
        .from(propertyManagement)
        .where(eq(propertyManagement.propertyId, id))
        .limit(1);

      // Convert Date objects to strings and numbers to strings for numeric database columns
      // Base schema validates dates as strings
      const managementDataForDb: Record<string, unknown> = {
        propertyId: id,
      };

      // Handle dates (base schema validates as strings)
      if (managementData.contractStartDate != null) {
        managementDataForDb.contractStartDate = typeof managementData.contractStartDate === 'string'
          ? managementData.contractStartDate
          : String(managementData.contractStartDate);
      }
      if (managementData.contractEndDate != null) {
        managementDataForDb.contractEndDate = typeof managementData.contractEndDate === 'string'
          ? managementData.contractEndDate
          : String(managementData.contractEndDate);
      }

      // Handle numeric fields (convert to strings for database)
      if (managementData.feePercentage != null) {
        managementDataForDb.feePercentage = String(managementData.feePercentage);
      }
      if (managementData.feeFlatAmount != null) {
        managementDataForDb.feeFlatAmount = String(managementData.feeFlatAmount);
      }
      if (managementData.feeMinimum != null) {
        managementDataForDb.feeMinimum = String(managementData.feeMinimum);
      }
      if (managementData.leasingFeePercentage != null) {
        managementDataForDb.leasingFeePercentage = String(managementData.leasingFeePercentage);
      }
      if (managementData.leasingFeeFlat != null) {
        managementDataForDb.leasingFeeFlat = String(managementData.leasingFeeFlat);
      }
      if (managementData.leaseRenewalFee != null) {
        managementDataForDb.leaseRenewalFee = String(managementData.leaseRenewalFee);
      }
      if (managementData.maintenanceMarkupPercentage != null) {
        managementDataForDb.maintenanceMarkupPercentage = String(managementData.maintenanceMarkupPercentage);
      }
      if (managementData.maintenanceCoordinationFee != null) {
        managementDataForDb.maintenanceCoordinationFee = String(managementData.maintenanceCoordinationFee);
      }
      if (managementData.evictionFee != null) {
        managementDataForDb.evictionFee = String(managementData.evictionFee);
      }
      if (managementData.earlyTerminationFee != null) {
        managementDataForDb.earlyTerminationFee = String(managementData.earlyTerminationFee);
      }
      if (managementData.reserveAmount != null) {
        managementDataForDb.reserveAmount = String(managementData.reserveAmount);
      }

      // Handle boolean and text fields
      if (managementData.isSelfManaged !== undefined) {
        managementDataForDb.isSelfManaged = managementData.isSelfManaged;
      }
      if (managementData.companyName != null) {
        managementDataForDb.companyName = managementData.companyName;
      }
      if (managementData.companyWebsite != null) {
        managementDataForDb.companyWebsite = managementData.companyWebsite;
      }
      if (managementData.contactName != null) {
        managementDataForDb.contactName = managementData.contactName;
      }
      if (managementData.contactEmail != null) {
        managementDataForDb.contactEmail = managementData.contactEmail;
      }
      if (managementData.contactPhone != null) {
        managementDataForDb.contactPhone = managementData.contactPhone;
      }
      if (managementData.contractAutoRenews !== undefined) {
        managementDataForDb.contractAutoRenews = managementData.contractAutoRenews;
      }
      if (managementData.cancellationNoticeDays != null) {
        managementDataForDb.cancellationNoticeDays = managementData.cancellationNoticeDays;
      }
      if (managementData.feeType != null) {
        managementDataForDb.feeType = managementData.feeType;
      }
      if (managementData.leasingFeeType != null) {
        managementDataForDb.leasingFeeType = managementData.leasingFeeType;
      }
      if (managementData.servicesIncluded != null) {
        managementDataForDb.servicesIncluded = managementData.servicesIncluded;
      }
      if (managementData.paymentMethod != null) {
        managementDataForDb.paymentMethod = managementData.paymentMethod;
      }
      if (managementData.paymentDay != null) {
        managementDataForDb.paymentDay = managementData.paymentDay;
      }
      if (managementData.holdsSecurityDeposit !== undefined) {
        managementDataForDb.holdsSecurityDeposit = managementData.holdsSecurityDeposit;
      }
      if (managementData.portalUrl != null) {
        managementDataForDb.portalUrl = managementData.portalUrl;
      }
      if (managementData.portalUsername != null) {
        managementDataForDb.portalUsername = managementData.portalUsername;
      }
      if (managementData.appfolioPropertyId != null) {
        managementDataForDb.appfolioPropertyId = managementData.appfolioPropertyId;
      }
      if (managementData.buildiumPropertyId != null) {
        managementDataForDb.buildiumPropertyId = managementData.buildiumPropertyId;
      }
      if (managementData.propertywarePropertyId != null) {
        managementDataForDb.propertywarePropertyId = managementData.propertywarePropertyId;
      }
      if (managementData.notes != null) {
        managementDataForDb.notes = managementData.notes;
      }

      if (existing) {
        await db
          .update(propertyManagement)
          .set({ ...managementDataForDb, updatedAt: new Date() })
          .where(eq(propertyManagement.propertyId, id));
      } else {
        await db.insert(propertyManagement).values(managementDataForDb as typeof propertyManagement.$inferInsert);
      }
    }

    // Handle loan data (mark old loans inactive, insert new one)
    if (loan) {
      try {
        // Get userId from request header for user isolation
        const authHeader = c.req.header("Authorization");
        const clerkId = authHeader?.replace("Bearer ", "");

        if (!clerkId) {
          console.error("Loan creation failed: No authorization header found");
          throw new Error("Unauthorized: No authorization header for loan creation");
        }

        const { users } = await import("@axori/db/src/schema");
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, clerkId))
          .limit(1);

        if (!user) {
          console.error("Loan creation failed: User not found for clerkId:", clerkId);
          throw new Error("Unauthorized: User not found for loan creation");
        }

        const validated = validateData(
          { propertyId: id, userId: user.id, ...loan },
          loanInsertApiSchema,
          { operation: "createLoan" }
        );

        // Convert to database format (remove userId, convert numbers to strings)
        const loanDataForInsert: Record<string, unknown> = {
          propertyId: id,
          loanType: validated.loanType,
          lenderName: validated.lenderName || '',
          servicerName: validated.servicerName || null,
          loanNumber: validated.loanNumber || null,
          originalLoanAmount: validated.originalLoanAmount ? String(validated.originalLoanAmount) : '0',
          interestRate: validated.interestRate ? String(validated.interestRate / 100) : '0', // Convert percentage to decimal
          termMonths: validated.termMonths || null,
          currentBalance: validated.currentBalance ? String(validated.currentBalance) : '0',
          status: validated.status || 'active',
          isPrimary: validated.isPrimary ?? true,
          loanPosition: validated.loanPosition ?? 1,
        };

        // Add payment fields (convert numbers to strings for DB numeric columns)
        if (validated.monthlyPrincipalInterest != null) {
          loanDataForInsert.monthlyPrincipalInterest = String(validated.monthlyPrincipalInterest);
        }
        if (validated.monthlyEscrow != null) {
          loanDataForInsert.monthlyEscrow = String(validated.monthlyEscrow);
        }
        if (validated.monthlyPmi != null) {
          loanDataForInsert.monthlyPmi = String(validated.monthlyPmi);
        }
        if (validated.totalMonthlyPayment != null) {
          loanDataForInsert.totalMonthlyPayment = String(validated.totalMonthlyPayment);
        }
        if (validated.paymentDueDay != null) {
          loanDataForInsert.paymentDueDay = validated.paymentDueDay;
        }

        // Add optional fields (dates are already strings in YYYY-MM-DD format)
        if (validated.startDate) {
          loanDataForInsert.startDate = validated.startDate;
        }
        if (validated.maturityDate) {
          loanDataForInsert.maturityDate = validated.maturityDate;
        }

        // Mark existing active loans as paid off (when adding new loan)
        await db
          .update(loans)
          .set({ status: "paid_off", updatedAt: new Date() })
          .where(and(
            eq(loans.propertyId, id),
            eq(loans.status, "active")
          ));

        // Insert new active loan
        await db.insert(loans).values(loanDataForInsert as typeof loans.$inferInsert);
      } catch (loanError) {
        // Re-throw with context - will be handled by outer error handler
        throw loanError;
      }
    }

    return c.json({ property: updated });
  } catch (error) {
    const handled = handleError(error, {
      operation: "updateProperty",
      params: { id: c.req.param("id") },
    });

    const responseBody: Record<string, unknown> = { error: handled.error };
    if ("details" in handled) {
      responseBody.details = handled.details;
    }
    if ("message" in handled && handled.message) {
      responseBody.message = handled.message;
    }

    return c.json(responseBody, handled.statusCode as 400 | 401 | 404 | 409 | 500);
  }
});

// Create a loan for a property
// Protected: Requires edit permission on the property
propertiesRouter.post(
  "/:id/loans",
  withPermission({ propertyPermission: "edit", propertyIdParam: "id" }),
  async (c) => {
    try {
      const id = c.req.param("id");
      const userId = getAuthenticatedUserId(c);
      const body = await c.req.json();

      // Verify property exists
      const [property] = await db
        .select()
        .from(properties)
        .where(eq(properties.id, id))
        .limit(1);

      if (!property) {
        return c.json({ error: "Property not found" }, 404);
      }

      // Calculate maturity date if startDate and termMonths are provided
      let maturityDate = null;
      if (body.startDate && body.termMonths) {
        const start = new Date(body.startDate);
        start.setMonth(start.getMonth() + Number(body.termMonths));
        maturityDate = start.toISOString().split('T')[0];
      }

      // Validate required fields before processing
      if (!body.lenderName || !body.originalLoanAmount || !body.interestRate || !body.termMonths || !body.currentBalance) {
        return c.json(
          { error: "Missing required fields: lenderName, originalLoanAmount, interestRate, termMonths, and currentBalance are required" },
          400
        );
      }

      // Prepare loan data for Zod validation
      // Note: Enhanced schema expects interestRate as percentage (0-100), userId for authorization
      // Note: Enhanced schema expects termMonths directly (not loanTerm)
      const loanDataForValidation = {
        propertyId: id,
        userId: userId, // For validation/authorization, but not stored in loans table
      loanType: body.loanType || "conventional",
      lenderName: body.lenderName,
      servicerName: body.servicerName || null,
      loanNumber: body.loanNumber || null,
      originalLoanAmount: Number(body.originalLoanAmount),
      interestRate: Number(body.interestRate), // Enhanced schema expects percentage (0-100)
      termMonths: Number(body.termMonths), // Enhanced schema expects termMonths directly
      startDate: body.startDate || null,
      maturityDate: maturityDate,
      currentBalance: Number(body.currentBalance),
      status: "active" as const,
      isPrimary: true,
    };

    // Validate with enhanced Zod schema (validates userId for authorization and types)
    const validated = loanInsertApiSchema.parse(loanDataForValidation);

    // Convert interest rate from percentage to decimal (e.g., 6.5% -> 0.06500)
    const interestRateDecimal = validated.interestRate! / 100;

    // Prepare data for database insert (convert to database format, remove userId)
    // All required fields are guaranteed to be present after validation
    const loanDataForInsert = {
      propertyId: id,
      loanType: validated.loanType,
      lenderName: validated.lenderName!,
      servicerName: validated.servicerName,
      loanNumber: validated.loanNumber,
      originalLoanAmount: String(validated.originalLoanAmount!),
      interestRate: String(interestRateDecimal),
      termMonths: validated.termMonths!,
      startDate: validated.startDate || null,
      maturityDate: validated.maturityDate || null,
      currentBalance: String(validated.currentBalance!),
      balanceAsOfDate: new Date().toISOString().split('T')[0],
      status: validated.status || ("active" as const),
      isPrimary: validated.isPrimary ?? true,
      loanPosition: 1,
    };

    // If this is the first loan or we're setting it as primary, mark other active loans as not primary
    if (loanDataForInsert.isPrimary) {
      await db
        .update(loans)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(and(
          eq(loans.propertyId, id),
          eq(loans.status, "active")
        ));
    }

    // Insert new loan
    const [newLoan] = await db
      .insert(loans)
      .values(loanDataForInsert)
      .returning();

    return c.json({ loan: newLoan }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation failed", details: error.errors },
        400
      );
    }
    console.error("Error creating loan:", error);
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return c.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
  }
);

// Update an existing loan
// Protected: Requires edit permission on the property
propertiesRouter.put(
  "/:id/loans/:loanId",
  withPermission({ propertyPermission: "edit", propertyIdParam: "id" }),
  async (c) => {
    try {
      const id = c.req.param("id");
      const loanId = c.req.param("loanId");
      const userId = getAuthenticatedUserId(c);
      const body = await c.req.json();

      // Verify property exists
      const [property] = await db
        .select()
        .from(properties)
        .where(eq(properties.id, id))
        .limit(1);

      if (!property) {
        return c.json({ error: "Property not found" }, 404);
      }

      // Verify loan exists and belongs to this property
    const [existingLoan] = await db
      .select()
      .from(loans)
      .where(and(
        eq(loans.id, loanId),
        eq(loans.propertyId, id)
      ))
      .limit(1);

    if (!existingLoan) {
      return c.json({ error: "Loan not found" }, 404);
    }

    // User is already authenticated via middleware

    // Calculate maturity date if startDate and termMonths are provided
    let maturityDate = null;
    if (body.startDate && body.termMonths) {
      const start = new Date(body.startDate);
      start.setMonth(start.getMonth() + Number(body.termMonths));
      maturityDate = start.toISOString().split('T')[0];
    }

    // Validate required fields before processing
    if (!body.lenderName || !body.originalLoanAmount || !body.interestRate || !body.termMonths || !body.currentBalance) {
      return c.json(
        { error: "Missing required fields: lenderName, originalLoanAmount, interestRate, termMonths, and currentBalance are required" },
        400
      );
    }

    // Prepare loan data for Zod validation
    // Note: Update schema expects propertyId, all other fields are optional
    const loanDataForValidation: Record<string, unknown> = {
      propertyId: id,
    };

    // Only include fields that are provided in the request body
    if (body.loanType !== undefined) loanDataForValidation.loanType = body.loanType;
    if (body.lenderName !== undefined) loanDataForValidation.lenderName = body.lenderName;
    if (body.servicerName !== undefined) loanDataForValidation.servicerName = body.servicerName || null;
    if (body.loanNumber !== undefined) loanDataForValidation.loanNumber = body.loanNumber || null;
    if (body.originalLoanAmount !== undefined) loanDataForValidation.originalLoanAmount = Number(body.originalLoanAmount);
    if (body.interestRate !== undefined) loanDataForValidation.interestRate = Number(body.interestRate); // Enhanced schema expects percentage (0-100)
    if (body.termMonths !== undefined) loanDataForValidation.termMonths = Number(body.termMonths);
    if (body.startDate !== undefined) loanDataForValidation.startDate = body.startDate || null;
    if (body.currentBalance !== undefined) loanDataForValidation.currentBalance = Number(body.currentBalance);
    if (maturityDate !== null) loanDataForValidation.maturityDate = maturityDate;

    // Validate with enhanced update schema (all fields optional except propertyId)
    const validated = loanUpdateApiSchema.parse(loanDataForValidation);

    // Prepare data for database update
    const loanDataForUpdate: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Only update fields that were provided
    if (validated.loanType !== undefined) loanDataForUpdate.loanType = validated.loanType;
    if (validated.lenderName !== undefined) loanDataForUpdate.lenderName = validated.lenderName;
    if (validated.servicerName !== undefined) loanDataForUpdate.servicerName = validated.servicerName;
    if (validated.loanNumber !== undefined) loanDataForUpdate.loanNumber = validated.loanNumber;
    if (validated.originalLoanAmount !== undefined) loanDataForUpdate.originalLoanAmount = String(validated.originalLoanAmount);
    if (validated.interestRate !== undefined) {
      // Convert interest rate from percentage to decimal (e.g., 6.5% -> 0.06500)
      const interestRateDecimal = validated.interestRate / 100;
      loanDataForUpdate.interestRate = String(interestRateDecimal);
    }
    if (validated.termMonths !== undefined) loanDataForUpdate.termMonths = validated.termMonths;
    if (validated.startDate !== undefined) loanDataForUpdate.startDate = validated.startDate;
    if (validated.maturityDate !== undefined) loanDataForUpdate.maturityDate = validated.maturityDate;
    if (validated.currentBalance !== undefined) loanDataForUpdate.currentBalance = String(validated.currentBalance);
    if (validated.currentBalance !== undefined) {
      loanDataForUpdate.balanceAsOfDate = new Date().toISOString().split('T')[0];
    }

    // Update the loan
    const [updatedLoan] = await db
      .update(loans)
      .set(loanDataForUpdate)
      .where(and(
        eq(loans.id, loanId),
        eq(loans.propertyId, id)
      ))
      .returning();

    return c.json({ loan: updatedLoan }, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation failed", details: error.errors },
        400
      );
    }
    console.error("Error updating loan:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return c.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
  }
);

// Complete/finalize a draft property (mark as active)
// Protected: Requires edit permission on the property
propertiesRouter.post(
  "/:id/complete",
  withPermission({ propertyPermission: "edit", propertyIdParam: "id" }),
  withErrorHandling(async (c) => {
    const id = c.req.param("id");

    // Verify property exists and is draft
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);

    if (!property) {
      return c.json({ error: "Property not found" }, 404);
    }

    // Mark as active and ensure propertyType is set (required for active)
    const [updated] = await db
      .update(properties)
      .set({
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id))
      .returning();

    return c.json({ property: updated });
  }, { operation: "completeProperty" })
);

// Soft delete a property (mark as archived)
// Protected: Requires delete permission on the property
propertiesRouter.delete(
  "/:id",
  withPermission({ propertyPermission: "delete", propertyIdParam: "id" }),
  withErrorHandling(async (c) => {
    const id = c.req.param("id");

    // Verify property exists
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);

    if (!property) {
      return c.json({ error: "Property not found" }, 404);
    }

    // Soft delete by marking as archived (doesn't actually delete from DB)
    const [updated] = await db
      .update(properties)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id))
      .returning();

    return c.json({ property: updated });
  }, { operation: "deleteProperty" })
);

// GET /api/properties/drafts/me - Get current user's most recent draft property
// GET /api/properties/drafts/me - Get current user's most recent draft property
// Protected: Requires authentication
propertiesRouter.get(
  "/drafts/me",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);

    // Get user's default portfolio
    const userPortfoliosList = await db
      .select()
      .from(userPortfolios)
      .where(eq(userPortfolios.userId, userId))
      .limit(1);

    if (userPortfoliosList.length === 0) {
      return c.json({ property: null }); // No portfolio, no drafts
    }

    const portfolioId = userPortfoliosList[0].portfolioId;

    // Get most recent draft property for this portfolio added by this user
    const allDrafts = await db
      .select()
      .from(properties)
      .where(eq(properties.portfolioId, portfolioId));

    // Filter in memory for status and addedBy (to avoid type conflicts)
    const userDrafts = allDrafts
      .filter(
        (p) =>
          p.status === "draft" &&
          p.addedBy === userId
      )
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA; // Most recent first
      });

    if (userDrafts.length === 0) {
      return c.json({ property: null });
    }

    return c.json({ property: userDrafts[0] });
  }, { operation: "getUserDrafts" })
);

// ============================================================================
// Property Transactions Routes (Unified: Income, Expenses, Capital)
// ============================================================================

// GET /api/properties/:id/transactions - List transactions for property
// Protected: Requires view permission on the property
propertiesRouter.get(
  "/:id/transactions",
  withPermission({ propertyPermission: "view", propertyIdParam: "id" }),
  withErrorHandling(async (c) => {
    const { id } = c.req.param();

    // Get query parameters for filtering
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const type = c.req.query("type"); // income, expense, capital
  const category = c.req.query("category");
  const reviewStatus = c.req.query("reviewStatus");
  const page = parseInt(c.req.query("page") || "1", 10);
  const pageSize = parseInt(c.req.query("pageSize") || "20", 10);
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions = [eq(propertyTransactions.propertyId, id)];

  if (startDate) {
    conditions.push(gte(propertyTransactions.transactionDate, startDate));
  }
  if (endDate) {
    conditions.push(lte(propertyTransactions.transactionDate, endDate));
  }
  if (type) {
    type TransactionType = "income" | "expense" | "capital";
    conditions.push(eq(propertyTransactions.type, type as TransactionType));
  }
  if (category) {
    // Cast to transaction category enum type
    type TransactionCategory = "rent" | "parking" | "laundry" | "pet_rent" | "storage" | "utility_reimbursement" | "late_fees" | "application_fees" | "acquisition" | "property_tax" | "insurance" | "hoa" | "management" | "repairs" | "maintenance" | "capex" | "utilities" | "legal" | "accounting" | "marketing" | "travel" | "office" | "bank_fees" | "licenses" | "other";
    conditions.push(eq(propertyTransactions.category, category as TransactionCategory));
  }
  if (reviewStatus) {
    type ReviewStatus = "pending" | "approved" | "flagged" | "excluded";
    conditions.push(eq(propertyTransactions.reviewStatus, reviewStatus as ReviewStatus));
  }

  // Get total count for pagination
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(propertyTransactions)
    .where(and(...conditions));

  const total = Number(countResult?.count || 0);

  // Query transactions with filters and pagination
  const transactions = await db
    .select()
    .from(propertyTransactions)
    .where(and(...conditions))
    .orderBy(desc(propertyTransactions.transactionDate))
    .limit(pageSize)
    .offset(offset);

    return c.json({
      transactions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }, { operation: "listTransactions" })
);

// GET /api/properties/:id/transactions/:transactionId - Get single transaction
// Protected: Requires view permission on the property
propertiesRouter.get(
  "/:id/transactions/:transactionId",
  withPermission({ propertyPermission: "view", propertyIdParam: "id" }),
  withErrorHandling(async (c) => {
    const { id, transactionId } = c.req.param();

    // Get transaction and verify it belongs to the property
    const [transaction] = await db
      .select()
      .from(propertyTransactions)
      .where(
        and(
          eq(propertyTransactions.id, transactionId),
          eq(propertyTransactions.propertyId, id)
        )
      )
      .limit(1);

    if (!transaction) {
      return c.json({ error: "Transaction not found" }, 404);
    }

    return c.json({ transaction });
  }, { operation: "getTransaction" })
);

// POST /api/properties/:id/transactions - Create transaction
// Protected: Requires edit permission on the property
propertiesRouter.post(
  "/:id/transactions",
  withPermission({ propertyPermission: "edit", propertyIdParam: "id" }),
  withErrorHandling(async (c) => {
    const { id } = c.req.param();
    const userId = getAuthenticatedUserId(c);

    // Verify property exists
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);

    if (!property) {
      return c.json({ error: "Property not found" }, 404);
    }

    // Parse and validate request body
    const data = propertyTransactionInsertApiSchema.parse(await c.req.json());

    // Convert data types for database (numeric fields need to be strings, dates are already strings from enhanced schema)
    const transactionDataForDb: Record<string, unknown> = {
      propertyId: id,
      createdBy: userId,
      type: data.type,
      transactionDate: data.transactionDate,
      amount: String(data.amount),
      category: data.category,
      isRecurring: data.isRecurring ?? false,
      isTaxDeductible: data.isTaxDeductible ?? true,
      source: data.source ?? "manual",
      reviewStatus: data.reviewStatus ?? "pending",
      isExcluded: data.isExcluded ?? false,
    };

    // Add type-specific fields
    if (data.type === "expense" && data.vendor) {
      transactionDataForDb.vendor = data.vendor;
    }
    if (data.type === "income" && data.payer) {
      transactionDataForDb.payer = data.payer;
    }

    // Add optional fields
    if (data.subcategory != null) transactionDataForDb.subcategory = data.subcategory;
    if (data.description != null) transactionDataForDb.description = data.description;
    if (data.recurrenceFrequency != null) transactionDataForDb.recurrenceFrequency = data.recurrenceFrequency;
    if (data.recurrenceEndDate != null) {
      transactionDataForDb.recurrenceEndDate = data.recurrenceEndDate;
    }
    if (data.taxCategory != null) transactionDataForDb.taxCategory = data.taxCategory;
    if (data.documentId != null) transactionDataForDb.documentId = data.documentId;
    if (data.externalId != null) transactionDataForDb.externalId = data.externalId;
    if (data.notes != null) transactionDataForDb.notes = data.notes;

    // Create transaction
    const transaction = await db
      .insert(propertyTransactions)
      .values(transactionDataForDb as typeof propertyTransactions.$inferInsert)
      .returning();

    return c.json({ transaction: transaction[0] });
  }, { operation: "createTransaction" })
);

// PUT /api/properties/:id/transactions/:transactionId - Update transaction
// Protected: Requires edit permission on the property
propertiesRouter.put(
  "/:id/transactions/:transactionId",
  withPermission({ propertyPermission: "edit", propertyIdParam: "id" }),
  withErrorHandling(async (c) => {
    const { id, transactionId } = c.req.param();
    const userId = getAuthenticatedUserId(c);

    // Verify transaction belongs to property
    const [existingTransaction] = await db
      .select()
      .from(propertyTransactions)
      .where(
        and(
          eq(propertyTransactions.id, transactionId),
          eq(propertyTransactions.propertyId, id)
        )
      )
      .limit(1);

    if (!existingTransaction) {
      return c.json({ error: "Transaction not found" }, 404);
    }

    // Parse and validate request body
    const data = propertyTransactionUpdateApiSchema.parse(await c.req.json());

  // Convert data types for database
  const transactionDataForDb: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  // Convert date and numeric fields
  if (data.transactionDate !== undefined) {
    transactionDataForDb.transactionDate = data.transactionDate;
  }
  if (data.amount !== undefined) {
    transactionDataForDb.amount = String(data.amount);
  }
  if (data.recurrenceEndDate !== undefined) {
    transactionDataForDb.recurrenceEndDate = data.recurrenceEndDate;
  }

  // Add other optional fields
  if (data.type !== undefined) transactionDataForDb.type = data.type;
  if (data.category !== undefined) transactionDataForDb.category = data.category;
  if (data.subcategory !== undefined) transactionDataForDb.subcategory = data.subcategory;
  if (data.vendor !== undefined) transactionDataForDb.vendor = data.vendor;
  if (data.payer !== undefined) transactionDataForDb.payer = data.payer;
  if (data.description !== undefined) transactionDataForDb.description = data.description;
  if (data.isRecurring !== undefined) transactionDataForDb.isRecurring = data.isRecurring;
  if (data.recurrenceFrequency !== undefined) transactionDataForDb.recurrenceFrequency = data.recurrenceFrequency;
  if (data.isTaxDeductible !== undefined) transactionDataForDb.isTaxDeductible = data.isTaxDeductible;
  if (data.taxCategory !== undefined) transactionDataForDb.taxCategory = data.taxCategory;
  if (data.documentId !== undefined) transactionDataForDb.documentId = data.documentId;
  if (data.source !== undefined) transactionDataForDb.source = data.source;
  if (data.externalId !== undefined) transactionDataForDb.externalId = data.externalId;
  if (data.notes !== undefined) transactionDataForDb.notes = data.notes;
  if (data.reviewStatus !== undefined) transactionDataForDb.reviewStatus = data.reviewStatus;
  if (data.isExcluded !== undefined) transactionDataForDb.isExcluded = data.isExcluded;

    // Update reviewedBy and reviewedAt if reviewStatus is being set
    if (data.reviewStatus !== undefined && data.reviewStatus !== "pending") {
      transactionDataForDb.reviewedBy = userId;
      transactionDataForDb.reviewedAt = new Date();
    }

    // Update transaction
    const transaction = await db
      .update(propertyTransactions)
      .set(transactionDataForDb as Partial<typeof propertyTransactions.$inferInsert>)
      .where(eq(propertyTransactions.id, transactionId))
      .returning();

    return c.json({ transaction: transaction[0] });
  }, { operation: "updateTransaction" })
);

// DELETE /api/properties/:id/transactions/:transactionId - Delete transaction
// Protected: Requires edit permission on the property
propertiesRouter.delete(
  "/:id/transactions/:transactionId",
  withPermission({ propertyPermission: "edit", propertyIdParam: "id" }),
  withErrorHandling(async (c) => {
    const { id, transactionId } = c.req.param();

    // Verify transaction belongs to property
    const [existingTransaction] = await db
      .select()
      .from(propertyTransactions)
      .where(
        and(
          eq(propertyTransactions.id, transactionId),
          eq(propertyTransactions.propertyId, id)
        )
      )
      .limit(1);

    if (!existingTransaction) {
      return c.json({ error: "Transaction not found" }, 404);
    }

    // Delete transaction
    await db.delete(propertyTransactions).where(eq(propertyTransactions.id, transactionId));

    return c.json({ message: "Transaction deleted successfully" });
  }, { operation: "deleteTransaction" })
);

// ============================================================================
// Property Depreciation Routes
// ============================================================================

// GET /api/properties/:id/depreciation - Get depreciation data for property
// Protected: Requires view permission on the property
propertiesRouter.get(
  "/:id/depreciation",
  withPermission({ propertyPermission: "view", propertyIdParam: "id" }),
  withErrorHandling(async (c) => {
    const { id } = c.req.param();

    // Get depreciation data
    const [depreciation] = await db
      .select()
      .from(propertyDepreciation)
      .where(eq(propertyDepreciation.propertyId, id))
      .limit(1);

    // Get improvements
    const improvements = await db
      .select()
      .from(propertyImprovements)
      .where(eq(propertyImprovements.propertyId, id))
      .orderBy(desc(propertyImprovements.completedDate));

    // Get cost segregation studies
    const costSegStudies = await db
      .select()
      .from(costSegregationStudies)
      .where(eq(costSegregationStudies.propertyId, id))
      .orderBy(desc(costSegregationStudies.studyDate));

    // Get annual depreciation records
    const depreciationRecords = await db
      .select()
      .from(annualDepreciationRecords)
      .where(eq(annualDepreciationRecords.propertyId, id))
      .orderBy(desc(annualDepreciationRecords.taxYear));

    return c.json({
      depreciation: depreciation || null,
      improvements,
      costSegStudies,
      depreciationRecords,
    });
  }, { operation: "getDepreciation" })
);

// PUT /api/properties/:id/depreciation - Update/create depreciation settings
propertiesRouter.put(
  "/:id/depreciation",
  withErrorHandling(async (c) => {
  const { id } = c.req.param();

  // Security: Get user from auth header
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Lookup user by clerkId
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Security: Verify user has access to property via portfolio membership
  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1);

  if (!property) {
    return c.json({ error: "Property not found" }, 404);
  }

  // Check if user has access to the property's portfolio
  const [userPortfolioAccess] = await db
    .select()
    .from(userPortfolios)
    .where(
      and(
        eq(userPortfolios.userId, user.id),
        eq(userPortfolios.portfolioId, property.portfolioId)
      )
    )
    .limit(1);

  if (!userPortfolioAccess) {
    return c.json({ error: "Unauthorized: You don't have access to this property" }, 403);
  }

  const body = await c.req.json();

  // Prepare data for database
  const depreciationData: Record<string, unknown> = {
    propertyId: id,
    updatedAt: new Date(),
  };

  // Map fields from request body
  if (body.depreciationType !== undefined) {
    depreciationData.depreciationType = body.depreciationType;
  }
  if (body.placedInServiceDate !== undefined) {
    depreciationData.placedInServiceDate = body.placedInServiceDate;
  }
  if (body.purchasePrice !== undefined) {
    depreciationData.purchasePrice = String(body.purchasePrice);
  }
  if (body.closingCosts !== undefined) {
    depreciationData.closingCosts = String(body.closingCosts);
  }
  if (body.initialImprovements !== undefined) {
    depreciationData.initialImprovements = String(body.initialImprovements);
  }
  if (body.landValue !== undefined) {
    depreciationData.landValue = String(body.landValue);
  }
  if (body.landValueSource !== undefined) {
    depreciationData.landValueSource = body.landValueSource;
  }
  if (body.landValueRatio !== undefined) {
    depreciationData.landValueRatio = String(body.landValueRatio);
  }
  if (body.marginalTaxRate !== undefined) {
    depreciationData.marginalTaxRate = String(body.marginalTaxRate);
  }
  if (body.accumulatedDepreciation !== undefined) {
    depreciationData.accumulatedDepreciation = String(body.accumulatedDepreciation);
  }
  if (body.lastDepreciationYear !== undefined) {
    depreciationData.lastDepreciationYear = body.lastDepreciationYear;
  }
  if (body.notes !== undefined) {
    depreciationData.notes = body.notes;
  }

  // Check if record exists
  const [existing] = await db
    .select()
    .from(propertyDepreciation)
    .where(eq(propertyDepreciation.propertyId, id))
    .limit(1);

  let depreciation;
  if (existing) {
    [depreciation] = await db
      .update(propertyDepreciation)
      .set(depreciationData)
      .where(eq(propertyDepreciation.propertyId, id))
      .returning();
  } else {
    [depreciation] = await db
      .insert(propertyDepreciation)
      .values(depreciationData as typeof propertyDepreciation.$inferInsert)
      .returning();
  }

  return c.json({ depreciation });
  }, { operation: "updateDepreciation" })
);

// POST /api/properties/:id/improvements - Add a capital improvement
propertiesRouter.post(
  "/:id/improvements",
  withErrorHandling(async (c) => {
  const { id } = c.req.param();

  // Security: Get user from auth header
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Lookup user by clerkId
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Security: Verify user has access to property via portfolio membership
  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1);

  if (!property) {
    return c.json({ error: "Property not found" }, 404);
  }

  // Check if user has access to the property's portfolio
  const [userPortfolioAccess] = await db
    .select()
    .from(userPortfolios)
    .where(
      and(
        eq(userPortfolios.userId, user.id),
        eq(userPortfolios.portfolioId, property.portfolioId)
      )
    )
    .limit(1);

  if (!userPortfolioAccess) {
    return c.json({ error: "Unauthorized: You don't have access to this property" }, 403);
  }

  const body = await c.req.json();

  // Validate required fields
  if (!body.description || !body.amount || !body.completedDate) {
    return c.json(
      { error: "Missing required fields: description, amount, and completedDate are required" },
      400
    );
  }

  // Prepare data for database
  const improvementData: Record<string, unknown> = {
    propertyId: id,
    description: body.description,
    amount: String(body.amount),
    completedDate: body.completedDate,
  };

  if (body.placedInServiceDate !== undefined) {
    improvementData.placedInServiceDate = body.placedInServiceDate;
  }
  if (body.depreciationClass !== undefined) {
    improvementData.depreciationClass = body.depreciationClass;
  }
  if (body.accumulatedDepreciation !== undefined) {
    improvementData.accumulatedDepreciation = String(body.accumulatedDepreciation);
  }
  if (body.documentId !== undefined) {
    improvementData.documentId = body.documentId;
  }
  if (body.notes !== undefined) {
    improvementData.notes = body.notes;
  }

  const [improvement] = await db
    .insert(propertyImprovements)
    .values(improvementData as typeof propertyImprovements.$inferInsert)
    .returning();

  return c.json({ improvement }, 201);
  }, { operation: "addImprovement" })
);

// GET /api/properties/:id/improvements - Get all improvements
propertiesRouter.get(
  "/:id/improvements",
  withErrorHandling(async (c) => {
  const { id } = c.req.param();

  // Security: Get user from auth header
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Lookup user by clerkId
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Security: Verify user has access to property via portfolio membership
  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1);

  if (!property) {
    return c.json({ error: "Property not found" }, 404);
  }

  // Check if user has access to the property's portfolio
  const [userPortfolioAccess] = await db
    .select()
    .from(userPortfolios)
    .where(
      and(
        eq(userPortfolios.userId, user.id),
        eq(userPortfolios.portfolioId, property.portfolioId)
      )
    )
    .limit(1);

  if (!userPortfolioAccess) {
    return c.json({ error: "Unauthorized: You don't have access to this property" }, 403);
  }

  const improvements = await db
    .select()
    .from(propertyImprovements)
    .where(eq(propertyImprovements.propertyId, id))
    .orderBy(desc(propertyImprovements.completedDate));

  return c.json({ improvements });
  }, { operation: "getImprovements" })
);

// POST /api/properties/:id/cost-segregation - Add cost segregation study
propertiesRouter.post(
  "/:id/cost-segregation",
  withErrorHandling(async (c) => {
  const { id } = c.req.param();

  // Security: Get user from auth header
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Lookup user by clerkId
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Security: Verify user has access to property via portfolio membership
  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1);

  if (!property) {
    return c.json({ error: "Property not found" }, 404);
  }

  // Check if user has access to the property's portfolio
  const [userPortfolioAccess] = await db
    .select()
    .from(userPortfolios)
    .where(
      and(
        eq(userPortfolios.userId, user.id),
        eq(userPortfolios.portfolioId, property.portfolioId)
      )
    )
    .limit(1);

  if (!userPortfolioAccess) {
    return c.json({ error: "Unauthorized: You don't have access to this property" }, 403);
  }

  const body = await c.req.json();

  // Validate required fields
  if (!body.studyDate || !body.originalBasis || !body.amountRemaining) {
    return c.json(
      { error: "Missing required fields: studyDate, originalBasis, and amountRemaining are required" },
      400
    );
  }

  // Prepare data for database
  const costSegData: Record<string, unknown> = {
    propertyId: id,
    studyDate: body.studyDate,
    originalBasis: String(body.originalBasis),
    amountRemaining: String(body.amountRemaining),
  };

  if (body.studyProvider !== undefined) {
    costSegData.studyProvider = body.studyProvider;
  }
  if (body.studyCost !== undefined) {
    costSegData.studyCost = String(body.studyCost);
  }
  if (body.amount5Year !== undefined) {
    costSegData.amount5Year = String(body.amount5Year);
  }
  if (body.amount7Year !== undefined) {
    costSegData.amount7Year = String(body.amount7Year);
  }
  if (body.amount15Year !== undefined) {
    costSegData.amount15Year = String(body.amount15Year);
  }
  if (body.bonusDepreciationPercent !== undefined) {
    costSegData.bonusDepreciationPercent = String(body.bonusDepreciationPercent);
  }
  if (body.bonusDepreciationAmount !== undefined) {
    costSegData.bonusDepreciationAmount = String(body.bonusDepreciationAmount);
  }
  if (body.taxYearApplied !== undefined) {
    costSegData.taxYearApplied = body.taxYearApplied;
  }
  if (body.documentId !== undefined) {
    costSegData.documentId = body.documentId;
  }
  if (body.notes !== undefined) {
    costSegData.notes = body.notes;
  }

  const [costSeg] = await db
    .insert(costSegregationStudies)
    .values(costSegData as typeof costSegregationStudies.$inferInsert)
    .returning();

  return c.json({ costSegStudy: costSeg }, 201);
  }, { operation: "addCostSegStudy" })
);

// GET /api/properties/:id/cost-segregation - Get cost segregation studies
propertiesRouter.get(
  "/:id/cost-segregation",
  withErrorHandling(async (c) => {
  const { id } = c.req.param();

  // Security: Get user from auth header
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Lookup user by clerkId
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Security: Verify user has access to property via portfolio membership
  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1);

  if (!property) {
    return c.json({ error: "Property not found" }, 404);
  }

  // Check if user has access to the property's portfolio
  const [userPortfolioAccess] = await db
    .select()
    .from(userPortfolios)
    .where(
      and(
        eq(userPortfolios.userId, user.id),
        eq(userPortfolios.portfolioId, property.portfolioId)
      )
    )
    .limit(1);

  if (!userPortfolioAccess) {
    return c.json({ error: "Unauthorized: You don't have access to this property" }, 403);
  }

  const costSegStudies = await db
    .select()
    .from(costSegregationStudies)
    .where(eq(costSegregationStudies.propertyId, id))
    .orderBy(desc(costSegregationStudies.studyDate));

  return c.json({ costSegStudies });
  }, { operation: "getCostSegStudies" })
);

// POST /api/properties/:id/depreciation-records - Add annual depreciation record
propertiesRouter.post(
  "/:id/depreciation-records",
  withErrorHandling(async (c) => {
  const { id } = c.req.param();

  // Security: Get user from auth header
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Lookup user by clerkId
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Security: Verify user has access to property via portfolio membership
  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1);

  if (!property) {
    return c.json({ error: "Property not found" }, 404);
  }

  // Check if user has access to the property's portfolio
  const [userPortfolioAccess] = await db
    .select()
    .from(userPortfolios)
    .where(
      and(
        eq(userPortfolios.userId, user.id),
        eq(userPortfolios.portfolioId, property.portfolioId)
      )
    )
    .limit(1);

  if (!userPortfolioAccess) {
    return c.json({ error: "Unauthorized: You don't have access to this property" }, 403);
  }

  const body = await c.req.json();

  // Validate required fields
  if (!body.taxYear || !body.regularDepreciation || !body.totalDepreciation) {
    return c.json(
      { error: "Missing required fields: taxYear, regularDepreciation, and totalDepreciation are required" },
      400
    );
  }

  // Prepare data for database
  const recordData: Record<string, unknown> = {
    propertyId: id,
    taxYear: body.taxYear,
    regularDepreciation: String(body.regularDepreciation),
    totalDepreciation: String(body.totalDepreciation),
  };

  if (body.bonusDepreciation !== undefined) {
    recordData.bonusDepreciation = String(body.bonusDepreciation);
  }
  if (body.improvementDepreciation !== undefined) {
    recordData.improvementDepreciation = String(body.improvementDepreciation);
  }
  if (body.monthsDepreciated !== undefined) {
    recordData.monthsDepreciated = body.monthsDepreciated;
  }
  if (body.verifiedByCpa !== undefined) {
    recordData.verifiedByCpa = body.verifiedByCpa;
  }
  if (body.verifiedDate !== undefined) {
    recordData.verifiedDate = body.verifiedDate;
  }
  if (body.notes !== undefined) {
    recordData.notes = body.notes;
  }

  const [record] = await db
    .insert(annualDepreciationRecords)
    .values(recordData as typeof annualDepreciationRecords.$inferInsert)
    .returning();

  return c.json({ depreciationRecord: record }, 201);
  }, { operation: "addDepreciationRecord" })
);

// GET /api/properties/:id/depreciation-records - Get annual depreciation records
propertiesRouter.get(
  "/:id/depreciation-records",
  withErrorHandling(async (c) => {
  const { id } = c.req.param();

  // Security: Get user from auth header
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Lookup user by clerkId
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Security: Verify user has access to property via portfolio membership
  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1);

  if (!property) {
    return c.json({ error: "Property not found" }, 404);
  }

  // Check if user has access to the property's portfolio
  const [userPortfolioAccess] = await db
    .select()
    .from(userPortfolios)
    .where(
      and(
        eq(userPortfolios.userId, user.id),
        eq(userPortfolios.portfolioId, property.portfolioId)
      )
    )
    .limit(1);

  if (!userPortfolioAccess) {
    return c.json({ error: "Unauthorized: You don't have access to this property" }, 403);
  }

  const depreciationRecords = await db
    .select()
    .from(annualDepreciationRecords)
    .where(eq(annualDepreciationRecords.propertyId, id))
    .orderBy(desc(annualDepreciationRecords.taxYear));

  return c.json({ depreciationRecords });
  }, { operation: "getDepreciationRecords" })
);

export default propertiesRouter;
