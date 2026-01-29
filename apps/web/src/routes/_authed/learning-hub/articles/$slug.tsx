import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState  } from "react";
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  ChevronRight,
  Clock,
  FileText,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { CATEGORY_ICONS, CATEGORY_LABELS, LEVEL_LABELS } from "@axori/shared";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";
import {
  getArticleBySlug,
  getRelatedArticles,
} from "@/data/learning-hub/articles";
import { getTermBySlug } from "@/data/learning-hub/glossary";
import { addToRecentlyViewed, isBookmarked, toggleBookmark } from "@/lib/learning-hub/progress";

export const Route = createFileRoute("/_authed/learning-hub/articles/$slug")({
  component: ArticleDetailPage,
});

function ArticleDetailPage() {
  const { slug } = Route.useParams();
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";

  const article = getArticleBySlug(slug);
  const [bookmarked, setBookmarked] = useState(false);

  // Scroll to top and track view
  useEffect(() => {
    window.scrollTo(0, 0);
    if (article) {
      addToRecentlyViewed("article", article.slug, article.title);
      setBookmarked(isBookmarked("article", article.slug));
    }
  }, [article]);

  if (!article) {
    return (
      <div className="p-6 xl:p-8">
        <div
          className={cn(
            "text-center py-16",
            isDark ? "text-white/60" : "text-slate-500"
          )}
        >
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-bold mb-2">Article not found</p>
          <Link
            to="/learning-hub/articles"
            className={cn(
              "text-sm underline",
              isDark ? "text-[#E8FF4D]" : "text-violet-600"
            )}
          >
            Browse all articles
          </Link>
        </div>
      </div>
    );
  }

  const relatedArticles = getRelatedArticles(article);

  // Get icon component by name
  const getIcon = (iconName: string) => {
    const icons = LucideIcons as unknown as Record<
      string,
      React.ComponentType<{ size?: number; className?: string }> | undefined
    >;
    const Icon = icons[iconName];
    return Icon ?? BookOpen;
  };

  const categoryIcon = CATEGORY_ICONS[article.category];
  const Icon = getIcon(categoryIcon);

  // Handle bookmark toggle
  const handleBookmarkToggle = () => {
    const newState = toggleBookmark("article", article.slug, article.title);
    setBookmarked(newState);
  };

  // Parse markdown-like content to simple HTML
  const renderContent = (content: string) => {
    // Simple markdown parsing for display
    const lines = content.split("\n");
    const elements: Array<JSX.Element> = [];
    let currentList: Array<string> = [];
    let listType: "ul" | "ol" | "checklist" | null = null;

    const flushList = () => {
      if (currentList.length > 0 && listType) {
        if (listType === "checklist") {
          elements.push(
            <ul key={elements.length} className="space-y-2 my-4">
              {currentList.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5",
                      isDark ? "border-white/20" : "border-slate-300"
                    )}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        } else {
          const ListTag = listType;
          elements.push(
            <ListTag
              key={elements.length}
              className={cn(
                "my-4 ml-6",
                listType === "ol" ? "list-decimal" : "list-disc"
              )}
            >
              {currentList.map((item, i) => (
                <li key={i} className="mb-1">
                  {item}
                </li>
              ))}
            </ListTag>
          );
        }
        currentList = [];
        listType = null;
      }
    };

    lines.forEach((line, index) => {
      // Headers
      if (line.startsWith("## ")) {
        flushList();
        elements.push(
          <h2
            key={index}
            className={cn(
              "text-xl font-black mt-8 mb-4",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        flushList();
        elements.push(
          <h3
            key={index}
            className={cn(
              "text-lg font-bold mt-6 mb-3",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            {line.slice(4)}
          </h3>
        );
      }
      // Checklist items
      else if (line.startsWith("- [ ] ")) {
        if (listType !== "checklist") {
          flushList();
          listType = "checklist";
        }
        currentList.push(line.slice(6));
      }
      // Unordered list items
      else if (line.startsWith("- ") || line.startsWith("* ")) {
        if (listType !== "ul") {
          flushList();
          listType = "ul";
        }
        currentList.push(line.slice(2));
      }
      // Ordered list items
      else if (/^\d+\.\s/.test(line)) {
        if (listType !== "ol") {
          flushList();
          listType = "ol";
        }
        currentList.push(line.replace(/^\d+\.\s/, ""));
      }
      // Code blocks
      else if (line.startsWith("```")) {
        flushList();
        // Skip code fence markers
      }
      // Bold text with **
      else if (line.includes("**")) {
        flushList();
        const parts = line.split(/\*\*(.*?)\*\*/g);
        elements.push(
          <p
            key={index}
            className={cn("my-3", isDark ? "text-white/80" : "text-slate-700")}
          >
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <strong key={i} className="font-bold">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      }
      // Tables (simple rendering)
      else if (line.startsWith("|")) {
        flushList();
        const cells = line
          .split("|")
          .filter((c) => c.trim())
          .map((c) => c.trim());
        if (!cells.every((c) => /^[-:]+$/.test(c))) {
          elements.push(
            <div
              key={index}
              className={cn(
                "flex gap-4 py-2 border-b",
                isDark ? "border-white/10" : "border-slate-200"
              )}
            >
              {cells.map((cell, i) => (
                <div key={i} className="flex-1 text-sm">
                  {cell}
                </div>
              ))}
            </div>
          );
        }
      }
      // Regular paragraphs
      else if (line.trim()) {
        flushList();
        elements.push(
          <p
            key={index}
            className={cn("my-3", isDark ? "text-white/80" : "text-slate-700")}
          >
            {line}
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  return (
    <div className="p-6 xl:p-8 max-w-4xl mx-auto">
      {/* Back Link */}
      <Link
        to="/learning-hub/articles"
        className={cn(
          "inline-flex items-center gap-2 text-sm mb-6 transition-colors",
          isDark
            ? "text-white/60 hover:text-white"
            : "text-slate-500 hover:text-slate-900"
        )}
      >
        <ArrowLeft size={16} />
        All Articles
      </Link>

      {/* Article Header */}
      <div className="mb-8">
        {/* Category & Meta */}
        <div className="flex items-center gap-4 mb-4">
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
            {article.readTimeMinutes} min read
          </div>
          <span
            className={cn(
              "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded",
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
        </div>

        {/* Title */}
        <h1
          className={cn(
            "text-3xl font-black mb-3",
            isDark ? "text-white" : "text-slate-900"
          )}
        >
          {article.title}
        </h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p
            className={cn(
              "text-lg",
              isDark ? "text-white/60" : "text-slate-500"
            )}
          >
            {article.subtitle}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleBookmarkToggle}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors",
              bookmarked
                ? isDark
                  ? "bg-[#E8FF4D]/20 text-[#E8FF4D]"
                  : "bg-violet-100 text-violet-700"
                : isDark
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            <Bookmark size={16} className={bookmarked ? "fill-current" : ""} />
            {bookmarked ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* Article Content */}
      <div
        className={cn(
          "prose max-w-none",
          isDark ? "prose-invert" : "prose-slate"
        )}
      >
        {typeof article.content === "string"
          ? renderContent(article.content)
          : null}
      </div>

      {/* Related Glossary Terms */}
      {article.relatedGlossaryTerms.length > 0 && (
        <div
          className={cn(
            "mt-12 pt-8 border-t",
            isDark ? "border-white/10" : "border-slate-200"
          )}
        >
          <h3
            className={cn(
              "text-lg font-bold mb-4",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            Related Terms
          </h3>
          <div className="flex flex-wrap gap-2">
            {article.relatedGlossaryTerms.map((termSlug) => {
              const term = getTermBySlug(termSlug);
              if (!term) return null;
              return (
                <Link
                  key={termSlug}
                  to="/learning-hub/glossary/$slug"
                  params={{ slug: termSlug }}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isDark
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  <BookOpen size={14} />
                  {term.term}
                  <ChevronRight size={14} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div
          className={cn(
            "mt-8 pt-8 border-t",
            isDark ? "border-white/10" : "border-slate-200"
          )}
        >
          <h3
            className={cn(
              "text-lg font-bold mb-4",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            Continue Reading
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedArticles.map((related) => (
              <Link
                key={related.slug}
                to="/learning-hub/articles/$slug"
                params={{ slug: related.slug }}
                className={cn(
                  "group p-4 rounded-xl border transition-all",
                  isDark
                    ? "bg-white/5 border-white/10 hover:bg-white/10"
                    : "bg-slate-50 border-slate-200 hover:bg-white hover:shadow-md"
                )}
              >
                <h4
                  className={cn(
                    "font-bold text-sm mb-2 group-hover:underline",
                    isDark ? "text-white" : "text-slate-900"
                  )}
                >
                  {related.title}
                </h4>
                <p
                  className={cn(
                    "text-xs line-clamp-2",
                    isDark ? "text-white/60" : "text-slate-500"
                  )}
                >
                  {related.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
