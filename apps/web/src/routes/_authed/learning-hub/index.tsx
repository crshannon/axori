import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  BookOpen,
  ArrowRight,
  Clock,
  Zap,
  ChevronRight,
} from "lucide-react";
import { useLearningHubContext } from "../learning-hub";
import * as LucideIcons from "lucide-react";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  type GlossaryCategory,
} from "@axori/shared";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";
import { allGlossaryTerms, getCategoryCounts } from "@/data/learning-hub/glossary";

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
  const categoryCounts = getCategoryCounts();

  // Get icon component by name
  const getIcon = (iconName: string) => {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>;
    const Icon = icons[iconName];
    return Icon || BookOpen;
  };

  // Filter protocols by category
  const filteredProtocols = useMemo(() => {
    if (selectedCategory === "all") return PROTOCOLS;
    return PROTOCOLS.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  // Get recommended terms based on journey
  const recommendedTerms = useMemo(() => {
    const journeyTermMap: Record<string, string[]> = {
      builder: ["brrrr", "house-hacking", "dscr", "ltv", "cash-on-cash-return"],
      optimizer: ["cost-segregation", "1031-exchange", "depreciation", "cap-rate", "noi"],
      explorer: ["cap-rate", "noi", "cash-flow", "appreciation", "equity"],
    };
    const slugs = journeyTermMap[selectedJourney] || journeyTermMap.explorer;
    return allGlossaryTerms
      .filter((t) => slugs.includes(t.slug))
      .slice(0, 5);
  }, [selectedJourney]);

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
                className={cn(
                  "group p-6 rounded-2xl border transition-all cursor-pointer",
                  isDark
                    ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                    : "bg-white border-slate-200 hover:shadow-xl hover:border-violet-200"
                )}
              >
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
                  "group p-4 rounded-xl border transition-all",
                  isDark
                    ? "bg-white/5 border-white/10 hover:bg-white/10"
                    : "bg-white border-slate-200 hover:shadow-lg"
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

      {/* Stats Bar */}
      <div
        className={cn(
          "p-6 rounded-2xl border flex flex-wrap gap-8 items-center justify-center",
          isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
        )}
      >
        {[
          { value: allGlossaryTerms.length, label: "Glossary Terms" },
          { value: Object.keys(categoryCounts).length, label: "Categories" },
          { value: PROTOCOLS.length, label: "Protocols" },
          { value: "100+", label: "Pro Tips" },
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
