import { HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export interface OnboardingCardProps extends HTMLAttributes<HTMLDivElement> {
  isDark?: boolean;
  children?: ReactNode;
  variant?: "default" | "compact";
}

export function OnboardingCard({
  isDark = false,
  children,
  variant = "default",
  className,
  ...props
}: OnboardingCardProps) {
  return (
    <div
      className={cn(
        "rounded-[4rem] border transition-colors",
        variant === "default" && "p-16",
        variant === "compact" && "p-10",
        isDark
          ? "border-white/5 bg-[#1A1A1A]"
          : "border-black/5 bg-white shadow-2xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

