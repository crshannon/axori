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
      amount: "1850", // Updated to match property seed data
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

    // Pet rent income (1st of each month)
    transactions.push({
      propertyId,
      type: "income",
      transactionDate: new Date(monthYear, monthMonth, 1).toISOString().split("T")[0],
      amount: "50",
      category: "other",
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

    // Note: Lawn care, pest control, and other expenses are NOT included as transactions
    // because they're already in the structured propertyOperatingExpenses data
    // and would cause duplicates. These are tracked in the structured data as recurring expenses.

    // Primary loan payment (P&I) - 1st of each month
    // Using "other" category since "loan_payment" is not in the enum
    transactions.push({
      propertyId,
      type: "expense",
      transactionDate: new Date(monthYear, monthMonth, 1).toISOString().split("T")[0],
      amount: "1295", // Updated to match loan seed data
      category: "other",
      subcategory: "loan_payment",
      vendor: "First National Bank",
      description: "Primary mortgage payment (P&I)",
      isRecurring: true,
      recurrenceFrequency: "monthly",
      isTaxDeductible: false, // P&I not tax deductible, only interest portion
      source: "plaid",
      reviewStatus: "approved",
      isExcluded: false,
      createdBy: userId,
    });

    // Note: Property tax and insurance are NOT included as transactions here
    // because they're already in the structured propertyOperatingExpenses data
    // and would cause duplicates. In reality, these are typically paid
    // annually/quarterly from escrow, not monthly.

    // HELOC payment (interest-only) - 1st of each month
    transactions.push({
      propertyId,
      type: "expense",
      transactionDate: new Date(monthYear, monthMonth, 1).toISOString().split("T")[0],
      amount: "71", // Interest-only: $10k @ 8.5% / 12 = ~$71/month
      category: "other",
      subcategory: "loan_payment",
      vendor: "Community Credit Union",
      description: "HELOC interest payment",
      isRecurring: true,
      recurrenceFrequency: "monthly",
      isTaxDeductible: false, // Interest portion would be deductible, but keeping simple
      source: "plaid",
      reviewStatus: "approved",
      isExcluded: false,
      createdBy: userId,
    });


    // Occasional repairs (randomly in some months - not every month)
    if (monthOffset % 4 === 0) {
      transactions.push({
        propertyId,
        type: "expense",
        transactionDate: new Date(monthYear, monthMonth, 5).toISOString().split("T")[0],
        amount: "250",
        category: "repairs",
        vendor: "ABC Plumbing",
        description: "Minor repair and maintenance",
        isTaxDeductible: true,
        taxCategory: "Repairs",
        source: "document_ai",
        reviewStatus: "approved",
        isExcluded: false,
        createdBy: userId,
      });
    }
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

