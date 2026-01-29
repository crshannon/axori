/**
 * VideoEmbed Component
 *
 * Renders embedded videos from YouTube or Vimeo with consistent styling.
 * Supports tracking video views for learning progress.
 */

import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/utils/helpers";

interface VideoEmbedProps {
  /** YouTube or Vimeo URL */
  url: string;
  /** Video title for accessibility */
  title: string;
  /** Optional thumbnail URL (will auto-generate for YouTube) */
  thumbnail?: string;
  /** Aspect ratio: 16:9 (default) or 4:3 */
  aspectRatio?: "16:9" | "4:3";
  /** Whether to show video immediately or show thumbnail first */
  autoLoad?: boolean;
  /** Callback when video starts playing */
  onPlay?: () => void;
  /** Dark mode styling */
  isDark?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Extract video ID and platform from URL
 */
function parseVideoUrl(url: string): { platform: "youtube" | "vimeo" | null; videoId: string | null } {
  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return { platform: "youtube", videoId: match[1] };
    }
  }

  // Vimeo patterns
  const vimeoPatterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern);
    if (match) {
      return { platform: "vimeo", videoId: match[1] };
    }
  }

  return { platform: null, videoId: null };
}

/**
 * Get embed URL for the video platform
 */
function getEmbedUrl(platform: "youtube" | "vimeo", videoId: string): string {
  if (platform === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
  }
  return `https://player.vimeo.com/video/${videoId}?byline=0&portrait=0`;
}

/**
 * Get thumbnail URL for YouTube videos
 */
function getYoutubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function VideoEmbed({
  url,
  title,
  thumbnail,
  aspectRatio = "16:9",
  autoLoad = false,
  onPlay,
  isDark = false,
  className,
}: VideoEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(autoLoad);
  const { platform, videoId } = parseVideoUrl(url);

  if (!platform || !videoId) {
    return (
      <div
        className={cn(
          "rounded-2xl border p-8 text-center",
          isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200",
          className
        )}
      >
        <p className={cn("text-sm", isDark ? "text-white/60" : "text-slate-500")}>
          Invalid video URL. Please use a YouTube or Vimeo link.
        </p>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(platform, videoId);
  const thumbnailUrl = thumbnail || (platform === "youtube" ? getYoutubeThumbnail(videoId) : undefined);
  const paddingTop = aspectRatio === "16:9" ? "56.25%" : "75%";

  const handlePlay = () => {
    setIsLoaded(true);
    onPlay?.();
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl",
        isDark ? "bg-black" : "bg-slate-900",
        className
      )}
      style={{ paddingTop }}
    >
      {isLoaded ? (
        <iframe
          className="absolute inset-0 w-full h-full"
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          onClick={handlePlay}
          className="absolute inset-0 w-full h-full group"
          aria-label={`Play ${title}`}
        >
          {/* Thumbnail */}
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Overlay */}
          <div
            className={cn(
              "absolute inset-0 transition-colors",
              "bg-black/30 group-hover:bg-black/40"
            )}
          />

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all",
                "bg-white/90 group-hover:bg-white group-hover:scale-110",
                "shadow-xl"
              )}
            >
              <Play className="w-8 h-8 text-slate-900 ml-1" fill="currentColor" />
            </div>
          </div>

          {/* Title */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-sm font-medium truncate">{title}</p>
            <p className="text-white/60 text-xs mt-0.5 capitalize">{platform}</p>
          </div>
        </button>
      )}
    </div>
  );
}

/**
 * VideoPlayer Component
 *
 * A simpler version that immediately loads the video without a thumbnail overlay.
 */
export function VideoPlayer({
  url,
  title,
  aspectRatio = "16:9",
  className,
}: {
  url: string;
  title: string;
  aspectRatio?: "16:9" | "4:3";
  className?: string;
}) {
  return (
    <VideoEmbed
      url={url}
      title={title}
      aspectRatio={aspectRatio}
      autoLoad
      className={className}
    />
  );
}

export default VideoEmbed;
