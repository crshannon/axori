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

  // Generate 6 months of historical data (current month + 5 previous months)
  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
    const monthYear = monthDate.getFullYear();
    const monthMonth = monthDate.getMonth();

    // Monthly rent income (1st of each month)
    transactions.push({
      propertyId,
      type: "income",
      transactionDate: new Date(monthYear, monthMonth, 1).toISOString().split("T")[0],
      amount: "1850",
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

    // Parking income (15th of each month)
    transactions.push({
      propertyId,
      type: "income",
      transactionDate: new Date(monthYear, monthMonth, 15).toISOString().split("T")[0],
      amount: "75",
      category: "parking",
      payer: "Tenant - John Doe",
      description: "Parking spot rental",
      source: "manual",
      reviewStatus: "approved",
      isExcluded: false,
      isTaxDeductible: true,
      createdBy: userId,
    });

    // Monthly maintenance expense (10th of each month)
    transactions.push({
      propertyId,
      type: "expense",
      transactionDate: new Date(monthYear, monthMonth, 10).toISOString().split("T")[0],
      amount: "150",
      category: "maintenance",
      vendor: "Green Thumb Lawn Care",
      description: "Monthly lawn maintenance",
      isRecurring: true,
      recurrenceFrequency: "monthly",
      isTaxDeductible: true,
      taxCategory: "Maintenance",
      source: "plaid",
      reviewStatus: "approved",
      isExcluded: false,
      createdBy: userId,
    });

    // Monthly management fee (15th of each month)
    transactions.push({
      propertyId,
      type: "expense",
      transactionDate: new Date(monthYear, monthMonth, 15).toISOString().split("T")[0],
      amount: "185",
      category: "management",
      vendor: "ABC Property Management",
      description: "Management fee (10%)",
      isRecurring: true,
      recurrenceFrequency: "monthly",
      isTaxDeductible: true,
      taxCategory: "Management",
      source: "appfolio",
      reviewStatus: "approved",
      isExcluded: false,
      createdBy: userId,
    });

    // Quarterly property tax (only in Jan, Apr, Jul, Oct - every 3 months)
    const quarter = Math.floor(monthMonth / 3);
    const monthsInQuarter = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
    if (monthsInQuarter.includes(monthMonth)) {
      transactions.push({
        propertyId,
        type: "expense",
        transactionDate: new Date(monthYear, monthMonth, 20).toISOString().split("T")[0],
        amount: "1050", // Quarterly payment = 350 * 3
        category: "property_tax",
        vendor: "Shelby County Tax Assessor",
        description: "Quarterly property tax payment",
        isRecurring: true,
        recurrenceFrequency: "quarterly",
        isTaxDeductible: true,
        taxCategory: "Property Tax",
        source: "plaid",
        reviewStatus: "approved",
        isExcluded: false,
        createdBy: userId,
      });
    }

    // Occasional repairs (randomly in some months)
    if (monthOffset % 3 === 0) {
      transactions.push({
        propertyId,
        type: "expense",
        transactionDate: new Date(monthYear, monthMonth, 5).toISOString().split("T")[0],
        amount: "350",
        category: "repairs",
        vendor: "ABC Plumbing",
        description: "Repair and maintenance",
        isTaxDeductible: true,
        taxCategory: "Repairs",
        source: "document_ai",
        reviewStatus: "approved",
        isExcluded: false,
        createdBy: userId,
      });
    }

    // Bank fees (end of month)
    transactions.push({
      propertyId,
      type: "expense",
      transactionDate: new Date(monthYear, monthMonth + 1, 0).toISOString().split("T")[0], // Last day of month
      amount: "50",
      category: "bank_fees",
      vendor: "First National Bank",
      description: "Account maintenance fee",
      isTaxDeductible: true,
      taxCategory: "Bank Fees",
      source: "plaid",
      reviewStatus: "approved",
      isExcluded: false,
      createdBy: userId,
    });
  }

  // Add one-time Capex expense 2 months ago
  transactions.push({
    propertyId,
    type: "expense",
    transactionDate: new Date(today.getFullYear(), today.getMonth() - 2, 28).toISOString().split("T")[0],
    amount: "1200",
    category: "capex",
    vendor: "Home Depot",
    description: "New water heater installation",
    isTaxDeductible: true,
    taxCategory: "Capital Improvements",
    source: "document_ai",
    reviewStatus: "approved",
    isExcluded: false,
    createdBy: userId,
  });

  return transactions;
}

