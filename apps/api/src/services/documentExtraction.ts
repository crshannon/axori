import Anthropic from "@anthropic-ai/sdk";
import { DOCUMENT_TYPES, type DocumentType } from "@axori/shared/src/validation";

// Lazy initialization of Anthropic client
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required");
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Extracted data schemas for each document type
 */
export interface LeaseExtraction {
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  monthlyRent?: number;
  securityDeposit?: number;
  petDeposit?: number;
  lateFeePct?: number;
  rentDueDay?: number;
  paymentMethod?: string;
  specialTerms?: string[];
}

export interface TaxBillExtraction {
  taxYear?: number;
  assessedValue?: number;
  landValue?: number;
  improvementValue?: number;
  totalTaxAmount?: number;
  exemptions?: string[];
  dueDate?: string;
  parcelNumber?: string;
  taxingAuthority?: string;
}

export interface InsurancePolicyExtraction {
  policyNumber?: string;
  carrier?: string;
  coverageType?: string;
  effectiveDate?: string;
  expirationDate?: string;
  premiumAmount?: number;
  premiumFrequency?: string;
  dwellingCoverage?: number;
  liabilityCoverage?: number;
  deductible?: number;
  namedInsured?: string;
  propertyAddress?: string;
}

export interface ClosingDisclosureExtraction {
  closingDate?: string;
  purchasePrice?: number;
  loanAmount?: number;
  interestRate?: number;
  loanTerm?: number;
  monthlyPayment?: number;
  closingCosts?: number;
  sellerCredits?: number;
  prepaidItems?: number;
  escrowDeposit?: number;
  titleCompany?: string;
  lender?: string;
}

export interface MortgageStatementExtraction {
  statementDate?: string;
  loanNumber?: string;
  principalBalance?: number;
  interestRate?: number;
  monthlyPayment?: number;
  principalPaid?: number;
  interestPaid?: number;
  escrowPaid?: number;
  escrowBalance?: number;
  nextPaymentDue?: string;
  yearToDateInterest?: number;
  yearToDatePrincipal?: number;
}

export interface HOAStatementExtraction {
  statementDate?: string;
  accountNumber?: string;
  associationName?: string;
  duesAmount?: number;
  duesFrequency?: string;
  specialAssessments?: number;
  balance?: number;
  dueDate?: string;
  managementCompany?: string;
}

export interface UtilityBillExtraction {
  utilityType?: string;
  accountNumber?: string;
  statementDate?: string;
  serviceAddress?: string;
  totalAmount?: number;
  usage?: number;
  usageUnit?: string;
  dueDate?: string;
  provider?: string;
}

export interface ContractorInvoiceExtraction {
  invoiceNumber?: string;
  invoiceDate?: string;
  vendorName?: string;
  vendorContact?: string;
  totalAmount?: number;
  laborCost?: number;
  materialsCost?: number;
  description?: string;
  category?: string; // repair, improvement, maintenance
  dueDate?: string;
  paymentStatus?: string;
}

export interface Form1099Extraction {
  taxYear?: number;
  payerName?: string;
  payerTIN?: string;
  recipientName?: string;
  recipientTIN?: string;
  grossRents?: number;
  royalties?: number;
  otherIncome?: number;
  federalTaxWithheld?: number;
}

export interface YearEndReportExtraction {
  year?: number;
  totalRentalIncome?: number;
  totalExpenses?: number;
  netOperatingIncome?: number;
  occupancyRate?: number;
  expenseBreakdown?: Record<string, number>;
}

export interface GenericExtraction {
  documentTitle?: string;
  documentDate?: string;
  relevantDates?: string[];
  monetaryAmounts?: { description: string; amount: number }[];
  parties?: string[];
  summary?: string;
  keyTerms?: string[];
}

export type ExtractedData =
  | LeaseExtraction
  | TaxBillExtraction
  | InsurancePolicyExtraction
  | ClosingDisclosureExtraction
  | MortgageStatementExtraction
  | HOAStatementExtraction
  | UtilityBillExtraction
  | ContractorInvoiceExtraction
  | Form1099Extraction
  | YearEndReportExtraction
  | GenericExtraction;

/**
 * Document type specific extraction prompts
 */
const EXTRACTION_PROMPTS: Record<DocumentType, string> = {
  lease: `Extract the following information from this lease agreement:
- Tenant name and contact (email, phone)
- Lease start date and end date
- Monthly rent amount
- Security deposit amount
- Pet deposit (if any)
- Late fee percentage
- Rent due day of month
- Payment method
- Any special terms or conditions

Return as JSON with these fields: tenantName, tenantEmail, tenantPhone, leaseStartDate, leaseEndDate, monthlyRent, securityDeposit, petDeposit, lateFeePct, rentDueDay, paymentMethod, specialTerms (array)`,

  tax_bill: `Extract the following from this property tax bill:
- Tax year
- Assessed value (total, land, improvements)
- Total tax amount due
- Any exemptions applied
- Payment due date
- Parcel/property ID number
- Taxing authority name

Return as JSON with: taxYear, assessedValue, landValue, improvementValue, totalTaxAmount, exemptions (array), dueDate, parcelNumber, taxingAuthority`,

  insurance_policy: `Extract from this insurance policy:
- Policy number
- Insurance carrier/company
- Coverage type (homeowner, landlord, etc.)
- Effective and expiration dates
- Premium amount and frequency
- Dwelling coverage amount
- Liability coverage amount
- Deductible
- Named insured
- Property address covered

Return as JSON with: policyNumber, carrier, coverageType, effectiveDate, expirationDate, premiumAmount, premiumFrequency, dwellingCoverage, liabilityCoverage, deductible, namedInsured, propertyAddress`,

  insurance_claim: `Extract from this insurance claim document:
- Claim number
- Date of loss
- Type of damage/claim
- Estimated or actual repair cost
- Deductible applied
- Claim status
- Adjuster contact info

Return as JSON with relevant fields.`,

  closing_disclosure: `Extract from this closing disclosure:
- Closing date
- Purchase price
- Loan amount
- Interest rate
- Loan term (years)
- Monthly principal & interest payment
- Total closing costs
- Seller credits
- Prepaid items total
- Escrow deposit amount
- Title company name
- Lender name

Return as JSON with: closingDate, purchasePrice, loanAmount, interestRate, loanTerm, monthlyPayment, closingCosts, sellerCredits, prepaidItems, escrowDeposit, titleCompany, lender`,

  deed: `Extract from this deed:
- Grantor (seller) name
- Grantee (buyer) name
- Property legal description
- Recording date
- Document/recording number
- Consideration amount (if shown)

Return as JSON with relevant fields.`,

  title_policy: `Extract from this title insurance policy:
- Policy number
- Policy date
- Amount of insurance
- Property description
- Named insured
- Title company
- Any exceptions or exclusions

Return as JSON with relevant fields.`,

  appraisal: `Extract from this property appraisal:
- Appraisal date
- Appraised value
- Property type
- Square footage
- Year built
- Number of bedrooms/bathrooms
- Lot size
- Appraiser name/company
- Comparable sales used

Return as JSON with relevant fields.`,

  inspection: `Extract from this property inspection report:
- Inspection date
- Inspector name/company
- Major issues found
- Minor issues found
- Systems inspected
- Recommended repairs with estimated costs
- Overall condition assessment

Return as JSON with relevant fields.`,

  mortgage_statement: `Extract from this mortgage statement:
- Statement date
- Loan/account number
- Current principal balance
- Interest rate
- Monthly payment amount
- Principal paid this period
- Interest paid this period
- Escrow payment
- Escrow balance
- Next payment due date
- Year-to-date interest paid
- Year-to-date principal paid

Return as JSON with: statementDate, loanNumber, principalBalance, interestRate, monthlyPayment, principalPaid, interestPaid, escrowPaid, escrowBalance, nextPaymentDue, yearToDateInterest, yearToDatePrincipal`,

  hoa_statement: `Extract from this HOA statement:
- Statement date
- Account number
- Association name
- Regular dues amount and frequency
- Special assessments (if any)
- Current balance
- Payment due date
- Management company name

Return as JSON with: statementDate, accountNumber, associationName, duesAmount, duesFrequency, specialAssessments, balance, dueDate, managementCompany`,

  utility_bill: `Extract from this utility bill:
- Type of utility (electric, gas, water, etc.)
- Account number
- Statement/bill date
- Service address
- Total amount due
- Usage amount and unit
- Payment due date
- Provider/company name

Return as JSON with: utilityType, accountNumber, statementDate, serviceAddress, totalAmount, usage, usageUnit, dueDate, provider`,

  receipt: `Extract from this receipt:
- Vendor/store name
- Receipt date
- Items purchased with prices
- Total amount
- Payment method
- Category (supplies, repairs, etc.)

Return as JSON with relevant fields.`,

  contractor_invoice: `Extract from this contractor invoice:
- Invoice number
- Invoice date
- Contractor/vendor name and contact
- Total amount
- Labor cost
- Materials cost
- Description of work
- Category (repair, improvement, maintenance)
- Payment due date
- Payment status

Return as JSON with: invoiceNumber, invoiceDate, vendorName, vendorContact, totalAmount, laborCost, materialsCost, description, category, dueDate, paymentStatus`,

  permit: `Extract from this permit document:
- Permit number
- Issue date
- Permit type (building, electrical, plumbing, etc.)
- Project description
- Contractor name
- Permit cost
- Expiration date
- Inspection requirements

Return as JSON with relevant fields.`,

  year_end_report: `Extract from this year-end property report:
- Report year
- Total rental income
- Total expenses
- Net operating income
- Occupancy rate
- Breakdown of expenses by category

Return as JSON with: year, totalRentalIncome, totalExpenses, netOperatingIncome, occupancyRate, expenseBreakdown (object with categories as keys)`,

  rent_roll: `Extract from this rent roll:
- Report date
- Total units
- Occupied units
- Total monthly rent
- Individual unit details (unit number, tenant, rent amount, lease dates)
- Vacancy rate

Return as JSON with relevant fields.`,

  "1099": `Extract from this 1099 form:
- Tax year
- Payer name and TIN
- Recipient name and TIN
- Gross rents (Box 1)
- Royalties (Box 2)
- Other income (Box 3)
- Federal income tax withheld (Box 4)

Return as JSON with: taxYear, payerName, payerTIN, recipientName, recipientTIN, grossRents, royalties, otherIncome, federalTaxWithheld`,

  w9: `Extract from this W-9 form:
- Name
- Business name (if different)
- Tax classification
- Address
- TIN (SSN or EIN)
- Certification date

Return as JSON with relevant fields.`,

  other: `Analyze this document and extract:
- Document title/type
- Document date
- Any relevant dates mentioned
- All monetary amounts with descriptions
- Parties/names mentioned
- Brief summary of document purpose
- Key terms or conditions

Return as JSON with: documentTitle, documentDate, relevantDates (array), monetaryAmounts (array of {description, amount}), parties (array), summary, keyTerms (array)`,
};

/**
 * Extract data from a document using Claude Vision
 */
export async function extractDocumentData(
  documentType: DocumentType,
  fileContent: Buffer,
  mimeType: string,
  filename: string
): Promise<{
  extractedData: ExtractedData;
  confidence: number;
  rawResponse: string;
}> {
  const client = getAnthropicClient();
  const prompt = EXTRACTION_PROMPTS[documentType];

  // Determine media type for the API
  const mediaType = mimeType.startsWith("image/")
    ? (mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
    : "application/pdf";

  const base64Content = fileContent.toString("base64");

  const systemPrompt = `You are a document analysis expert specializing in real estate and property management documents.
Your task is to carefully extract structured data from the provided document.
Always respond with valid JSON only - no explanations or markdown formatting.
If a field cannot be found or is unclear, omit it from the response rather than guessing.
Dates should be in YYYY-MM-DD format when possible.
Currency amounts should be numbers without symbols or commas.`;

  try {
    // For PDFs, we use the document type - Claude supports PDF natively
    const content: Anthropic.MessageCreateParams["messages"][0]["content"] =
      mimeType === "application/pdf"
        ? [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Content,
              },
            },
            {
              type: "text",
              text: `Filename: ${filename}\n\n${prompt}`,
            },
          ]
        : [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: base64Content,
              },
            },
            {
              type: "text",
              text: `Filename: ${filename}\n\n${prompt}`,
            },
          ];

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content,
        },
      ],
    });

    // Extract text from response
    const textContent = response.content.find((c) => c.type === "text");
    const rawResponse = textContent?.type === "text" ? textContent.text : "";

    // Parse the JSON response
    let extractedData: ExtractedData;
    try {
      // Clean up the response - remove any markdown code blocks
      const cleanedResponse = rawResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      extractedData = JSON.parse(cleanedResponse);
    } catch {
      console.error("Failed to parse extraction response:", rawResponse);
      extractedData = {
        summary: "Failed to parse document. Raw extraction attempted.",
        documentTitle: filename,
      };
    }

    // Calculate confidence based on response stop reason and content
    let confidence = 0.85; // Base confidence
    if (response.stop_reason === "end_turn") {
      confidence += 0.1;
    }
    // Lower confidence if we couldn't parse the JSON properly
    if (!rawResponse.includes("{")) {
      confidence = 0.3;
    }

    return {
      extractedData,
      confidence: Math.min(confidence, 1.0),
      rawResponse,
    };
  } catch (error) {
    console.error("Document extraction failed:", error);
    throw error;
  }
}

/**
 * Validate extracted data against expected schema
 */
export function validateExtractedData(
  documentType: DocumentType,
  data: ExtractedData
): { isValid: boolean; missingFields: string[] } {
  const requiredFieldsByType: Partial<Record<DocumentType, string[]>> = {
    lease: ["monthlyRent"],
    tax_bill: ["totalTaxAmount", "taxYear"],
    insurance_policy: ["premiumAmount", "policyNumber"],
    mortgage_statement: ["principalBalance", "interestRate"],
    "1099": ["taxYear", "grossRents"],
  };

  const requiredFields = requiredFieldsByType[documentType] || [];
  const missingFields = requiredFields.filter(
    (field) => !(field in data) || data[field as keyof ExtractedData] === undefined
  );

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}
