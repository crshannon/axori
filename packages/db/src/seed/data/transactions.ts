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

  return [
    // Income transactions
    {
      propertyId,
      type: "income",
      transactionDate: new Date(today.getFullYear(), today.getMonth() - 1, 1)
        .toISOString()
        .split("T")[0], // Last month
      amount: "1850",
      category: "rent",
      payer: "Tenant - John Doe",
      description: "Monthly rent payment",
      isRecurring: true,
      recurrenceFrequency: "monthly",
      source: "plaid", // Bank sync - rent payments typically come from bank
      reviewStatus: "approved",
      isExcluded: false,
      isTaxDeductible: true,
      createdBy: userId,
    },
    {
      propertyId,
      type: "income",
      transactionDate: new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split("T")[0], // This month
      amount: "1850",
      category: "rent",
      payer: "Tenant - John Doe",
      description: "Monthly rent payment",
      isRecurring: true,
      recurrenceFrequency: "monthly",
      source: "plaid", // Bank sync
      reviewStatus: "approved",
      isExcluded: false,
      isTaxDeductible: true,
      createdBy: userId,
    },
    {
      propertyId,
      type: "income",
      transactionDate: new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        15
      )
        .toISOString()
        .split("T")[0],
      amount: "75",
      category: "parking",
      payer: "Tenant - John Doe",
      description: "Parking spot rental",
      source: "manual", // Small amounts often manually entered
      reviewStatus: "approved",
      isExcluded: false,
      isTaxDeductible: true,
      createdBy: userId,
    },
    // Expense transactions
    {
      propertyId,
      type: "expense",
      transactionDate: new Date(today.getFullYear(), today.getMonth() - 1, 5)
        .toISOString()
        .split("T")[0],
      amount: "350",
      category: "repairs",
      vendor: "ABC Plumbing",
      description: "Faucet repair and leak fix",
      isTaxDeductible: true,
      taxCategory: "Repairs",
      source: "document_ai", // Receipt scanned/parsed from invoice
      reviewStatus: "approved",
      isExcluded: false,
      createdBy: userId,
    },
    {
      propertyId,
      type: "expense",
      transactionDate: new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        10
      )
        .toISOString()
        .split("T")[0],
      amount: "150",
      category: "maintenance",
      vendor: "Green Thumb Lawn Care",
      description: "Monthly lawn maintenance",
      isRecurring: true,
      recurrenceFrequency: "monthly",
      isTaxDeductible: true,
      taxCategory: "Maintenance",
      source: "plaid", // Recurring maintenance often auto-synced from bank
      reviewStatus: "approved",
      isExcluded: false,
      createdBy: userId,
    },
    {
      propertyId,
      type: "expense",
      transactionDate: new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        15
      )
        .toISOString()
        .split("T")[0],
      amount: "185",
      category: "management",
      vendor: "ABC Property Management",
      description: "Management fee (10%)",
      isRecurring: true,
      recurrenceFrequency: "monthly",
      isTaxDeductible: true,
      taxCategory: "Management",
      source: "appfolio", // Property management platform integration
      reviewStatus: "approved",
      isExcluded: false,
      createdBy: userId,
    },
    {
      propertyId,
      type: "expense",
      transactionDate: new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        20
      )
        .toISOString()
        .split("T")[0],
      amount: "350",
      category: "property_tax",
      vendor: "Shelby County Tax Assessor",
      description: "Quarterly property tax payment",
      isRecurring: true,
      recurrenceFrequency: "quarterly",
      isTaxDeductible: true,
      taxCategory: "Property Tax",
      source: "plaid", // Tax payments typically from bank account
      reviewStatus: "approved",
      isExcluded: false,
      createdBy: userId,
    },
    {
      propertyId,
      type: "expense",
      transactionDate: new Date(today.getFullYear(), today.getMonth(), 3)
        .toISOString()
        .split("T")[0], // This month
      amount: "200",
      category: "repairs",
      vendor: "Quick Fix HVAC",
      description: "AC unit maintenance and filter replacement",
      isTaxDeductible: true,
      taxCategory: "Repairs",
      source: "document_ai", // Recent receipt scanned/parsed - pending review
      reviewStatus: "pending",
      isExcluded: false,
      createdBy: userId,
    },
    {
      propertyId,
      type: "expense",
      transactionDate: new Date(today.getFullYear(), today.getMonth() - 2, 28)
        .toISOString()
        .split("T")[0], // 2 months ago
      amount: "1200",
      category: "capex",
      vendor: "Home Depot",
      description: "New water heater installation",
      isTaxDeductible: true,
      taxCategory: "Capital Improvements",
      source: "document_ai", // Large purchase with receipt scanned
      reviewStatus: "approved",
      isExcluded: false,
      createdBy: userId,
    },
    {
      propertyId,
      type: "expense",
      transactionDate: new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        25
      )
        .toISOString()
        .split("T")[0],
      amount: "50",
      category: "bank_fees",
      vendor: "First National Bank",
      description: "Account maintenance fee",
      isTaxDeductible: true,
      taxCategory: "Bank Fees",
      source: "plaid", // Bank fees come from bank sync
      reviewStatus: "approved",
      isExcluded: false,
      createdBy: userId,
    },
  ];
}

