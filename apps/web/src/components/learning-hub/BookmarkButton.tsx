/**
 * BookmarkButton Component
 *
 * Toggle button for bookmarking learning hub content.
 * Uses localStorage via progress.ts utilities.
 */

import { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";
import {
  isBookmarked,
  toggleBookmark,
  type Bookmark as BookmarkType,
} from "@/lib/learning-hub/progress";

interface BookmarkButtonProps {
  contentType: BookmarkType["contentType"];
  slug: string;
  title: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  onToggle?: (isNowBookmarked: boolean) => void;
}

export function BookmarkButton({
  contentType,
  slug,
  title,
  size = "md",
  showLabel = false,
  className,
  onToggle,
}: BookmarkButtonProps) {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const [bookmarked, setBookmarked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check initial bookmark state
  useEffect(() => {
    setBookmarked(isBookmarked(contentType, slug));
  }, [contentType, slug]);

  const handleClick = () => {
    setIsAnimating(true);
    const newState = toggleBookmark(contentType, slug, title);
    setBookmarked(newState);
    onToggle?.(newState);

    // Reset animation
    setTimeout(() => setIsAnimating(false), 300);
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border transition-all",
        sizeClasses[size],
        showLabel && "w-auto px-4",
        bookmarked
          ? isDark
            ? "bg-[#E8FF4D]/20 border-[#E8FF4D]/50 text-[#E8FF4D]"
            : "bg-violet-100 border-violet-300 text-violet-700"
          : isDark
            ? "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
            : "bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50",
        isAnimating && "scale-110",
        className
      )}
      title={bookmarked ? "Remove bookmark" : "Add bookmark"}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      {bookmarked ? (
        <BookmarkCheck
          size={iconSizes[size]}
          className={cn(isAnimating && "animate-pulse")}
        />
      ) : (
        <Bookmark size={iconSizes[size]} />
      )}
      {showLabel && (
        <span className="text-sm font-bold">
          {bookmarked ? "Saved" : "Save"}
        </span>
      )}
    </button>
  );
}
