import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Bookmark, ChevronRight, Filter, Search } from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  GLOSSARY_CATEGORIES,
  INVESTOR_LEVELS,
  LEVEL_LABELS,
  getCategoryColor,
} from "@axori/shared";
import type { GlossaryCategory, GlossaryTerm, InvestorLevel } from "@axori/shared";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";
import {
  allGlossaryTerms,
  getTermsByLetter,
} from "@/data/learning-hub/glossary";
import { getBookmarksByType } from "@/lib/learning-hub/progress";

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
  const [searchQuery, setSearchQuery] = useState(searchParams.q ?? "");
  const [selectedCategory, setSelectedCategory] = useState<GlossaryCategory | null>(
    (searchParams.category as GlossaryCategory | undefined) ?? null
  );
  const [selectedLevel, setSelectedLevel] = useState<InvestorLevel | null>(
    (searchParams.level as InvestorLevel | undefined) ?? null
  );
  const [showFilters, setShowFilters] = useState(false);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState<Set<string>>(new Set());

  // Load bookmarks
  useEffect(() => {
    const bookmarks = getBookmarksByType("term");
    setBookmarkedSlugs(new Set(bookmarks.map((b) => b.slug)));
  }, []);

  // Filter terms based on search and filters
  const filteredTerms = useMemo(() => {
    let terms = allGlossaryTerms;

    // Filter by bookmarks
    if (showBookmarksOnly) {
      terms = terms.filter((t) => bookmarkedSlugs.has(t.slug));
    }

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
  }, [selectedCategory, selectedLevel, searchQuery, showBookmarksOnly, bookmarkedSlugs]);

  // Group filtered terms by letter
  const termsByLetter = useMemo(() => {
    const result: Record<string, Array<GlossaryTerm> | undefined> = {};
    for (const term of filteredTerms) {
      const letter = term.term.charAt(0).toUpperCase();
      const existing = result[letter];
      if (existing) {
        existing.push(term);
      } else {
        result[letter] = [term];
      }
    }
    return result as Record<string, Array<GlossaryTerm>>;
  }, [filteredTerms]);

  // Get all available letters
  const allLetters = Object.keys(getTermsByLetter()).sort();
  const activeLetters = Object.keys(termsByLetter).sort();

  // Get icon component by name
  const getIcon = (iconName: string) => {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }> | undefined>;
    const Icon = icons[iconName];
    return Icon ?? BookOpen;
  };

  // Get category colors as CSS values (Tailwind dynamic classes don't work)
  const getCategoryStyles = (color: string, dark: boolean) => {
    const colors: Record<string, { bg: string; bgDark: string; text: string; textDark: string }> = {
      sky: { bg: "rgb(224 242 254)", bgDark: "rgba(14, 165, 233, 0.2)", text: "rgb(2 132 199)", textDark: "rgb(56 189 248)" },
      indigo: { bg: "rgb(224 231 255)", bgDark: "rgba(99, 102, 241, 0.2)", text: "rgb(79 70 229)", textDark: "rgb(129 140 248)" },
      slate: { bg: "rgb(241 245 249)", bgDark: "rgba(100, 116, 139, 0.2)", text: "rgb(71 85 105)", textDark: "rgb(148 163 184)" },
      emerald: { bg: "rgb(209 250 229)", bgDark: "rgba(16, 185, 129, 0.2)", text: "rgb(4 120 87)", textDark: "rgb(52 211 153)" },
      amber: { bg: "rgb(254 243 199)", bgDark: "rgba(245, 158, 11, 0.2)", text: "rgb(180 83 9)", textDark: "rgb(251 191 36)" },
      rose: { bg: "rgb(255 228 230)", bgDark: "rgba(244, 63, 94, 0.2)", text: "rgb(190 18 60)", textDark: "rgb(251 113 133)" },
      cyan: { bg: "rgb(207 250 254)", bgDark: "rgba(6, 182, 212, 0.2)", text: "rgb(14 116 144)", textDark: "rgb(34 211 238)" },
      violet: { bg: "rgb(237 233 254)", bgDark: "rgba(139, 92, 246, 0.2)", text: "rgb(109 40 217)", textDark: "rgb(167 139 250)" },
      orange: { bg: "rgb(255 237 213)", bgDark: "rgba(249, 115, 22, 0.2)", text: "rgb(194 65 12)", textDark: "rgb(251 146 60)" },
      fuchsia: { bg: "rgb(250 232 255)", bgDark: "rgba(217, 70, 239, 0.2)", text: "rgb(162 28 175)", textDark: "rgb(232 121 249)" },
    };
    const c = colors[color] ?? colors.slate;
    return {
      backgroundColor: dark ? c.bgDark : c.bg,
      color: dark ? c.textDark : c.text,
    };
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
            onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            className={cn(
              "px-4 py-3 rounded-xl border flex items-center gap-2 text-sm font-bold transition-all",
              showBookmarksOnly
                ? isDark
                  ? "bg-[#E8FF4D]/20 border-[#E8FF4D]/50 text-[#E8FF4D]"
                  : "bg-violet-100 border-violet-300 text-violet-700"
                : isDark
                  ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
            title={showBookmarksOnly ? "Show all terms" : "Show bookmarked terms only"}
          >
            <Bookmark size={18} className={showBookmarksOnly ? "fill-current" : ""} />
            Saved
            {bookmarkedSlugs.size > 0 && (
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                  showBookmarksOnly
                    ? isDark ? "bg-[#E8FF4D] text-black" : "bg-violet-600 text-white"
                    : isDark ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                )}
              >
                {bookmarkedSlugs.size}
              </span>
            )}
          </button>
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
                        selectedCategory === cat ? null : (cat)
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
                        selectedLevel === level ? null : (level)
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
                    {LEVEL_LABELS[level]}
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
          {showBookmarksOnly && (
            <span className="ml-1">(showing saved only)</span>
          )}
          {(selectedCategory || selectedLevel || searchQuery || showBookmarksOnly) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
                setSelectedLevel(null);
                setShowBookmarksOnly(false);
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
                      "p-4 rounded-2xl border group transition-all duration-300",
                      isDark
                        ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                        : "bg-white border-slate-200 hover:shadow-xl hover:border-violet-200"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={getCategoryStyles(categoryColor, isDark)}
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
