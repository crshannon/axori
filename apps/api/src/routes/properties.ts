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
  eq,
  and,
  desc
} from "@axori/db";
import {
  propertyInsertSchema,
  propertyUpdateSchema,
  propertyCharacteristicsInsertSchema,
  propertyValuationInsertSchema,
  propertyAcquisitionInsertSchema,
  propertyRentalIncomeInsertSchema,
  propertyOperatingExpensesInsertSchema,
  propertyManagementInsertSchema,
  loanInsertSchema,
} from "@axori/shared/src/validation";
import { RentcastClient, type PropertyDetails } from "@axori/shared/src/integrations/rentcast";
import { transformRentcastToAxori } from "@axori/shared/src/integrations/data-transformers";
import { z } from "zod";

const propertiesRouter = new Hono();

// Get all properties (filter by portfolio and/or status if provided)
// Excludes archived properties by default (soft delete)
propertiesRouter.get("/", async (c) => {
  const portfolioId = c.req.query("portfolioId");
  const status = c.req.query("status");
  const includeArchived = c.req.query("includeArchived") === "true";

  // Get all properties for the portfolio (only filter if portfolioId is provided and valid)
  // Check if portfolioId is a valid UUID format (basic check: not empty and looks like UUID)
  const isValidPortfolioId = portfolioId && portfolioId.trim() !== "" && portfolioId.length > 10;

  let allProperties;
  if (isValidPortfolioId) {
    // Filter by specific portfolio
    allProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.portfolioId, portfolioId));
  } else {
    // Get all properties (no portfolio filter)
    allProperties = await db.select().from(properties);
  }

  // Filter by status and exclude archived (unless explicitly requested)
  let filtered = allProperties;

  if (status) {
    filtered = filtered.filter((p) => p.status === status);
  } else if (!includeArchived) {
    // Exclude archived by default
    filtered = filtered.filter((p) => p.status !== "archived");
  }

  // Sort by most recent first
  filtered.sort((a, b) => {
    const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return dateB - dateA;
  });

  return c.json({ properties: filtered });
});

// Fetch or update Rentcast data for a property
// GET /api/properties/:id/rentcast-data
// Checks cache (1 week old) and fetches from Rentcast if needed
// In local environment (NODE_ENV=local), returns mock data instead of making API calls
// NOTE: This must come before /:id route to avoid route matching conflicts
propertiesRouter.get("/:id/rentcast-data", async (c) => {
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
    property.rentcastFetchedAt &&
    new Date(property.rentcastFetchedAt) > oneWeekAgo
  ) {
    // Return cached data
    return c.json({
      data: JSON.parse(property.rentcastData),
      cached: true,
      fetchedAt: property.rentcastFetchedAt,
    });
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
});

// Get single property by ID (with all normalized data joined)
propertiesRouter.get("/:id", async (c) => {
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

  // Get active loan (if any) - primary active loan for the property
  const activeLoans = await db
    .select()
    .from(loans)
    .where(and(
      eq(loans.propertyId, id),
      eq(loans.status, "active"),
      eq(loans.isPrimary, true)
    ))
    .limit(1);

  const activeLoan = activeLoans.length > 0 ? activeLoans[0] : null;

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
      loans: activeLoan ? [activeLoan] : [], // Return as array for consistency
    },
  });
});

// Create new property (draft or active)
propertiesRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validated = propertyInsertSchema.parse(body);

    const [property] = await db
      .insert(properties)
      .values({
        ...validated,
        status: validated.status || "draft",
      })
      .returning();

    return c.json({ property }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation failed", details: error.errors },
        400
      );
    }
    console.error("Error creating property:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update existing property (used for draft updates and finalizing)
// Accepts property core data + optional normalized table data
propertiesRouter.put("/:id", async (c) => {
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
      if (characteristicsData.rentcastPropertyId != null) characteristicsDataForDb.rentcastPropertyId = characteristicsData.rentcastPropertyId;

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
      const acquisitionData = propertyAcquisitionInsertSchema.parse({
        propertyId: id,
        ...acquisition,
      });

      const [existing] = await db
        .select()
        .from(propertyAcquisition)
        .where(eq(propertyAcquisition.propertyId, id))
        .limit(1);

      // Convert Date objects to strings for database
      const acquisitionDataForDb = {
        ...acquisitionData,
        purchaseDate: acquisitionData.purchaseDate instanceof Date
          ? acquisitionData.purchaseDate.toISOString().split('T')[0]
          : acquisitionData.purchaseDate,
        closingDate: acquisitionData.closingDate instanceof Date
          ? acquisitionData.closingDate.toISOString().split('T')[0]
          : acquisitionData.closingDate,
      };

      if (existing) {
        await db
          .update(propertyAcquisition)
          .set({ ...acquisitionDataForDb, updatedAt: new Date() })
          .where(eq(propertyAcquisition.propertyId, id));
      } else {
        await db.insert(propertyAcquisition).values(acquisitionDataForDb);
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
      const operatingExpensesData = propertyOperatingExpensesInsertSchema.parse({
        propertyId: id,
        ...operatingExpenses,
      });

      const [existing] = await db
        .select()
        .from(propertyOperatingExpenses)
        .where(eq(propertyOperatingExpenses.propertyId, id))
        .limit(1);

      // Convert numbers to strings for numeric database columns
      const operatingExpensesDataForDb = {
        ...operatingExpensesData,
        propertyTaxesAnnual: String(operatingExpensesData.propertyTaxesAnnual || 0),
        insuranceAnnual: String(operatingExpensesData.insuranceAnnual || 0),
        hoaMonthly: String(operatingExpensesData.hoaMonthly || 0),
        utilitiesMonthly: String(operatingExpensesData.utilitiesMonthly || 0),
        maintenanceMonthly: String(operatingExpensesData.maintenanceMonthly || 0),
        managementFeeFlat: String(operatingExpensesData.managementFeeFlat || 0),
        landscapingMonthly: String(operatingExpensesData.landscapingMonthly || 0),
        pestControlMonthly: String(operatingExpensesData.pestControlMonthly || 0),
        capitalExReserveMonthly: String(operatingExpensesData.capitalExReserveMonthly || 0),
        otherExpensesMonthly: String(operatingExpensesData.otherExpensesMonthly || 0),
        vacancyRatePercentage: String(operatingExpensesData.vacancyRatePercentage || 5),
      };

      if (existing) {
        await db
          .update(propertyOperatingExpenses)
          .set({ ...operatingExpensesDataForDb, updatedAt: new Date() })
          .where(eq(propertyOperatingExpenses.propertyId, id));
      } else {
        await db.insert(propertyOperatingExpenses).values(operatingExpensesDataForDb);
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
      const managementDataForDb = {
        ...managementData,
        contractStartDate: managementData.contractStartDate instanceof Date
          ? managementData.contractStartDate.toISOString().split('T')[0]
          : managementData.contractStartDate,
        contractEndDate: managementData.contractEndDate instanceof Date
          ? managementData.contractEndDate.toISOString().split('T')[0]
          : managementData.contractEndDate,
        feePercentage: managementData.feePercentage != null
          ? String(managementData.feePercentage)
          : managementData.feePercentage,
        feeFlatAmount: managementData.feeFlatAmount != null
          ? String(managementData.feeFlatAmount)
          : managementData.feeFlatAmount,
        feeMinimum: managementData.feeMinimum != null
          ? String(managementData.feeMinimum)
          : managementData.feeMinimum,
        leasingFeePercentage: managementData.leasingFeePercentage != null
          ? String(managementData.leasingFeePercentage)
          : managementData.leasingFeePercentage,
        leasingFeeFlat: managementData.leasingFeeFlat != null
          ? String(managementData.leasingFeeFlat)
          : managementData.leasingFeeFlat,
        leaseRenewalFee: managementData.leaseRenewalFee != null
          ? String(managementData.leaseRenewalFee)
          : managementData.leaseRenewalFee,
        maintenanceMarkupPercentage: managementData.maintenanceMarkupPercentage != null
          ? String(managementData.maintenanceMarkupPercentage)
          : managementData.maintenanceMarkupPercentage,
        maintenanceCoordinationFee: managementData.maintenanceCoordinationFee != null
          ? String(managementData.maintenanceCoordinationFee)
          : managementData.maintenanceCoordinationFee,
        evictionFee: managementData.evictionFee != null
          ? String(managementData.evictionFee)
          : managementData.evictionFee,
        earlyTerminationFee: managementData.earlyTerminationFee != null
          ? String(managementData.earlyTerminationFee)
          : managementData.earlyTerminationFee,
        reserveAmount: managementData.reserveAmount != null
          ? String(managementData.reserveAmount)
          : managementData.reserveAmount,
      };

      if (existing) {
        await db
          .update(propertyManagement)
          .set({ ...managementDataForDb, updatedAt: new Date() })
          .where(eq(propertyManagement.propertyId, id));
      } else {
        await db.insert(propertyManagement).values(managementDataForDb);
      }
    }

    // Handle loan data (mark old loans inactive, insert new one)
    if (loan) {
      // Get userId from request header for user isolation
      const authHeader = c.req.header("Authorization");
      const clerkId = authHeader?.replace("Bearer ", "");

      if (clerkId) {
        const { users } = await import("@axori/db/src/schema");
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, clerkId))
          .limit(1);

        if (user) {
          const loanData = loanInsertSchema.parse({
            propertyId: id,
            userId: user.id,
            ...loan,
          });

          // Mark existing active loans as paid off (when adding new loan)
          await db
            .update(loans)
            .set({ status: "paid_off", updatedAt: new Date() })
            .where(and(
              eq(loans.propertyId, id),
              eq(loans.status, "active")
            ));

          // Insert new active loan
          await db.insert(loans).values(loanData);
        }
      }
    }

    return c.json({ property: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation failed", details: error.errors },
        400
      );
    }
    console.error("Error updating property:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Create a loan for a property
propertiesRouter.post("/:id/loans", async (c) => {
  try {
    const id = c.req.param("id");
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

    // Get userId from request header for user isolation
    const authHeader = c.req.header("Authorization");
    const clerkId = authHeader?.replace("Bearer ", "");

    if (!clerkId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { users } = await import("@axori/db/src/schema");
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
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
    // Note: Zod schema expects interestRate as percentage (0-100), userId for authorization
    // Note: Zod schema has loanTerm (years) but we use termMonths (months) in the database
    // We'll validate the required fields manually and use Zod for type checking only
    const loanDataForValidation = {
      propertyId: id,
      userId: user.id, // For validation/authorization, but not stored in loans table
      loanType: body.loanType || "conventional",
      lenderName: body.lenderName,
      servicerName: body.servicerName || null,
      loanNumber: body.loanNumber || null,
      originalLoanAmount: Number(body.originalLoanAmount),
      interestRate: Number(body.interestRate), // Zod expects percentage (0-100)
      loanTerm: null, // Not used, we have termMonths - Zod allows nullable
      startDate: body.startDate || null,
      maturityDate: maturityDate,
      currentBalance: Number(body.currentBalance),
      status: "active" as const,
      isPrimary: true,
    };

    // Validate with Zod schema (validates userId for authorization and types)
    // Note: We bypass Zod's termMonths validation since it uses loanTerm instead
    const validated = loanInsertSchema.parse(loanDataForValidation);

    // Convert interest rate from percentage to decimal (e.g., 6.5% -> 0.06500)
    const interestRateDecimal = validated.interestRate! / 100;

    // Get termMonths from body (not from validated since Zod doesn't have it)
    // Validate it's a positive integer
    const termMonths = Number(body.termMonths);
    if (!termMonths || termMonths <= 0 || !Number.isInteger(termMonths)) {
      return c.json(
        { error: "termMonths must be a positive integer" },
        400
      );
    }

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
      termMonths: termMonths, // Use termMonths from body directly
      startDate: body.startDate || null, // Use from body, not validated (Zod uses originationDate)
      maturityDate: maturityDate,
      currentBalance: String(body.currentBalance), // Use from body, not validated (not in Zod schema)
      balanceAsOfDate: new Date().toISOString().split('T')[0],
      status: "active" as const,
      isPrimary: true,
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
});

// Update an existing loan
propertiesRouter.put("/:id/loans/:loanId", async (c) => {
  try {
    const id = c.req.param("id");
    const loanId = c.req.param("loanId");
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

    // Get userId from request header for user isolation
    const authHeader = c.req.header("Authorization");
    const clerkId = authHeader?.replace("Bearer ", "");

    if (!clerkId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { users } = await import("@axori/db/src/schema");
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
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
    const loanDataForValidation = {
      propertyId: id,
      userId: user.id,
      loanType: body.loanType || existingLoan.loanType || "conventional",
      lenderName: body.lenderName,
      servicerName: body.servicerName || null,
      loanNumber: body.loanNumber || null,
      originalLoanAmount: Number(body.originalLoanAmount),
      interestRate: Number(body.interestRate), // Zod expects percentage (0-100)
      loanTerm: null,
      startDate: body.startDate || null,
      maturityDate: maturityDate,
      currentBalance: Number(body.currentBalance),
      status: existingLoan.status || "active",
      isPrimary: existingLoan.isPrimary !== undefined ? existingLoan.isPrimary : true,
    };

    // Validate with Zod schema
    const validated = loanInsertSchema.parse(loanDataForValidation);

    // Convert interest rate from percentage to decimal (e.g., 6.5% -> 0.06500)
    const interestRateDecimal = validated.interestRate! / 100;

    // Get termMonths from body
    const termMonths = Number(body.termMonths);
    if (!termMonths || termMonths <= 0 || !Number.isInteger(termMonths)) {
      return c.json(
        { error: "termMonths must be a positive integer" },
        400
      );
    }

    // Prepare data for database update
    const loanDataForUpdate = {
      loanType: validated.loanType,
      lenderName: validated.lenderName!,
      servicerName: validated.servicerName,
      loanNumber: validated.loanNumber,
      originalLoanAmount: String(validated.originalLoanAmount!),
      interestRate: String(interestRateDecimal),
      termMonths: termMonths,
      startDate: body.startDate || null,
      maturityDate: maturityDate,
      currentBalance: String(body.currentBalance),
      balanceAsOfDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date(),
    };

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
});

// Complete/finalize a draft property (mark as active)
propertiesRouter.post("/:id/complete", async (c) => {
  try {
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
  } catch (error) {
    console.error("Error completing property:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Soft delete a property (mark as archived)
propertiesRouter.delete("/:id", async (c) => {
  try {
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
  } catch (error) {
    console.error("Error deleting property:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/properties/drafts/me - Get current user's most recent draft property
propertiesRouter.get("/drafts/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get user ID - using direct import to avoid type conflicts
  const { users, userPortfolios } = await import("@axori/db/src/schema");
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Get user's default portfolio
  const userPortfoliosList = await db
    .select()
    .from(userPortfolios)
    .where(eq(userPortfolios.userId, user.id))
    .limit(1);

  if (userPortfoliosList.length === 0) {
    return c.json({ property: null }); // No portfolio, no drafts
  }

  const portfolioId = userPortfoliosList[0].portfolioId;

  // Get most recent draft property for this portfolio added by this user
  // Using query params approach to avoid type conflicts
  const allDrafts = await db
    .select()
    .from(properties)
    .where(eq(properties.portfolioId, portfolioId));

  // Filter in memory for status and addedBy (to avoid type conflicts)
  const userDrafts = allDrafts
    .filter(
      (p) =>
        p.status === "draft" &&
        p.addedBy === user.id
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
});

export default propertiesRouter;
