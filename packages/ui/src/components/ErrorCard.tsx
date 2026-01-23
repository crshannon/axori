import { HTMLAttributes, ReactNode } from "react";
import { Typography } from "./Typography";
import { cn } from "../utils/cn";

export interface ErrorCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Error message to display */
  message: string | ReactNode;
  /** Optional title/heading for the error */
  title?: string;
  /** Variant for error styling - defaults to 'default' (rose/red) */
  variant?: "default" | "danger";
}

/**
 * ErrorCard - A reusable error message card component
 *
 * Displays an error message in a styled card with consistent formatting.
 * Uses the design system's Typography component for consistency.
 *
 * @example
 * ```tsx
 * <ErrorCard message="Something went wrong. Please try again." />
 * ```
 *
 * @example
 * ```tsx
 * <ErrorCard
 *   title="Validation Error"
 *   message="Please check your input and try again."
 * />
 * ```
 */
export const ErrorCard = ({
  message,
  title,
  variant = "default",
  className,
  ...props
}: ErrorCardProps) => {
  const isDanger = variant === "danger";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        isDanger
          ? "border-red-500/20 bg-red-500/10"
          : `
            border-rose-200 bg-rose-50
            dark:border-rose-800 dark:bg-rose-900/20
          `,
        className
      )}
      {...props}
    >
      {title && (
        <Typography
          variant="body-sm"
          weight="black"
          className={cn(
            "mb-2",
            isDanger
              ? `
                text-red-600
                dark:text-red-400
              `
              : `
                text-rose-600
                dark:text-rose-400
              `
          )}
        >
          {title}
        </Typography>
      )}
      <Typography
        variant="body-sm"
        weight="bold"
        className={cn(
          isDanger
            ? `
              text-red-600
              dark:text-red-400
            `
            : `
              text-rose-600
              dark:text-rose-400
            `
        )}
      >
        {message}
      </Typography>
    </div>
  );
};
