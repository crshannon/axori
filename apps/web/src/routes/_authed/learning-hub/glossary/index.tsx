import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Filter, BookOpen, ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  LEVEL_LABELS,
  GLOSSARY_CATEGORIES,
  INVESTOR_LEVELS,
  getCategoryColor,
  type GlossaryCategory,
  type InvestorLevel,
  type GlossaryTerm,
} from "@axori/shared";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";
import {
  allGlossaryTerms,
  getTermsByLetter,
} from "@/data/learning-hub/glossary";

// Search params for filtering
interface GlossarySearchParams {
  category?: string;
  level?: string;
  q?: string;
}

export const Route = createFileRoute("/_authed/learning-hub/glossary/")({
  component: GlossaryPage,
  validateSearch: (search: Record<string, unknown>): GlossarySearchParams => {
    return {
      category: typeof search.category === "string" ? search.category : undefined,
      level: typeof search.level === "string" ? search.level : undefined,
      q: typeof search.q === "string" ? search.q : undefined,
    };
  },
});

function GlossaryPage() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const searchParams = Route.useSearch();
  const [searchQuery, setSearchQuery] = useState(searchParams.q || "");
  const [selectedCategory, setSelectedCategory] = useState<GlossaryCategory | null>(
    (searchParams.category as GlossaryCategory) || null
  );
  const [selectedLevel, setSelectedLevel] = useState<InvestorLevel | null>(
    (searchParams.level as InvestorLevel) || null
  );
  const [showFilters, setShowFilters] = useState(false);

  // Filter terms based on search and filters
  const filteredTerms = useMemo(() => {
    let terms = allGlossaryTerms;

    // Filter by category
    if (selectedCategory) {
      terms = terms.filter((t) => t.category === selectedCategory);
    }

    // Filter by level
    if (selectedLevel) {
      terms = terms.filter((t) => t.investorLevel === selectedLevel);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      terms = terms.filter(
        (t) =>
          t.term.toLowerCase().includes(query) ||
          t.shortDefinition.toLowerCase().includes(query) ||
          t.synonyms.some((s) => s.toLowerCase().includes(query))
      );
    }

    // Sort alphabetically
    return terms.sort((a, b) => a.term.localeCompare(b.term));
  }, [selectedCategory, selectedLevel, searchQuery]);

  // Group filtered terms by letter
  const termsByLetter = useMemo(() => {
    const result: Record<string, GlossaryTerm[]> = {};
    filteredTerms.forEach((term) => {
      const letter = term.term.charAt(0).toUpperCase();
      if (!result[letter]) {
        result[letter] = [];
      }
      result[letter].push(term);
    });
    return result;
  }, [filteredTerms]);

  // Get all available letters
  const allLetters = Object.keys(getTermsByLetter()).sort();
  const activeLetters = Object.keys(termsByLetter).sort();

  // Get icon component by name
  const getIcon = (iconName: string) => {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>;
    const Icon = icons[iconName];
    return Icon || BookOpen;
  };

  return (
    <div className="p-6 xl:p-8">
      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="relative flex-grow">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search terms, definitions, synonyms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition-all outline-none",
                isDark
                  ? "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#E8FF4D]/50"
                  : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-300 focus:shadow-lg"
              )}
            />
          </div>
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
            {(selectedCategory || selectedLevel) && (
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                  isDark ? "bg-[#E8FF4D] text-black" : "bg-violet-600 text-white"
                )}
              >
                {(selectedCategory ? 1 : 0) + (selectedLevel ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panels */}
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
                      setSelectedCategory(
                        selectedCategory === cat ? null : (cat as GlossaryCategory)
                      )
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
                    {CATEGORY_LABELS[cat as GlossaryCategory]}
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
                Investor Level
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
                      setSelectedLevel(
                        selectedLevel === level ? null : (level as InvestorLevel)
                      )
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
                    {LEVEL_LABELS[level as InvestorLevel]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        <div
          className={cn(
            "text-sm",
            isDark ? "text-white/60" : "text-slate-500"
          )}
        >
          {filteredTerms.length} term{filteredTerms.length !== 1 ? "s" : ""} found
          {(selectedCategory || selectedLevel || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
                setSelectedLevel(null);
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

      {/* A-Z Index */}
      <div
        className={cn(
          "flex flex-wrap gap-1 mb-6 p-3 rounded-xl border",
          isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
        )}
      >
        {allLetters.map((letter) => {
          const isActive = activeLetters.includes(letter);
          return (
            <a
              key={letter}
              href={isActive ? `#letter-${letter}` : undefined}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all",
                isActive
                  ? isDark
                    ? "bg-white/10 text-white hover:bg-[#E8FF4D]/20 hover:text-[#E8FF4D]"
                    : "bg-white text-slate-900 hover:bg-violet-100 hover:text-violet-700 shadow-sm"
                  : isDark
                    ? "text-white/20 cursor-default"
                    : "text-slate-300 cursor-default"
              )}
            >
              {letter}
            </a>
          );
        })}
      </div>

      {/* Terms List */}
      <div className="space-y-8">
        {activeLetters.map((letter) => (
          <div key={letter} id={`letter-${letter}`}>
            <div
              className={cn(
                "text-3xl font-black mb-4 pb-2 border-b",
                isDark
                  ? "text-white border-white/10"
                  : "text-slate-900 border-slate-200"
              )}
            >
              {letter}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {termsByLetter[letter].map((term) => {
                const categoryIcon = CATEGORY_ICONS[term.category];
                const Icon = getIcon(categoryIcon);
                const categoryColor = getCategoryColor(term.category);

                return (
                  <Link
                    key={term.slug}
                    to="/learning-hub/glossary/$slug"
                    params={{ slug: term.slug }}
                    className={cn(
                      "p-4 rounded-xl border group transition-all",
                      isDark
                        ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                        : "bg-white border-slate-200 hover:shadow-lg hover:border-violet-200"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          isDark
                            ? `bg-${categoryColor}-500/20 text-${categoryColor}-400`
                            : `bg-${categoryColor}-100 text-${categoryColor}-600`
                        )}
                        style={{
                          backgroundColor: isDark
                            ? `rgb(var(--color-${categoryColor}-500) / 0.2)`
                            : undefined,
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={cn(
                              "font-bold text-sm truncate",
                              isDark ? "text-white" : "text-slate-900"
                            )}
                          >
                            {term.term}
                          </h3>
                          <ChevronRight
                            size={14}
                            className={cn(
                              "opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0",
                              isDark ? "text-[#E8FF4D]" : "text-violet-600"
                            )}
                          />
                        </div>
                        <p
                          className={cn(
                            "text-xs line-clamp-2",
                            isDark ? "text-white/60" : "text-slate-500"
                          )}
                        >
                          {term.shortDefinition}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                              term.investorLevel === "beginner" &&
                                (isDark
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-emerald-100 text-emerald-700"),
                              term.investorLevel === "intermediate" &&
                                (isDark
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-amber-100 text-amber-700"),
                              term.investorLevel === "advanced" &&
                                (isDark
                                  ? "bg-violet-500/20 text-violet-400"
                                  : "bg-violet-100 text-violet-700")
                            )}
                          >
                            {LEVEL_LABELS[term.investorLevel]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTerms.length === 0 && (
        <div
          className={cn(
            "text-center py-16",
            isDark ? "text-white/60" : "text-slate-500"
          )}
        >
          <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-bold mb-2">No terms found</p>
          <p className="text-sm">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}
