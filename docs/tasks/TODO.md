# Axori Development Tasks & Todos

This document tracks all active tasks, todos, and development work for the Axori application.

> **Last Updated**: 2026-01-16 (Learning Hub implementation completed)
> **Workflow**: Move completed items to `COMPLETED.md` and archive monthly

## How to Use

1. **Add new tasks** to the appropriate section below
2. **Mark tasks as in-progress** with `[IN PROGRESS]` prefix
3. **Move completed tasks** to `COMPLETED.md` with completion date
4. **Reference related ADRs** or plans in task descriptions
5. **Break down large tasks** into smaller, actionable items

---

## 🎯 High Priority

### Legal & Compliance

- [ ] **Implement legal disclaimers and user acknowledgments**
  - [ ] Create comprehensive legal disclaimer system
  - [ ] Add clear messaging: "We are not financial advisers - we help you plan using your data"
  - [ ] Implement user acknowledgment flow (initial signup/onboarding)
  - [ ] Add disclaimer to Learning Hub drawer (already started in Expert Context section)
  - [ ] Add disclaimer to financial calculations/advice sections
  - [ ] Create reusable disclaimer component for consistent messaging
  - [ ] Track user acknowledgments in database (user preferences/legal_acknowledgments table)
  - [ ] Add terms of service and privacy policy links where appropriate
  - [ ] Consider periodic re-acknowledgment (e.g., annually or when terms change)

### Core Features

- [ ] Implement property bank accounts integration (Plaid)
  - [ ] Create `property_bank_accounts` database table
  - [ ] Implement `usePropertyBankAccount()` hook
  - [ ] Create Plaid Link integration in `BankAccountConnectionDrawer`
  - [ ] Add API endpoints for link token and public token exchange
  - [ ] Update `Liquidity` component to show connected state

### Data & Infrastructure

- [ ] Fix remaining Zod validation schema issues
  - [x] Fixed loan schema (standalone `z.object()` pattern)
  - [x] Fixed property acquisition schema
  - [ ] Review and fix any other schema extension issues
- [ ] Audit all API routes for proper error handling
- [ ] Add API rate limiting and request validation

---

## 📋 Medium Priority

### UI/UX Improvements

- [ ] Review and improve `LearningHubDrawer` styles and readability
  - [ ] Increase header text size (currently fairly small to read)
  - [ ] Review overall typography hierarchy
  - [ ] Improve spacing and visual hierarchy
  - [ ] Ensure proper contrast for all text elements

- [ ] Enhance `DebtLogic` component
  - [x] Display all active loans (not just primary)
  - [ ] Add loan sorting/ordering (by position or date)
  - [ ] Improve HELOC vs primary loan visual distinction
  - [ ] Add loan summary totals (total debt, weighted rate, etc.)

- [ ] Complete `TaxShieldIntel` component calculations
  - [ ] Implement actual depreciation calculations from property data
  - [ ] Add cost segregation analysis logic
  - [ ] Connect to tax-related property data

- [ ] Improve `OperatingCore` component
  - [ ] Add historical trend indicators
  - [ ] Show variance vs projections
  - [ ] Add drill-down to expense details

### Financial Calculations

- [ ] Implement comprehensive NOI calculations
- [ ] Add cash-on-cash return calculations
- [ ] Calculate cap rates dynamically
- [ ] Add IRR calculations for property investments

---

## 🔄 Refactoring & Technical Debt

### Component Organization

- [ ] Review and consolidate financial components
  - [x] Ensure all components use computed hooks pattern
  - [x] Standardize component structure across financials page
  - [ ] Extract shared financial formatting utilities
  - [x] Created reusable `LearningHubButton` component (reduces duplication)

### Type Safety

- [ ] Review and improve TypeScript types for loan data
- [ ] Add proper type guards for loan calculations
- [ ] Remove `as any` type assertions where possible

### API Improvements

- [ ] Standardize error responses across all API routes
- [ ] Add request/response logging for debugging
- [ ] Implement proper pagination for list endpoints

---

## 📊 Data & Analytics

### Reporting

- [ ] Add property performance dashboard
- [ ] Implement portfolio-level analytics
- [ ] Create financial report generation (PDF export)
- [ ] Add comparison views (property vs property, year over year)

### Data Quality

- [ ] Add data validation on frontend (Zod schemas)
- [ ] Implement data sync status indicators
- [ ] Add data freshness checks for external integrations

---

## 🔐 Security & Authentication

- [ ] Implement row-level security (RLS) in database
- [ ] Add property access permissions
- [ ] Audit all API endpoints for proper authorization
- [ ] Add CSRF protection

---

## 📱 Mobile & Responsive

- [ ] Audit all components for mobile responsiveness
- [ ] Optimize financials page for mobile viewing
- [ ] Add mobile-specific navigation patterns

---

## 🧪 Testing

- [ ] Add unit tests for computed hooks
- [ ] Add integration tests for API routes
- [ ] Add E2E tests for critical user flows
- [ ] Test multi-loan scenarios thoroughly

---

## 📚 Documentation

- [ ] Document computed hooks pattern
- [ ] Create component library usage guide
- [ ] Document financial calculation formulas
- [ ] Add inline documentation for complex calculations

---

## 🔍 Research & Exploration

- [ ] Research property valuation APIs integration
- [ ] Explore automated expense categorization
- [ ] Investigate mortgage calculator APIs
- [ ] Research tax deduction tracking tools

---

## Notes

### Current Development Focus

- Financial components on the property details page
- Multi-loan support and display
- Design system component integration
- Learning Hub feature implementation (completed - all financial components)

### Patterns to Follow

- Use computed hooks for business logic (`useOperatingCore`, `useAcquisitionIntel`)
- Use design system components from `@axori/ui`
- Follow Drizzle-Zod alignment patterns (standalone schemas for API validation)
- Maintain separation of concerns (hooks for logic, components for presentation)

### Known Issues

- Some TypeScript `as any` assertions exist (technical debt to address)
- Need better error handling in some API routes

---

## Completed Recently

See `COMPLETED.md` for a full history of completed tasks.
