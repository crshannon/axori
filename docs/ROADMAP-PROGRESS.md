# Axori Roadmap Progress Review

**Last Updated:** January 31, 2026
**Review Session:** claude/review-roadmap-progress-QPiW7

This document tracks implementation progress against the Axori Development Roadmap.

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ | Fully implemented and tested |
| ⚠️ | Partially implemented or needs enhancement |
| ❌ | Not yet implemented |
| 🔧 | Needs refactoring or updates |

---

## Phase 1: Core Data Layer

**Status: ✅ COMPLETE**

### Database Schema

| Task | Status | Notes |
|------|--------|-------|
| Create properties table schema | ✅ | Comprehensive with draft/active/archived status, Mapbox geocoding cache |
| Create property_transactions table schema | ✅ | Full income/expense tracking with categories, review workflow, recurring support |
| Create documents table schema | ✅ | AI processing status, extraction tracking, confidence scores |
| Create property_scores table schema | ⚠️ | Schema exists but scoring calculations not implemented |
| Run Drizzle migrations | ✅ | All migrations applied |

**Additional Tables Implemented (Beyond Roadmap):**
- `propertyCharacteristics` - Physical details (beds, baths, sqft, parking, HOA)
- `propertyValuation` - Current value, tax assessment, appraisals
- `propertyAcquisition` - Purchase details, closing costs, BRRRR tracking
- `propertyRentalIncome` - Monthly rent, secondary income streams
- `propertyOperatingExpenses` - Vacancy, management, maintenance rates
- `propertyManagement` - PM company details, integrations
- `propertyHistory` - Audit trail for all changes
- `loans` - Comprehensive loan support (12 loan types, ARM, interest-only, balloon)
- `loanHistory` - Payment and servicing tracking
- `propertyDepreciation` - Cost basis, land value, marginal tax rate
- `propertyImprovements` - Capital improvements with depreciation classes
- `costSegregationStudies` - Cost seg analysis with bonus depreciation
- `annualDepreciationRecords` - Year-by-year tracking with CPA verification
- `propertyBankAccounts` - Plaid-connected or manual accounts
- `users`, `portfolios`, `userPortfolios` - Multi-tenant user management
- `subscriptions`, `plans` - Stripe billing
- `markets` - Investment markets with metrics

### API Routes

| Task | Status | Notes |
|------|--------|-------|
| GET /api/properties | ✅ | Pagination, portfolio filter, status filter |
| POST /api/properties | ✅ | Wizard support, draft state |
| GET /api/properties/:id | ✅ | All relations included |
| PUT /api/properties/:id | ✅ | Full update support |
| DELETE /api/properties/:id | ✅ | Soft delete with cascade |
| GET /api/properties/:id/transactions | ✅ | Date range, type, category, review status filters |
| POST /api/property-transactions | ✅ | Full validation, ownership check |

**Additional Routes Implemented (Beyond Roadmap):**
- Full loan CRUD (`/api/properties/:id/loans/*`)
- Full depreciation management (`/api/properties/:id/depreciation/*`)
- Bank account management (`/api/bank-accounts/*`)
- Portfolio management (`/api/portfolios/*`)
- Portfolio members (`/api/portfolio-members/*`)
- User management (`/api/users/*`)
- Permissions (`/api/permissions/*`)
- Billing (`/api/billing/*`)
- Markets (`/api/markets/*`)
- Onboarding (`/api/onboarding/*`)
- Mapbox integration (`/api/mapbox/*`)
- Webhooks (Stripe, GitHub)

### Dashboard Wiring

| Task | Status | Notes |
|------|--------|-------|
| Wire property list component | ✅ | ActivePropertiesList, ActivePropertiesGrid with loading/empty states |
| Wire portfolio summary cards | ✅ | PortfolioStats component with aggregated data |
| Build property detail page | ✅ | 8-tab detail view (overview, documents, financials, settings, etc.) |
| Build add/edit property form | ✅ | 6-step AddPropertyWizard with AI sidebar |

---

## Phase 2: Document & Tax Organization

**Status: ✅ COMPLETE**

### Storage Setup

| Task | Status | Notes |
|------|--------|-------|
| Configure Supabase Storage bucket | ✅ | RLS policies, file type validation |

### Upload Components

| Task | Status | Notes |
|------|--------|-------|
| Build drag-and-drop upload component | ✅ | DocumentUploadDrawer with progress, multi-file |
| Document metadata form | ✅ | Type selection, property association, tags, date picker |

### Document API

| Task | Status | Notes |
|------|--------|-------|
| Document CRUD operations | ✅ | Full CRUD with Supabase Storage integration |

### Document Views

| Task | Status | Notes |
|------|--------|-------|
| Document list view with filters | ✅ | Property, type, date range filters, search |
| Tax year summary view | ⚠️ | Exists but could be enhanced |

### Download & Export

| Task | Status | Notes |
|------|--------|-------|
| Individual document download | ✅ | Auth and access control included |
| Bulk download by property | ⚠️ | Not implemented - individual downloads only |
| CPA Package export | ⚠️ | TaxExportPanel exists but zip generation limited |

### Tax Shield & Depreciation

| Task | Status | Notes |
|------|--------|-------|
| Capture property cost basis | ✅ | Purchase price, closing costs, improvements |
| Depreciation schedule calculation | ✅ | 27.5yr and 39yr straight-line, mid-month convention |
| Cost segregation support | ✅ | Cost seg study input, bonus depreciation on components |
| Tax shield value display | ✅ | Depreciation × marginal tax rate, annual savings visualization |

---

## Phase 3: Property Score System

**Status: ⚠️ PARTIAL**

### Score Calculations

| Task | Status | Notes | Forge Priority |
|------|--------|-------|----------------|
| Financial Performance score (20-25 pts) | ❌ | Schema exists, calculation not implemented | High |
| Equity Velocity score (20-25 pts) | ❌ | Not implemented | High |
| Risk Profile score (15-20 pts) | ❌ | Not implemented | Medium |
| Operational Health score (15-20 pts) | ❌ | Not implemented | Medium |
| Strategic Alignment score (15-20 pts) | ❌ | Not implemented | Medium |

### Strategy Integration

| Task | Status | Notes |
|------|--------|-------|
| Strategy profile selection | ✅ | User can select strategy in property settings |

### Score Display

| Task | Status | Notes |
|------|--------|-------|
| Score badge component | ⚠️ | PropertyScoreGauge exists but shows placeholder data |
| Score breakdown card | ⚠️ | RadarChart component exists but needs real data |

### Intelligence Layer

| Task | Status | Notes |
|------|--------|-------|
| Score-based recommendations | ❌ | AxoriSuggestions component exists but not data-driven |
| Validate scores against real portfolio | ❌ | Pending score implementation |

---

## Phase 4: Production Infrastructure

**Status: ✅ MOSTLY COMPLETE**

### Deployment

| Task | Status | Notes |
|------|--------|-------|
| Connect repo to Vercel | ✅ | Configured with preview deployments |
| Production Supabase project | ✅ | Connection pooling and backups configured |
| Production Clerk application | ✅ | OAuth, email templates, branding |
| Environment variables in Vercel | ✅ | All secrets configured |
| Configure axori.io DNS | ✅ | SSL provisioned |

### Billing (Stripe)

| Task | Status | Notes |
|------|--------|-------|
| Stripe account and products | ✅ | Free, Pro ($24), Portfolio ($49), Enterprise ($99) |
| Stripe webhook handlers | ✅ | subscription.created, updated, canceled, payment_failed |
| Customer portal integration | ✅ | Subscription management, payment methods, invoices |

### Feature Gating

| Task | Status | Notes |
|------|--------|-------|
| Feature gating tables | ✅ | plans, subscriptions tables with tier features |
| Feature access middleware | ⚠️ | Basic tier checks, could be more granular |
| Upgrade prompt UI components | ⚠️ | PlanSelectionDrawer exists, could enhance CTAs |

### Observability

| Task | Status | Notes |
|------|--------|-------|
| PostHog analytics integration | ❌ | Not implemented |
| Error tracking (Sentry) | ❌ | Not implemented |
| Audit log system | ✅ | propertyHistory, permissionAuditLog tables |

---

## Phase 5: Explore Tab

**Status: ⚠️ PARTIAL**

### Market Discovery

| Task | Status | Notes | Forge Priority |
|------|--------|-------|----------------|
| Market search interface | ⚠️ | Map-based explore exists but limited search | Medium |
| Market scorecard component | ❌ | Rentcast data available but not displayed | High |
| Rentcast API integration | ✅ | Full integration with caching |
| Market watchlist functionality | ✅ | userMarkets table with watching status |
| Market comparison view | ❌ | Not implemented | Medium |

### Property Discovery

| Task | Status | Notes |
|------|--------|-------|
| Property search within markets | ❌ | Not implemented |
| Property "Considering" list | ⚠️ | Draft properties could serve this purpose |

### Education

| Task | Status | Notes |
|------|--------|-------|
| Strategy library content | ⚠️ | LearningHubDrawer exists but limited content |
| Strategy finder quiz | ⚠️ | Onboarding persona selection, not full quiz |

### Calculators

| Task | Status | Notes |
|------|--------|-------|
| Cash flow projection calculator | ⚠️ | CalculatorModal exists, basic functionality |
| "What if I rent this later" scenario | ❌ | Not implemented |

### Conversion

| Task | Status | Notes |
|------|--------|-------|
| Property evaluation credits (free tier) | ❌ | Not implemented |
| Journey initiation flow | ❌ | Not implemented |
| Purchase journey checklist | ❌ | Not implemented |

---

## Phase 6: AI Features

**Status: ⚠️ PARTIAL**

### Usage & Billing

| Task | Status | Notes |
|------|--------|-------|
| AI interaction counter | ⚠️ | Forge token tracking, not user-facing AI |
| AI usage reset on billing cycle | ⚠️ | Forge budget system exists |

### AI Features

| Task | Status | Notes | Forge Priority |
|------|--------|-------|----------------|
| Property Acquisition Analyzer | ❌ | Not implemented | High |
| Rent optimization suggestions | ❌ | Rentcast data available but not analyzed | Medium |
| Maintenance decision support | ❌ | Not implemented | Low |
| Portfolio concentration analysis | ❌ | Not implemented | Medium |
| Performance outlier detection | ❌ | Not implemented | Medium |

### Optimization

| Task | Status | Notes |
|------|--------|-------|
| AI response caching | ✅ | Forge uses caching for context management |

---

## Property Details Tabs

**Status: ✅ MOSTLY COMPLETE**

| Tab | Status | Notes |
|-----|--------|-------|
| Overview Tab | ✅ | At-a-glance metrics, data completeness, recent activity |
| Details Tab | ✅ | Characteristics, valuation, acquisition, management, map |
| Financials Tab | ✅ | Income, expenses, cash flow, depreciation, charts |
| Mortgage Tab | ✅ | Comprehensive loan details, amortization |
| Lease Tab | ⚠️ | Schema exists, UI limited |
| Strategy Tab | ✅ | Strategy selection, hold timeline, goal alignment |
| Documents Tab | ✅ | Document library, AI extraction, tax export |
| Communications Tab | ⚠️ | Basic structure, needs enhancement |
| History Tab | ⚠️ | Schema exists, UI limited |

---

## Additional Features Implemented (Not in Original Roadmap)

### Forge AI Agent System ✅

Complete development workflow engine:

| Feature | Status |
|---------|--------|
| Ticket management (CRUD) | ✅ |
| Agent execution with protocols | ✅ |
| Decision ledger | ✅ |
| Registry auto-scanner | ✅ |
| Morning briefing with AI personality | ✅ |
| Token budgeting and tracking | ✅ |
| File locking for concurrent edits | ✅ |
| GitHub PR/release integration | ✅ |
| Deployment tracking | ✅ |
| Admin dashboard | ✅ |

### Wealth Journey ✅

| Feature | Status |
|---------|--------|
| Trajectory visualization | ✅ |
| Freedom number calculator | ✅ |
| Capital tracking | ✅ |
| DNA investment profile | ✅ |
| Strategic execution targets | ✅ |
| Milestone tracking | ✅ |

### Advanced Onboarding ✅

| Feature | Status |
|---------|--------|
| 7-step guided onboarding | ✅ |
| Persona selection | ✅ |
| Strategy recommendation | ✅ |
| Email capture with UTM | ✅ |

### Team Collaboration ⚠️

| Feature | Status |
|---------|--------|
| Portfolio sharing | ✅ |
| Role-based access (owner/admin/member/viewer) | ✅ |
| Invitation tokens | ✅ |
| Read-only mode | ✅ |
| Team member management UI | ⚠️ |

---

## Summary by Phase

| Phase | Completion | Key Gaps |
|-------|------------|----------|
| Phase 1: Core Data Layer | **100%** | None |
| Phase 2: Document & Tax | **90%** | Bulk download, enhanced CPA export |
| Phase 3: Property Scores | **20%** | Score calculations not implemented |
| Phase 4: Production Infra | **85%** | PostHog, Sentry missing |
| Phase 5: Explore Tab | **40%** | Market scorecards, property search, calculators |
| Phase 6: AI Features | **15%** | User-facing AI features not implemented |

---

## Recommended Forge Milestones

Based on this review, here are recommended Forge milestones for remaining work:

### Milestone 1: Property Scoring Engine (High Priority)

**Goal:** Implement the 5-dimension scoring system

| Ticket | Type | Estimate | Protocol |
|--------|------|----------|----------|
| Create score calculation service | feature | 5 | sonnet_implementation |
| Implement Financial Performance score | feature | 3 | sonnet_implementation |
| Implement Equity Velocity score | feature | 3 | sonnet_implementation |
| Implement Risk Profile score | feature | 3 | sonnet_implementation |
| Implement Operational Health score | feature | 3 | sonnet_implementation |
| Implement Strategic Alignment score | feature | 2 | sonnet_implementation |
| Wire PropertyScoreGauge to real data | feature | 2 | sonnet_implementation |
| Wire RadarChart to score breakdown | feature | 2 | sonnet_implementation |
| Add score-based recommendations | feature | 3 | sonnet_implementation |

**Total: 26 points**

### Milestone 2: Market Intelligence (Medium Priority)

**Goal:** Enhanced explore tab with market analysis

| Ticket | Type | Estimate | Protocol |
|--------|------|----------|----------|
| Build market scorecard component | feature | 3 | sonnet_implementation |
| Create market comparison view | feature | 3 | sonnet_implementation |
| Add property search within markets | feature | 5 | sonnet_implementation |
| Implement cash flow calculator enhancements | feature | 2 | sonnet_implementation |
| Add "rent this later" scenario calculator | feature | 3 | sonnet_implementation |

**Total: 16 points**

### Milestone 3: AI-Powered Analysis (High Priority)

**Goal:** User-facing AI features for property analysis

| Ticket | Type | Estimate | Protocol |
|--------|------|----------|----------|
| Build Property Acquisition Analyzer | feature | 8 | opus_full_feature |
| Implement rent optimization suggestions | feature | 3 | sonnet_implementation |
| Add portfolio concentration analysis | feature | 3 | sonnet_implementation |
| Add performance outlier detection | feature | 3 | sonnet_implementation |
| Create AI usage tracking for users | feature | 2 | sonnet_implementation |

**Total: 19 points**

### Milestone 4: Document Export Enhancements

**Goal:** Better CPA package generation

| Ticket | Type | Estimate | Protocol |
|--------|------|----------|----------|
| Implement bulk document download (zip) | feature | 3 | sonnet_implementation |
| Enhanced CPA package with folder structure | feature | 3 | sonnet_implementation |
| Add tax year summary report generation | feature | 2 | sonnet_implementation |

**Total: 8 points**

### Milestone 5: Observability & Monitoring

**Goal:** Production-grade monitoring

| Ticket | Type | Estimate | Protocol |
|--------|------|----------|----------|
| Integrate PostHog analytics | feature | 2 | sonnet_implementation |
| Add Sentry error tracking | feature | 2 | sonnet_implementation |
| Create key event tracking | feature | 2 | haiku_quick_edit |

**Total: 6 points**

### Milestone 6: Lease & Tenant Management

**Goal:** Complete lease/tenant functionality

| Ticket | Type | Estimate | Protocol |
|--------|------|----------|----------|
| Build lease management API routes | feature | 3 | sonnet_implementation |
| Create lease CRUD UI | feature | 3 | sonnet_implementation |
| Add tenant tracking | feature | 2 | sonnet_implementation |
| Implement renewal notifications | feature | 2 | sonnet_implementation |

**Total: 10 points**

---

## Next Steps

1. **Prioritize Scoring Engine** - This is the differentiator that makes Axori "context-aware"
2. **Add PostHog/Sentry** - Quick wins for production readiness
3. **Enhance Market Intelligence** - Improves explore tab value prop
4. **Build AI Analyzer** - Key differentiator for paid tiers

---

## Technical Debt Notes

| Area | Issue | Priority |
|------|-------|----------|
| Property Scores | Schema exists but calculations not implemented | High |
| Lease Tab | Schema complete, UI minimal | Medium |
| History Tab | Schema complete, UI minimal | Low |
| Communications Tab | Basic structure, needs enhancement | Low |
| Feature gating | Could be more granular per-feature | Medium |
| Mobile app | Early stage, needs attention if mobile is priority | Low |
