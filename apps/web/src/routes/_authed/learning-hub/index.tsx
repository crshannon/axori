import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  TrendingUp,
  Calculator,
  Target,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  GLOSSARY_CATEGORIES,
  type GlossaryCategory,
} from "@axori/shared";
import * as LucideIcons from "lucide-react";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";
import { getCategoryCounts, totalTermCount } from "@/data/learning-hub/glossary";

export const Route = createFileRoute("/_authed/learning-hub/")({
  component: LearningHubHome,
});

function LearningHubHome() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const categoryCounts = getCategoryCounts();

  // Get icon component by name
  const getIcon = (iconName: string) => {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>;
    const Icon = icons[iconName];
    return Icon || BookOpen;
  };

  return (
    <div className="p-6 xl:p-8 space-y-8">
      {/* Welcome Section */}
      <div
        className={cn(
          "p-8 rounded-[2rem] relative overflow-hidden",
          isDark
            ? "bg-gradient-to-br from-violet-600 to-indigo-700"
            : "bg-gradient-to-br from-violet-500 to-indigo-600"
        )}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="text-white/80" size={24} />
            <span className="text-white/80 text-sm font-bold uppercase tracking-widest">
              Learning Hub
            </span>
          </div>
          <h2 className="text-3xl font-black text-white mb-3">
            Level Up Your Real Estate Knowledge
          </h2>
          <p className="text-white/80 max-w-2xl">
            Explore {totalTermCount}+ terms, concepts, and strategies to become a more
            informed investor. From financing fundamentals to advanced tax
            strategies.
          </p>
          <div className="flex gap-4 mt-6">
            <Link
              to="/learning-hub/glossary"
              className="px-6 py-3 bg-white text-violet-600 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-white/90 transition-all"
            >
              <BookOpen size={18} />
              Browse Glossary
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Terms",
            value: totalTermCount.toString(),
            icon: BookOpen,
            color: "violet",
          },
          {
            label: "Categories",
            value: GLOSSARY_CATEGORIES.length.toString(),
            icon: Target,
            color: "indigo",
          },
          {
            label: "Formulas",
            value: "25+",
            icon: Calculator,
            color: "emerald",
          },
          {
            label: "Pro Tips",
            value: "100+",
            icon: TrendingUp,
            color: "amber",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={cn(
                "p-5 rounded-2xl border",
                isDark
                  ? "bg-white/5 border-white/10"
                  : "bg-white border-slate-200"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                  stat.color === "violet" &&
                    (isDark ? "bg-violet-500/20 text-violet-400" : "bg-violet-100 text-violet-600"),
                  stat.color === "indigo" &&
                    (isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600"),
                  stat.color === "emerald" &&
                    (isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"),
                  stat.color === "amber" &&
                    (isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600")
                )}
              >
                <Icon size={20} />
              </div>
              <div
                className={cn(
                  "text-2xl font-black",
                  isDark ? "text-white" : "text-slate-900"
                )}
              >
                {stat.value}
              </div>
              <div
                className={cn(
                  "text-sm",
                  isDark ? "text-white/60" : "text-slate-500"
                )}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Browse by Category */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3
            className={cn(
              "text-xl font-black",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            Browse by Category
          </h3>
          <Link
            to="/learning-hub/glossary"
            className={cn(
              "text-sm font-bold flex items-center gap-1",
              isDark
                ? "text-[#E8FF4D] hover:text-[#E8FF4D]/80"
                : "text-violet-600 hover:text-violet-700"
            )}
          >
            View All
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {GLOSSARY_CATEGORIES.map((category) => {
            const iconName = CATEGORY_ICONS[category as GlossaryCategory];
            const Icon = getIcon(iconName);
            const count = categoryCounts[category as GlossaryCategory] || 0;

            return (
              <Link
                key={category}
                to="/learning-hub/glossary"
                search={{ category }}
                className={cn(
                  "p-5 rounded-2xl border group transition-all",
                  isDark
                    ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                    : "bg-white border-slate-200 hover:shadow-lg hover:border-violet-200"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
                    isDark
                      ? "bg-white/10 text-white group-hover:bg-[#E8FF4D]/20 group-hover:text-[#E8FF4D]"
                      : "bg-slate-100 text-slate-600 group-hover:bg-violet-100 group-hover:text-violet-600"
                  )}
                >
                  <Icon size={20} />
                </div>
                <div
                  className={cn(
                    "font-bold text-sm mb-1",
                    isDark ? "text-white" : "text-slate-900"
                  )}
                >
                  {CATEGORY_LABELS[category as GlossaryCategory]}
                </div>
                <div
                  className={cn(
                    "text-xs",
                    isDark ? "text-white/60" : "text-slate-500"
                  )}
                >
                  {count} terms
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Coming Soon Section */}
      <div
        className={cn(
          "p-6 rounded-2xl border",
          isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
        )}
      >
        <h3
          className={cn(
            "text-lg font-black mb-4",
            isDark ? "text-white" : "text-slate-900"
          )}
        >
          Coming Soon
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Learning Paths",
              description: "Structured courses to master real estate investing",
            },
            {
              title: "Interactive Calculators",
              description: "Cap rate, DSCR, cash-on-cash, and more",
            },
            {
              title: "Personalized Recommendations",
              description: "Content tailored to your investment journey",
            },
          ].map((item) => (
            <div
              key={item.title}
              className={cn(
                "p-4 rounded-xl border",
                isDark
                  ? "bg-white/5 border-white/10"
                  : "bg-white border-slate-200"
              )}
            >
              <div
                className={cn(
                  "font-bold text-sm mb-1",
                  isDark ? "text-white" : "text-slate-900"
                )}
              >
                {item.title}
              </div>
              <div
                className={cn(
                  "text-xs",
                  isDark ? "text-white/60" : "text-slate-500"
                )}
              >
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
