# Architecture Documentation

This directory contains Architectural Decision Records (ADRs) and key design decisions for the Axori application.

## Purpose

As we build this application with AI assistance, we document:

- **Architectural decisions** and their rationale
- **Schema design choices** and evolution
- **Technology stack decisions**
- **Design patterns** and best practices
- **Lessons learned** and pitfalls avoided

## Document Format

Each ADR follows a consistent format:

1. **Title**: Clear, descriptive name
2. **Status**: Proposed | Accepted | Deprecated | Superseded
3. **Date**: When the decision was made
4. **Context**: What problem are we solving?
5. **Decision**: What did we decide?
6. **Consequences**: What are the trade-offs?
7. **Related**: Links to other ADRs or documentation

## Index of Architectural Decisions

### Database & Schema

- [ADR-001: Property Schema Refactoring](./001-property-schema-refactoring.md) - Initial split of property data into 4 tables (SUPERSEDED by ADR-002)
- [ADR-002: Comprehensive Property Model Migration](./plans/002-comprehensive-property-model-migration.md) - **5-phase migration to normalized schema** (10 tables → 17 tables)
- [Schema Migration Comparison](./schema-migration-comparison.md) - Detailed before/after comparison of ADR-001 vs ADR-002

### Implementation Logs

- [Phase 1: Normalized Property Schema](./completed/phase1-normalized-schema-implementation.md) - 🚧 **In Progress** - Execution log with decisions and timeline

### Reference Documentation

- [Axori Property Data Model](./axori-property-data-model.md) - Complete target schema with all tables, fields, triggers, and views
- [Loan & Financing Tracking](./loan-financing-tracking.md) - Comprehensive guide to tracking all financing types, servicing transfers, and loan lifecycle
- [Terminology Update: loans](./TERMINOLOGY-UPDATE-loans.md) - Decision to rename `mortgages` → `loans`

### Frontend Architecture

_(To be documented)_

### Backend Architecture

_(To be documented)_

### Infrastructure

_(To be documented)_

## How to Contribute

When making significant architectural decisions:

1. Create a new ADR document: `NNN-descriptive-title.md`
2. Use the template format above
3. Update this README index
4. Link related ADRs
5. Keep documents concise but complete

## Related Documentation

- [Architect Skill](./../.skills/architect/) - Full-stack development guidelines
- [Database Schema](../../packages/db/src/schema/) - Drizzle ORM schema definitions
- [Validation Schemas](../../packages/shared/src/validation/) - Zod validation schemas
