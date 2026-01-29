# Learning Hub - Schema Definitions

**Related**: [SUMMARY.md](./SUMMARY.md) | [EXECUTION.md](./EXECUTION.md)

This document defines the TypeScript schemas for Learning Hub content. These schemas are designed to be CMS-compatible (Sanity.io conventions) for future migration.

---

## Core Content Types

### GlossaryTerm

```typescript
interface GlossaryTerm {
  // CMS-compatible identifiers
  _id: string;                      // Unique identifier (UUID or nanoid)
  _type: "glossaryTerm";            // Document type for CMS

  // Core fields
  slug: string;                     // URL-friendly identifier (e.g., "net-operating-income")
  term: string;                     // Display name (e.g., "Net Operating Income (NOI)")
  shortDefinition: string;          // 1-2 sentence summary (plain text)
  fullDefinition: PortableText;     // Rich text explanation (CMS-compatible)

  // Classification
  category: GlossaryCategory;       // Primary category
  investorLevel: InvestorLevel;     // Difficulty/sophistication level

  // Relationships
  relatedTerms: string[];           // Slugs of related terms
  synonyms: string[];               // Alternative names (for search)

  // Rich content (optional)
  examples?: Example[];             // Real-world examples
  formulas?: Formula[];             // Mathematical formulas
  proTips?: string[];               // Expert advice bullets

  // Personalization targeting
  relevantContexts?: LearningContext[];  // When to surface this term
  relevantStrategies?: InvestmentStrategy[];
  relevantPhases?: InvestmentPhase[];

  // App integration
  featureLink?: FeatureLink;        // Link to relevant app feature

  // SEO (for future public pages)
  seoMetadata?: SEOMetadata;

  // Timestamps
  createdAt: string;                // ISO 8601
  updatedAt: string;                // ISO 8601
}
```

### LearningArticle

```typescript
interface LearningArticle {
  _id: string;
  _type: "learningArticle";

  // Core fields
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;                  // Preview text (150-200 chars)
  content: PortableText;            // Full article body

  // Classification
  category: GlossaryCategory;
  tags: string[];                   // Flexible tagging
  investorLevel: InvestorLevel;
  readTimeMinutes: number;          // Estimated reading time

  // Media
  featuredImage?: MediaAsset;

  // Attribution
  author?: Author;

  // Personalization targeting
  targetPersonas: InvestorPersona[];
  targetPhases: InvestmentPhase[];
  targetStrategies: InvestmentStrategy[];

  // Relationships
  relatedArticles: string[];        // Article slugs
  relatedGlossaryTerms: string[];   // Term slugs

  // Engagement
  callToAction?: CallToAction;

  // Analytics (populated at runtime)
  popularity?: number;              // View count or engagement score

  // Publishing
  status: "draft" | "published" | "archived";
  publishedAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

### LearningPath

```typescript
interface LearningPath {
  _id: string;
  _type: "learningPath";

  // Core fields
  slug: string;
  title: string;
  description: string;
  icon: string;                     // Lucide icon name

  // Classification
  investorLevel: InvestorLevel;
  estimatedHours: number;           // Total time to complete

  // Personalization targeting
  targetPersonas: InvestorPersona[];
  targetStrategies?: InvestmentStrategy[];

  // Structure
  modules: LearningModule[];

  // Prerequisites
  prerequisites?: string[];         // Other path slugs

  // Completion
  certificateEnabled: boolean;

  // Publishing
  status: "draft" | "published" | "archived";

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

interface LearningModule {
  _id: string;
  title: string;
  description: string;
  order: number;
  lessons: LearningLesson[];
}

interface LearningLesson {
  _id: string;
  title: string;
  type: LessonType;
  contentRef: string;               // Reference to article/video/quiz slug
  order: number;
  estimatedMinutes: number;
  isRequired: boolean;
}

type LessonType = "article" | "video" | "quiz" | "exercise" | "checklist" | "calculator";
```

---

## Taxonomy Types

### Categories

```typescript
type GlossaryCategory =
  | "financing"           // Mortgages, loans, leverage, credit
  | "valuation"           // Appraisals, cap rates, ARV, pricing
  | "operations"          // NOI, vacancy, property management
  | "taxation"            // Depreciation, 1031, cost segregation
  | "acquisition"         // Due diligence, closing, offers
  | "legal"               // Contracts, entities, liability
  | "market-analysis"     // Demographics, trends, cycles
  | "investment-metrics"  // ROI, cash-on-cash, IRR
  | "property-types"      // SFR, multifamily, commercial
  | "strategies";         // BRRRR, house hacking, flipping

const CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  "financing": "Financing & Leverage",
  "valuation": "Valuation & Analysis",
  "operations": "Operations & Management",
  "taxation": "Tax Strategy",
  "acquisition": "Acquisition & Due Diligence",
  "legal": "Legal & Compliance",
  "market-analysis": "Market Analysis",
  "investment-metrics": "Investment Metrics",
  "property-types": "Property Types",
  "strategies": "Investment Strategies",
};

const CATEGORY_ICONS: Record<GlossaryCategory, string> = {
  "financing": "Landmark",
  "valuation": "TrendingUp",
  "operations": "Settings",
  "taxation": "Receipt",
  "acquisition": "Key",
  "legal": "Scale",
  "market-analysis": "BarChart3",
  "investment-metrics": "Calculator",
  "property-types": "Building2",
  "strategies": "Target",
};
```

### Investor Levels

```typescript
type InvestorLevel = "beginner" | "intermediate" | "advanced";

const LEVEL_LABELS: Record<InvestorLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const LEVEL_COLORS: Record<InvestorLevel, string> = {
  beginner: "emerald",      // Green - accessible, welcoming
  intermediate: "amber",    // Yellow - caution, learning
  advanced: "violet",       // Purple - mastery, expertise
};
```

### Personalization Types (Match Onboarding)

```typescript
// User investment personas
type InvestorPersona =
  | "wealth-builder"      // Long-term appreciation focus
  | "cash-flow-seeker"    // Monthly income priority
  | "equity-optimizer"    // BRRRR, value-add specialist
  | "passive-investor"    // Syndications, hands-off
  | "first-timer";        // New to real estate

// User investment phase
type InvestmentPhase =
  | "researching"         // Learning, not yet invested
  | "first-property"      // Acquiring first property
  | "scaling"             // Building portfolio (2-10 properties)
  | "optimizing"          // Maximizing existing portfolio
  | "legacy";             // Wealth transfer, estate planning

// Investment strategies
type InvestmentStrategy =
  | "buy-and-hold"
  | "brrrr"
  | "house-hacking"
  | "fix-and-flip"
  | "wholesale"
  | "short-term-rental"
  | "commercial"
  | "syndication";

// Learning contexts (matches existing snippet contexts)
type LearningContext =
  | "debt-logic"
  | "acquisition"
  | "operating-core"
  | "tax-shield"
  | "asset-configuration"
  | "acquisition-metadata"
  | "calculation-presumptions"
  | "notification-engine"
  | "general";
```

---

## Supporting Types

### Rich Text (Portable Text)

```typescript
// Sanity-compatible rich text format
// Stored as JSON array, easily migrated to CMS
interface PortableText {
  _type: "block";
  _key: string;
  style: "normal" | "h2" | "h3" | "h4" | "blockquote";
  markDefs: MarkDef[];
  children: TextSpan[];
}

interface TextSpan {
  _type: "span";
  _key: string;
  text: string;
  marks: string[];  // References to markDefs
}

interface MarkDef {
  _key: string;
  _type: "link" | "glossaryRef" | "strong" | "em" | "code";
  href?: string;           // For links
  glossarySlug?: string;   // For glossary references
}

// Custom block types
interface CalloutBlock {
  _type: "callout";
  _key: string;
  style: "info" | "warning" | "tip" | "example";
  content: PortableText;
}

interface FormulaBlock {
  _type: "formula";
  _key: string;
  expression: string;      // LaTeX or plain text
  variables: FormulaVariable[];
}

interface CodeBlock {
  _type: "code";
  _key: string;
  language: string;
  code: string;
}
```

### Examples & Formulas

```typescript
interface Example {
  title: string;
  scenario: string;         // Setup/context
  calculation?: string;     // Step-by-step math
  outcome: string;          // Result/conclusion
}

interface Formula {
  name: string;
  expression: string;       // LaTeX or plain: "NOI / Property Value"
  variables: FormulaVariable[];
  example?: {
    inputs: Record<string, number>;
    result: number;
  };
}

interface FormulaVariable {
  symbol: string;           // "NOI"
  description: string;      // "Net Operating Income"
  unit?: string;            // "$", "%", "years"
}
```

### Media & Links

```typescript
interface MediaAsset {
  _type: "image" | "video";
  url: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
}

interface Author {
  name: string;
  title?: string;           // "Real Estate Analyst"
  avatar?: string;          // URL to avatar image
  bio?: string;
}

interface CallToAction {
  type: "feature" | "external" | "next-lesson" | "glossary";
  label: string;
  destination: string;      // Route path or URL
  featureFlag?: string;     // PostHog flag for gating
}

interface FeatureLink {
  label: string;            // "See it in Property Financials"
  route: string;            // "/property-hub/:propertyId/financials"
  section?: string;         // Anchor or tab name
}

interface SEOMetadata {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
}
```

---

## User Progress Types

```typescript
interface UserLearningProgress {
  id: string;
  userId: string;
  contentType: "term" | "article" | "path" | "lesson" | "quiz";
  contentSlug: string;
  status: "viewed" | "in_progress" | "completed";
  progressData?: {
    // For paths
    currentModuleId?: string;
    currentLessonId?: string;
    completedLessons?: string[];
    // For quizzes
    lastScore?: number;
    attempts?: number;
  };
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserBookmark {
  id: string;
  userId: string;
  contentType: "term" | "article" | "path";
  contentSlug: string;
  createdAt: string;
}

interface UserQuizAttempt {
  id: string;
  userId: string;
  quizSlug: string;
  score: number;
  maxScore: number;
  answers: Record<string, string>;  // questionId -> answerId
  completedAt: string;
}
```

---

## Recommendation Types

```typescript
interface UserLearningContext {
  // From onboarding (users.onboardingData)
  persona: InvestorPersona | null;
  phase: InvestmentPhase | null;
  strategy: InvestmentStrategy | null;
  freedomNumber: number | null;
  targetMarkets: string[];

  // Calculated from portfolio
  portfolio: {
    totalProperties: number;
    totalEquity: number;
    avgCapRate: number;
    hasLoans: boolean;
    hasMultifamily: boolean;
    hasCommercial: boolean;
    hasShortTermRentals: boolean;
    avgPropertyAge: number;
    utilizesDepreciation: boolean;
  };

  // From activity tracking
  activity: {
    viewedTerms: string[];
    viewedArticles: string[];
    completedPaths: string[];
    inProgressPaths: string[];
    bookmarkedItems: string[];
    recentSearches: string[];
  };
}

interface Recommendation {
  type: "term" | "article" | "path" | "calculator";
  slug: string;
  title: string;
  reason: string;           // Human-readable explanation
  priority: number;         // 1 = highest
  source: RecommendationSource;
}

type RecommendationSource =
  | "onboarding"           // Based on persona/phase/strategy
  | "portfolio"            // Based on property data
  | "activity"             // Based on what they've viewed
  | "gap"                  // Knowledge gap detection
  | "trending"             // Popular content
  | "sequential";          // Next in learning path
```

---

## Quiz Types

```typescript
interface Quiz {
  _id: string;
  _type: "quiz";
  slug: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number;     // Percentage (0-100)
  relatedPath?: string;     // Path this quiz belongs to
  relatedTerms: string[];   // Terms covered
}

interface QuizQuestion {
  _id: string;
  question: string;
  type: "multiple-choice" | "true-false";
  options: QuizOption[];
  explanation: string;      // Shown after answering
  relatedTerm?: string;     // Link to glossary for deeper learning
}

interface QuizOption {
  _id: string;
  text: string;
  isCorrect: boolean;
}
```

---

## Calculator Types

```typescript
interface Calculator {
  _id: string;
  _type: "calculator";
  slug: string;
  name: string;
  description: string;
  category: GlossaryCategory;
  inputs: CalculatorInput[];
  formula: string;          // Description of calculation
  relatedTerms: string[];   // Glossary terms used
}

interface CalculatorInput {
  id: string;
  label: string;
  type: "currency" | "percentage" | "number" | "years";
  placeholder?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  helpText?: string;
  glossarySlug?: string;    // Link to term for explanation
}
```

---

## JSON File Structure

### Example Glossary Term (financing.json)

```json
{
  "terms": [
    {
      "_id": "term_ltv_001",
      "_type": "glossaryTerm",
      "slug": "loan-to-value",
      "term": "Loan-to-Value Ratio (LTV)",
      "shortDefinition": "The ratio of a loan amount to the appraised value of a property, expressed as a percentage. A key metric lenders use to assess risk.",
      "fullDefinition": [
        {
          "_type": "block",
          "_key": "p1",
          "style": "normal",
          "children": [
            {
              "_type": "span",
              "text": "Loan-to-Value (LTV) ratio measures how much you're borrowing relative to a property's value. For example, if you purchase a $500,000 property with a $400,000 loan, your LTV is 80%."
            }
          ]
        }
      ],
      "category": "financing",
      "investorLevel": "beginner",
      "relatedTerms": ["equity", "refinance", "down-payment", "pmi"],
      "synonyms": ["LTV", "loan to value"],
      "formulas": [
        {
          "name": "LTV Calculation",
          "expression": "Loan Amount / Property Value × 100",
          "variables": [
            { "symbol": "Loan Amount", "description": "Total mortgage balance", "unit": "$" },
            { "symbol": "Property Value", "description": "Appraised or purchase price", "unit": "$" }
          ],
          "example": {
            "inputs": { "loanAmount": 400000, "propertyValue": 500000 },
            "result": 80
          }
        }
      ],
      "proTips": [
        "Most conventional loans require LTV of 80% or below to avoid PMI",
        "Investment property loans typically allow max 75-80% LTV",
        "DSCR loans may allow higher LTV for strong cash-flowing properties"
      ],
      "featureLink": {
        "label": "View in Debt Logic",
        "route": "/property-hub/:propertyId/financials",
        "section": "debt-logic"
      },
      "createdAt": "2026-01-26T00:00:00Z",
      "updatedAt": "2026-01-26T00:00:00Z"
    }
  ]
}
```

---

## Migration Notes

When migrating to Sanity.io:

1. **Document types** map directly (`_type: "glossaryTerm"` → Sanity schema)
2. **Portable Text** is native to Sanity
3. **References** convert to Sanity references (`relatedTerms` → `reference` type)
4. **Slugs** become Sanity's `slug` type with auto-generation
5. **Categories** become a separate document type or string list

The schema is intentionally designed to minimize transformation during CMS migration.
