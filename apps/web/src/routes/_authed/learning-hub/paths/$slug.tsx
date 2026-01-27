import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  HelpCircle,
  Lock,
  PlayCircle,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { LEVEL_LABELS } from "@axori/shared";
import type { LearningLesson, LearningModule } from "@axori/shared";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";
import {
  getPathBySlug,
  getPathLessonCount,
  getPathTotalMinutes,
  getPrerequisitePaths,
} from "@/data/learning-hub/paths";
import { getCompletedLessons } from "@/lib/learning-hub/progress";

export const Route = createFileRoute("/_authed/learning-hub/paths/$slug")({
  component: PathDetailPage,
});

function PathDetailPage() {
  const { slug } = Route.useParams();
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";

  const path = getPathBySlug(slug);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

  // Scroll to top when path changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Load completed lessons
  useEffect(() => {
    if (path) {
      const completed = getCompletedLessons(path.slug);
      setCompletedLessonIds(new Set(completed));
      // Expand first incomplete module by default
      const firstIncompleteModule = path.modules.find(
        (m) => !m.lessons.every((l) => completed.includes(l._id))
      );
      if (firstIncompleteModule) {
        setExpandedModules(new Set([firstIncompleteModule._id]));
      } else if (path.modules.length > 0) {
        setExpandedModules(new Set([path.modules[0]._id]));
      }
    }
  }, [path]);

  if (!path) {
    return (
      <div className="p-6 xl:p-8">
        <div
          className={cn(
            "text-center py-16",
            isDark ? "text-white/60" : "text-slate-500"
          )}
        >
          <GraduationCap size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-bold mb-2">Path not found</p>
          <Link
            to="/learning-hub/paths"
            className={cn(
              "text-sm underline",
              isDark ? "text-[#E8FF4D]" : "text-violet-600"
            )}
          >
            Browse all paths
          </Link>
        </div>
      </div>
    );
  }

  const lessonCount = getPathLessonCount(path);
  const totalMinutes = getPathTotalMinutes(path);
  const completedCount = completedLessonIds.size;
  const progressPercent = lessonCount > 0 ? (completedCount / lessonCount) * 100 : 0;
  const prerequisites = getPrerequisitePaths(path);

  // Get icon component by name
  const getIcon = (iconName: string) => {
    const icons = LucideIcons as unknown as Record<
      string,
      React.ComponentType<{ size?: number; className?: string }> | undefined
    >;
    const Icon = icons[iconName];
    return Icon ?? GraduationCap;
  };

  const Icon = getIcon(path.icon);

  // Get lesson type icon
  const getLessonIcon = (type: LearningLesson["type"]) => {
    switch (type) {
      case "article":
        return FileText;
      case "video":
        return PlayCircle;
      case "quiz":
        return HelpCircle;
      case "calculator":
        return Calculator;
      case "checklist":
        return CheckCircle2;
      default:
        return BookOpen;
    }
  };

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  // Get lesson link
  const getLessonLink = (lesson: LearningLesson): string | null => {
    switch (lesson.type) {
      case "glossary":
        return `/learning-hub/glossary/${lesson.contentRef}`;
      case "article":
        return `/learning-hub/articles/${lesson.contentRef}`;
      case "calculator":
        return `/learning-hub/calculators#${lesson.contentRef}`;
      case "quiz":
        return null; // Quizzes handled inline
      default:
        return null;
    }
  };

  // Check if module is complete
  const isModuleComplete = (module: LearningModule) => {
    return module.lessons.every((l) => completedLessonIds.has(l._id));
  };

  // Get module progress
  const getModuleProgress = (module: LearningModule) => {
    const completed = module.lessons.filter((l) =>
      completedLessonIds.has(l._id)
    ).length;
    return { completed, total: module.lessons.length };
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="p-6 xl:p-8">
      {/* Back Link */}
      <Link
        to="/learning-hub/paths"
        className={cn(
          "inline-flex items-center gap-2 text-sm mb-6 transition-colors",
          isDark
            ? "text-white/60 hover:text-white"
            : "text-slate-500 hover:text-slate-900"
        )}
      >
        <ArrowLeft size={16} />
        All Learning Paths
      </Link>

      {/* Path Header */}
      <div
        className={cn(
          "rounded-2xl border p-6 mb-8",
          isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
        )}
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* Icon */}
          <div
            className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0",
              path.investorLevel === "beginner" &&
                (isDark
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-emerald-100 text-emerald-600"),
              path.investorLevel === "intermediate" &&
                (isDark
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-amber-100 text-amber-600"),
              path.investorLevel === "advanced" &&
                (isDark
                  ? "bg-violet-500/20 text-violet-400"
                  : "bg-violet-100 text-violet-600")
            )}
          >
            <Icon size={36} />
          </div>

          {/* Info */}
          <div className="flex-grow">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded",
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
              {path.certificateEnabled && (
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-1 rounded",
                    isDark
                      ? "bg-[#E8FF4D]/20 text-[#E8FF4D]"
                      : "bg-violet-100 text-violet-700"
                  )}
                >
                  Certificate
                </span>
              )}
            </div>

            <h1
              className={cn(
                "text-2xl font-black mb-2",
                isDark ? "text-white" : "text-slate-900"
              )}
            >
              {path.title}
            </h1>

            <p
              className={cn(
                "text-sm mb-4",
                isDark ? "text-white/60" : "text-slate-500"
              )}
            >
              {path.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div
                className={cn(
                  "flex items-center gap-1.5 text-sm",
                  isDark ? "text-white/50" : "text-slate-400"
                )}
              >
                <BookOpen size={16} />
                <span>
                  {path.modules.length} modules, {lessonCount} lessons
                </span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1.5 text-sm",
                  isDark ? "text-white/50" : "text-slate-400"
                )}
              >
                <Clock size={16} />
                <span>{formatDuration(totalMinutes)}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className={isDark ? "text-white/60" : "text-slate-500"}>
                  Progress
                </span>
                <span
                  className={cn(
                    "font-bold",
                    isDark ? "text-white" : "text-slate-900"
                  )}
                >
                  {completedCount} / {lessonCount} lessons ({Math.round(progressPercent)}
                  %)
                </span>
              </div>
              <div
                className={cn(
                  "h-2 rounded-full",
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
            </div>
          </div>
        </div>

        {/* Prerequisites */}
        {prerequisites.length > 0 && (
          <div
            className={cn(
              "mt-6 pt-6 border-t",
              isDark ? "border-white/10" : "border-slate-200"
            )}
          >
            <div
              className={cn(
                "text-xs font-bold uppercase tracking-wider mb-3",
                isDark ? "text-white/60" : "text-slate-500"
              )}
            >
              Prerequisites
            </div>
            <div className="flex flex-wrap gap-2">
              {prerequisites.map((prereq) => (
                <Link
                  key={prereq.slug}
                  to="/learning-hub/paths/$slug"
                  params={{ slug: prereq.slug }}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isDark
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  <Lock size={14} />
                  {prereq.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modules */}
      <div className="space-y-4">
        <h2
          className={cn(
            "text-lg font-bold",
            isDark ? "text-white" : "text-slate-900"
          )}
        >
          Course Content
        </h2>

        {path.modules.map((module, moduleIndex) => {
          const isExpanded = expandedModules.has(module._id);
          const moduleComplete = isModuleComplete(module);
          const { completed, total } = getModuleProgress(module);

          return (
            <div
              key={module._id}
              className={cn(
                "rounded-xl border overflow-hidden",
                isDark ? "border-white/10" : "border-slate-200"
              )}
            >
              {/* Module Header */}
              <button
                onClick={() => toggleModule(module._id)}
                className={cn(
                  "w-full p-4 flex items-center gap-4 text-left transition-colors",
                  isDark
                    ? "bg-white/5 hover:bg-white/10"
                    : "bg-slate-50 hover:bg-slate-100"
                )}
              >
                {/* Module Number / Check */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold",
                    moduleComplete
                      ? path.investorLevel === "beginner"
                        ? "bg-emerald-500 text-white"
                        : path.investorLevel === "intermediate"
                          ? "bg-amber-500 text-white"
                          : "bg-violet-500 text-white"
                      : isDark
                        ? "bg-white/10 text-white"
                        : "bg-white text-slate-700 border border-slate-200"
                  )}
                >
                  {moduleComplete ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <span>{moduleIndex + 1}</span>
                  )}
                </div>

                {/* Module Info */}
                <div className="flex-grow min-w-0">
                  <h3
                    className={cn(
                      "font-bold",
                      isDark ? "text-white" : "text-slate-900"
                    )}
                  >
                    {module.title}
                  </h3>
                  <p
                    className={cn(
                      "text-sm truncate",
                      isDark ? "text-white/60" : "text-slate-500"
                    )}
                  >
                    {module.description}
                  </p>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={cn(
                      "text-sm",
                      isDark ? "text-white/50" : "text-slate-400"
                    )}
                  >
                    {completed}/{total}
                  </span>
                  <ChevronDown
                    size={20}
                    className={cn(
                      "transition-transform",
                      isExpanded && "rotate-180",
                      isDark ? "text-white/50" : "text-slate-400"
                    )}
                  />
                </div>
              </button>

              {/* Lessons */}
              {isExpanded && (
                <div
                  className={cn(
                    "divide-y",
                    isDark
                      ? "bg-white/[0.02] divide-white/5"
                      : "bg-white divide-slate-100"
                  )}
                >
                  {module.lessons.map((lesson) => {
                    const LessonIcon = getLessonIcon(lesson.type);
                    const isCompleted = completedLessonIds.has(lesson._id);
                    const lessonLink = getLessonLink(lesson);

                    const lessonContent = (
                      <div className="flex items-center gap-4">
                        {/* Completion Status */}
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            isCompleted
                              ? path.investorLevel === "beginner"
                                ? "bg-emerald-500/20 text-emerald-500"
                                : path.investorLevel === "intermediate"
                                  ? "bg-amber-500/20 text-amber-500"
                                  : "bg-violet-500/20 text-violet-500"
                              : isDark
                                ? "bg-white/10 text-white/50"
                                : "bg-slate-100 text-slate-400"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <LessonIcon size={16} />
                          )}
                        </div>

                        {/* Lesson Info */}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2">
                            <h4
                              className={cn(
                                "text-sm font-medium",
                                isCompleted
                                  ? isDark
                                    ? "text-white/50"
                                    : "text-slate-400"
                                  : isDark
                                    ? "text-white"
                                    : "text-slate-900"
                              )}
                            >
                              {lesson.title}
                            </h4>
                            {lesson.isRequired && (
                              <span
                                className={cn(
                                  "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                                  isDark
                                    ? "bg-white/10 text-white/60"
                                    : "bg-slate-100 text-slate-500"
                                )}
                              >
                                Required
                              </span>
                            )}
                          </div>
                          <div
                            className={cn(
                              "flex items-center gap-2 text-xs",
                              isDark ? "text-white/40" : "text-slate-400"
                            )}
                          >
                            <span className="capitalize">{lesson.type}</span>
                            <span>-</span>
                            <span>{lesson.estimatedMinutes} min</span>
                          </div>
                        </div>

                        {/* Action */}
                        {lessonLink && (
                          <ChevronRight
                            size={16}
                            className={cn(
                              "flex-shrink-0",
                              isDark ? "text-white/30" : "text-slate-300"
                            )}
                          />
                        )}
                      </div>
                    );

                    if (lessonLink) {
                      return (
                        <Link
                          key={lesson._id}
                          to={lessonLink}
                          className={cn(
                            "block px-4 py-3 transition-colors",
                            isDark
                              ? "hover:bg-white/5"
                              : "hover:bg-slate-50"
                          )}
                        >
                          {lessonContent}
                        </Link>
                      );
                    }

                    return (
                      <div
                        key={lesson._id}
                        className={cn(
                          "px-4 py-3",
                          lesson.type === "quiz" && "opacity-60"
                        )}
                      >
                        {lessonContent}
                        {lesson.type === "quiz" && (
                          <div
                            className={cn(
                              "text-xs mt-1 ml-12",
                              isDark ? "text-white/40" : "text-slate-400"
                            )}
                          >
                            Coming soon
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
