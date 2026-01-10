# Documentation Index

Welcome to the Axori documentation. This directory contains all project documentation organized by topic.

## Directory Structure

```
docs/
├── architecture/          # Architectural Decision Records (ADRs)
│   ├── README.md         # Index of all architectural decisions
│   └── 001-*.md          # Individual ADRs
├── api/                  # API documentation (to be created)
├── database/             # Database schema documentation (to be created)
└── guides/               # Developer guides (to be created)
```

## Quick Links

### Architecture
- [Architecture Overview](./architecture/README.md)
- [ADR-001: Property Schema Refactoring](./architecture/001-property-schema-refactoring.md)

### Development
- [Architect Skill](../.skills/architect/SKILL.md) - Full-stack development guidelines
- [Setup Guide](../SETUP.md) - Getting started with local development

### Schema & Types
- [Database Schema](../packages/db/src/schema/) - Drizzle ORM definitions
- [TypeScript Types](../packages/db/src/types.ts) - Type exports
- [Validation Schemas](../packages/shared/src/validation/) - Zod validation

## Contributing to Documentation

When making significant changes:

1. **Architecture decisions** → Create an ADR in `architecture/`
2. **API changes** → Update API documentation
3. **Schema changes** → Document in ADR + update schema comments
4. **New features** → Update relevant guides

### ADR Format

Each Architectural Decision Record should include:
- **Status**: Proposed | Accepted | Deprecated | Superseded
- **Date**: When the decision was made
- **Context**: What problem are we solving?
- **Decision**: What did we decide?
- **Consequences**: Trade-offs and implications
- **Alternatives**: What else did we consider?

## Documentation Philosophy

> **Document decisions, not just implementations**

We document:
- **Why** we made a choice (rationale)
- **What** alternatives we considered
- **How** we implemented it
- **What** we learned

We don't document:
- Implementation details that are obvious from code
- Temporary workarounds (unless they're important to know about)
- External library APIs (link to official docs instead)

## Keeping Documentation Fresh

- **Review docs** during code reviews
- **Update ADRs** when decisions change
- **Archive outdated docs** (mark as Superseded, don't delete)
- **Reference from code** - Link ADRs in comments for important code

## AI-Assisted Development

Since we're using AI for development, documentation is especially important:
- **Context preservation** - Help AI understand past decisions
- **Consistency** - Ensure AI follows established patterns
- **Learning** - Document what works and what doesn't
- **Handoff** - Enable smooth transitions between sessions

