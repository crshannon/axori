/**
 * Sample transaction data for seed scripts
 *
 * This file contains realistic transaction data that can be used for seeding
 * properties with income and expense transactions for testing and development.
 */

import type { PropertyTransactionInsert } from "@axori/db/types";

/**
 * Generate sample transactions for a property
 *
 * @param propertyId - The property ID to associate transactions with
 * @param userId - The user ID who created these transactions
 * @returns Array of transaction data ready for insertion
 */
export function generateSampleTransactions(
  propertyId: string,
  userId: string
): Array<Omit<PropertyTransactionInsert, "id" | "createdAt" | "updatedAt">> {
  const today = new Date();
  const transactions: Array<Omit<PropertyTransactionInsert, "id" | "createdAt" | "updatedAt">> = [];

  // Generate 12 months of historical data for realistic month-to-month variation
  // This provides a full year of transaction history
  for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
    const monthYear = monthDate.getFullYear();
    const monthMonth = monthDate.getMonth();

    // Monthly rent income (1st of each month) - consistent
    transactions.push({
      propertyId,
      type: "income",
      transactionDate: new Date(monthYear, monthMonth, 1).toISOString().split("T")[0],
      amount: "1950", // Slightly above market rent for cash flow positive property
      category: "rent",
      payer: "Tenant - John Doe",
      description: "Monthly rent payment",
      isRecurring: true,
      recurrenceFrequency: "monthly",
      source: "plaid",
      reviewStatus: "approved",
      isExcluded: false,
      isTaxDeductible: true,
      createdBy: userId,
    });

    // Pet rent income (1st of each month) - consistent
    transactions.push({
      propertyId,
      type: "income",
      transactionDate: new Date(monthYear, monthMonth, 1).toISOString().split("T")[0],
      amount: "50",
      category: "pet_rent",
      payer: "Tenant - John Doe",
      description: "Pet rent",
      isRecurring: true,
      recurrenceFrequency: "monthly",
      source: "manual",
      reviewStatus: "approved",
      isExcluded: false,
      isTaxDeductible: true,
      createdBy: userId,
    });

    // Primary loan payment (P&I) - 1st of each month
    transactions.push({
      propertyId,
      type: "expense",
      transactionDate: new Date(monthYear, monthMonth, 1).toISOString().split("T")[0],
      amount: "1295", // Matches loan seed data
      category: "other",
      subcategory: "loan_payment",
      vendor: "First National Bank",
      description: "Primary mortgage payment (P&I)",
      isRecurring: true,
      recurrenceFrequency: "monthly",
      isTaxDeductible: false,
      source: "plaid",
      reviewStatus: "approved",
      isExcluded: false,
      createdBy: userId,
    });

    // HELOC payment (interest-only) - 1st of each month
    // Note: HELOC has been paid down, so interest is lower now
    transactions.push({
      propertyId,
      type: "expense",
      transactionDate: new Date(monthYear, monthMonth, 1).toISOString().split("T")[0],
      amount: "42", // Interest-only: $6k balance @ 8.5% / 12 = ~$42/month (paid down from $10k)
      category: "other",
      subcategory: "loan_payment",
      vendor: "Community Credit Union",
      description: "HELOC interest payment",
      isRecurring: true,
      recurrenceFrequency: "monthly",
      isTaxDeductible: false,
      source: "plaid",
      reviewStatus: "approved",
      isExcluded: false,
      createdBy: userId,
    });

    // Property tax (paid monthly from escrow) - monthly payments
    transactions.push({
      propertyId,
      type: "expense",
      transactionDate: new Date(monthYear, monthMonth, 15).toISOString().split("T")[0],
      amount: "325", // Monthly: $3,900 annual / 12 = $325 (lower TN taxes)
      category: "property_tax",
      vendor: "County Tax Assessor",
      description: "Property tax (monthly escrow)",
      isRecurring: true,
      recurrenceFrequency: "monthly",
      isTaxDeductible: true,
      taxCategory: "Property Tax",
      source: "plaid",
      reviewStatus: "approved",
      isExcluded: false,
      createdBy: userId,
    });

    // Insurance (paid monthly from escrow)
    transactions.push({
      propertyId,
      type: "expense",
      transactionDate: new Date(monthYear, monthMonth, 10).toISOString().split("T")[0],
      amount: "125", // Monthly: $1,500 annual / 12 = $125
      category: "insurance",
      vendor: "State Farm Insurance",
      description: "Property insurance (monthly escrow)",
      isRecurring: true,
      recurrenceFrequency: "monthly",
      isTaxDeductible: true,
      taxCategory: "Insurance",
      source: "plaid",
      reviewStatus: "approved",
      isExcluded: false,
      createdBy: userId,
    });

    // Management fee (if not self-managed) - monthly
    // Note: Property is self-managed, so no management fee transactions

    // Lawn care (monthly during growing season - March through October)
    if (monthMonth >= 2 && monthMonth <= 9) {
      transactions.push({
        propertyId,
        type: "expense",
        transactionDate: new Date(monthYear, monthMonth, 5).toISOString().split("T")[0],
        amount: "75",
        category: "maintenance",
        subcategory: "landscaping",
        vendor: "Green Thumb Lawn Care",
        description: "Monthly lawn maintenance",
        isRecurring: true,
        recurrenceFrequency: "monthly",
        isTaxDeductible: true,
        taxCategory: "Maintenance",
        source: "manual",
        reviewStatus: "approved",
        isExcluded: false,
        createdBy: userId,
      });
    }

    // Pest control (quarterly - every 3 months)
    if (monthOffset % 3 === 1) {
      transactions.push({
        propertyId,
        type: "expense",
        transactionDate: new Date(monthYear, monthMonth, 12).toISOString().split("T")[0],
        amount: "100", // Quarterly: ~$100 per visit
        category: "maintenance",
        subcategory: "pest_control",
        vendor: "Bug Busters",
        description: "Quarterly pest control service",
        isRecurring: true,
        recurrenceFrequency: "quarterly",
        isTaxDeductible: true,
        taxCategory: "Maintenance",
        source: "manual",
        reviewStatus: "approved",
        isExcluded: false,
        createdBy: userId,
      });
    }

    // Occasional repairs (varies by month for realism)
    // Add repairs in 2-3 months out of 12 for a well-maintained property
    const repairMonths = [3, 7, 11] // Months with repairs
    if (repairMonths.includes(monthOffset % 12)) {
      const repairAmounts = ["95", "150", "120"] // Lower repair costs for well-maintained property
      const repairVendors = ["ABC Plumbing", "Handyman Pro", "Quick Fix Services"]
      const repairDescriptions = [
        "Minor plumbing repair",
        "Door handle repair",
        "HVAC filter replacement"
      ]
      const repairIndex = repairMonths.indexOf(monthOffset % 12)

      transactions.push({
        propertyId,
        type: "expense",
        transactionDate: new Date(monthYear, monthMonth, 8 + (monthOffset % 20)).toISOString().split("T")[0],
        amount: repairAmounts[repairIndex],
        category: "repairs",
        vendor: repairVendors[repairIndex],
        description: repairDescriptions[repairIndex],
        isTaxDeductible: true,
        taxCategory: "Repairs",
        source: "document_ai",
        reviewStatus: "approved",
        isExcluded: false,
        createdBy: userId,
      });
    }

    // Utility reimbursement (if tenant pays utilities, landlord sometimes reimburses)
    // Add occasionally for realism
    if (monthOffset % 6 === 0) {
      transactions.push({
        propertyId,
        type: "income",
        transactionDate: new Date(monthYear, monthMonth, 20).toISOString().split("T")[0],
        amount: "45",
        category: "utility_reimbursement",
        payer: "Tenant - John Doe",
        description: "Utility reimbursement (winter heating)",
        isRecurring: false,
        isTaxDeductible: true,
        source: "manual",
        reviewStatus: "approved",
        isExcluded: false,
        createdBy: userId,
      });
    }
  }

  // Add one-time Capex expense 6 months ago (for historical context)
  // These are excluded from monthly calculations but show in history
  transactions.push({
    propertyId,
    type: "expense",
    transactionDate: new Date(today.getFullYear(), today.getMonth() - 6, 15).toISOString().split("T")[0],
    amount: "450",
    category: "capex",
    vendor: "Home Depot",
    description: "Water heater maintenance and anode replacement",
    isTaxDeductible: true,
    taxCategory: "Capital Improvements",
    source: "document_ai",
    reviewStatus: "approved",
    isExcluded: false,
    createdBy: userId,
  });

  return transactions;
}

/**
 * Generate sparse transactions for a newly acquired property
 * Only generates 1 month of data to test how charts handle limited data
 *
 * @param propertyId - The property ID to associate transactions with
 * @param userId - The user ID who created these transactions
 * @returns Array of transaction data ready for insertion (only 1 month)
 */
export function generateSparseTransactions(
  propertyId: string,
  userId: string
): Array<Omit<PropertyTransactionInsert, "id" | "createdAt" | "updatedAt">> {
  const today = new Date();
  const transactions: Array<Omit<PropertyTransactionInsert, "id" | "createdAt" | "updatedAt">> = [];

  // Only generate transactions for the current month (simulating a newly acquired property)
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Monthly rent income (1st of current month)
  transactions.push({
    propertyId,
    type: "income",
    transactionDate: new Date(currentYear, currentMonth, 1).toISOString().split("T")[0],
    amount: "1450", // Matches sparse property seed data
    category: "rent",
    payer: "Tenant - Maria Garcia",
    description: "Monthly rent payment",
    isRecurring: true,
    recurrenceFrequency: "monthly",
    source: "plaid",
    reviewStatus: "approved",
    isExcluded: false,
    isTaxDeductible: true,
    createdBy: userId,
  });

  // Parking income (1st of current month)
  transactions.push({
    propertyId,
    type: "income",
    transactionDate: new Date(currentYear, currentMonth, 1).toISOString().split("T")[0],
    amount: "75",
    category: "parking",
    payer: "Tenant - Maria Garcia",
    description: "Reserved parking space",
    isRecurring: true,
    recurrenceFrequency: "monthly",
    source: "manual",
    reviewStatus: "approved",
    isExcluded: false,
    isTaxDeductible: true,
    createdBy: userId,
  });

  // Mortgage payment (1st of current month)
  transactions.push({
    propertyId,
    type: "expense",
    transactionDate: new Date(currentYear, currentMonth, 1).toISOString().split("T")[0],
    amount: "1010", // Matches sparse property loan data
    category: "other",
    subcategory: "loan_payment",
    vendor: "Wells Fargo",
    description: "Mortgage payment (P&I)",
    isRecurring: true,
    recurrenceFrequency: "monthly",
    isTaxDeductible: false,
    source: "plaid",
    reviewStatus: "approved",
    isExcluded: false,
    createdBy: userId,
  });

  // HOA fee (1st of current month)
  transactions.push({
    propertyId,
    type: "expense",
    transactionDate: new Date(currentYear, currentMonth, 1).toISOString().split("T")[0],
    amount: "250", // Matches sparse property HOA
    category: "hoa",
    vendor: "Riverfront Condo Association",
    description: "Monthly HOA fee",
    isRecurring: true,
    recurrenceFrequency: "monthly",
    isTaxDeductible: true,
    taxCategory: "HOA Fees",
    source: "plaid",
    reviewStatus: "approved",
    isExcluded: false,
    createdBy: userId,
  });

  // Property management fee (5th of current month)
  transactions.push({
    propertyId,
    type: "expense",
    transactionDate: new Date(currentYear, currentMonth, 5).toISOString().split("T")[0],
    amount: "145", // 10% of $1,450 rent
    category: "management",
    vendor: "Urban Property Management",
    description: "Monthly management fee",
    isRecurring: true,
    recurrenceFrequency: "monthly",
    isTaxDeductible: true,
    taxCategory: "Management Fees",
    source: "plaid",
    reviewStatus: "approved",
    isExcluded: false,
    createdBy: userId,
  });

  return transactions;
}

