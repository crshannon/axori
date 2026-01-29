# Learning Hub Feature Plan

**Status**: Planning
**Date**: 2026-01-26
**Updated**: 2026-01-26
**Priority**: Medium

## Overview

The Learning Hub is a comprehensive educational resource center for real estate investors, accessible from the left side navigation. It combines a glossary of real estate concepts with personalized learning paths based on user data (investment phase, persona, strategy, and portfolio composition).

## Goals

1. **Educate users** - Provide a centralized location for real estate investment knowledge
2. **Personalize learning** - Use onboarding and portfolio data to make smart recommendations
3. **Support feature adoption** - Help users understand Axori features through contextual education
4. **Enable self-service** - Reduce support burden by empowering users with knowledge
5. **Drive engagement** - Keep users coming back to learn and level up as investors

## Key Features

### Phase 1: Foundation (MVP)

- [ ] Left side navigation item (`/learning-hub`)
- [ ] Glossary browser with 50+ core real estate terms
- [ ] Category filtering (financing, valuation, operations, taxation, etc.)
- [ ] Investor level filtering (beginner, intermediate, advanced)
- [ ] Term detail pages with rich content
- [ ] Basic search functionality
- [ ] Integration with existing Learning Hub drawers ("Learn More" links)

### Phase 2: Personalization

- [ ] Recommendation engine using onboarding data (persona, phase, strategy)
- [ ] Portfolio-aware suggestions based on property data
- [ ] "Your Learning Journey" dashboard section
- [ ] Progress tracking (localStorage initially, database later)
- [ ] Recently viewed / bookmarked terms
- [ ] "Level Up" suggestions based on portfolio gaps

### Phase 3: Rich Content

- [ ] Learning paths with modules and lessons
- [ ] Article library with in-depth guides
- [ ] Interactive calculators hub (Cap Rate, DSCR, Cash-on-Cash, etc.)
- [ ] Video embed support (YouTube/Vimeo)
- [ ] Quizzes and knowledge checks
- [ ] Achievement/badge system for completed paths

### Phase 4: Advanced Features

- [ ] Property Analyzer ("Analyze Your Property" educational breakdown)
- [ ] Scenario Modeler (what-if simulations)
- [ ] Freedom Number progress tracker
- [ ] Market Intel (educational content about user's target markets)
- [ ] Investment checklists (due diligence templates)
- [ ] Weekly digest emails with personalized recommendations

### Phase 5: CMS Migration

- [ ] Evaluate CMS options (Sanity.io recommended)
- [ ] Set up CMS studio for non-technical editors
- [ ] Migrate JSON content to CMS
- [ ] Implement webhooks for cache invalidation
- [ ] Add editorial workflow (draft → review → publish)

## Content Categories

| Category | Description | Example Terms |
|----------|-------------|---------------|
| `financing` | Mortgages, loans, leverage | LTV, DSCR, HELOC, Refinance |
| `valuation` | Appraisals, pricing, analysis | Cap Rate, ARV, Comps, GRM |
| `operations` | Property management, income | NOI, Vacancy Rate, CapEx |
| `taxation` | Tax strategies, deductions | Depreciation, 1031, Cost Seg |
| `acquisition` | Buying, due diligence | Closing Costs, Earnest Money |
| `legal` | Contracts, entities, liability | LLC, Operating Agreement |
| `market-analysis` | Demographics, trends | Absorption Rate, Days on Market |
| `investment-metrics` | ROI, returns, performance | Cash-on-Cash, IRR, Equity |
| `property-types` | Asset classes | SFR, Multifamily, Commercial |
| `strategies` | Investment approaches | BRRRR, House Hacking, Wholesale |

## Personalization Data Sources

The recommendation engine leverages existing user data:

### From Onboarding (`users.onboardingData`)

- **persona**: wealth-builder, cash-flow-seeker, equity-optimizer, passive-investor, first-timer
- **phase**: researching, first-property, scaling, optimizing, legacy
- **strategy**: buy-and-hold, brrrr, house-hacking, fix-and-flip, wholesale, short-term-rental
- **freedomNumber**: Financial independence target
- **markets**: Target investment markets

### From Portfolio (Calculated)

- Total properties owned
- Total equity across portfolio
- Average cap rate
- Loan presence (has financing?)
- Property types (SFR, multifamily, commercial)
- Average property age
- Depreciation utilization
- Tax strategy sophistication

### From Activity (Tracked)

- Viewed glossary terms
- Completed learning paths
- Bookmarked content
- Search queries
- Time spent on educational content

## Schema Design

Schemas are designed to be CMS-compatible (Sanity.io conventions) for future migration:

- Uses `_id` and `_type` fields (Sanity standard)
- Portable Text for rich content (JSON-based, CMS-portable)
- Slug-based references between content
- Category and level taxonomies

See `SCHEMA.md` for detailed type definitions.

## Route Structure

```
/learning-hub                          # Personalized dashboard
/learning-hub/glossary                 # A-Z glossary browser
/learning-hub/glossary/[slug]          # Term detail page
/learning-hub/articles                 # Article library
/learning-hub/articles/[slug]          # Article detail
/learning-hub/paths                    # Learning paths overview
/learning-hub/paths/[slug]             # Path detail with modules
/learning-hub/calculators              # Calculator hub
/learning-hub/search                   # Global search results
```

## Integration Points

### Existing Learning Hub Drawers

Current drawer snippets become entry points to full content:

- Add `glossarySlug` field to `LearningSnippet` type
- "Learn More" button in drawer links to `/learning-hub/glossary/[slug]`
- Bidirectional: Glossary pages link back to relevant app features

### Navigation

- Add to `navItems` in `apps/web/src/lib/navigation.ts`
- Icon: `GraduationCap` from Lucide React
- Position: Between Wealth Journey and Explore

### Feature Flags

- Use PostHog for progressive rollout
- Flag: `learning-hub-enabled`
- Phased rollout by user cohort

## Technical Decisions

### Content Storage (Now)

- JSON files in `apps/web/src/data/learning-hub/`
- Organized by content type: `glossary/`, `articles/`, `paths/`
- TypeScript types in `packages/shared/src/content/learning-hub/`

### Content Storage (Future)

- Sanity.io CMS for non-technical content management
- GROQ queries for content fetching
- Webhook-triggered cache invalidation
- Preview mode for draft content

### Search

- Phase 1: Client-side filtering with Fuse.js
- Future: Algolia or Typesense for full-text search

### Progress Tracking

- Phase 1: localStorage (`axori:learning-hub:progress:*`)
- Phase 2: Database tables (`user_learning_progress`, `user_bookmarks`)

## Success Metrics

- **Engagement**: % of users visiting Learning Hub monthly
- **Depth**: Average terms/articles viewed per session
- **Completion**: Learning path completion rates
- **Feature Adoption**: Correlation between education and feature usage
- **Support Reduction**: Decrease in basic "how does X work" queries

## Open Questions

1. **Content Creation**: Who writes initial glossary content? (Product team? Hired writer?)
2. **Legal Review**: Do educational articles need legal disclaimer beyond current drawer disclaimer?
3. **SEO**: Should Learning Hub pages be publicly accessible for SEO, or auth-gated?
4. **Mobile Priority**: Full mobile experience in Phase 1, or desktop-first?

## Related Documents

- [Learning Hub Integration Rules](/.cursor/rules/learning-hub-integration.mdc)
- [Existing Snippets](apps/web/src/data/learning-hub/)
- [LearningHubDrawer Component](apps/web/src/components/drawers/LearningHubDrawer.tsx)

## Expected Outcome

- Comprehensive real estate education hub accessible from main navigation
- Personalized recommendations that help users level up as investors
- Seamless integration with existing Learning Hub drawers
- Foundation for future CMS migration when content scales
- Increased user engagement and feature adoption
