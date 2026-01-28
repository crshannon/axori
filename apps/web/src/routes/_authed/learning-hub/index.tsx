import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  ChevronRight,
  Clock,
  GraduationCap,
  History,
  Zap,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  LEVEL_LABELS,
} from "@axori/shared";
import { useLearningHubContext } from "../learning-hub";
import type { GlossaryCategory } from "@axori/shared";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";
import { allGlossaryTerms, getTermBySlug } from "@/data/learning-hub/glossary";
import {
  allLearningPaths,
  getPathLessonCount,
  getPathTotalMinutes,
} from "@/data/learning-hub/paths";
import {
  getBookmarksByType,
  getLearningStats,
  getPathsInProgress,
  getRecentlyViewed,
} from "@/lib/learning-hub/progress";
import { getQuickRecommendations } from "@/lib/learning-hub/recommendations";

export const Route = createFileRoute("/_authed/learning-hub/")({
  component: LearningHubHome,
});

// Simplified category filters matching the design
const CATEGORY_FILTERS = [
  { id: "all", label: "ALL" },
  { id: "financing", label: "FINANCING" },
  { id: "investment-metrics", label: "PERFORMANCE" },
  { id: "taxation", label: "TAX" },
  { id: "strategies", label: "STRATEGY" },
  { id: "operations", label: "OPERATIONS" },
] as const;

// Protocol cards (placeholder content for the PROTOCOLS tab)
const PROTOCOLS = [
  {
    id: "brrrr-method",
    title: "The BRRRR Method",
    description: "Buy, Rehab, Rent, Refinance, Repeat - A complete guide to building wealth through strategic property recycling",
    category: "strategies",
    readTime: "15 min read",
    difficulty: "intermediate",
    tags: ["financing", "strategy", "growth"],
  },
  {
    id: "cash-flow-analysis",
    title: "Cash Flow Analysis 101",
    description: "Master the fundamentals of evaluating rental property cash flow and making profitable investment decisions",
    category: "investment-metrics",
    readTime: "10 min read",
    difficulty: "beginner",
    tags: ["metrics", "analysis"],
  },
  {
    id: "tax-optimization",
    title: "Real Estate Tax Strategies",
    description: "Leverage depreciation, 1031 exchanges, and cost segregation to minimize your tax burden legally",
    category: "taxation",
    readTime: "20 min read",
    difficulty: "advanced",
    tags: ["tax", "depreciation", "1031"],
  },
  {
    id: "financing-options",
    title: "Financing Your First Property",
    description: "Compare conventional loans, FHA, VA, DSCR loans, and creative financing strategies for investors",
    category: "financing",
    readTime: "12 min read",
    difficulty: "beginner",
    tags: ["loans", "financing", "getting-started"],
  },
  {
    id: "property-management",
    title: "Self-Management vs PM Company",
    description: "Analyze the costs, benefits, and breakeven points for managing your own rental properties",
    category: "operations",
    readTime: "8 min read",
    difficulty: "beginner",
    tags: ["management", "operations"],
  },
  {
    id: "market-analysis",
    title: "Analyzing Rental Markets",
    description: "Use data-driven approaches to identify high-growth markets and evaluate neighborhood potential",
    category: "market-analysis",
    readTime: "15 min read",
    difficulty: "intermediate",
    tags: ["research", "markets", "data"],
  },
];

function LearningHubHome() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const { selectedJourney } = useLearningHubContext();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showComingSoon, setShowComingSoon] = useState<string | null>(null);

  // Personalization state
  const [recentlyViewed, setRecentlyViewed] = useState<ReturnType<typeof getRecentlyViewed>>([]);
  const [bookmarks, setBookmarks] = useState<ReturnType<typeof getBookmarksByType>>([]);
  const [stats, setStats] = useState<ReturnType<typeof getLearningStats> | null>(null);
  const [pathsInProgress, setPathsInProgress] = useState<ReturnType<typeof getPathsInProgress>>([]);

  // Load personalization data
  useEffect(() => {
    setRecentlyViewed(getRecentlyViewed(5));
    setBookmarks(getBookmarksByType("term"));
    setStats(getLearningStats());
    setPathsInProgress(getPathsInProgress());
  }, []);

  // Get icon component by name
  const getIcon = (iconName: string) => {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }> | undefined>;
    const Icon = icons[iconName];
    return Icon ?? BookOpen;
  };

  // Filter protocols by category
  const filteredProtocols = useMemo(() => {
    if (selectedCategory === "all") return PROTOCOLS;
    return PROTOCOLS.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  // Get personalized recommendations based on journey and viewed terms
  const recommendations = useMemo(() => {
    const viewedSlugs = recentlyViewed
      .filter((r) => r.contentType === "term")
      .map((r) => r.slug);
    return getQuickRecommendations(
      selectedJourney as "builder" | "optimizer" | "explorer",
      viewedSlugs,
      5
    );
  }, [selectedJourney, recentlyViewed]);

  // Get recommended terms based on journey (keeping existing logic as fallback)
  const recommendedTerms = useMemo(() => {
    // Use recommendations if available, otherwise fall back to static mapping
    if (recommendations.length > 0) {
      return recommendations
        .filter((r) => r.type === "term")
        .map((r) => getTermBySlug(r.slug))
        .filter((t): t is NonNullable<typeof t> => t !== undefined)
        .slice(0, 5);
    }

    const journeyTermMap: Record<string, Array<string> | undefined> = {
      builder: ["brrrr", "house-hacking", "dscr", "ltv", "cash-on-cash-return"],
      optimizer: ["cost-segregation", "1031-exchange", "depreciation", "cap-rate", "noi"],
      explorer: ["cap-rate", "noi", "cash-flow", "appreciation", "equity"],
    };
    const defaultSlugs = ["cap-rate", "noi", "cash-flow", "appreciation", "equity"];
    const slugs = journeyTermMap[selectedJourney] ?? defaultSlugs;
    return allGlossaryTerms
      .filter((t) => slugs.includes(t.slug))
      .slice(0, 5);
  }, [selectedJourney, recommendations]);

  const journeyLabel = selectedJourney.charAt(0).toUpperCase() + selectedJourney.slice(1) + "s";

  return (
    <div className="px-6 xl:px-8 pb-8">
      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all",
              selectedCategory === cat.id
                ? isDark
                  ? "bg-white text-black border-white"
                  : "bg-slate-900 text-white border-slate-900"
                : isDark
                  ? "bg-transparent text-white/60 border-white/20 hover:text-white hover:border-white/40"
                  : "bg-transparent text-slate-500 border-slate-300 hover:text-slate-900 hover:border-slate-400"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Recommended Section */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div
            className={cn(
              "w-8 h-1 rounded-full",
              isDark ? "bg-[#E8FF4D]" : "bg-violet-600"
            )}
          />
          <h2
            className={cn(
              "text-sm font-black uppercase tracking-widest",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            Recommended for {journeyLabel}
          </h2>
        </div>

        {/* Protocol Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProtocols.map((protocol) => {
            const categoryIcon = CATEGORY_ICONS[protocol.category as GlossaryCategory] || "BookOpen";
            const Icon = getIcon(categoryIcon);

            return (
              <div
                key={protocol.id}
                onClick={() => {
                  setShowComingSoon(protocol.id);
                  setTimeout(() => setShowComingSoon(null), 2000);
                }}
                className={cn(
                  "group p-6 rounded-2xl border transition-all cursor-pointer relative overflow-hidden",
                  isDark
                    ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                    : "bg-white border-slate-200 hover:shadow-xl hover:border-violet-200"
                )}
              >
                {/* Coming Soon Badge */}
                <div
                  className={cn(
                    "absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                    isDark
                      ? "bg-white/10 text-white/40"
                      : "bg-slate-100 text-slate-400"
                  )}
                >
                  Coming Soon
                </div>

                {/* Coming Soon Toast */}
                {showComingSoon === protocol.id && (
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center z-10 rounded-2xl",
                      isDark ? "bg-black/80" : "bg-white/90"
                    )}
                  >
                    <div className="text-center">
                      <div
                        className={cn(
                          "text-lg font-black mb-1",
                          isDark ? "text-[#E8FF4D]" : "text-violet-600"
                        )}
                      >
                        Coming Soon
                      </div>
                      <div
                        className={cn(
                          "text-sm",
                          isDark ? "text-white/60" : "text-slate-500"
                        )}
                      >
                        Protocols are under development
                      </div>
                    </div>
                  </div>
                )}
                {/* Category & Read Time */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={cn(
                      "flex items-center gap-2 text-xs font-bold uppercase tracking-wider",
                      isDark ? "text-white/40" : "text-slate-400"
                    )}
                  >
                    <Icon size={14} />
                    {CATEGORY_LABELS[protocol.category as GlossaryCategory] || protocol.category}
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      isDark ? "text-white/40" : "text-slate-400"
                    )}
                  >
                    <Clock size={12} />
                    {protocol.readTime}
                  </div>
                </div>

                {/* Title */}
                <h3
                  className={cn(
                    "text-lg font-black mb-2 group-hover:underline decoration-2 underline-offset-4",
                    isDark
                      ? "text-white decoration-[#E8FF4D]"
                      : "text-slate-900 decoration-violet-600"
                  )}
                >
                  {protocol.title}
                </h3>

                {/* Description */}
                <p
                  className={cn(
                    "text-sm mb-4 line-clamp-2",
                    isDark ? "text-white/60" : "text-slate-500"
                  )}
                >
                  {protocol.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {protocol.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                        isDark
                          ? "bg-white/10 text-white/60"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Difficulty Badge */}
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded",
                      protocol.difficulty === "beginner" &&
                        (isDark
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-emerald-100 text-emerald-700"),
                      protocol.difficulty === "intermediate" &&
                        (isDark
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-amber-100 text-amber-700"),
                      protocol.difficulty === "advanced" &&
                        (isDark
                          ? "bg-violet-500/20 text-violet-400"
                          : "bg-violet-100 text-violet-700")
                    )}
                  >
                    {protocol.difficulty}
                  </span>
                  <ChevronRight
                    size={18}
                    className={cn(
                      "transition-transform group-hover:translate-x-1",
                      isDark ? "text-[#E8FF4D]" : "text-violet-600"
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Learning Paths Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <GraduationCap
              className={isDark ? "text-[#E8FF4D]" : "text-violet-600"}
              size={20}
            />
            <h2
              className={cn(
                "text-sm font-black uppercase tracking-widest",
                isDark ? "text-white" : "text-slate-900"
              )}
            >
              Learning Paths
            </h2>
          </div>
          <Link
            to="/learning-hub/paths"
            className={cn(
              "text-sm font-bold flex items-center gap-1 transition-all",
              isDark
                ? "text-[#E8FF4D] hover:text-[#E8FF4D]/80"
                : "text-violet-600 hover:text-violet-700"
            )}
          >
            View All Paths
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allLearningPaths
            .filter((p) => p.status === "published")
            .slice(0, 3)
            .map((path) => {
              const PathIcon = getIcon(path.icon);
              const lessonCount = getPathLessonCount(path);
              const totalMinutes = getPathTotalMinutes(path);
              const progressData = pathsInProgress.find(
                (p) => p.pathSlug === path.slug
              );
              const completedCount = progressData?.completedLessons.length || 0;
              const progressPercent =
                lessonCount > 0 ? (completedCount / lessonCount) * 100 : 0;

              return (
                <Link
                  key={path.slug}
                  to="/learning-hub/paths/$slug"
                  params={{ slug: path.slug }}
                  className={cn(
                    "group p-6 rounded-2xl border transition-all duration-300",
                    isDark
                      ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      : "bg-white border-slate-200 hover:shadow-xl hover:border-violet-200"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border",
                        path.investorLevel === "beginner" &&
                          (isDark
                            ? "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400"
                            : "bg-gradient-to-br from-emerald-100 to-emerald-50 border-emerald-200 text-emerald-600"),
                        path.investorLevel === "intermediate" &&
                          (isDark
                            ? "bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400"
                            : "bg-gradient-to-br from-amber-100 to-amber-50 border-amber-200 text-amber-600"),
                        path.investorLevel === "advanced" &&
                          (isDark
                            ? "bg-gradient-to-br from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-400"
                            : "bg-gradient-to-br from-violet-100 to-violet-50 border-violet-200 text-violet-600")
                      )}
                    >
                      <PathIcon size={22} />
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                            path.investorLevel === "beginner" &&
                              (isDark
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-emerald-100 text-emerald-700"),
                            path.investorLevel === "intermediate" &&
                              (isDark
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-amber-100 text-amber-700"),
                            path.investorLevel === "advanced" &&
                              (isDark
                                ? "bg-violet-500/20 text-violet-400"
                                : "bg-violet-100 text-violet-700")
                          )}
                        >
                          {LEVEL_LABELS[path.investorLevel]}
                        </span>
                      </div>
                      <h3
                        className={cn(
                          "font-bold text-base mb-1",
                          isDark ? "text-white" : "text-slate-900"
                        )}
                      >
                        {path.title}
                      </h3>
                      <p
                        className={cn(
                          "text-xs line-clamp-2 mb-3",
                          isDark ? "text-white/50" : "text-slate-500"
                        )}
                      >
                        {path.description}
                      </p>
                      <div
                        className={cn(
                          "flex items-center gap-3 text-xs",
                          isDark ? "text-white/40" : "text-slate-400"
                        )}
                      >
                        <span>{path.modules.length} modules</span>
                        <span>-</span>
                        <span>
                          {totalMinutes < 60
                            ? `${totalMinutes}m`
                            : `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div
                      className={cn(
                        "h-1.5 rounded-full",
                        isDark ? "bg-white/10" : "bg-slate-100"
                      )}
                    >
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          path.investorLevel === "beginner" && "bg-emerald-500",
                          path.investorLevel === "intermediate" && "bg-amber-500",
                          path.investorLevel === "advanced" && "bg-violet-500"
                        )}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div
                      className={cn(
                        "text-xs mt-1",
                        isDark ? "text-white/40" : "text-slate-400"
                      )}
                    >
                      {completedCount > 0
                        ? `${completedCount}/${lessonCount} lessons`
                        : "Not started"}
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>

      {/* Quick Terms Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Zap
              className={isDark ? "text-[#E8FF4D]" : "text-violet-600"}
              size={20}
            />
            <h2
              className={cn(
                "text-sm font-black uppercase tracking-widest",
                isDark ? "text-white" : "text-slate-900"
              )}
            >
              Quick Terms to Know
            </h2>
          </div>
          <Link
            to="/learning-hub/glossary"
            className={cn(
              "text-sm font-bold flex items-center gap-1 transition-all",
              isDark
                ? "text-[#E8FF4D] hover:text-[#E8FF4D]/80"
                : "text-violet-600 hover:text-violet-700"
            )}
          >
            View Glossary
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {recommendedTerms.map((term) => {
            const Icon = getIcon(CATEGORY_ICONS[term.category]);
            return (
              <Link
                key={term.slug}
                to="/learning-hub/glossary/$slug"
                params={{ slug: term.slug }}
                className={cn(
                  "group p-4 rounded-2xl border transition-all duration-300",
                  isDark
                    ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                    : "bg-white border-slate-200 hover:shadow-xl hover:border-violet-200"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon
                    size={14}
                    className={isDark ? "text-white/40" : "text-slate-400"}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      isDark ? "text-white/40" : "text-slate-400"
                    )}
                  >
                    {CATEGORY_LABELS[term.category]}
                  </span>
                </div>
                <h4
                  className={cn(
                    "font-bold text-sm mb-1",
                    isDark ? "text-white" : "text-slate-900"
                  )}
                >
                  {term.term}
                </h4>
                <p
                  className={cn(
                    "text-xs line-clamp-2",
                    isDark ? "text-white/50" : "text-slate-500"
                  )}
                >
                  {term.shortDefinition}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <History
              className={isDark ? "text-[#E8FF4D]" : "text-violet-600"}
              size={20}
            />
            <h2
              className={cn(
                "text-sm font-black uppercase tracking-widest",
                isDark ? "text-white" : "text-slate-900"
              )}
            >
              Continue Learning
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {recentlyViewed
              .filter((item) => item.contentType === "term")
              .map((item) => {
                const term = getTermBySlug(item.slug);
                if (!term) return null;
                const Icon = getIcon(CATEGORY_ICONS[term.category]);
                return (
                  <Link
                    key={item.slug}
                    to="/learning-hub/glossary/$slug"
                    params={{ slug: item.slug }}
                    className={cn(
                      "group p-4 rounded-2xl border transition-all duration-300 relative",
                      isDark
                        ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                        : "bg-white border-slate-200 hover:shadow-xl hover:border-violet-200"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-2 right-2 w-2 h-2 rounded-full",
                        isDark ? "bg-[#E8FF4D]" : "bg-violet-600"
                      )}
                      title="Recently viewed"
                    />
                    <div className="flex items-center gap-2 mb-2">
                      <Icon
                        size={14}
                        className={isDark ? "text-white/40" : "text-slate-400"}
                      />
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          isDark ? "text-white/40" : "text-slate-400"
                        )}
                      >
                        {CATEGORY_LABELS[term.category]}
                      </span>
                    </div>
                    <h4
                      className={cn(
                        "font-bold text-sm mb-1",
                        isDark ? "text-white" : "text-slate-900"
                      )}
                    >
                      {term.term}
                    </h4>
                    <p
                      className={cn(
                        "text-xs line-clamp-2",
                        isDark ? "text-white/50" : "text-slate-500"
                      )}
                    >
                      {term.shortDefinition}
                    </p>
                  </Link>
                );
              })}
          </div>
        </div>
      )}

      {/* Bookmarks Section */}
      {bookmarks.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bookmark
                className={isDark ? "text-[#E8FF4D]" : "text-violet-600"}
                size={20}
              />
              <h2
                className={cn(
                  "text-sm font-black uppercase tracking-widest",
                  isDark ? "text-white" : "text-slate-900"
                )}
              >
                Your Saved Terms
              </h2>
            </div>
            <span
              className={cn(
                "text-xs font-bold",
                isDark ? "text-white/40" : "text-slate-400"
              )}
            >
              {bookmarks.length} saved
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {bookmarks.slice(0, 5).map((bookmark) => {
              const term = getTermBySlug(bookmark.slug);
              if (!term) return null;
              const Icon = getIcon(CATEGORY_ICONS[term.category]);
              return (
                <Link
                  key={bookmark.slug}
                  to="/learning-hub/glossary/$slug"
                  params={{ slug: bookmark.slug }}
                  className={cn(
                    "group p-4 rounded-2xl border transition-all duration-300",
                    isDark
                      ? "bg-[#E8FF4D]/5 border-[#E8FF4D]/20 hover:bg-[#E8FF4D]/10 hover:border-[#E8FF4D]/30"
                      : "bg-violet-50 border-violet-200 hover:shadow-xl hover:border-violet-300"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon
                      size={14}
                      className={isDark ? "text-[#E8FF4D]/60" : "text-violet-400"}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        isDark ? "text-[#E8FF4D]/60" : "text-violet-400"
                      )}
                    >
                      {CATEGORY_LABELS[term.category]}
                    </span>
                  </div>
                  <h4
                    className={cn(
                      "font-bold text-sm mb-1",
                      isDark ? "text-white" : "text-slate-900"
                    )}
                  >
                    {term.term}
                  </h4>
                  <p
                    className={cn(
                      "text-xs line-clamp-2",
                      isDark ? "text-white/50" : "text-slate-500"
                    )}
                  >
                    {term.shortDefinition}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div
        className={cn(
          "p-6 rounded-2xl border flex flex-wrap gap-8 items-center justify-center",
          isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
        )}
      >
        {[
          { value: stats?.totalTermsViewed || 0, label: "Terms Viewed" },
          { value: stats?.totalBookmarks || 0, label: "Bookmarked" },
          { value: allGlossaryTerms.length, label: "Total Terms" },
          { value: allLearningPaths.length, label: "Learning Paths" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div
              className={cn(
                "text-3xl font-black",
                isDark ? "text-[#E8FF4D]" : "text-violet-600"
              )}
            >
              {stat.value}
            </div>
            <div
              className={cn(
                "text-xs font-bold uppercase tracking-wider",
                isDark ? "text-white/40" : "text-slate-400"
              )}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
