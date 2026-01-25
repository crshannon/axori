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
 * For a $265k property in Memphis - above market rent for premium property
 * Positioned for positive cash flow (~$200+/month)
 */
export const sampleRentalIncome = {
  monthlyRent: "1950", // Above market for premium well-maintained property
  marketRentEstimate: "1850",
  otherIncomeMonthly: "0", // Additional income sources
  parkingIncomeMonthly: "0",
  laundryIncomeMonthly: "0",
  petRentMonthly: "50", // Example: $50/month pet fee
  storageIncomeMonthly: "0",
  utilityReimbursementMonthly: "0",
};

/**
 * Sample operating expenses data
 * Optimized expenses for a $265k single-family rental property
 * Lower TN taxes and efficient management for positive cash flow
 */
export const sampleOperatingExpenses = {
  propertyTaxAnnual: "3900", // ~$325/month - efficient TN taxes
  insuranceAnnual: "1500", // ~$125/month - good policy
  hoaMonthly: "0",
  waterSewerMonthly: "0", // Typically tenant pays
  electricMonthly: "0", // Typically tenant pays
  gasMonthly: "0", // Typically tenant pays
  lawnCareMonthly: "60", // Monthly lawn maintenance
  pestControlMonthly: "25", // Quarterly service = ~$25/month
  otherExpensesMonthly: "50", // Other miscellaneous expenses (well-maintained property)
  vacancyRate: "0.05", // 5% as decimal
  managementRate: "0.00", // Self-managed
  maintenanceRate: "0.03", // 3% as decimal (well-maintained, newer property)
  capexRate: "0.05", // 5% as decimal (newer 2015 build)
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
 *
 * NOTE: For cash flow calculations, we only use P&I (not escrow) because
 * property tax and insurance are already counted in operating expenses.
 * The escrow is just a pass-through account that pays those same expenses.
 * Setting monthlyEscrow to null/0 prevents double-counting in cash flow calcs.
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
  monthlyEscrow: null, // Not used for cash flow (taxes/insurance already in operating expenses)
  totalMonthlyPayment: "1295", // Just P&I for cash flow (escrow handled via operating expenses)
  startDate: "2023-06-15",
  maturityDate: "2053-06-15",
  status: "active" as const,
  isPrimary: true,
  loanPosition: 1,
};

/**
 * =====================================================
 * SPARSE DATA PROPERTY - For testing limited data scenarios
 * =====================================================
 * This property has only 1 month of transaction data to test
 * how charts and analytics handle sparse/new properties.
 */

/**
 * Sparse data property characteristics - smaller condo
 */
export const sparseDataCharacteristics = {
  propertyType: "Condo",
  bedrooms: 2,
  bathrooms: "2",
  squareFeet: 1100,
  lotSizeSqft: null, // Condo, no lot
  yearBuilt: 2019,
};

/**
 * Sparse data property valuation
 */
export const sparseDataValuation = {
  currentValue: "195000",
  taxAssessedValue: "185000",
  lastAppraisalValue: "198000",
};

/**
 * Sparse data property acquisition - recently purchased
 */
export const sparseDataAcquisition = {
  purchasePrice: "190000",
  purchaseDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15)
    .toISOString()
    .split("T")[0], // Purchased last month
  acquisitionMethod: "traditional",
  closingCostsTotal: "6000",
  downPaymentAmount: "38000", // 20% down
  downPaymentSource: "savings",
  earnestMoney: "3000",
  sellerCredits: "1500",
  buyerAgentCommission: "5700",
};

/**
 * Sparse data property rental income
 */
export const sparseDataRentalIncome = {
  monthlyRent: "1450",
  marketRentEstimate: "1500",
  otherIncomeMonthly: "0",
  parkingIncomeMonthly: "75", // Reserved parking spot
  laundryIncomeMonthly: "0",
  petRentMonthly: "0",
  storageIncomeMonthly: "0",
  utilityReimbursementMonthly: "0",
};

/**
 * Sparse data property operating expenses - condo with HOA
 */
export const sparseDataOperatingExpenses = {
  propertyTaxAnnual: "2400", // Lower tax for condo
  insuranceAnnual: "1200", // Lower insurance for condo
  hoaMonthly: "250", // Condo HOA fee
  waterSewerMonthly: "0", // Included in HOA
  electricMonthly: "0", // Tenant pays
  gasMonthly: "0", // Tenant pays
  lawnCareMonthly: "0", // Included in HOA
  pestControlMonthly: "0", // Included in HOA
  otherExpensesMonthly: "50",
  vacancyRate: "0.05",
  managementRate: "0.10", // Using property manager
  maintenanceRate: "0.03", // Lower for condo
  capexRate: "0.05", // Lower for condo (less exterior maintenance)
};

/**
 * Sparse data property management - using a manager
 */
export const sparseDataManagement = {
  isSelfManaged: false,
  companyName: "Urban Property Management",
  contactName: "Sarah Johnson",
  contactEmail: "sarah@urbanpm.com",
  contactPhone: "901-555-0199",
  contractStartDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15)
    .toISOString()
    .split("T")[0],
  feePercentage: "0.10",
};

/**
 * Sparse data property loan
 */
export const sparseDataLoan = {
  loanType: "conventional" as const,
  lenderName: "Wells Fargo",
  servicerName: "Wells Fargo",
  loanNumber: "WF-2024-SPARSE",
  originalLoanAmount: "152000", // $190k - $38k down
  interestRate: "0.0699", // 6.99%
  termMonths: 360,
  currentBalance: "151800", // Just started
  monthlyPrincipalInterest: "1010",
  monthlyEscrow: null,
  totalMonthlyPayment: "1010",
  startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15)
    .toISOString()
    .split("T")[0],
  maturityDate: new Date(new Date().getFullYear() + 30, new Date().getMonth() - 1, 15)
    .toISOString()
    .split("T")[0],
  status: "active" as const,
  isPrimary: true,
  loanPosition: 1,
};

