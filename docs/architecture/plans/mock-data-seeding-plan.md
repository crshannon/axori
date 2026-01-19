# Mock Data Seeding Plan

## Overview

This plan outlines the creation of a mock data seeding system that can populate a specific user's account with realistic test data for development and testing purposes.

## Goals

1. **User-Specific Seeding**: Seed data for a specific user by their Clerk ID
2. **Realistic Data**: Create data that represents real-world usage patterns
3. **Multiple States**: Include both empty state and fully implemented examples
4. **Onboarding Completion**: Pre-fill onboarding data to skip setup flow

## Implementation

### File Structure

```
packages/db/src/seed/
├── markets.ts (existing)
└── mock-user-data.ts (new)
```

### Seed Function

Located in `packages/db/src/seed/mock-user-data.ts`:

- **Function**: `seedMockUserData(clerkId: string)`
- **Purpose**: Seeds comprehensive mock data for a specific user

### Data Created

#### 1. User Onboarding (Completed)

- **onboardingStep**: `null` (completed)
- **onboardingCompleted**: Current timestamp
- **onboardingData**: JSON object with:
  - `phase`: "active_investor"
  - `persona`: "portfolio_builder"
  - `ownership`: { currentProperties: 3, yearsExperience: 5 }
  - `freedomNumber`: 10000
  - `strategy`: { primary: "cash_flow", secondary: "appreciation" }
  - `markets`: ["indianapolis", "memphis", "cleveland"]
- **firstName**: "Demo"
- **lastName**: "User"

#### 2. Portfolio

- **Name**: "Demo Portfolio"
- **Description**: "Demo portfolio for testing"
- **Role**: User is "owner"

#### 3. User Markets

Links user to three markets:

- Indianapolis
- Memphis
- Cleveland

Relationship type: "target_market"

#### 4. Empty State Property

- **Address**: "123 Main Street, Indianapolis, IN 46202"
- **Status**: "draft" (incomplete)
- **No additional data**: Represents a property that was started but not completed

#### 5. Fully Implemented Property

- **Address**: "456 Oak Avenue, Memphis, TN 38103"
- **Status**: "active" (complete)

**Property Characteristics:**

- Type: Single Family
- Bedrooms: 3
- Bathrooms: 2.5
- Square Feet: 1,850
- Lot Size: 7,200 sqft
- Year Built: 2015

**Valuation:**

- Current Value: $285,000
- Purchase Value: $265,000
- ARV: $310,000

**Acquisition:**

- Purchase Price: $265,000
- Purchase Date: 2023-06-15
- Acquisition Method: Traditional Sale
- Closing Costs: $8,500
- Down Payment: $53,000 (cash)
- Earnest Money: $5,000
- Seller Credits: $2,000
- Buyer Agent Commission: $7,950
- Owner Occupied: No

**Rental Income:**

- Monthly Rent: $1,850
- Annual Rent: $22,200
- Market Rent: $1,900
- Rent Growth Rate: 3.5%

**Operating Expenses:**

- Property Taxes: $4,200/year
- Insurance: $1,800/year
- Maintenance: $150/month
- Landscaping: $75/month
- Pest Control: $25/month
- CapEx Reserve: $200/month
- Other Expenses: $50/month
- Vacancy Rate: 5%

**Property Management:**

- Self Managed: No
- Management Company: "ABC Property Management"
- Contact: John Smith (john@abcpm.com, 555-123-4567)
- Contract Start: 2023-07-01
- Fee: 10%

**Loan:**

- Type: Conventional
- Lender: First National Bank
- Servicer: First National Bank
- Loan Number: LN-2023-001
- Original Amount: $212,000
- Interest Rate: 6.5%
- Term: 360 months (30 years)
- Current Balance: $208,500
- Start Date: 2023-06-15
- Maturity Date: 2053-06-15
- Status: Active
- Primary: Yes

## Usage

### Command Line

```bash
# Seed data for a specific user
pnpm --filter @axori/db db:seed:user <clerk-id>

# Example
pnpm --filter @axori/db db:seed:user user_2abc123xyz
```

### Programmatic

```typescript
import { seedMockUserData } from "@axori/db/src/seed/mock-user-data";

await seedMockUserData("user_2abc123xyz");
```

## Prerequisites

1. **User Must Exist**: The user must already exist in the database (created via Clerk sign-up)
2. **Database Connection**: Valid `DATABASE_URL` in environment
3. **Schema Up to Date**: Database schema must match current Drizzle schema

## Error Handling

- If user not found, throws error with clear message
- If portfolio exists, uses existing portfolio
- If user markets exist, skips duplicate creation
- Logs all operations for debugging

## Future Enhancements

1. **Multiple Property Variations**: Add more property examples (different types, states)
2. **Expense Transactions**: Add sample expense records
3. **Multiple Loans**: Add refinancing scenarios
4. **Historical Data**: Add properties with historical transactions
5. **Tenant Data**: Add lease/tenant information when that schema exists
6. **Document Links**: Add sample document references
7. **Market Variations**: Seed different market combinations

## Testing

After seeding, verify:

1. User onboarding is marked complete
2. Portfolio exists and user has access
3. Empty property shows in draft state
4. Full property shows all data in UI
5. Loan appears in debt architecture
6. Acquisition intel shows correct values
7. All calculations (equity velocity, cash flow) are correct

## Notes

- This is for development/testing only
- Data is realistic but fictional
- Can be run multiple times (idempotent where possible)
- Consider adding cleanup script to remove seeded data
