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
      amount: "1850", // Matches property seed data
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
      isTaxDeductible: false,
      source: "plaid",
      reviewStatus: "approved",
      isExcluded: false,
      createdBy: userId,
    });

    // Property tax (paid quarterly from escrow) - every 3 months
    if (monthOffset % 3 === 0) {
      transactions.push({
        propertyId,
        type: "expense",
        transactionDate: new Date(monthYear, monthMonth, 15).toISOString().split("T")[0],
        amount: "1050", // Quarterly: $4,200 annual / 4 = $1,050
        category: "property_tax",
        vendor: "County Tax Assessor",
        description: "Property tax payment (quarterly)",
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

    // Insurance (paid annually, but show as monthly escrow deduction)
    // In reality this comes from escrow, but we'll show it as a monthly transaction
    if (monthOffset === 0) {
      // Annual insurance payment in current month
      transactions.push({
        propertyId,
        type: "expense",
        transactionDate: new Date(monthYear, monthMonth, 10).toISOString().split("T")[0],
        amount: "1800", // Annual insurance: $1,800
        category: "insurance",
        vendor: "State Farm Insurance",
        description: "Annual property insurance",
        isRecurring: true,
        recurrenceFrequency: "annual",
        isTaxDeductible: true,
        taxCategory: "Insurance",
        source: "plaid",
        reviewStatus: "approved",
        isExcluded: false,
        createdBy: userId,
      });
    }

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
    // Add repairs in 3-4 months out of 12 for variety
    const repairMonths = [2, 5, 8, 11] // Months with repairs
    if (repairMonths.includes(monthOffset % 12)) {
      const repairAmounts = ["150", "250", "180", "320"] // Varying repair costs
      const repairVendors = ["ABC Plumbing", "Handyman Pro", "Quick Fix Services", "Reliable Repairs"]
      const repairDescriptions = [
        "Minor plumbing repair",
        "Electrical outlet replacement",
        "Door handle repair",
        "HVAC filter and service"
      ]
      const repairIndex = Math.floor(monthOffset / 3) % repairAmounts.length
      
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

  // Add one-time Capex expense 3 months ago (for historical context)
  transactions.push({
    propertyId,
    type: "expense",
    transactionDate: new Date(today.getFullYear(), today.getMonth() - 3, 15).toISOString().split("T")[0],
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

  // Add another Capex expense 8 months ago
  transactions.push({
    propertyId,
    type: "expense",
    transactionDate: new Date(today.getFullYear(), today.getMonth() - 8, 22).toISOString().split("T")[0],
    amount: "850",
    category: "capex",
    vendor: "Local HVAC Company",
    description: "AC unit service and capacitor replacement",
    isTaxDeductible: true,
    taxCategory: "Capital Improvements",
    source: "document_ai",
    reviewStatus: "approved",
    isExcluded: false,
    createdBy: userId,
  });

  return transactions;
}

