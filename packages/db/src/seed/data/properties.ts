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
 * Updated to match loan amount (increased down payment for better cash flow)
 */
export const sampleAcquisition = {
  purchasePrice: "265000",
  purchaseDate: "2023-06-15",
  acquisitionMethod: "traditional",
  closingCostsTotal: "8500",
  downPaymentAmount: "60000", // Increased from $53k to $60k for better cash flow
  downPaymentSource: "savings",
  earnestMoney: "5000",
  sellerCredits: "2000",
  buyerAgentCommission: "7950",
};

/**
 * Sample rental income data
 * For a $265k property in Memphis, realistic rent is ~$1,750-1,850/month
 * Adjusted to ensure positive cash flow after all expenses
 */
export const sampleRentalIncome = {
  monthlyRent: "1850", // Realistic for Memphis market, adjusted for positive cash flow
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
 * Realistic expenses for a $265k single-family rental property
 */
export const sampleOperatingExpenses = {
  propertyTaxAnnual: "4200", // ~$350/month - realistic for TN
  insuranceAnnual: "1800", // ~$150/month
  hoaMonthly: "0",
  waterSewerMonthly: "0", // Typically tenant pays
  electricMonthly: "0", // Typically tenant pays
  gasMonthly: "0", // Typically tenant pays
  lawnCareMonthly: "75", // Monthly lawn maintenance
  pestControlMonthly: "25", // Quarterly service = ~$25/month
  otherExpensesMonthly: "75", // Other miscellaneous expenses (reduced for realistic cash flow)
  vacancyRate: "0.05", // 5% as decimal
  managementRate: "0.08", // 8% as decimal (slightly lower for better cash flow)
  maintenanceRate: "0.05", // 5% as decimal (for maintenance budgeting)
  capexRate: "0.08", // 8% as decimal (for CapEx reserve calculation)
};

/**
 * Sample property management data
 * Set to self-managed to improve cash flow (no management fee)
 */
export const sampleManagement = {
  isSelfManaged: true, // Self-managed for better cash flow
  companyName: null,
  contactName: null,
  contactEmail: null,
  contactPhone: null,
  contractStartDate: null,
  feePercentage: null, // No fee for self-managed
};

/**
 * Sample loan data
 * For $265k purchase with $60k down = $205k loan (increased down payment for better cash flow)
 * At 6.5% for 30 years, P&I = ~$1,295/month
 */
export const sampleLoan = {
  loanType: "conventional" as const,
  lenderName: "First National Bank",
  servicerName: "First National Bank",
  loanNumber: "LN-2023-001",
  originalLoanAmount: "205000", // $265k - $60k down (increased down payment)
  interestRate: "0.065", // 6.5% - realistic for 2023
  termMonths: 360, // 30 years
  currentBalance: "201500", // Slightly paid down
  monthlyPrincipalInterest: "1295", // P&I payment for $201.5k @ 6.5% for 30 years
  monthlyEscrow: "500", // Escrow (taxes $350 + insurance $150)
  totalMonthlyPayment: "1795", // P&I + Escrow
  startDate: "2023-06-15",
  maturityDate: "2053-06-15",
  status: "active" as const,
  isPrimary: true,
  loanPosition: 1,
};

