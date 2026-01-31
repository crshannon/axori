/**
 * Roadmap Milestones Seed
 *
 * Seeds Forge milestones and tickets based on the roadmap progress review.
 * Run with: pnpm db:seed:roadmap
 *
 * Generated: January 31, 2026
 * Session: claude/review-roadmap-progress-QPiW7
 */

import { db } from "../client";
import { forgeMilestones, forgeTickets } from "../schema/forge";
import { sql } from "drizzle-orm";

interface MilestoneData {
  name: string;
  description: string;
  color: string;
  targetDate?: string;
  sortOrder: number;
  tickets: TicketData[];
}

interface TicketData {
  title: string;
  description: string;
  type: "feature" | "bug" | "chore" | "refactor" | "docs";
  priority: "critical" | "high" | "medium" | "low";
  estimate: number;
  protocol:
    | "opus_full_feature"
    | "opus_architecture"
    | "sonnet_implementation"
    | "sonnet_bug_fix"
    | "haiku_quick_edit"
    | "haiku_docs";
  labels: Array<string>;
}

// Get next ticket number
async function getNextTicketNumber(): Promise<number> {
  const [result] = await db
    .select({
      nextNum: sql<number>`COALESCE(MAX(CAST(SUBSTRING(identifier FROM 5) AS INTEGER)), 0) + 1`,
    })
    .from(forgeTickets);
  return result?.nextNum ?? 1;
}

const milestones: Array<MilestoneData> = [
  {
    name: "Property Scoring Engine",
    description:
      "Implement the 5-dimension scoring system that makes Axori context-aware. This is the core differentiator for the platform.",
    color: "#10b981", // emerald
    targetDate: "2026-02-28",
    sortOrder: 1,
    tickets: [
      {
        title: "Create property score calculation service",
        description: `Create a new service in \`apps/api/src/services/\` that orchestrates the 5-dimension property scoring system.

The service should:
1. Accept a property ID and calculate all 5 dimension scores
2. Return individual dimension scores (0-25 points each) and total score (0-100)
3. Store results in the property_scores table
4. Trigger recalculation when relevant property data changes

Scoring dimensions:
- Financial Performance (20-25 pts): CoC return, cash flow quality, DSCR, rent optimization
- Equity Velocity (20-25 pts): Principal paydown, appreciation rate, equity position
- Risk Profile (15-20 pts): Vacancy rate, market concentration, insurance coverage, lease term
- Operational Health (15-20 pts): Maintenance ratio, tenant quality, PM performance
- Strategic Alignment (15-20 pts): Goal match based on investor strategy`,
        type: "feature",
        priority: "high",
        estimate: 5,
        protocol: "sonnet_implementation",
        labels: ["scoring", "api", "core"],
      },
      {
        title: "Implement Financial Performance score calculation",
        description: `Implement the Financial Performance dimension (20-25 points) of the property scoring system.

Calculate based on:
- Cash-on-Cash Return vs benchmark (regional average): 0-8 pts
- Cash Flow Quality (consistency, trend): 0-6 pts
- DSCR (Debt Service Coverage Ratio): 0-5 pts
- Rent Optimization (actual vs market rent from Rentcast): 0-6 pts

Use data from:
- propertyRentalIncome table (actual rent)
- propertyOperatingExpenses table (expenses)
- loans table (debt service)
- Rentcast integration (market rent)

Return a score object with breakdown and explanation.`,
        type: "feature",
        priority: "high",
        estimate: 3,
        protocol: "sonnet_implementation",
        labels: ["scoring", "financials"],
      },
      {
        title: "Implement Equity Velocity score calculation",
        description: `Implement the Equity Velocity dimension (20-25 points) of the property scoring system.

Calculate based on:
- Principal Paydown Progress (YTD vs expected): 0-8 pts
- Appreciation Rate (property value growth): 0-8 pts
- Equity Position vs Initial Investment: 0-9 pts

Use data from:
- loans table (principal balance, original amount)
- propertyValuation table (current value, historical)
- propertyAcquisition table (purchase price, down payment)

Consider ARV for BRRRR properties.`,
        type: "feature",
        priority: "high",
        estimate: 3,
        protocol: "sonnet_implementation",
        labels: ["scoring", "equity"],
      },
      {
        title: "Implement Risk Profile score calculation",
        description: `Implement the Risk Profile dimension (15-20 points) of the property scoring system.

Calculate based on:
- Vacancy Rate (actual vs budget): 0-5 pts
- Market Concentration Risk: 0-5 pts
- Insurance Coverage Adequacy: 0-5 pts
- Lease Term Remaining: 0-5 pts

Use data from:
- propertyOperatingExpenses (vacancy rate)
- markets table (concentration analysis)
- propertyDocuments (insurance policies)
- propertyRentalIncome (lease dates)

Flag high-risk items for recommendations.`,
        type: "feature",
        priority: "medium",
        estimate: 3,
        protocol: "sonnet_implementation",
        labels: ["scoring", "risk"],
      },
      {
        title: "Implement Operational Health score calculation",
        description: `Implement the Operational Health dimension (15-20 points) of the property scoring system.

Calculate based on:
- Maintenance Ratio (actual vs budget): 0-6 pts
- Tenant Quality Indicators: 0-5 pts
- Property Manager Performance: 0-5 pts
- Reserve Fund Health: 0-4 pts

Use data from:
- propertyTransactions (maintenance expenses)
- propertyOperatingExpenses (budgets)
- propertyManagement (PM details)
- propertyBankAccounts (reserve balances)`,
        type: "feature",
        priority: "medium",
        estimate: 3,
        protocol: "sonnet_implementation",
        labels: ["scoring", "operations"],
      },
      {
        title: "Implement Strategic Alignment score calculation",
        description: `Implement the Strategic Alignment dimension (15-20 points) of the property scoring system.

Calculate based on:
- Goal Match (property performance vs investor strategy): 0-10 pts
- Timeline Alignment (hold period progress): 0-5 pts
- Exit Strategy Readiness: 0-5 pts

User strategies:
- Cash Flow: Weight income stability heavily
- Appreciation: Weight equity growth heavily
- BRRRR: Track phase progress, ARV achievement
- Balanced: Even weighting

Use data from:
- User preferences (strategy selection)
- Property settings (hold timeline, exit strategy)
- All scoring dimensions for weighting`,
        type: "feature",
        priority: "medium",
        estimate: 2,
        protocol: "sonnet_implementation",
        labels: ["scoring", "strategy"],
      },
      {
        title: "Wire PropertyScoreGauge to real calculated data",
        description: `Update the PropertyScoreGauge component to display real calculated scores instead of placeholder data.

Tasks:
1. Create usePropertyScore hook in apps/web/src/hooks/api/
2. Call GET /api/properties/:id/score endpoint
3. Display total score with color coding (red <40, yellow 40-70, green >70)
4. Add loading and error states
5. Show trend indicator (up/down/stable)

The component exists at apps/web/src/components/ - find and update it.`,
        type: "feature",
        priority: "high",
        estimate: 2,
        protocol: "sonnet_implementation",
        labels: ["scoring", "ui", "components"],
      },
      {
        title: "Wire RadarChart to score breakdown data",
        description: `Update the RadarChart component to display the 5-dimension score breakdown.

Tasks:
1. Connect to usePropertyScore hook
2. Map 5 dimensions to radar chart axes
3. Add dimension labels with explanations on hover
4. Style with appropriate colors per dimension
5. Add comparison overlay (portfolio average or benchmark)

The RadarChart component exists - find and update with real data integration.`,
        type: "feature",
        priority: "medium",
        estimate: 2,
        protocol: "sonnet_implementation",
        labels: ["scoring", "ui", "charts"],
      },
      {
        title: "Add score-based recommendations engine",
        description: `Create a recommendations engine that surfaces actionable insights based on low-scoring dimensions.

Recommendations examples:
- Risk score low due to lease expiry: "Your lease expires in 30 days - consider starting renewal process"
- Financial score low due to rent: "Your rent is 15% below market - consider rent increase at renewal"
- Operational health low: "Maintenance costs 40% above budget - review vendor contracts"

Implementation:
1. Create recommendation generation service
2. Store recommendations in database with dismissal tracking
3. Create AxoriSuggestions component integration
4. Add to property overview page`,
        type: "feature",
        priority: "medium",
        estimate: 3,
        protocol: "sonnet_implementation",
        labels: ["scoring", "ai", "recommendations"],
      },
    ],
  },
  {
    name: "Market Intelligence",
    description:
      "Enhanced explore tab with comprehensive market analysis, comparison tools, and discovery features for aspiring investors.",
    color: "#8b5cf6", // violet
    targetDate: "2026-03-15",
    sortOrder: 2,
    tickets: [
      {
        title: "Build market scorecard component",
        description: `Create a MarketScorecard component that displays comprehensive market metrics.

Display metrics from Rentcast integration:
- Job Growth Rate (%)
- Rent Growth Trend (%)
- Price Appreciation Rate (%)
- Population Growth (%)
- Landlord-Friendliness Score
- Median Home Price
- Median Rent
- Rent-to-Price Ratio
- Cap Rate Range

Design:
- Card layout with key metrics prominently displayed
- Color-coded indicators (green/yellow/red)
- Trend arrows for growth metrics
- "Watch Market" toggle button
- Link to detailed market view`,
        type: "feature",
        priority: "high",
        estimate: 3,
        protocol: "sonnet_implementation",
        labels: ["explore", "markets", "ui"],
      },
      {
        title: "Create market comparison view",
        description: `Build a side-by-side market comparison feature allowing users to compare 2-3 markets.

Features:
- Select up to 3 markets from search/watchlist
- Side-by-side comparison table
- Highlight best/worst values per metric
- Radar chart overlay for visual comparison
- Export comparison as PDF/image

Metrics to compare:
- All Rentcast market metrics
- Affordability index
- Investment score calculation
- Pro/con summary`,
        type: "feature",
        priority: "medium",
        estimate: 3,
        protocol: "sonnet_implementation",
        labels: ["explore", "markets", "comparison"],
      },
      {
        title: "Add property search within markets",
        description: `Implement property search functionality within selected markets using Rentcast property API.

Features:
- Search by market/zip/city
- Filters: price range, beds, baths, property type, ROI potential
- List and map views
- Quick analysis card per property (estimated cash flow, cap rate)
- Save to "Considering" list

API integration:
- Use Rentcast property search endpoint
- Cache results for performance
- Rate limit user searches (tier-based)`,
        type: "feature",
        priority: "high",
        estimate: 5,
        protocol: "sonnet_implementation",
        labels: ["explore", "properties", "search"],
      },
      {
        title: "Enhance cash flow projection calculator",
        description: `Improve the existing CalculatorModal with more comprehensive projections.

Enhancements:
- Pre-fill with Rentcast market data for selected properties
- Multiple scenarios (conservative, moderate, aggressive)
- 5-year projection with appreciation
- Include all expense categories
- BRRRR mode for rehab calculations
- Print/export report

Metrics to calculate:
- Monthly cash flow
- Annual cash-on-cash return
- Cap rate
- Total ROI (with appreciation)
- Break-even analysis`,
        type: "feature",
        priority: "medium",
        estimate: 2,
        protocol: "sonnet_implementation",
        labels: ["explore", "calculator", "analysis"],
      },
      {
        title: "Add rent-this-later scenario calculator",
        description: `Create a calculator for primary residence buyers to model future rental potential.

Scenario:
- User owns or is buying a primary residence
- Wants to know: "What if I rent this in X years?"

Inputs:
- Current property value / purchase price
- Current mortgage details
- Projected hold period before renting
- Market rent estimate (from Rentcast)

Outputs:
- Projected property value at rental start
- Projected mortgage balance
- Expected monthly cash flow
- Cash-on-cash return (based on equity at that time)
- Comparison: sell vs rent analysis`,
        type: "feature",
        priority: "medium",
        estimate: 3,
        protocol: "sonnet_implementation",
        labels: ["explore", "calculator", "primary-to-rental"],
      },
    ],
  },
  {
    name: "AI-Powered Analysis",
    description:
      "User-facing AI features that analyze properties, provide recommendations, and detect portfolio issues. Key differentiator for paid tiers.",
    color: "#f59e0b", // amber
    targetDate: "2026-03-31",
    sortOrder: 3,
    tickets: [
      {
        title: "Build Property Acquisition Analyzer",
        description: `Create an AI-powered property acquisition analysis feature.

User flow:
1. User pastes listing URL or enters property details
2. System fetches property data (if URL) or accepts manual entry
3. AI analyzes against user's portfolio and strategy
4. Returns: cash flow projection, portfolio fit assessment, buy/pass recommendation

Components:
- PropertyAnalyzerDrawer with URL input and manual form
- Analysis results display with scoring
- Comparison to existing portfolio properties
- Risk assessment

Use Claude API for analysis with structured prompts.
Track AI usage for tier limits.`,
        type: "feature",
        priority: "high",
        estimate: 8,
        protocol: "opus_full_feature",
        labels: ["ai", "acquisition", "analysis"],
      },
      {
        title: "Implement rent optimization suggestions",
        description: `Create AI-driven rent optimization recommendations.

Analysis:
- Compare current rent to Rentcast market data
- Analyze lease renewal timing
- Consider property improvements impact
- Factor in vacancy risk of rent increases

Output:
- Recommended rent range
- Optimal increase timing
- Risk assessment for each scenario
- Lease renewal talking points

Display in property financials tab and as recommendation cards.`,
        type: "feature",
        priority: "medium",
        estimate: 3,
        protocol: "sonnet_implementation",
        labels: ["ai", "rent", "optimization"],
      },
      {
        title: "Add portfolio concentration analysis",
        description: `Analyze portfolio for concentration risks and suggest rebalancing.

Risk factors:
- Geographic concentration (single market/region)
- Property type concentration
- Tenant type concentration
- Financing concentration (single lender, ARM exposure)
- Value concentration (one property dominates)

Output:
- Concentration risk score
- Visual breakdown (pie charts)
- Diversification recommendations
- "What if" scenarios for new acquisitions`,
        type: "feature",
        priority: "medium",
        estimate: 3,
        protocol: "sonnet_implementation",
        labels: ["ai", "portfolio", "risk"],
      },
      {
        title: "Add performance outlier detection",
        description: `Flag properties performing significantly above or below portfolio averages.

Detection criteria:
- Cash flow deviation from portfolio average
- Expense ratio anomalies
- Vacancy rate outliers
- Appreciation rate deviation

For each outlier:
- Identify root cause factors
- Suggest investigation areas
- Recommend actions

Display on dashboard and in recommendations.`,
        type: "feature",
        priority: "medium",
        estimate: 3,
        protocol: "sonnet_implementation",
        labels: ["ai", "portfolio", "outliers"],
      },
      {
        title: "Create AI usage tracking for users",
        description: `Implement per-user AI interaction tracking for tier-based limits.

Features:
- Track AI interactions per user per billing period
- Different limits per tier (Free: 5, Pro: 50, Portfolio: 200, Enterprise: unlimited)
- Usage display in account settings
- Upgrade prompts when approaching/exceeding limits
- Reset on billing cycle (Stripe webhook)

Database:
- Add ai_usage table or extend user_preferences
- Track: user_id, interaction_type, tokens_used, timestamp`,
        type: "feature",
        priority: "high",
        estimate: 2,
        protocol: "sonnet_implementation",
        labels: ["ai", "billing", "limits"],
      },
    ],
  },
  {
    name: "Document Export Enhancements",
    description:
      "Better document management with bulk operations and enhanced CPA package generation for tax season.",
    color: "#06b6d4", // cyan
    targetDate: "2026-02-15",
    sortOrder: 4,
    tickets: [
      {
        title: "Implement bulk document download as zip",
        description: `Add ability to download multiple documents as a zip file.

Features:
- Select multiple documents in document list
- "Download Selected" button generates zip
- Progress indicator for large downloads
- Include by property, by year, or custom selection

Implementation:
- Use JSZip or server-side zip generation
- For large sets, use background job with notification
- Preserve folder structure in zip`,
        type: "feature",
        priority: "medium",
        estimate: 3,
        protocol: "sonnet_implementation",
        labels: ["documents", "export", "bulk"],
      },
      {
        title: "Enhanced CPA package with folder structure",
        description: `Improve TaxExportPanel to generate organized CPA packages.

Package structure:
\`\`\`
CPA-Package-2025/
├── Income/
│   ├── PropertyName1/
│   │   ├── 1099s/
│   │   └── Rent-Receipts/
│   └── PropertyName2/
├── Expenses/
│   ├── PropertyName1/
│   │   ├── Insurance/
│   │   ├── Taxes/
│   │   ├── Repairs/
│   │   └── Utilities/
├── Depreciation/
│   ├── PropertyName1/
│   │   ├── Cost-Seg-Study.pdf
│   │   └── Improvements/
├── Closing-Documents/
└── Summary-Report.pdf
\`\`\`

Include auto-generated summary report with totals.`,
        type: "feature",
        priority: "high",
        estimate: 3,
        protocol: "sonnet_implementation",
        labels: ["documents", "export", "cpa"],
      },
      {
        title: "Add tax year summary report generation",
        description: `Generate a comprehensive tax year summary report.

Report sections:
1. Portfolio Overview (property count, total value)
2. Income Summary (by property and category)
3. Expense Summary (by property and category)
4. Depreciation Summary (by property)
5. Capital Improvements
6. Document Checklist (what's missing)

Output formats: PDF and CSV
Include Axori branding.`,
        type: "feature",
        priority: "medium",
        estimate: 2,
        protocol: "sonnet_implementation",
        labels: ["documents", "export", "reports"],
      },
    ],
  },
  {
    name: "Observability & Monitoring",
    description:
      "Production-grade monitoring, analytics, and error tracking for reliability.",
    color: "#ec4899", // pink
    targetDate: "2026-02-10",
    sortOrder: 5,
    tickets: [
      {
        title: "Integrate PostHog analytics",
        description: `Add PostHog for product analytics.

Track key events:
- User signup/login
- Property added/updated/deleted
- Document uploaded
- Score viewed
- Calculator used
- Subscription changed
- Feature used (for tier analysis)

Setup:
- Add PostHog SDK to web app
- Configure server-side tracking for API events
- Set up user identification (Clerk ID)
- Create initial dashboards`,
        type: "feature",
        priority: "medium",
        estimate: 2,
        protocol: "sonnet_implementation",
        labels: ["observability", "analytics"],
      },
      {
        title: "Add Sentry error tracking",
        description: `Set up Sentry for error tracking across web and API.

Configuration:
- Add @sentry/react to web app
- Add @sentry/node to API
- Configure source maps upload in build
- Set up environment tagging (dev/staging/prod)
- Configure alert rules for critical errors

Integration points:
- React error boundaries
- API error middleware
- Unhandled promise rejections`,
        type: "feature",
        priority: "medium",
        estimate: 2,
        protocol: "sonnet_implementation",
        labels: ["observability", "errors"],
      },
      {
        title: "Create key event tracking constants",
        description: `Define centralized event tracking constants for consistency.

Create apps/web/src/lib/analytics.ts:
- Event name constants
- Event property types
- Helper functions for common tracking patterns

Events to define:
- PROPERTY_CREATED, PROPERTY_UPDATED, PROPERTY_DELETED
- DOCUMENT_UPLOADED, DOCUMENT_DOWNLOADED
- SCORE_CALCULATED, SCORE_VIEWED
- CALCULATOR_USED, ANALYSIS_REQUESTED
- SUBSCRIPTION_STARTED, SUBSCRIPTION_CANCELLED
- FEATURE_LIMIT_REACHED`,
        type: "chore",
        priority: "low",
        estimate: 2,
        protocol: "haiku_quick_edit",
        labels: ["observability", "analytics", "dx"],
      },
    ],
  },
  {
    name: "Lease & Tenant Management",
    description:
      "Complete lease and tenant tracking functionality to complement the existing schema.",
    color: "#84cc16", // lime
    targetDate: "2026-03-15",
    sortOrder: 6,
    tickets: [
      {
        title: "Build lease management API routes",
        description: `Create CRUD API routes for lease management.

Routes:
- GET /api/properties/:id/leases - List leases for property
- GET /api/properties/:id/leases/:leaseId - Get single lease
- POST /api/properties/:id/leases - Create new lease
- PUT /api/properties/:id/leases/:leaseId - Update lease
- DELETE /api/properties/:id/leases/:leaseId - Delete lease

Include:
- Lease document association
- Tenant contact info
- Lease term calculations
- Renewal tracking`,
        type: "feature",
        priority: "medium",
        estimate: 3,
        protocol: "sonnet_implementation",
        labels: ["leases", "api"],
      },
      {
        title: "Create lease CRUD UI components",
        description: `Build UI components for lease management.

Components:
- LeaseListPanel - List view of all leases for property
- AddLeaseDrawer - Form for creating/editing leases
- LeaseCard - Summary card with key details
- LeaseTimeline - Visual timeline of lease terms

Features:
- Current/past/future lease filtering
- Lease document upload integration
- Rent schedule display
- Days remaining indicator`,
        type: "feature",
        priority: "medium",
        estimate: 3,
        protocol: "sonnet_implementation",
        labels: ["leases", "ui"],
      },
      {
        title: "Add tenant tracking functionality",
        description: `Add tenant management within leases.

Tenant data:
- Name, contact info, emergency contact
- Payment history summary
- Communication log
- Move-in/move-out checklist status

Features:
- Tenant profile view
- Payment history from transactions
- Document association (lease, ID, background check)
- Notes and communication log`,
        type: "feature",
        priority: "medium",
        estimate: 2,
        protocol: "sonnet_implementation",
        labels: ["leases", "tenants"],
      },
      {
        title: "Implement lease renewal notifications",
        description: `Create notification system for lease renewals.

Triggers:
- 90 days before lease expiration
- 60 days before lease expiration
- 30 days before lease expiration
- 7 days before lease expiration

Actions:
- In-app notification
- Email notification (if enabled)
- Dashboard alert card
- Risk score impact`,
        type: "feature",
        priority: "medium",
        estimate: 2,
        protocol: "sonnet_implementation",
        labels: ["leases", "notifications"],
      },
    ],
  },
];

export async function seedRoadmapMilestones() {
  console.log("🚀 Starting roadmap milestones seed...\n");

  let ticketNumber = await getNextTicketNumber();

  for (const milestoneData of milestones) {
    console.log(`📋 Creating milestone: ${milestoneData.name}`);

    // Create milestone
    const [milestone] = await db
      .insert(forgeMilestones)
      .values({
        name: milestoneData.name,
        description: milestoneData.description,
        color: milestoneData.color,
        targetDate: milestoneData.targetDate || null,
        sortOrder: milestoneData.sortOrder,
        status: "active",
        progressPercent: 0,
      })
      .returning();

    console.log(`   ✅ Created milestone: ${milestone.id}`);

    // Create tickets for this milestone
    for (const ticketData of milestoneData.tickets) {
      const identifier = `AXO-${ticketNumber++}`;

      await db.insert(forgeTickets).values({
        identifier,
        title: ticketData.title,
        description: ticketData.description,
        type: ticketData.type,
        priority: ticketData.priority,
        estimate: ticketData.estimate,
        assignedAgent: ticketData.protocol,
        labels: ticketData.labels,
        milestoneId: milestone.id,
        status: "backlog",
        phase: "planning",
        currentPhase: "planning",
        statusOrder: 0,
      });

      console.log(`   📝 Created ticket: ${identifier} - ${ticketData.title}`);
    }

    console.log("");
  }

  console.log("✅ Roadmap milestones seed complete!\n");
  console.log("Summary:");
  console.log(`   Milestones created: ${milestones.length}`);
  console.log(
    `   Tickets created: ${milestones.reduce((sum, m) => sum + m.tickets.length, 0)}`
  );
}

// Run if executed directly
seedRoadmapMilestones()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
