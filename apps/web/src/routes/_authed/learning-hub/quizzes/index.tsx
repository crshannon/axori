/**
 * Quizzes Index Page
 *
 * Browse all available quizzes organized by category.
 */

import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, ChevronRight, Clock, Target, Trophy } from "lucide-react";
import { allQuizzes } from "@/data/learning-hub/quizzes";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";

export const Route = createFileRoute("/_authed/learning-hub/quizzes/")({
  component: QuizzesPage,
});

const LEVEL_COLORS = {
  beginner: {
    light: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dark: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  intermediate: {
    light: "bg-amber-100 text-amber-700 border-amber-200",
    dark: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  advanced: {
    light: "bg-violet-100 text-violet-700 border-violet-200",
    dark: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  },
};

const CATEGORIES = [
  { id: "all", label: "All Quizzes" },
  { id: "investment-metrics", label: "Investment Metrics" },
  { id: "financing", label: "Financing" },
  { id: "taxation", label: "Taxation" },
];

function QuizzesPage() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredQuizzes =
    selectedCategory === "all"
      ? allQuizzes
      : allQuizzes.filter((q) => q.category === selectedCategory);

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
          Knowledge Quizzes
        </h1>
        <p className={cn("text-sm", isDark ? "text-white/60" : "text-slate-500")}>
          Test your real estate investing knowledge with interactive quizzes.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
              selectedCategory === cat.id
                ? isDark
                  ? "bg-white text-black"
                  : "bg-slate-900 text-white"
                : isDark
                  ? "text-white/60 hover:text-white hover:bg-white/5"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Quiz Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuizzes.map((quiz) => {
          const levelColors = LEVEL_COLORS[quiz.level];

          return (
            <Link
              key={quiz.slug}
              to="/learning-hub/quizzes/$slug"
              params={{ slug: quiz.slug }}
              className={cn(
                "group p-6 rounded-2xl border transition-all duration-300",
                isDark
                  ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  : "bg-white border-slate-200 hover:shadow-xl hover:border-violet-200"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    isDark
                      ? "bg-[#E8FF4D]/20 text-[#E8FF4D]"
                      : "bg-violet-100 text-violet-600"
                  )}
                >
                  <BookOpen size={24} />
                </div>
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    isDark ? levelColors.dark : levelColors.light
                  )}
                >
                  {quiz.level}
                </span>
              </div>

              <h3
                className={cn(
                  "font-bold mb-2 group-hover:text-violet-600 dark:group-hover:text-[#E8FF4D] transition-colors",
                  isDark ? "text-white" : "text-slate-900"
                )}
              >
                {quiz.title}
              </h3>

              <p
                className={cn(
                  "text-sm mb-4 line-clamp-2",
                  isDark ? "text-white/60" : "text-slate-500"
                )}
              >
                {quiz.description}
              </p>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Target
                    size={14}
                    className={isDark ? "text-white/40" : "text-slate-400"}
                  />
                  <span
                    className={cn(
                      "text-xs",
                      isDark ? "text-white/60" : "text-slate-500"
                    )}
                  >
                    {quiz.questions.length} questions
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock
                    size={14}
                    className={isDark ? "text-white/40" : "text-slate-400"}
                  />
                  <span
                    className={cn(
                      "text-xs",
                      isDark ? "text-white/60" : "text-slate-500"
                    )}
                  >
                    {quiz.estimatedMinutes} min
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Trophy
                    size={14}
                    className={isDark ? "text-white/40" : "text-slate-400"}
                  />
                  <span
                    className={cn(
                      "text-xs",
                      isDark ? "text-white/60" : "text-slate-500"
                    )}
                  >
                    {quiz.passingScore}% to pass
                  </span>
                </div>
              </div>

              <div
                className={cn(
                  "mt-4 pt-4 border-t flex items-center justify-between",
                  isDark ? "border-white/10" : "border-slate-100"
                )}
              >
                <span
                  className={cn(
                    "text-sm font-medium",
                    isDark
                      ? "text-[#E8FF4D] group-hover:text-[#d4eb45]"
                      : "text-violet-600 group-hover:text-violet-700"
                  )}
                >
                  Take Quiz
                </span>
                <ChevronRight
                  size={16}
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
      {filteredQuizzes.length === 0 && (
        <div
          className={cn(
            "p-12 rounded-2xl border text-center",
            isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
          )}
        >
          <BookOpen
            size={48}
            className={cn(
              "mx-auto mb-4",
              isDark ? "text-white/20" : "text-slate-300"
            )}
          />
          <p
            className={cn(
              "font-bold mb-2",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            No quizzes found
          </p>
          <p className={cn("text-sm", isDark ? "text-white/60" : "text-slate-500")}>
            Try selecting a different category.
          </p>
        </div>
      )}
    </div>
  );
}
