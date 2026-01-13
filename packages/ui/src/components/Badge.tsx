import { HTMLAttributes } from "react";
import { cn } from "../utils/cn";
import { Variant } from "../types";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const badgeVariants: Record<Variant, string> = {
  primary: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  secondary: "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-300",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  success:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  warning:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  outline:
    "border border-slate-200 dark:border-white/5 bg-transparent text-slate-900 dark:text-white",
};

export const Badge = ({
  variant = "primary",
  className,
  children,
  ...props
}: BadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
