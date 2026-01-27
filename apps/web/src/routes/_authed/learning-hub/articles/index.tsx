import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Clock,
  FileText,
  Filter,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  GLOSSARY_CATEGORIES,
  INVESTOR_LEVELS,
  LEVEL_LABELS,
} from "@axori/shared";
import type { GlossaryCategory, InvestorLevel } from "@axori/shared";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";
import { allLearningArticles, getAllTags } from "@/data/learning-hub/articles";

// Search params for filtering
interface ArticlesSearchParams {
  category?: string;
  level?: string;
  tag?: string;
}

export const Route = createFileRoute("/_authed/learning-hub/articles/")({
  component: ArticlesPage,
  validateSearch: (search: Record<string, unknown>): ArticlesSearchParams => {
    return {
      category: typeof search.category === "string" ? search.category : undefined,
      level: typeof search.level === "string" ? search.level : undefined,
      tag: typeof search.tag === "string" ? search.tag : undefined,
    };
  },
});

function ArticlesPage() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const searchParams = Route.useSearch();
  const [selectedCategory, setSelectedCategory] = useState<GlossaryCategory | null>(
    (searchParams.category as GlossaryCategory | undefined) ?? null
  );
  const [selectedLevel, setSelectedLevel] = useState<InvestorLevel | null>(
    (searchParams.level as InvestorLevel | undefined) ?? null
  );
  const [selectedTag, setSelectedTag] = useState<string | null>(
    searchParams.tag ?? null
  );
  const [showFilters, setShowFilters] = useState(false);

  const allTags = getAllTags();

  // Filter articles
  const filteredArticles = useMemo(() => {
    let articles = allLearningArticles.filter((a) => a.status === "published");

    if (selectedCategory) {
      articles = articles.filter((a) => a.category === selectedCategory);
    }

    if (selectedLevel) {
      articles = articles.filter((a) => a.investorLevel === selectedLevel);
    }

    if (selectedTag) {
      articles = articles.filter((a) => a.tags.includes(selectedTag));
    }

    return articles;
  }, [selectedCategory, selectedLevel, selectedTag]);

  // Get icon component by name
  const getIcon = (iconName: string) => {
    const icons = LucideIcons as unknown as Record<
      string,
      React.ComponentType<{ size?: number; className?: string }> | undefined
    >;
    const Icon = icons[iconName];
    return Icon ?? BookOpen;
  };

  return (
    <div className="p-6 xl:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className={cn(
            "text-2xl font-black mb-2",
            isDark ? "text-white" : "text-slate-900"
          )}
        >
          Article Library
        </h1>
        <p className={cn("text-sm", isDark ? "text-white/60" : "text-slate-500")}>
          In-depth guides and tutorials to deepen your real estate knowledge.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-4 py-3 rounded-xl border flex items-center gap-2 text-sm font-bold transition-all",
              showFilters
                ? isDark
                  ? "bg-[#E8FF4D]/20 border-[#E8FF4D]/50 text-[#E8FF4D]"
                  : "bg-violet-100 border-violet-300 text-violet-700"
                : isDark
                  ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
          >
            <Filter size={18} />
            Filters
            {(selectedCategory || selectedLevel || selectedTag) && (
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                  isDark ? "bg-[#E8FF4D] text-black" : "bg-violet-600 text-white"
                )}
              >
                {(selectedCategory ? 1 : 0) +
                  (selectedLevel ? 1 : 0) +
                  (selectedTag ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div
            className={cn(
              "p-4 rounded-xl border space-y-4",
              isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
            )}
          >
            {/* Category Filter */}
            <div>
              <div
                className={cn(
                  "text-xs font-bold uppercase tracking-wider mb-2",
                  isDark ? "text-white/60" : "text-slate-500"
                )}
              >
                Category
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    !selectedCategory
                      ? isDark
                        ? "bg-[#E8FF4D] text-black"
                        : "bg-violet-600 text-white"
                      : isDark
                        ? "bg-white/10 text-white hover:bg-white/20"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  )}
                >
                  All
                </button>
                {GLOSSARY_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() =>
                      setSelectedCategory(selectedCategory === cat ? null : cat)
                    }
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      selectedCategory === cat
                        ? isDark
                          ? "bg-[#E8FF4D] text-black"
                          : "bg-violet-600 text-white"
                        : isDark
                          ? "bg-white/10 text-white hover:bg-white/20"
                          : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                    )}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <div
                className={cn(
                  "text-xs font-bold uppercase tracking-wider mb-2",
                  isDark ? "text-white/60" : "text-slate-500"
                )}
              >
                Level
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedLevel(null)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    !selectedLevel
                      ? isDark
                        ? "bg-[#E8FF4D] text-black"
                        : "bg-violet-600 text-white"
                      : isDark
                        ? "bg-white/10 text-white hover:bg-white/20"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  )}
                >
                  All Levels
                </button>
                {INVESTOR_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      setSelectedLevel(selectedLevel === level ? null : level)
                    }
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      selectedLevel === level
                        ? isDark
                          ? "bg-[#E8FF4D] text-black"
                          : "bg-violet-600 text-white"
                        : isDark
                          ? "bg-white/10 text-white hover:bg-white/20"
                          : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                    )}
                  >
                    {LEVEL_LABELS[level]}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag Filter */}
            <div>
              <div
                className={cn(
                  "text-xs font-bold uppercase tracking-wider mb-2",
                  isDark ? "text-white/60" : "text-slate-500"
                )}
              >
                Tags
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    !selectedTag
                      ? isDark
                        ? "bg-[#E8FF4D] text-black"
                        : "bg-violet-600 text-white"
                      : isDark
                        ? "bg-white/10 text-white hover:bg-white/20"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  )}
                >
                  All
                </button>
                {allTags.slice(0, 15).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      selectedTag === tag
                        ? isDark
                          ? "bg-[#E8FF4D] text-black"
                          : "bg-violet-600 text-white"
                        : isDark
                          ? "bg-white/10 text-white hover:bg-white/20"
                          : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className={cn("text-sm", isDark ? "text-white/60" : "text-slate-500")}>
          {filteredArticles.length} article
          {filteredArticles.length !== 1 ? "s" : ""} found
          {(selectedCategory || selectedLevel || selectedTag) && (
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedLevel(null);
                setSelectedTag(null);
              }}
              className={cn(
                "ml-2 underline",
                isDark
                  ? "text-[#E8FF4D] hover:text-[#E8FF4D]/80"
                  : "text-violet-600 hover:text-violet-700"
              )}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles.map((article) => {
          const categoryIcon = CATEGORY_ICONS[article.category];
          const Icon = getIcon(categoryIcon);

          return (
            <Link
              key={article.slug}
              to="/learning-hub/articles/$slug"
              params={{ slug: article.slug }}
              className={cn(
                "group p-5 rounded-xl border transition-all",
                isDark
                  ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  : "bg-white border-slate-200 hover:shadow-lg hover:border-violet-200"
              )}
            >
              {/* Category & Read Time */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className={cn(
                    "flex items-center gap-2 text-xs font-bold uppercase tracking-wider",
                    isDark ? "text-white/40" : "text-slate-400"
                  )}
                >
                  <Icon size={14} />
                  {CATEGORY_LABELS[article.category]}
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    isDark ? "text-white/40" : "text-slate-400"
                  )}
                >
                  <Clock size={12} />
                  {article.readTimeMinutes} min
                </div>
              </div>

              {/* Title */}
              <h3
                className={cn(
                  "font-bold text-base mb-2 group-hover:underline decoration-2 underline-offset-4",
                  isDark
                    ? "text-white decoration-[#E8FF4D]"
                    : "text-slate-900 decoration-violet-600"
                )}
              >
                {article.title}
              </h3>

              {/* Excerpt */}
              <p
                className={cn(
                  "text-sm line-clamp-2 mb-4",
                  isDark ? "text-white/60" : "text-slate-500"
                )}
              >
                {article.excerpt}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {article.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                      isDark
                        ? "bg-white/10 text-white/60"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded",
                    article.investorLevel === "beginner" &&
                      (isDark
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-emerald-100 text-emerald-700"),
                    article.investorLevel === "intermediate" &&
                      (isDark
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-amber-100 text-amber-700"),
                    article.investorLevel === "advanced" &&
                      (isDark
                        ? "bg-violet-500/20 text-violet-400"
                        : "bg-violet-100 text-violet-700")
                  )}
                >
                  {LEVEL_LABELS[article.investorLevel]}
                </span>
                <ChevronRight
                  size={18}
                  className={cn(
                    "transition-transform group-hover:translate-x-1",
                    isDark ? "text-[#E8FF4D]" : "text-violet-600"
                  )}
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredArticles.length === 0 && (
        <div
          className={cn(
            "text-center py-16",
            isDark ? "text-white/60" : "text-slate-500"
          )}
        >
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-bold mb-2">No articles found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
