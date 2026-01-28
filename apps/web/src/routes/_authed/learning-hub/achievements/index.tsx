import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import * as LucideIcons from "lucide-react";
import {
  Award,
  BookOpen,
  Flame,
  Lock,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import type {Achievement, AchievementProgress, StreakData} from "@/lib/learning-hub/achievements";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";
import {
  ACHIEVEMENTS,
  getAchievementProgress,
  getLevel,
  getStreakData,
  getTotalXP,
  getUnlockedAchievements,
  updateStreak,
} from "@/lib/learning-hub/achievements";

export const Route = createFileRoute("/_authed/learning-hub/achievements/")({
  component: AchievementsPage,
});

function AchievementsPage() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const [unlockedIds, setUnlockedIds] = useState<Array<string>>([]);
  const [progress, setProgress] = useState<AchievementProgress | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);

  // Load data on mount
  useEffect(() => {
    setUnlockedIds(getUnlockedAchievements());
    setProgress(getAchievementProgress());
    const updatedStreak = updateStreak();
    setStreak(updatedStreak);
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const totalXP = getTotalXP();
    const levelInfo = getLevel(totalXP);
    const unlockedCount = unlockedIds.length;
    const totalCount = ACHIEVEMENTS.length;
    const completionPercent = (unlockedCount / totalCount) * 100;

    return {
      totalXP,
      ...levelInfo,
      unlockedCount,
      totalCount,
      completionPercent,
    };
  }, [unlockedIds]);

  // Group achievements by category
  const achievementsByCategory = useMemo(() => {
    const categories: Record<
      Achievement["category"],
      { title: string; icon: React.ComponentType<{ size?: number }>; achievements: Array<Achievement> }
    > = {
      exploration: { title: "Exploration", icon: BookOpen, achievements: [] },
      mastery: { title: "Mastery", icon: Target, achievements: [] },
      engagement: { title: "Engagement", icon: Zap, achievements: [] },
      milestone: { title: "Milestones", icon: Flame, achievements: [] },
    };

    for (const achievement of ACHIEVEMENTS) {
      categories[achievement.category].achievements.push(achievement);
    }

    return categories;
  }, []);

  // Get progress for an achievement
  const getProgressForAchievement = (achievement: Achievement): { current: number; max: number } => {
    if (!progress) return { current: 0, max: achievement.requirement.count };

    const req = achievement.requirement;
    let current = 0;

    switch (req.type) {
      case "terms_viewed":
        current = progress.termsViewed.length;
        break;
      case "paths_completed":
        if (req.specific) {
          current = req.specific.filter((slug) =>
            progress.pathsCompleted.includes(slug)
          ).length;
        } else {
          current = progress.pathsCompleted.length;
        }
        break;
      case "calculators_used":
        current = progress.calculatorsUsed.length;
        break;
      case "checklists_completed":
        current = progress.checklistsCompleted.length;
        break;
      case "articles_read":
        current = progress.articlesRead.length;
        break;
      case "bookmarks":
        current = progress.bookmarksCount;
        break;
      case "streak":
        current = streak?.currentStreak || 0;
        break;
    }

    return { current: Math.min(current, req.count), max: req.count };
  };

  // Get icon component by name
  const getIcon = (iconName: string) => {
    const icons = LucideIcons as unknown as Record<
      string,
      React.ComponentType<{ size?: number; className?: string }> | undefined
    >;
    const Icon = icons[iconName];
    return Icon ?? Star;
  };

  // Rarity colors
  const rarityColors = {
    common: {
      bg: isDark ? "bg-slate-500/20" : "bg-slate-100",
      text: isDark ? "text-slate-400" : "text-slate-600",
      border: isDark ? "border-slate-500/30" : "border-slate-200",
      label: "Common",
    },
    rare: {
      bg: isDark ? "bg-blue-500/20" : "bg-blue-50",
      text: isDark ? "text-blue-400" : "text-blue-600",
      border: isDark ? "border-blue-500/30" : "border-blue-200",
      label: "Rare",
    },
    epic: {
      bg: isDark ? "bg-violet-500/20" : "bg-violet-50",
      text: isDark ? "text-violet-400" : "text-violet-600",
      border: isDark ? "border-violet-500/30" : "border-violet-200",
      label: "Epic",
    },
    legendary: {
      bg: isDark ? "bg-amber-500/20" : "bg-amber-50",
      text: isDark ? "text-amber-400" : "text-amber-600",
      border: isDark ? "border-amber-500/30" : "border-amber-200",
      label: "Legendary",
    },
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
          Achievements
        </h1>
        <p className={cn("text-sm", isDark ? "text-white/60" : "text-slate-500")}>
          Track your learning progress and unlock achievements.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Level */}
        <div
          className={cn(
            "p-4 rounded-2xl border",
            isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isDark
                  ? "bg-[#E8FF4D]/20 text-[#E8FF4D]"
                  : "bg-violet-100 text-violet-600"
              )}
            >
              <Trophy size={20} />
            </div>
            <div>
              <div
                className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  isDark ? "text-white/60" : "text-slate-500"
                )}
              >
                Level
              </div>
              <div
                className={cn(
                  "text-2xl font-black",
                  isDark ? "text-white" : "text-slate-900"
                )}
              >
                {stats.level}
              </div>
            </div>
          </div>
          <div
            className={cn(
              "h-1.5 rounded-full",
              isDark ? "bg-white/10" : "bg-slate-100"
            )}
          >
            <div
              className={cn(
                "h-full rounded-full",
                isDark ? "bg-[#E8FF4D]" : "bg-violet-500"
              )}
              style={{
                width: `${(stats.xpProgress / stats.xpForNext) * 100}%`,
              }}
            />
          </div>
          <div
            className={cn(
              "text-xs mt-1",
              isDark ? "text-white/40" : "text-slate-400"
            )}
          >
            {stats.xpProgress} / {stats.xpForNext} XP
          </div>
        </div>

        {/* Total XP */}
        <div
          className={cn(
            "p-4 rounded-2xl border",
            isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isDark
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-emerald-100 text-emerald-600"
              )}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div
                className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  isDark ? "text-white/60" : "text-slate-500"
                )}
              >
                Total XP
              </div>
              <div
                className={cn(
                  "text-2xl font-black",
                  isDark ? "text-white" : "text-slate-900"
                )}
              >
                {stats.totalXP.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Unlocked */}
        <div
          className={cn(
            "p-4 rounded-2xl border",
            isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isDark
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-amber-100 text-amber-600"
              )}
            >
              <Award size={20} />
            </div>
            <div>
              <div
                className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  isDark ? "text-white/60" : "text-slate-500"
                )}
              >
                Unlocked
              </div>
              <div
                className={cn(
                  "text-2xl font-black",
                  isDark ? "text-white" : "text-slate-900"
                )}
              >
                {stats.unlockedCount}
                <span
                  className={cn(
                    "text-sm font-normal ml-1",
                    isDark ? "text-white/40" : "text-slate-400"
                  )}
                >
                  / {stats.totalCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Streak */}
        <div
          className={cn(
            "p-4 rounded-2xl border",
            isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isDark
                  ? "bg-rose-500/20 text-rose-400"
                  : "bg-rose-100 text-rose-600"
              )}
            >
              <Flame size={20} />
            </div>
            <div>
              <div
                className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  isDark ? "text-white/60" : "text-slate-500"
                )}
              >
                Streak
              </div>
              <div
                className={cn(
                  "text-2xl font-black",
                  isDark ? "text-white" : "text-slate-900"
                )}
              >
                {streak?.currentStreak || 0}
                <span
                  className={cn(
                    "text-sm font-normal ml-1",
                    isDark ? "text-white/40" : "text-slate-400"
                  )}
                >
                  days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Categories */}
      <div className="space-y-8">
        {Object.entries(achievementsByCategory).map(
          ([category, { title, icon: CategoryIcon, achievements }]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <CategoryIcon
                  size={20}
                  className={isDark ? "text-white/60" : "text-slate-500"}
                />
                <h2
                  className={cn(
                    "text-lg font-bold",
                    isDark ? "text-white" : "text-slate-900"
                  )}
                >
                  {title}
                </h2>
                <span
                  className={cn(
                    "text-sm",
                    isDark ? "text-white/40" : "text-slate-400"
                  )}
                >
                  {achievements.filter((a) => unlockedIds.includes(a.id)).length} /{" "}
                  {achievements.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => {
                  const isUnlocked = unlockedIds.includes(achievement.id);
                  const Icon = getIcon(achievement.icon);
                  const rarity = rarityColors[achievement.rarity];
                  const progressData = getProgressForAchievement(achievement);
                  const progressPercent =
                    (progressData.current / progressData.max) * 100;

                  return (
                    <div
                      key={achievement.id}
                      className={cn(
                        "p-4 rounded-2xl border transition-all",
                        isUnlocked
                          ? cn(rarity.bg, rarity.border)
                          : isDark
                            ? "bg-white/[0.02] border-white/10 opacity-60"
                            : "bg-slate-50 border-slate-200 opacity-60"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                            isUnlocked
                              ? rarity.bg
                              : isDark
                                ? "bg-white/10"
                                : "bg-slate-200"
                          )}
                        >
                          {isUnlocked ? (
                            <Icon
                              size={24}
                              className={rarity.text}
                            />
                          ) : (
                            <Lock
                              size={20}
                              className={isDark ? "text-white/30" : "text-slate-400"}
                            />
                          )}
                        </div>

                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={cn(
                                "font-bold text-sm",
                                isDark ? "text-white" : "text-slate-900"
                              )}
                            >
                              {achievement.title}
                            </h3>
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                                rarity.bg,
                                rarity.text
                              )}
                            >
                              {rarity.label}
                            </span>
                          </div>

                          <p
                            className={cn(
                              "text-xs mb-2",
                              isDark ? "text-white/60" : "text-slate-500"
                            )}
                          >
                            {achievement.description}
                          </p>

                          {!isUnlocked && (
                            <div className="space-y-1">
                              <div
                                className={cn(
                                  "h-1.5 rounded-full",
                                  isDark ? "bg-white/10" : "bg-slate-200"
                                )}
                              >
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    rarity.text.replace("text-", "bg-")
                                  )}
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <div
                                className={cn(
                                  "text-[10px]",
                                  isDark ? "text-white/40" : "text-slate-400"
                                )}
                              >
                                {progressData.current} / {progressData.max}
                              </div>
                            </div>
                          )}

                          {isUnlocked && (
                            <div
                              className={cn(
                                "text-xs font-bold",
                                rarity.text
                              )}
                            >
                              +{achievement.xp} XP
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>

      {/* Legend */}
      <div
        className={cn(
          "mt-12 p-4 rounded-xl",
          isDark ? "bg-white/5" : "bg-slate-50"
        )}
      >
        <div
          className={cn(
            "text-xs font-bold uppercase tracking-wider mb-3",
            isDark ? "text-white/60" : "text-slate-500"
          )}
        >
          Rarity Legend
        </div>
        <div className="flex flex-wrap gap-4">
          {Object.entries(rarityColors).map(([rarity, colors]) => (
            <div key={rarity} className="flex items-center gap-2">
              <div
                className={cn("w-3 h-3 rounded-full", colors.bg, colors.border, "border")}
              />
              <span
                className={cn(
                  "text-sm capitalize",
                  isDark ? "text-white/60" : "text-slate-600"
                )}
              >
                {rarity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
