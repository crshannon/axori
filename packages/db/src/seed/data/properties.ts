/**
 * Sample property data for seed scripts
 *
 * This file contains property seed data that can be used for testing and development.
 */

/**
 * Sample property characteristics data
 */
export const sampleCharacteristics = {
  propertyType: "Single Family",
  bedrooms: 3,
  bathrooms: "2.5",
  squareFeet: 1850,
  lotSizeSqft: 7200,
  yearBuilt: 2015,
};

/**
 * Sample property valuation data
 */
export const sampleValuation = {
  currentValue: "285000",
  taxAssessedValue: "265000",
  lastAppraisalValue: "310000",
};

/**
 * Sample property acquisition data
 */
export const sampleAcquisition = {
  purchasePrice: "265000",
  purchaseDate: "2023-06-15",
  acquisitionMethod: "traditional",
  closingCostsTotal: "8500",
  downPaymentAmount: "53000",
  downPaymentSource: "savings",
  earnestMoney: "5000",
  sellerCredits: "2000",
  buyerAgentCommission: "7950",
};

/**
 * Sample rental income data
 */
export const sampleRentalIncome = {
  monthlyRent: "1850",
  marketRentEstimate: "1900",
  otherIncomeMonthly: "0", // Additional income sources
  parkingIncomeMonthly: "0",
  laundryIncomeMonthly: "0",
  petRentMonthly: "50", // Example: $50/month pet fee
  storageIncomeMonthly: "0",
  utilityReimbursementMonthly: "0",
};

/**
 * Sample operating expenses data
 */
export const sampleOperatingExpenses = {
  propertyTaxAnnual: "4200",
  insuranceAnnual: "1800",
  hoaMonthly: "0",
  waterSewerMonthly: "0",
  electricMonthly: "0",
  gasMonthly: "0",
  lawnCareMonthly: "75",
  pestControlMonthly: "25",
  otherExpensesMonthly: "250", // Other miscellaneous expenses
  vacancyRate: "0.05", // 5% as decimal
  managementRate: "0.10", // 10% as decimal (for management fee calculation)
  maintenanceRate: "0.05", // 5% as decimal (for maintenance budgeting)
  capexRate: "0.08", // 8% as decimal (for CapEx reserve calculation)
};

/**
 * Sample property management data
 */
export const sampleManagement = {
  isSelfManaged: false,
  companyName: "ABC Property Management",
  contactName: "John Smith",
  contactEmail: "john@abcpm.com",
  contactPhone: "555-123-4567",
  contractStartDate: "2023-07-01",
  feePercentage: "0.10", // 10% as decimal
};

/**
 * Sample loan data
 */
export const sampleLoan = {
  loanType: "conventional" as const,
  lenderName: "First National Bank",
  servicerName: "First National Bank",
  loanNumber: "LN-2023-001",
  originalLoanAmount: "212000",
  interestRate: "0.065", // 6.5%
  termMonths: 360,
  currentBalance: "208500",
  monthlyPrincipalInterest: "1340", // Example P&I payment for ~$208k @ 6.5% for 30 years
  monthlyEscrow: "500", // Estimated escrow (taxes + insurance)
  totalMonthlyPayment: "1840", // P&I + Escrow
  startDate: "2023-06-15",
  maturityDate: "2053-06-15",
  status: "active" as const,
  isPrimary: true,
  loanPosition: 1,
};

