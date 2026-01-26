# Learning Hub - Additional Features

**Related**: [SUMMARY.md](./SUMMARY.md) | [EXECUTION.md](./EXECUTION.md)

This document details the additional functionality recommendations for the Learning Hub, based on the Axori platform's focus on property management and wealth building.

---

## Feature Priority Matrix

| Feature | User Value | Dev Effort | Priority | Phase |
|---------|------------|------------|----------|-------|
| Interactive Calculators | High | Medium | P1 | 3 |
| Freedom Number Tracker | High | Low | P1 | 3 |
| Property Analyzer | High | High | P2 | 4 |
| Scenario Modeler | High | High | P2 | 4 |
| Investment Checklists | Medium | Low | P2 | 3 |
| Market Intel | Medium | Medium | P3 | 4 |
| Video Library | Medium | Low | P3 | 3 |
| Achievement System | Low | Medium | P4 | 4 |
| Community Q&A | Low | High | P5 | Future |
| Weekly Digest Emails | Medium | Medium | P3 | 4 |

---

## Interactive Calculator Hub

### Overview

A collection of interactive calculators that help users understand key real estate metrics. Each calculator links to relevant glossary terms and shows the formula being used.

### Route

`/learning-hub/calculators`

### Calculators to Build

#### 1. Cap Rate Calculator

**Purpose**: Calculate capitalization rate from NOI and property value

**Inputs**:
- Net Operating Income (annual) - `$`
- Property Value - `$`

**Output**:
- Cap Rate - `%`
- Interpretation (e.g., "Above average for residential properties")

**Related Terms**: `cap-rate`, `net-operating-income`, `valuation`

#### 2. Cash-on-Cash Return Calculator

**Purpose**: Calculate annual return on actual cash invested

**Inputs**:
- Annual Cash Flow (after debt service) - `$`
- Total Cash Invested (down payment + closing + rehab) - `$`

**Output**:
- Cash-on-Cash Return - `%`
- Comparison to savings rate, stock market average

**Related Terms**: `cash-on-cash-return`, `cash-flow`, `down-payment`

#### 3. DSCR Calculator

**Purpose**: Calculate debt service coverage ratio for loan qualification

**Inputs**:
- Gross Monthly Rent - `$`
- Monthly Operating Expenses - `$`
- Monthly Debt Payment - `$`

**Output**:
- DSCR ratio
- Interpretation (>1.25 = strong, 1.0-1.25 = marginal, <1.0 = negative)
- Typical lender requirements

**Related Terms**: `debt-service-coverage-ratio`, `net-operating-income`

#### 4. Mortgage Payment Calculator

**Purpose**: Calculate monthly payment with amortization breakdown

**Inputs**:
- Loan Amount - `$`
- Interest Rate - `%`
- Loan Term - `years`
- Property Tax (annual) - `$` (optional)
- Insurance (annual) - `$` (optional)

**Output**:
- Monthly Principal & Interest
- Monthly Total (PITI)
- Total Interest Over Life of Loan
- Amortization chart

**Related Terms**: `amortization`, `principal-interest`, `loan-to-value`

#### 5. Refinance Break-Even Calculator

**Purpose**: Determine when refinancing makes financial sense

**Inputs**:
- Current Monthly Payment - `$`
- New Monthly Payment - `$`
- Closing Costs for Refinance - `$`
- Remaining Months on Current Loan - `months`

**Output**:
- Monthly Savings
- Break-Even Point (months)
- Total Savings Over Loan Life
- Recommendation

**Related Terms**: `refinance`, `closing-costs`, `interest-rate-vs-apr`

#### 6. Depreciation Calculator

**Purpose**: Estimate annual depreciation deduction

**Inputs**:
- Purchase Price - `$`
- Land Value (or percentage) - `$` or `%`
- Property Type - `residential` | `commercial`
- Cost Segregation Study? - `yes` | `no`

**Output**:
- Building Value
- Annual Depreciation (standard)
- Accelerated Depreciation (if cost seg)
- Estimated Tax Savings (at 24%, 32%, 37% brackets)

**Related Terms**: `depreciation`, `cost-segregation-study`, `tax-shield`

#### 7. Rent vs Buy Calculator

**Purpose**: Compare renting vs buying for primary residence or investment

**Inputs**:
- Purchase Price - `$`
- Down Payment - `%`
- Interest Rate - `%`
- Monthly Rent (comparable) - `$`
- Expected Appreciation - `%`
- Investment Return (if not buying) - `%`

**Output**:
- Monthly Cost of Ownership
- Monthly Cost of Renting
- Break-Even Year
- 10-Year Wealth Comparison

**Related Terms**: `equity`, `appreciation`, `leverage`

#### 8. 1031 Exchange Calculator

**Purpose**: Calculate deferred taxes and reinvestment requirements

**Inputs**:
- Sale Price of Relinquished Property - `$`
- Original Purchase Price - `$`
- Accumulated Depreciation - `$`
- Capital Gains Tax Rate - `%`

**Output**:
- Total Gain
- Depreciation Recapture
- Estimated Tax (if not exchanging)
- Minimum Purchase Price for Replacement

**Related Terms**: `1031-exchange`, `capital-gains`, `depreciation-recapture`

### Calculator UI Components

```
apps/web/src/components/learning-hub/calculators/
├── CalculatorCard.tsx        # Wrapper with title, description
├── CalculatorInput.tsx       # Currency/percentage/number input
├── CalculatorResult.tsx      # Result display with breakdown
├── CalculatorChart.tsx       # Visualization (Recharts)
├── CalculatorExplanation.tsx # "How it works" section
├── CalculatorCTA.tsx         # Link to related terms/articles
├── CapRateCalculator.tsx
├── CashOnCashCalculator.tsx
├── DSCRCalculator.tsx
├── MortgageCalculator.tsx
├── RefinanceCalculator.tsx
├── DepreciationCalculator.tsx
├── RentVsBuyCalculator.tsx
└── Exchange1031Calculator.tsx
```

---

## Freedom Number Tracker

### Overview

Visual progress tracker toward user's financial independence goal (from onboarding). Shows current equity, projected growth, and actionable steps to accelerate.

### Route

`/learning-hub/freedom-tracker` or widget on `/learning-hub` home

### Features

1. **Progress Visualization**
   - Current total equity vs Freedom Number goal
   - Progress bar or radial chart
   - Percentage complete

2. **Projection**
   - Years to goal at current pace
   - Monthly equity growth rate
   - Impact of appreciation vs principal paydown

3. **Acceleration Suggestions**
   - "Add one more property to reach goal 3 years sooner"
   - "Refinance to increase cash flow by $X/month"
   - "Increase rent by 5% to add $X equity/year"

4. **Learning Path Integration**
   - Link to relevant learning paths based on current phase
   - "You're 40% to your goal - learn about scaling strategies"

### Data Sources

- `users.onboardingData.freedomNumber` - Target goal
- Calculated total equity across portfolio
- Property appreciation rates
- Loan paydown schedules

---

## Property Analyzer

### Overview

Educational tool that analyzes a property (from portfolio or hypothetical) and provides an educational breakdown of key metrics, linking each to glossary terms.

### Route

`/learning-hub/analyzer`

### Features

1. **Input Options**
   - Select property from portfolio
   - Enter hypothetical property details

2. **Analysis Sections**

   **Valuation Analysis**
   - Current value estimate
   - Cap rate vs market average
   - Price per square foot comparison
   - Links: `cap-rate`, `valuation`, `comps`

   **Cash Flow Analysis**
   - Monthly income breakdown
   - Operating expense ratio
   - NOI calculation step-by-step
   - Links: `net-operating-income`, `vacancy-rate`, `operating-expenses`

   **Financing Analysis**
   - Current LTV
   - DSCR ratio
   - Refinance potential
   - Links: `loan-to-value`, `debt-service-coverage-ratio`, `refinance`

   **Tax Benefits Analysis**
   - Annual depreciation
   - Estimated tax savings
   - Cost segregation opportunity
   - Links: `depreciation`, `tax-shield`, `cost-segregation-study`

   **Return Analysis**
   - Cash-on-cash return
   - Total return (cash flow + appreciation + equity + tax)
   - Links: `cash-on-cash-return`, `roi`, `total-return`

3. **Recommendations**
   - Personalized suggestions based on analysis
   - Links to relevant learning content

---

## Scenario Modeler

### Overview

Interactive "what-if" simulation tool that shows how changes in key variables affect property performance.

### Route

`/learning-hub/scenarios`

### Scenarios

1. **Interest Rate Changes**
   - Slider: -2% to +2% from current rate
   - Impact on: Monthly payment, DSCR, cash flow, equity
   - When to use: "Should I lock in a rate now or wait?"

2. **Vacancy Impact**
   - Options: 0%, 5%, 10%, 15%, 20%
   - Impact on: NOI, cash flow, DSCR
   - When to use: "How much vacancy can I absorb?"

3. **Appreciation Projections**
   - Options: 0%, 3%, 5%, 7%, 10% annual
   - Impact on: Equity growth, total return, refinance timeline
   - When to use: "How does appreciation affect my returns?"

4. **Rent Growth**
   - Options: 0%, 2%, 3%, 5% annual
   - Impact on: Cash flow over time, NOI, cap rate
   - When to use: "Should I push for higher rents?"

5. **Refinance Timing**
   - Slider: 6 months to 5 years
   - Impact on: Equity pulled, new payment, cash flow
   - When to use: "When should I refinance?"

6. **Additional Property**
   - Input hypothetical property details
   - Impact on: Portfolio cash flow, total equity, diversification
   - When to use: "How does adding a property affect my portfolio?"

### UI

- Sliders for variable adjustment
- Real-time chart updates
- Comparison table (current vs scenario)
- Save scenarios for later review

---

## Investment Checklists

### Overview

Downloadable/printable checklists for key investment activities. Users can track progress and check off items.

### Route

`/learning-hub/checklists`

### Checklists

1. **Pre-Offer Due Diligence**
   - [ ] Verify ownership and title
   - [ ] Check property taxes and liens
   - [ ] Review rent roll (if occupied)
   - [ ] Analyze comparable sales
   - [ ] Calculate preliminary numbers
   - [ ] Drive by property
   - [ ] Research neighborhood

2. **Property Inspection Checklist**
   - Roof (age, condition, warranty)
   - Foundation (cracks, water intrusion)
   - HVAC (age, recent service)
   - Plumbing (material, water pressure)
   - Electrical (panel, wiring type)
   - Appliances (age, working condition)
   - Windows and doors
   - Exterior (siding, drainage)

3. **Closing Document Review**
   - [ ] Verify all names and addresses
   - [ ] Confirm loan terms match commitment
   - [ ] Review title insurance coverage
   - [ ] Check prorated amounts
   - [ ] Verify seller credits
   - [ ] Review closing costs line by line

4. **Post-Purchase Setup**
   - [ ] Transfer utilities
   - [ ] Set up landlord insurance
   - [ ] Create property file/folder
   - [ ] Add property to Axori
   - [ ] Set up rent collection
   - [ ] Establish CapEx reserve
   - [ ] Schedule initial inspection

5. **Annual Property Review**
   - [ ] Review rent vs market
   - [ ] Assess insurance coverage
   - [ ] Review operating expenses
   - [ ] Check loan refinance opportunities
   - [ ] Update property value estimate
   - [ ] Review tax strategy

### Features

- Copy checklist to personal list
- Check off items (saved to localStorage/database)
- Print-friendly version
- Link items to relevant glossary terms

---

## Market Intel

### Overview

Educational content about real estate markets, personalized to user's target markets (from onboarding).

### Route

`/learning-hub/markets` or section on hub home

### Features

1. **Market Overview Cards**
   - For each target market in user's profile
   - Key metrics: median price, rent, cap rate, appreciation
   - Market cycle assessment

2. **Market Education**
   - "Understanding [City] Real Estate Market"
   - Local regulations and landlord laws
   - Neighborhoods to watch
   - Property type performance

3. **Comparative Analysis**
   - Compare user's target markets
   - Strengths and considerations
   - Investment strategy fit

### Data Sources

- Static educational content initially
- Future: Integration with market data APIs (Zillow, Redfin, Census)

---

## Achievement System

### Overview

Gamification layer that rewards users for learning activities. Badges displayed on profile and hub home.

### Badges

**Learning Milestones**
- 🎯 **First Steps** - Complete your first learning path
- 📚 **Glossary Explorer** - View 25 glossary terms
- 🧮 **Number Cruncher** - Use all 8 calculators
- 🎓 **Dedicated Student** - Complete 5 learning paths

**Knowledge Areas**
- 💰 **Tax Savvy** - Complete tax strategy path
- 🏦 **Financing Expert** - Complete financing path
- 📈 **Deal Analyst** - Complete deal analysis path
- 🔄 **BRRRR Master** - Complete BRRRR strategy path

**Engagement**
- 🔥 **Streak Keeper** - Visit Learning Hub 7 days in a row
- ⭐ **Bookworm** - Bookmark 10 items
- 🏆 **Quiz Champion** - Score 100% on any quiz
- 📝 **Completionist** - Complete all available paths

### Implementation

- Badges stored in user profile
- Achievement checks run on relevant actions
- Toast notification when badge earned
- Badge display on hub home and user profile

---

## Weekly Digest Emails

### Overview

Personalized weekly email with learning recommendations, portfolio insights, and market updates.

### Sections

1. **Your Learning Progress**
   - Paths in progress
   - Suggested next steps
   - Time to complete current path

2. **Personalized Recommendations**
   - Based on portfolio gaps
   - Based on recent activity
   - Trending content in their strategy

3. **Portfolio Insights**
   - Equity change this week
   - Cash flow summary
   - Actionable alerts

4. **Featured Content**
   - New glossary terms
   - New articles
   - Featured calculator

### Implementation

- Email service integration (Resend, SendGrid)
- Cron job for weekly sends
- User preference for opt-in/out
- Unsubscribe link

---

## Community Q&A (Future)

### Overview

User-generated questions with community and expert answers. Think Stack Overflow for real estate investing.

### Features

- Ask questions tagged by category
- Community voting on answers
- Expert-verified answers
- Link to relevant glossary terms
- Search and filter

### Considerations

- Moderation requirements
- Legal disclaimer for advice
- Spam prevention
- Expert verification process

### Recommendation

Defer to Phase 5+ or integrate with existing community tools (Discord, Circle.so).

---

## Integration Opportunities

### With Existing Features

| Learning Hub Feature | Integrates With |
|---------------------|-----------------|
| Calculators | Property Financials page |
| Freedom Tracker | Wealth Journey dashboard |
| Property Analyzer | Property Details page |
| Scenario Modeler | Strategy tab on property |
| Checklists | Add Property wizard |
| Market Intel | Explore page |

### Deep Linking

- From calculator result → "See this for [Property Name]"
- From glossary term → "View in your portfolio"
- From learning path → "Apply to your first property"

### Contextual Triggers

- User views property with low DSCR → Surface DSCR learning content
- User hasn't claimed depreciation → Surface tax strategy path
- User has negative cash flow → Surface optimization content

---

## Implementation Notes

### Start Simple

1. **Phase 3**: Calculators + Freedom Tracker + Checklists
2. **Phase 4**: Property Analyzer + Scenario Modeler + Market Intel
3. **Future**: Achievements + Digest + Community

### Reuse Existing Components

- Use `@axori/ui` components consistently
- Leverage existing chart library (Recharts)
- Follow existing drawer/modal patterns

### Data Strategy

- Start with static content and localStorage
- Add database persistence in Phase 5
- Consider caching for calculated values

### Mobile Considerations

- All features should be mobile-responsive
- Calculators need touch-friendly inputs
- Checklists should work offline
