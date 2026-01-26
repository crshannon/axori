# Learning Hub - Execution Plan

**Related**: [SUMMARY.md](./SUMMARY.md) | [SCHEMA.md](./SCHEMA.md)

---

## Phase 1: Foundation (MVP)

### 1.1 Type Definitions & Schema

- [ ] Create `packages/shared/src/content/learning-hub/types.ts`
  - [ ] `GlossaryTerm` interface (CMS-ready with `_id`, `_type`)
  - [ ] `LearningArticle` interface
  - [ ] `LearningPath` interface
  - [ ] `GlossaryCategory` type (10 categories)
  - [ ] `InvestorLevel` type (beginner, intermediate, advanced)
  - [ ] `InvestorPersona` type (matches onboarding)
  - [ ] `InvestmentPhase` type (matches onboarding)
  - [ ] `InvestmentStrategy` type (matches onboarding)
  - [ ] `PortableText` interface for rich content
  - [ ] Supporting types: `Example`, `Formula`, `CallToAction`

### 1.2 Initial Glossary Content

- [ ] Create `apps/web/src/data/learning-hub/glossary/` directory
- [ ] Create JSON files by category:
  - [ ] `financing.json` (10-15 terms: LTV, DSCR, HELOC, Refinance, Amortization, etc.)
  - [ ] `valuation.json` (8-10 terms: Cap Rate, ARV, GRM, Comps, etc.)
  - [ ] `operations.json` (8-10 terms: NOI, Vacancy Rate, CapEx, etc.)
  - [ ] `taxation.json` (10-12 terms: Depreciation, 1031, Cost Seg, Passive Losses, etc.)
  - [ ] `acquisition.json` (8-10 terms: Closing Costs, Due Diligence, Earnest Money, etc.)
  - [ ] `legal.json` (6-8 terms: LLC, Operating Agreement, Title Insurance, etc.)
  - [ ] `market-analysis.json` (6-8 terms: Absorption Rate, DOM, Supply/Demand, etc.)
  - [ ] `investment-metrics.json` (8-10 terms: Cash-on-Cash, IRR, ROI, etc.)
  - [ ] `property-types.json` (6-8 terms: SFR, Multifamily, Commercial, etc.)
  - [ ] `strategies.json` (8-10 terms: BRRRR, House Hacking, Wholesale, etc.)
- [ ] Create `apps/web/src/data/learning-hub/glossary/index.ts` content loader
- [ ] Migrate relevant content from existing snippets in `apps/web/src/data/learning-hub/`

### 1.3 Navigation Integration

- [ ] Add Learning Hub to `apps/web/src/lib/navigation.ts`
  - [ ] Add `{ path: "/learning-hub", icon: GraduationCap }` to `navItems`
  - [ ] Position between Wealth Journey and Explore
- [ ] Update `SideNav.tsx` if needed for new icon

### 1.4 Route Structure

- [ ] Create `apps/web/src/routes/learning-hub/` directory
- [ ] Create routes:
  - [ ] `index.tsx` - Hub home (placeholder for Phase 2 personalization)
  - [ ] `glossary/index.tsx` - Glossary browser
  - [ ] `glossary/$slug.tsx` - Term detail page
  - [ ] `search.tsx` - Search results page

### 1.5 UI Components

- [ ] Create `apps/web/src/components/learning-hub/` directory
- [ ] Build components:
  - [ ] `GlossaryCard.tsx` - Card for term in grid/list view
  - [ ] `GlossaryGrid.tsx` - Grid layout for terms
  - [ ] `TermDetail.tsx` - Full term page content
  - [ ] `CategoryFilter.tsx` - Category pill filter
  - [ ] `LevelBadge.tsx` - Beginner/Intermediate/Advanced badge
  - [ ] `AlphabetIndex.tsx` - A-Z quick navigation
  - [ ] `SearchBar.tsx` - Search input with autocomplete
  - [ ] `RelatedTerms.tsx` - Linked related terms section
  - [ ] `FormulaDisplay.tsx` - Formula rendering component
  - [ ] `ExampleCard.tsx` - Real-world example display

### 1.6 Drawer Integration

- [ ] Update `LearningSnippet` type to include `glossarySlug?: string`
- [ ] Add "Learn More" link to `LearningHubDrawer.tsx`
- [ ] Update existing snippets with corresponding glossary slugs

### 1.7 Basic Search

- [ ] Install Fuse.js: `pnpm add fuse.js -F web`
- [ ] Create `apps/web/src/lib/learning-hub/search.ts`
  - [ ] Configure Fuse.js with term, shortDefinition, synonyms
  - [ ] Implement search with fuzzy matching
  - [ ] Return ranked results with highlights

---

## Phase 2: Personalization

### 2.1 Recommendation Engine

- [ ] Create `apps/web/src/lib/learning-hub/recommendations.ts`
  - [ ] `UserLearningContext` interface (onboarding + portfolio + activity)
  - [ ] `generateRecommendations()` function
  - [ ] Phase-based recommendations (researching → 101 path)
  - [ ] Portfolio-based recommendations (has loans → DSCR term)
  - [ ] Strategy-based recommendations (BRRRR → BRRRR path)
  - [ ] Gap-based recommendations (missing tax knowledge)

### 2.2 User Context Hook

- [ ] Create `apps/web/src/hooks/useLearningContext.ts`
  - [ ] Fetch onboarding data from user record
  - [ ] Calculate portfolio metrics (total properties, equity, etc.)
  - [ ] Fetch activity data (localStorage initially)
  - [ ] Return unified `UserLearningContext`

### 2.3 Progress Tracking (localStorage)

- [ ] Create `apps/web/src/lib/learning-hub/progress.ts`
  - [ ] `markTermViewed(slug)` - Track viewed terms
  - [ ] `getViewedTerms()` - Get all viewed slugs
  - [ ] `bookmarkTerm(slug)` - Add to bookmarks
  - [ ] `getBookmarks()` - Get bookmarked items
  - [ ] `trackSearchQuery(query)` - Track search history
  - [ ] Storage keys: `axori:learning-hub:viewed:*`, `axori:learning-hub:bookmarks`

### 2.4 Hub Home Dashboard

- [ ] Update `/learning-hub/index.tsx` with sections:
  - [ ] "Your Learning Journey" - Progress on started paths
  - [ ] "Recommended for You" - Personalized recommendations
  - [ ] "Quick Reference" - Bookmarked terms
  - [ ] "Recently Viewed" - Continue where you left off
  - [ ] "Level Up" - Based on portfolio analysis

### 2.5 Personalization UI Components

- [ ] `RecommendationCard.tsx` - Recommendation with reason
- [ ] `LearningProgress.tsx` - Progress indicator
- [ ] `BookmarkButton.tsx` - Toggle bookmark state
- [ ] `RecentlyViewed.tsx` - Recent items carousel

---

## Phase 3: Rich Content

### 3.1 Learning Paths

- [ ] Create `apps/web/src/data/learning-hub/paths/` directory
- [ ] Design initial paths:
  - [ ] `real-estate-investing-101.json` - Beginner fundamentals
  - [ ] `mastering-brrrr.json` - BRRRR strategy deep dive
  - [ ] `tax-optimization-basics.json` - Tax strategy intro
  - [ ] `financing-fundamentals.json` - Loan/leverage education
  - [ ] `analyzing-deals.json` - Deal analysis skills
- [ ] Create path routes:
  - [ ] `paths/index.tsx` - Paths overview
  - [ ] `paths/$slug.tsx` - Path detail with modules
- [ ] Create components:
  - [ ] `PathCard.tsx` - Path preview card
  - [ ] `PathDetail.tsx` - Full path with modules
  - [ ] `ModuleList.tsx` - Module accordion
  - [ ] `LessonItem.tsx` - Individual lesson row
  - [ ] `PathProgress.tsx` - Completion progress bar

### 3.2 Article Library

- [ ] Create `apps/web/src/data/learning-hub/articles/` directory
- [ ] Design initial articles (5-10 to start):
  - [ ] "Understanding Cap Rates: Beyond the Basics"
  - [ ] "Maximizing Tax Benefits with Depreciation"
  - [ ] "The True Cost of Vacancy"
  - [ ] "When to Refinance Your Investment Property"
  - [ ] "Building Your First Real Estate Team"
- [ ] Create article routes:
  - [ ] `articles/index.tsx` - Article library
  - [ ] `articles/$slug.tsx` - Article detail
- [ ] Create components:
  - [ ] `ArticleCard.tsx` - Article preview
  - [ ] `ArticleContent.tsx` - Full article renderer
  - [ ] `ReadingTime.tsx` - Estimated read time
  - [ ] `ArticleAuthor.tsx` - Author attribution

### 3.3 Calculator Hub

- [ ] Create `/learning-hub/calculators` route
- [ ] Build interactive calculators:
  - [ ] `CapRateCalculator.tsx` - NOI / Property Value
  - [ ] `CashOnCashCalculator.tsx` - Cash Flow / Cash Invested
  - [ ] `DSCRCalculator.tsx` - NOI / Debt Service
  - [ ] `RefinanceAnalyzer.tsx` - Compare current vs new terms
  - [ ] `MortgageCalculator.tsx` - Payment breakdown
  - [ ] `DepreciationCalculator.tsx` - Annual deduction estimate
- [ ] Create calculator components:
  - [ ] `CalculatorCard.tsx` - Calculator wrapper
  - [ ] `CalculatorInput.tsx` - Styled numeric input
  - [ ] `CalculatorResult.tsx` - Result display
  - [ ] `CalculatorExplanation.tsx` - How it works section

### 3.4 Video Support

- [ ] Add video embed component `VideoEmbed.tsx`
- [ ] Support YouTube and Vimeo URLs
- [ ] Add video lessons to paths
- [ ] Track video completion in progress

### 3.5 Quizzes

- [ ] Create quiz schema and types
- [ ] Build quiz components:
  - [ ] `QuizQuestion.tsx` - Question with options
  - [ ] `QuizResult.tsx` - Score and feedback
  - [ ] `QuizProgress.tsx` - Question progress
- [ ] Add quizzes to learning paths

---

## Phase 4: Advanced Features

### 4.1 Property Analyzer

- [ ] Create `/learning-hub/analyzer` route
- [ ] Build "Analyze Your Property" feature:
  - [ ] Input: Property address or select from portfolio
  - [ ] Output: Educational breakdown of key metrics
  - [ ] Sections: Valuation, Cash Flow, Tax Benefits, Leverage
  - [ ] Link each metric to glossary term
  - [ ] Compare to market benchmarks

### 4.2 Scenario Modeler

- [ ] Create `/learning-hub/scenarios` route
- [ ] Build what-if simulations:
  - [ ] Rate change impact (interest rates +/- 1%)
  - [ ] Vacancy impact (0%, 5%, 10% vacancy)
  - [ ] Appreciation scenarios (3%, 5%, 7% annual)
  - [ ] Refinance timing analysis
- [ ] Visualize with charts (Recharts)

### 4.3 Freedom Number Tracker

- [ ] Create visual progress toward financial independence
- [ ] Show: Current equity vs Freedom Number target
- [ ] Projection: Time to goal at current pace
- [ ] Recommendations: How to accelerate

### 4.4 Investment Checklists

- [ ] Create checklist templates:
  - [ ] Pre-Offer Due Diligence
  - [ ] Property Inspection Items
  - [ ] Closing Document Review
  - [ ] Post-Purchase Setup
- [ ] Allow users to copy and track progress
- [ ] Store checklist progress in database

### 4.5 Achievement System

- [ ] Design achievement badges:
  - [ ] "First Steps" - Complete first path
  - [ ] "Glossary Explorer" - View 25 terms
  - [ ] "Tax Savvy" - Complete tax path
  - [ ] "Deal Analyzer" - Use all calculators
- [ ] Create badge display components
- [ ] Track achievements in user profile

---

## Phase 5: Database & Persistence

### 5.1 Database Schema

- [ ] Create migration for learning hub tables:
  ```sql
  -- User learning progress
  CREATE TABLE user_learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    content_type TEXT NOT NULL, -- 'term', 'article', 'path', 'lesson'
    content_slug TEXT NOT NULL,
    status TEXT NOT NULL, -- 'viewed', 'in_progress', 'completed'
    progress_data JSONB, -- For paths: { currentModule, currentLesson }
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_type, content_slug)
  );

  -- User bookmarks
  CREATE TABLE user_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    content_type TEXT NOT NULL,
    content_slug TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_type, content_slug)
  );

  -- Quiz attempts
  CREATE TABLE user_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    quiz_slug TEXT NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    answers JSONB NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

### 5.2 API Routes

- [ ] Create `apps/api/src/routes/learning-hub/` directory
- [ ] Implement endpoints:
  - [ ] `GET /learning-hub/progress` - Get user's progress
  - [ ] `POST /learning-hub/progress` - Update progress
  - [ ] `GET /learning-hub/bookmarks` - Get bookmarks
  - [ ] `POST /learning-hub/bookmarks` - Add bookmark
  - [ ] `DELETE /learning-hub/bookmarks/:slug` - Remove bookmark
  - [ ] `POST /learning-hub/quiz-attempts` - Submit quiz

### 5.3 Migrate from localStorage

- [ ] Create migration utility to move localStorage data to database
- [ ] Run migration on user login
- [ ] Clean up localStorage after successful migration

---

## Phase 6: CMS Migration (Future)

### 6.1 CMS Evaluation

- [ ] Evaluate CMS options:
  - [ ] **Sanity.io** (recommended) - Portable Text, TypeScript, GROQ
  - [ ] Contentful - Enterprise, GraphQL
  - [ ] Strapi - Self-hosted, SQL
  - [ ] Payload CMS - TypeScript-native
- [ ] Document decision in ADR

### 6.2 Sanity Setup (if chosen)

- [ ] Create Sanity project: `npm create sanity@latest`
- [ ] Configure schemas matching our TypeScript types
- [ ] Set up Sanity Studio for content editors
- [ ] Configure preview mode

### 6.3 Content Migration

- [ ] Export JSON content to Sanity format
- [ ] Import via `sanity dataset import`
- [ ] Verify content integrity
- [ ] Set up redirects from old routes if needed

### 6.4 Integration

- [ ] Install `@sanity/client` in web app
- [ ] Create content fetching utilities
- [ ] Implement caching strategy (SWR or React Query)
- [ ] Set up webhook for cache invalidation
- [ ] Add preview mode for draft content

---

## Testing Checklist

### Unit Tests

- [ ] Recommendation engine logic
- [ ] Search functionality
- [ ] Progress tracking utilities
- [ ] Calculator formulas

### Integration Tests

- [ ] API routes for progress/bookmarks
- [ ] Content loading from JSON files
- [ ] Navigation integration

### E2E Tests

- [ ] Glossary browsing flow
- [ ] Search and filter functionality
- [ ] Term detail page rendering
- [ ] Learning path completion flow
- [ ] Calculator interactions

---

## Definition of Done (Phase 1)

- [ ] Learning Hub accessible from left navigation
- [ ] 50+ glossary terms across 10 categories
- [ ] Category and level filtering works
- [ ] Search returns relevant results
- [ ] Term detail pages render correctly
- [ ] Existing drawer snippets link to glossary
- [ ] Mobile responsive
- [ ] Matches existing app theme/styling
- [ ] No ESLint errors (`--max-warnings 0`)
- [ ] TypeScript strict mode passes
