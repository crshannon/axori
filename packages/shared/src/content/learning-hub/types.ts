/**
 * Learning Hub Type Definitions
 *
 * These types are designed to be CMS-compatible (Sanity.io conventions)
 * for easy migration when moving to a headless CMS.
 */

// ============================================
// TAXONOMY TYPES
// ============================================

/**
 * Categories for organizing glossary terms and content
 */
export type GlossaryCategory =
  | "financing"
  | "valuation"
  | "operations"
  | "taxation"
  | "acquisition"
  | "legal"
  | "market-analysis"
  | "investment-metrics"
  | "property-types"
  | "strategies";

/**
 * Human-readable labels for categories
 */
export const CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  financing: "Financing & Leverage",
  valuation: "Valuation & Analysis",
  operations: "Operations & Management",
  taxation: "Tax Strategy",
  acquisition: "Acquisition & Due Diligence",
  legal: "Legal & Compliance",
  "market-analysis": "Market Analysis",
  "investment-metrics": "Investment Metrics",
  "property-types": "Property Types",
  strategies: "Investment Strategies",
};

/**
 * Lucide icon names for each category
 */
export const CATEGORY_ICONS: Record<GlossaryCategory, string> = {
  financing: "Landmark",
  valuation: "TrendingUp",
  operations: "Settings",
  taxation: "Receipt",
  acquisition: "Key",
  legal: "Scale",
  "market-analysis": "BarChart3",
  "investment-metrics": "Calculator",
  "property-types": "Building2",
  strategies: "Target",
};

/**
 * Investor experience levels
 */
export type InvestorLevel = "beginner" | "intermediate" | "advanced";

/**
 * Human-readable labels for levels
 */
export const LEVEL_LABELS: Record<InvestorLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

/**
 * Color scheme for levels (Tailwind color names)
 */
export const LEVEL_COLORS: Record<InvestorLevel, string> = {
  beginner: "emerald",
  intermediate: "amber",
  advanced: "violet",
};

// ============================================
// PERSONALIZATION TYPES (Match Onboarding)
// ============================================

/**
 * User investment personas from onboarding
 */
export type InvestorPersona =
  | "wealth-builder"
  | "cash-flow-seeker"
  | "equity-optimizer"
  | "passive-investor"
  | "first-timer";

/**
 * User investment phase from onboarding
 */
export type InvestmentPhase =
  | "researching"
  | "first-property"
  | "scaling"
  | "optimizing"
  | "legacy";

/**
 * Investment strategies
 */
export type InvestmentStrategy =
  | "buy-and-hold"
  | "brrrr"
  | "house-hacking"
  | "fix-and-flip"
  | "wholesale"
  | "short-term-rental"
  | "commercial"
  | "syndication";

/**
 * Learning contexts (matches existing snippet contexts)
 */
export type LearningContext =
  | "debt-logic"
  | "acquisition"
  | "operating-core"
  | "tax-shield"
  | "asset-configuration"
  | "acquisition-metadata"
  | "calculation-presumptions"
  | "notification-engine"
  | "general";

// ============================================
// CONTENT TYPES
// ============================================

/**
 * Rich text block (Sanity Portable Text compatible)
 */
export interface PortableTextBlock {
  _type: "block";
  _key: string;
  style: "normal" | "h2" | "h3" | "h4" | "blockquote";
  children: Array<{
    _type: "span";
    _key: string;
    text: string;
    marks?: string[];
  }>;
  markDefs?: Array<{
    _key: string;
    _type: "link" | "glossaryRef";
    href?: string;
    glossarySlug?: string;
  }>;
}

/**
 * Simplified portable text - array of blocks or plain string for simple cases
 */
export type PortableText = PortableTextBlock[] | string;

/**
 * Real-world example for a glossary term
 */
export interface Example {
  title: string;
  scenario: string;
  calculation?: string;
  outcome: string;
}

/**
 * Mathematical formula with variable definitions
 */
export interface Formula {
  name: string;
  expression: string;
  variables: FormulaVariable[];
  example?: {
    inputs: Record<string, number>;
    result: number;
  };
}

/**
 * Variable in a formula
 */
export interface FormulaVariable {
  symbol: string;
  description: string;
  unit?: string;
}

/**
 * Link to app feature
 */
export interface FeatureLink {
  label: string;
  route: string;
  section?: string;
}

/**
 * Call to action button
 */
export interface CallToAction {
  type: "feature" | "external" | "next-lesson" | "glossary";
  label: string;
  destination: string;
  featureFlag?: string;
}

// ============================================
// GLOSSARY TERM
// ============================================

/**
 * A glossary term entry
 */
export interface GlossaryTerm {
  /** Unique identifier (CMS-compatible) */
  _id: string;
  /** Document type for CMS */
  _type: "glossaryTerm";
  /** URL-friendly identifier */
  slug: string;
  /** Display name */
  term: string;
  /** Short 1-2 sentence definition */
  shortDefinition: string;
  /** Full rich text explanation */
  fullDefinition: PortableText;
  /** Primary category */
  category: GlossaryCategory;
  /** Difficulty level */
  investorLevel: InvestorLevel;
  /** Related term slugs */
  relatedTerms: string[];
  /** Alternative names for search */
  synonyms: string[];
  /** Real-world examples */
  examples?: Example[];
  /** Mathematical formulas */
  formulas?: Formula[];
  /** Expert tips */
  proTips?: string[];
  /** Contexts where this term is relevant */
  relevantContexts?: LearningContext[];
  /** Link to app feature */
  featureLink?: FeatureLink;
  /** ISO timestamp */
  createdAt: string;
  /** ISO timestamp */
  updatedAt: string;
}

/**
 * Glossary file structure (for JSON files)
 */
export interface GlossaryFile {
  category: GlossaryCategory;
  terms: GlossaryTerm[];
}

// ============================================
// LEARNING ARTICLE
// ============================================

/**
 * A learning article/guide
 */
export interface LearningArticle {
  _id: string;
  _type: "learningArticle";
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  content: PortableText;
  category: GlossaryCategory;
  tags: string[];
  investorLevel: InvestorLevel;
  readTimeMinutes: number;
  featuredImage?: {
    url: string;
    alt: string;
  };
  author?: {
    name: string;
    title?: string;
  };
  targetPersonas: InvestorPersona[];
  targetPhases: InvestmentPhase[];
  targetStrategies: InvestmentStrategy[];
  relatedArticles: string[];
  relatedGlossaryTerms: string[];
  callToAction?: CallToAction;
  status: "draft" | "published" | "archived";
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// LEARNING PATH
// ============================================

/**
 * A structured learning path with modules
 */
export interface LearningPath {
  _id: string;
  _type: "learningPath";
  slug: string;
  title: string;
  description: string;
  icon: string;
  investorLevel: InvestorLevel;
  estimatedHours: number;
  targetPersonas: InvestorPersona[];
  targetStrategies?: InvestmentStrategy[];
  modules: LearningModule[];
  prerequisites?: string[];
  certificateEnabled: boolean;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}

/**
 * A module within a learning path
 */
export interface LearningModule {
  _id: string;
  title: string;
  description: string;
  order: number;
  lessons: LearningLesson[];
}

/**
 * A lesson within a module
 */
export interface LearningLesson {
  _id: string;
  title: string;
  type: "article" | "video" | "quiz" | "exercise" | "checklist" | "calculator";
  contentRef: string;
  order: number;
  estimatedMinutes: number;
  isRequired: boolean;
}

// ============================================
// USER PROGRESS
// ============================================

/**
 * User's progress on learning content
 */
export interface UserLearningProgress {
  id: string;
  userId: string;
  contentType: "term" | "article" | "path" | "lesson" | "quiz";
  contentSlug: string;
  status: "viewed" | "in_progress" | "completed";
  progressData?: {
    currentModuleId?: string;
    currentLessonId?: string;
    completedLessons?: string[];
    lastScore?: number;
    attempts?: number;
  };
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User bookmark
 */
export interface UserBookmark {
  id: string;
  userId: string;
  contentType: "term" | "article" | "path";
  contentSlug: string;
  createdAt: string;
}

// ============================================
// RECOMMENDATIONS
// ============================================

/**
 * Context for generating personalized recommendations
 */
export interface UserLearningContext {
  persona: InvestorPersona | null;
  phase: InvestmentPhase | null;
  strategy: InvestmentStrategy | null;
  freedomNumber: number | null;
  targetMarkets: string[];
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
  activity: {
    viewedTerms: string[];
    viewedArticles: string[];
    completedPaths: string[];
    inProgressPaths: string[];
    bookmarkedItems: string[];
    recentSearches: string[];
  };
}

/**
 * A personalized recommendation
 */
export interface Recommendation {
  type: "term" | "article" | "path" | "calculator";
  slug: string;
  title: string;
  reason: string;
  priority: number;
  source:
    | "onboarding"
    | "portfolio"
    | "activity"
    | "gap"
    | "trending"
    | "sequential";
}

// ============================================
// SEARCH
// ============================================

/**
 * Search result item
 */
export interface SearchResult {
  type: "term" | "article" | "path";
  slug: string;
  title: string;
  excerpt: string;
  category: GlossaryCategory;
  investorLevel: InvestorLevel;
  score: number;
}

/**
 * Search options
 */
export interface SearchOptions {
  query: string;
  categories?: GlossaryCategory[];
  levels?: InvestorLevel[];
  types?: Array<"term" | "article" | "path">;
  limit?: number;
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * All glossary categories as an array
 */
export const GLOSSARY_CATEGORIES: GlossaryCategory[] = [
  "financing",
  "valuation",
  "operations",
  "taxation",
  "acquisition",
  "legal",
  "market-analysis",
  "investment-metrics",
  "property-types",
  "strategies",
];

/**
 * All investor levels as an array
 */
export const INVESTOR_LEVELS: InvestorLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
];

/**
 * Get category color (Tailwind class)
 */
export function getCategoryColor(category: GlossaryCategory): string {
  const colors: Record<GlossaryCategory, string> = {
    financing: "sky",
    valuation: "indigo",
    operations: "slate",
    taxation: "emerald",
    acquisition: "amber",
    legal: "rose",
    "market-analysis": "cyan",
    "investment-metrics": "violet",
    "property-types": "orange",
    strategies: "fuchsia",
  };
  return colors[category];
}

/**
 * Get level badge color (Tailwind class)
 */
export function getLevelColor(level: InvestorLevel): string {
  return LEVEL_COLORS[level];
}
