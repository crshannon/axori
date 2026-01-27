import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Clock,
  Filter,
  GraduationCap,
  Target,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  INVESTOR_LEVELS,
  LEVEL_LABELS,
} from "@axori/shared";
import type { InvestorLevel, LearningPath } from "@axori/shared";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";
import {
  allLearningPaths,
  getPathLessonCount,
  getPathTotalMinutes,
} from "@/data/learning-hub/paths";

// Search params for filtering
interface PathsSearchParams {
  level?: string;
}

export const Route = createFileRoute("/_authed/learning-hub/paths/")({
  component: PathsPage,
  validateSearch: (search: Record<string, unknown>): PathsSearchParams => {
    return {
      level: typeof search.level === "string" ? search.level : undefined,
    };
  },
});

function PathsPage() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const searchParams = Route.useSearch();
  const [selectedLevel, setSelectedLevel] = useState<InvestorLevel | null>(
    (searchParams.level as InvestorLevel | undefined) ?? null
  );
  const [showFilters, setShowFilters] = useState(false);

  // Filter paths based on level
  const filteredPaths = useMemo(() => {
    let paths = allLearningPaths.filter((p) => p.status === "published");

    if (selectedLevel) {
      paths = paths.filter((p) => p.investorLevel === selectedLevel);
    }

    return paths;
  }, [selectedLevel]);

  // Group paths by level
  const pathsByLevel = useMemo(() => {
    const result: Record<InvestorLevel, Array<LearningPath>> = {
      beginner: [],
      intermediate: [],
      advanced: [],
    };

    for (const path of filteredPaths) {
      result[path.investorLevel].push(path);
    }

    return result;
  }, [filteredPaths]);

  // Get icon component by name
  const getIcon = (iconName: string) => {
    const icons = LucideIcons as unknown as Record<
      string,
      React.ComponentType<{ size?: number; className?: string }> | undefined
    >;
    const Icon = icons[iconName];
    return Icon ?? GraduationCap;
  };

  // Format minutes to hours/minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
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
          Learning Paths
        </h1>
        <p className={cn("text-sm", isDark ? "text-white/60" : "text-slate-500")}>
          Structured courses to master real estate investing concepts step by step.
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
            Filter by Level
            {selectedLevel && (
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                  isDark ? "bg-[#E8FF4D] text-black" : "bg-violet-600 text-white"
                )}
              >
                1
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div
            className={cn(
              "p-4 rounded-xl border",
              isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
            )}
          >
            <div
              className={cn(
                "text-xs font-bold uppercase tracking-wider mb-2",
                isDark ? "text-white/60" : "text-slate-500"
              )}
            >
              Experience Level
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
        )}

        {/* Results count */}
        <div className={cn("text-sm", isDark ? "text-white/60" : "text-slate-500")}>
          {filteredPaths.length} path{filteredPaths.length !== 1 ? "s" : ""}{" "}
          available
          {selectedLevel && (
            <button
              onClick={() => setSelectedLevel(null)}
              className={cn(
                "ml-2 underline",
                isDark
                  ? "text-[#E8FF4D] hover:text-[#E8FF4D]/80"
                  : "text-violet-600 hover:text-violet-700"
              )}
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Paths by Level */}
      <div className="space-y-10">
        {INVESTOR_LEVELS.map((level) => {
          const paths = pathsByLevel[level];
          if (paths.length === 0) return null;

          return (
            <div key={level}>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={cn(
                    "text-sm font-bold uppercase tracking-wider px-3 py-1 rounded-lg",
                    level === "beginner" &&
                      (isDark
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-emerald-100 text-emerald-700"),
                    level === "intermediate" &&
                      (isDark
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-amber-100 text-amber-700"),
                    level === "advanced" &&
                      (isDark
                        ? "bg-violet-500/20 text-violet-400"
                        : "bg-violet-100 text-violet-700")
                  )}
                >
                  {LEVEL_LABELS[level]}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    isDark ? "text-white/40" : "text-slate-400"
                  )}
                >
                  {paths.length} path{paths.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paths.map((path) => {
                  const Icon = getIcon(path.icon);
                  const lessonCount = getPathLessonCount(path);
                  const totalMinutes = getPathTotalMinutes(path);

                  return (
                    <Link
                      key={path.slug}
                      to="/learning-hub/paths/$slug"
                      params={{ slug: path.slug }}
                      className={cn(
                        "p-5 rounded-xl border group transition-all",
                        isDark
                          ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                          : "bg-white border-slate-200 hover:shadow-lg hover:border-violet-200"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
                            level === "beginner" &&
                              (isDark
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-emerald-100 text-emerald-600"),
                            level === "intermediate" &&
                              (isDark
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-amber-100 text-amber-600"),
                            level === "advanced" &&
                              (isDark
                                ? "bg-violet-500/20 text-violet-400"
                                : "bg-violet-100 text-violet-600")
                          )}
                        >
                          <Icon size={24} />
                        </div>

                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={cn(
                                "font-bold text-base",
                                isDark ? "text-white" : "text-slate-900"
                              )}
                            >
                              {path.title}
                            </h3>
                            <ChevronRight
                              size={16}
                              className={cn(
                                "opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0",
                                isDark ? "text-[#E8FF4D]" : "text-violet-600"
                              )}
                            />
                          </div>

                          <p
                            className={cn(
                              "text-sm line-clamp-2 mb-3",
                              isDark ? "text-white/60" : "text-slate-500"
                            )}
                          >
                            {path.description}
                          </p>

                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "flex items-center gap-1.5 text-xs",
                                isDark ? "text-white/50" : "text-slate-400"
                              )}
                            >
                              <BookOpen size={14} />
                              <span>
                                {path.modules.length} modules, {lessonCount} lessons
                              </span>
                            </div>
                            <div
                              className={cn(
                                "flex items-center gap-1.5 text-xs",
                                isDark ? "text-white/50" : "text-slate-400"
                              )}
                            >
                              <Clock size={14} />
                              <span>{formatDuration(totalMinutes)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar placeholder */}
                      <div className="mt-4">
                        <div
                          className={cn(
                            "h-1.5 rounded-full",
                            isDark ? "bg-white/10" : "bg-slate-100"
                          )}
                        >
                          <div
                            className={cn(
                              "h-full rounded-full w-0",
                              level === "beginner" && "bg-emerald-500",
                              level === "intermediate" && "bg-amber-500",
                              level === "advanced" && "bg-violet-500"
                            )}
                          />
                        </div>
                        <div
                          className={cn(
                            "text-xs mt-1",
                            isDark ? "text-white/40" : "text-slate-400"
                          )}
                        >
                          Not started
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPaths.length === 0 && (
        <div
          className={cn(
            "text-center py-16",
            isDark ? "text-white/60" : "text-slate-500"
          )}
        >
          <Target size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-bold mb-2">No paths found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
