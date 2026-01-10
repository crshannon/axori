import { Card, cn } from "@axori/ui";
import type { HTMLAttributes, ReactNode } from "react";

export interface BentoCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  span?:
    | "full"
    | "half"
    | "two-thirds"
    | "one-third"
    | "seven-twelfths"
    | "five-twelfths";
  minHeightClass?: string;
  padding?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "image" | "contact" | "stats";
}

const spanClasses = {
  full: "md:col-span-12",
  half: "md:col-span-6",
  "two-thirds": "md:col-span-8",
  "one-third": "md:col-span-4",
  "seven-twelfths": "md:col-span-7",
  "five-twelfths": "md:col-span-5",
};

const paddingClasses = {
  sm: "p-6 md:p-8",
  md: "p-8 md:p-10",
  lg: "p-10 md:p-14",
  xl: "p-10 md:p-16",
};

export function BentoCard({
  children,
  span = "full",
  minHeightClass,
  padding = "md",
  variant = "default",
  className,
  ...props
}: BentoCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "image":
        return "bg-slate-300 relative overflow-hidden";
      case "contact":
        return "bg-white text-slate-900 border border-slate-200 dark:bg-[#E2B1A8] dark:text-black";
      case "stats":
        return "bg-slate-900 text-white dark:bg-white dark:text-black";
      default:
        return "";
    }
  };

  return (
    <Card
      variant="bento"
      className={cn(
        "rounded-[2.5rem]", // 2.5rem border radius for bento cards
        spanClasses[span],
        paddingClasses[padding],
        getVariantStyles(),
        minHeightClass,
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}
