import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  ChevronRight,
  ExternalLink,
  Lightbulb,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  LEVEL_LABELS,
  getCategoryColor,
} from "@axori/shared";
import type {
  Example,
  Formula,
  FormulaVariable,
  GlossaryCategory,
  InvestorLevel,
} from "@axori/shared";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";
import { getRelatedTerms, getTermBySlug } from "@/data/learning-hub/glossary";
import { BookmarkButton } from "@/components/learning-hub/BookmarkButton";
import {
  markTermViewed,
  updateRecentlyViewedTitle,
} from "@/lib/learning-hub/progress";

export const Route = createFileRoute("/_authed/learning-hub/glossary/$slug")({
  component: TermDetailPage,
  loader: ({ params }) => {
    const term = getTermBySlug(params.slug);
    if (!term) {
      throw notFound();
    }
    return { term };
  },
});

function TermDetailPage() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const { term } = Route.useLoaderData();
  const relatedTerms = getRelatedTerms(term);

  // Scroll to top when navigating to a new term
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [term.slug]);

  // Track view when page loads
  useEffect(() => {
    markTermViewed(term.slug);
    updateRecentlyViewedTitle("term", term.slug, term.term);
  }, [term.slug, term.term]);

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

  const categoryIcon = CATEGORY_ICONS[term.category];
  const CategoryIcon = getIcon(categoryIcon);
  const categoryColor = getCategoryColor(term.category);

  // Parse fullDefinition - can be string or PortableText array
  const definitionText =
    typeof term.fullDefinition === "string"
      ? term.fullDefinition
      : term.fullDefinition
          .map((block: { children?: Array<{ text: string }> }) =>
            block.children?.map((child: { text: string }) => child.text).join("")
          )
          .join("\n\n") || "";

  return (
    <div className="p-6 xl:p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          to="/learning-hub/glossary"
          className={cn(
            "flex items-center gap-2 text-sm font-bold transition-colors",
            isDark
              ? "text-white/60 hover:text-white"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          <ArrowLeft size={16} />
          Back to Glossary
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={getCategoryStyles(categoryColor, isDark)}
          >
            <CategoryIcon size={24} />
          </div>
          <div>
            <div
              className={cn(
                "text-xs font-bold uppercase tracking-wider",
                isDark ? "text-white/60" : "text-slate-500"
              )}
            >
              {CATEGORY_LABELS[term.category]}
            </div>
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

        <div className="flex items-start justify-between gap-4 mb-4">
          <h1
            className={cn(
              "text-3xl md:text-4xl font-black",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            {term.term}
          </h1>
          <BookmarkButton
            contentType="term"
            slug={term.slug}
            title={term.term}
            size="lg"
            showLabel
          />
        </div>

        {/* Short Definition */}
        <p
          className={cn(
            "text-lg leading-relaxed",
            isDark ? "text-white/80" : "text-slate-700"
          )}
        >
          {term.shortDefinition}
        </p>

        {/* Synonyms */}
        {term.synonyms.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={cn(
                "text-xs font-bold",
                isDark ? "text-white/40" : "text-slate-400"
              )}
            >
              Also known as:
            </span>
            {term.synonyms.map((syn: string) => (
              <span
                key={syn}
                className={cn(
                  "text-xs px-2 py-1 rounded",
                  isDark
                    ? "bg-white/10 text-white/60"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {syn}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Full Definition */}
      <section
        className={cn(
          "p-6 rounded-2xl border mb-6",
          isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
        )}
      >
        <h2
          className={cn(
            "text-lg font-black mb-4 flex items-center gap-2",
            isDark ? "text-white" : "text-slate-900"
          )}
        >
          <BookOpen size={20} />
          Full Explanation
        </h2>
        <div
          className={cn(
            "prose prose-sm max-w-none",
            isDark ? "text-white/80 prose-invert" : "text-slate-700"
          )}
        >
          {definitionText.split("\n\n").map((paragraph: string, i: number) => (
            <p key={i} className="mb-4 last:mb-0 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* Formula Section */}
      {term.formulas && term.formulas.length > 0 && (
        <section
          className={cn(
            "p-6 rounded-2xl border mb-6",
            isDark
              ? "bg-indigo-500/10 border-indigo-500/20"
              : "bg-indigo-50 border-indigo-200"
          )}
        >
          <h2
            className={cn(
              "text-lg font-black mb-4 flex items-center gap-2",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            <Calculator size={20} />
            Formula
          </h2>
          {term.formulas.map((formula: Formula, i: number) => (
            <div key={i} className="space-y-4">
              <div
                className={cn(
                  "text-xl font-mono font-bold p-4 rounded-xl text-center",
                  isDark ? "bg-black/20 text-white" : "bg-white text-slate-900"
                )}
              >
                {formula.expression}
              </div>
              {formula.variables.length > 0 && (
                <div className="space-y-2">
                  <div
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      isDark ? "text-white/60" : "text-slate-500"
                    )}
                  >
                    Variables
                  </div>
                  {formula.variables.map((v: FormulaVariable, vi: number) => (
                    <div
                      key={vi}
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        isDark ? "text-white/80" : "text-slate-700"
                      )}
                    >
                      <span className="font-mono font-bold">{v.symbol}</span>
                      <span className="text-slate-400">—</span>
                      <span>{v.description}</span>
                      {v.unit && (
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            isDark ? "bg-white/10" : "bg-slate-200"
                          )}
                        >
                          {v.unit}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {formula.example && (
                <div
                  className={cn(
                    "p-4 rounded-xl",
                    isDark ? "bg-black/20" : "bg-white"
                  )}
                >
                  <div
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider mb-2",
                      isDark ? "text-white/60" : "text-slate-500"
                    )}
                  >
                    Example
                  </div>
                  <div
                    className={cn(
                      "font-mono text-lg font-bold",
                      isDark ? "text-[#E8FF4D]" : "text-violet-600"
                    )}
                  >
                    Result: {formula.example.result}
                    {typeof formula.example.result === "number" &&
                      formula.example.result < 100 &&
                      "%"}
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Examples Section */}
      {term.examples && term.examples.length > 0 && (
        <section
          className={cn(
            "p-6 rounded-2xl border mb-6",
            isDark
              ? "bg-emerald-500/10 border-emerald-500/20"
              : "bg-emerald-50 border-emerald-200"
          )}
        >
          <h2
            className={cn(
              "text-lg font-black mb-4",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            Real-World Example
          </h2>
          {term.examples.map((example: Example, i: number) => (
            <div key={i} className="space-y-3">
              <h3
                className={cn(
                  "font-bold",
                  isDark ? "text-white" : "text-slate-900"
                )}
              >
                {example.title}
              </h3>
              <div
                className={cn(
                  "text-sm",
                  isDark ? "text-white/80" : "text-slate-700"
                )}
              >
                <p className="mb-2">
                  <span className="font-bold">Scenario:</span> {example.scenario}
                </p>
                {example.calculation && (
                  <p
                    className={cn(
                      "font-mono p-2 rounded mb-2",
                      isDark ? "bg-black/20" : "bg-white"
                    )}
                  >
                    {example.calculation}
                  </p>
                )}
                <p>
                  <span className="font-bold">Outcome:</span> {example.outcome}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Pro Tips Section */}
      {term.proTips && term.proTips.length > 0 && (
        <section
          className={cn(
            "p-6 rounded-2xl border mb-6",
            isDark
              ? "bg-amber-500/10 border-amber-500/20"
              : "bg-amber-50 border-amber-200"
          )}
        >
          <h2
            className={cn(
              "text-lg font-black mb-4 flex items-center gap-2",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            <Lightbulb size={20} />
            Pro Tips
          </h2>
          <ul className="space-y-3">
            {term.proTips.map((tip: string, i: number) => (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-3 text-sm",
                  isDark ? "text-white/80" : "text-slate-700"
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                    isDark
                      ? "bg-amber-500/30 text-amber-300"
                      : "bg-amber-200 text-amber-800"
                  )}
                >
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Feature Link */}
      {term.featureLink && (
        <section
          className={cn(
            "p-6 rounded-2xl border mb-6",
            isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
          )}
        >
          <h2
            className={cn(
              "text-lg font-black mb-2",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            See it in Action
          </h2>
          <p
            className={cn(
              "text-sm mb-4",
              isDark ? "text-white/60" : "text-slate-500"
            )}
          >
            View this concept in your property data
          </p>
          <Link
            to={term.featureLink.route as any}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all",
              isDark
                ? "bg-[#E8FF4D] text-black hover:bg-[#E8FF4D]/90"
                : "bg-violet-600 text-white hover:bg-violet-700"
            )}
          >
            {term.featureLink.label}
            <ExternalLink size={14} />
          </Link>
        </section>
      )}

      {/* Related Terms */}
      {relatedTerms.length > 0 && (
        <section>
          <h2
            className={cn(
              "text-lg font-black mb-4",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            Related Terms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedTerms.map((related) => {
              const relatedCategoryIcon = CATEGORY_ICONS[related.category];
              const RelatedIcon = getIcon(relatedCategoryIcon);

              return (
                <Link
                  key={related.slug}
                  to="/learning-hub/glossary/$slug"
                  params={{ slug: related.slug }}
                  className={cn(
                    "p-4 rounded-xl border group transition-all flex items-center gap-3",
                    isDark
                      ? "bg-white/5 border-white/10 hover:bg-white/10"
                      : "bg-white border-slate-200 hover:shadow-lg"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      isDark ? "bg-white/10" : "bg-slate-100"
                    )}
                  >
                    <RelatedIcon size={18} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div
                      className={cn(
                        "font-bold text-sm truncate",
                        isDark ? "text-white" : "text-slate-900"
                      )}
                    >
                      {related.term}
                    </div>
                    <div
                      className={cn(
                        "text-xs truncate",
                        isDark ? "text-white/60" : "text-slate-500"
                      )}
                    >
                      {related.shortDefinition}
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className={cn(
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      isDark ? "text-[#E8FF4D]" : "text-violet-600"
                    )}
                  />
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
