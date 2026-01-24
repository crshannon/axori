import { ReactNode } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { IconButton } from "./IconButton";
import { Typography } from "./Typography";
import { Plus, LucideIcon } from "lucide-react";
import { cn } from "../utils/cn";

export interface EmptyStateCardProps {
  /** Title displayed at the top */
  title: string;
  /** Optional subtitle or status message */
  statusMessage?: string;
  /** Description text with optional highlighted terms */
  description?: string | ReactNode;
  /** Highlighted terms in description (will be wrapped in spans) */
  highlightedTerms?: string[];
  /** Button text */
  buttonText?: string;
  /** Button click handler */
  onButtonClick?: () => void;
  /** Color theme variant */
  variant?: "violet" | "slate" | "indigo" | "emerald";
  /** Show placeholder skeleton bars */
  showPlaceholders?: boolean;
  /** Custom icon (defaults to Plus) */
  icon?: LucideIcon;
  /** Size/layout variant */
  size?: "default" | "condensed";
  /** Additional className for the card */
  className?: string;
}

const variantStyles = {
  violet: {
    card: "bg-violet-600/5 border-dashed border-violet-500/30 hover:border-violet-500/60",
    title: "text-violet-500/60",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
    placeholder: "bg-violet-500/10",
    placeholderLarge: "bg-violet-500/20",
    status: "text-violet-400",
    highlight: "text-violet-500",
    button: "dark:bg-violet-600 dark:hover:bg-violet-700 dark:text-white",
    focusRing: "focus:ring-violet-500 dark:focus:ring-violet-500",
    gradient: "from-violet-500/[0.03]",
  },
  slate: {
    card: "bg-slate-50 dark:bg-white/5 border-dashed border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20",
    title: "text-slate-500 dark:text-slate-400",
    iconBg: "bg-slate-200/50 dark:bg-white/10",
    iconColor: "text-slate-500 dark:text-slate-400",
    placeholder: "bg-slate-200 dark:bg-white/5",
    placeholderLarge: "bg-slate-300 dark:bg-white/10",
    status: "text-slate-400 dark:text-slate-500",
    highlight: "text-slate-600 dark:text-slate-300",
    button: "",
    focusRing: "focus:ring-slate-500 dark:focus:ring-slate-400",
    gradient: "from-slate-500/[0.03]",
  },
  indigo: {
    card: "bg-indigo-600/5 border-dashed border-indigo-500/30 hover:border-indigo-500/60",
    title: "text-indigo-500/60",
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-500",
    placeholder: "bg-indigo-500/10",
    placeholderLarge: "bg-indigo-500/20",
    status: "text-indigo-400",
    highlight: "text-indigo-500",
    button: "dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-white",
    focusRing: "focus:ring-indigo-500 dark:focus:ring-indigo-500",
    gradient: "from-indigo-500/[0.03]",
  },
  emerald: {
    card: "bg-emerald-600/5 border-dashed border-emerald-500/30 hover:border-emerald-500/60",
    title: "text-emerald-500/60",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    placeholder: "bg-emerald-500/10",
    placeholderLarge: "bg-emerald-500/20",
    status: "text-emerald-400",
    highlight: "text-emerald-500",
    button: "dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:text-white",
    focusRing: "focus:ring-emerald-500 dark:focus:ring-emerald-500",
    gradient: "from-emerald-500/[0.03]",
  },
};

export const EmptyStateCard = ({
  title,
  statusMessage,
  description,
  highlightedTerms = [],
  buttonText,
  onButtonClick,
  variant = "violet",
  showPlaceholders = true,
  icon: Icon = Plus,
  size = "default",
  className,
}: EmptyStateCardProps) => {
  const styles = variantStyles[variant];
  const isCondensed = size === "condensed";

  // Process description to highlight terms
  const renderDescription = () => {
    if (!description) return null;

    if (typeof description === "string") {
      if (highlightedTerms.length === 0) {
        return (
          <Typography
            variant="body-sm"
            className="mb-6 leading-relaxed text-slate-500 italic"
          >
            {description}
          </Typography>
        );
      }

      // Split description and wrap highlighted terms
      let parts: ReactNode[] = [description];
      highlightedTerms.forEach((term) => {
        const newParts: ReactNode[] = [];
        parts.forEach((part) => {
          if (typeof part === "string") {
            const regex = new RegExp(`(${term})`, "gi");
            const split = part.split(regex);
            split.forEach((segment, i) => {
              if (regex.test(segment)) {
                newParts.push(
                  <span key={`${term}-${i}`} className={styles.highlight}>
                    {segment}
                  </span>
                );
              } else if (segment) {
                newParts.push(segment);
              }
            });
          } else {
            newParts.push(part);
          }
        });
        parts = newParts;
      });

      return (
        <Typography
          variant="body-sm"
          className="mb-6 leading-relaxed text-slate-500 italic"
        >
          {parts}
        </Typography>
      );
    }

    // If description is already a ReactNode, render it directly
    return <div className="mb-6">{description}</div>;
  };

  // Condensed horizontal layout (matches FinancialPulse style)
  if (isCondensed) {
    return (
      <Card
        variant="rounded"
        padding="lg"
        radius="xl"
        className={cn(
          `
            group relative flex flex-col items-center gap-8 overflow-hidden py-8
            md:flex-row
          `,
          styles.card,
          className
        )}
      >
        {/* Gradient Background */}
        <div
          className={cn(
            `pointer-events-none absolute inset-0 bg-linear-to-r to-transparent`,
            styles.gradient
          )}
        />
        {/* Blueprint Hatching Overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 20px)",
            backgroundSize: "20px 20px",
          }}
        ></div>

        {/* Left: Title and Description */}
        <div className="relative z-10 flex grow flex-col justify-center">
          <Typography
            variant="caption"
            weight="black"
            className={cn(
              styles.title,
              `
                mb-2 flex items-center gap-2 text-sm tracking-[0.2em]
                opacity-100
              `
            )}
          >
            <span className="size-1.5 animate-pulse rounded-full bg-current" />
            {title}
          </Typography>
          {description && (
            <Typography
              variant="caption"
              className="
                mt-2 max-w-md text-slate-500
                dark:text-slate-400
              "
            >
              {typeof description === "string" ? description : description}
            </Typography>
          )}
        </div>

        {/* Right: Button */}
        {buttonText && onButtonClick && (
          <div className="relative z-10">
            {showPlaceholders && (
              <div className="mb-4 flex items-center gap-4">
                <div
                  className={cn("h-3 w-24 rounded-full", styles.placeholder)}
                ></div>
                <div
                  className={cn("h-6 w-32 rounded-xl", styles.placeholderLarge)}
                ></div>
              </div>
            )}
            <Button
              onClick={onButtonClick}
              variant="primary"
              className={cn(
                `
                  rounded-xl px-6 py-3 text-xs font-black tracking-widest
                  whitespace-nowrap uppercase shadow-lg transition-transform
                  group-hover:scale-[1.02]
                `,
                styles.button,
                styles.focusRing
              )}
            >
              {buttonText}
            </Button>
          </div>
        )}
      </Card>
    );
  }

  // Default vertical layout
  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden",
        styles.card,
        className
      )}
    >
      <div className="flex h-full flex-col justify-between">
        {/* Blueprint Hatching Overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 20px)",
            backgroundSize: "20px 20px",
          }}
        ></div>

        <div>
          <div className="relative z-10 mb-6 flex items-center justify-between">
            <Typography variant="h5" className={styles.title}>
              {title}
            </Typography>
            <IconButton
              icon={Icon}
              size="sm"
              variant="ghost"
              shape="circle"
              animation="pulse"
              iconSize={14}
              iconStrokeWidth={4}
              className={cn("size-8", styles.iconBg, styles.iconColor)}
              aria-label="Add icon"
              disabled
            />
          </div>
          {showPlaceholders && (
            <div className="relative z-10 grid grid-cols-[40%_60%] gap-4">
              <div className="space-y-4 font-mono">
                <div
                  className={cn("h-4 w-24 rounded-full", styles.placeholder)}
                ></div>
                <div
                  className={cn("h-8 w-32 rounded-xl", styles.placeholderLarge)}
                ></div>
              </div>
              {statusMessage && (
                <div className="flex items-end">{renderDescription()}</div>
              )}
            </div>
          )}
        </div>

        {buttonText && onButtonClick && (
          <div className="relative z-10 mt-12">
            <Button
              onClick={onButtonClick}
              variant="primary"
              fullWidth
              className={cn(
                `
                  rounded-2xl py-4 text-[10px] font-black tracking-widest
                  uppercase shadow-xl
                  group-hover:scale-[1.02]
                `,
                styles.button,
                styles.focusRing
              )}
            >
              {buttonText}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
