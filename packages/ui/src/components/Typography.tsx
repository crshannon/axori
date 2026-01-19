import { HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

// ============================================================================
// Typography Variants
// ============================================================================

export type TypographyVariant =
  | "display" // Hero/landing page headings
  | "h1" // Page headings
  | "h2" // Section headings
  | "h3" // Subsection headings
  | "h4" // Card headings
  | "h5" // Small headings
  | "h6" // Smallest headings
  | "body" // Body text
  | "body-lg" // Large body text
  | "body-sm" // Small body text
  | "label" // Form labels
  | "label-sm" // Small labels
  | "caption" // Captions/helper text
  | "overline"; // Overline text

export type TypographyWeight =
  | "normal"
  | "medium"
  | "semibold"
  | "bold"
  | "black";
export type TypographyTransform = "none" | "uppercase" | "lowercase";
export type TypographyTracking =
  | "tighter"
  | "tight"
  | "normal"
  | "wide"
  | "wider"
  | "widest"
  | "custom";

// ============================================================================
// Typography Component
// ============================================================================

export interface TypographyProps extends HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  weight?: TypographyWeight;
  transform?: TypographyTransform;
  tracking?: TypographyTracking;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div" | "label";
  children?: ReactNode;
  className?: string;
}

const variantStyles: Record<TypographyVariant, string> = {
  display:
    "text-[clamp(3rem,8vw,6rem)] md:text-6xl lg:text-7xl xl:text-8xl font-black uppercase tracking-tighter leading-[0.9]",
  h1: "text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none",
  h2: "text-4xl md:text-5xl font-black uppercase tracking-tighter leading-tight",
  h3: "text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight",
  h4: "text-2xl font-black uppercase tracking-tight",
  h5: "text-xl font-black uppercase tracking-tight",
  h6: "text-lg font-bold uppercase tracking-normal",
  "body-lg": "text-lg font-normal leading-relaxed",
  body: "text-base font-normal leading-normal",
  "body-sm": "text-sm font-normal leading-normal",
  label: "text-sm font-black uppercase tracking-widest",
  "label-sm": "text-xs font-black uppercase tracking-widest",
  caption: "text-[10px] font-bold uppercase tracking-widest opacity-60",
  overline: "text-[9px] font-black uppercase tracking-[0.3em] opacity-40",
};

const weightStyles: Record<TypographyWeight, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  black: "font-black",
};

const transformStyles: Record<TypographyTransform, string> = {
  none: "",
  uppercase: "uppercase",
  lowercase: "lowercase",
};

const trackingStyles: Record<TypographyTracking, string> = {
  tighter: "tracking-tighter",
  tight: "tracking-tight",
  normal: "tracking-normal",
  wide: "tracking-wide",
  wider: "tracking-wider",
  widest: "tracking-widest",
  custom: "tracking-[0.3em]", // Default custom tracking
};

const defaultElements: Record<TypographyVariant, TypographyProps["as"]> = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  "body-lg": "p",
  body: "p",
  "body-sm": "p",
  label: "label",
  "label-sm": "label",
  caption: "p",
  overline: "span",
};

export function Typography({
  variant = "body",
  weight,
  transform,
  tracking,
  as,
  children,
  className,
  ...props
}: TypographyProps) {
  const Component = as || defaultElements[variant];
  const variantClass = variantStyles[variant];

  // Override weight/transform/tracking if provided
  const weightClass = weight ? weightStyles[weight] : "";
  const transformClass = transform ? transformStyles[transform] : "";
  const trackingClass = tracking ? trackingStyles[tracking] : "";

  if (!Component) {
    throw new Error(
      `Typography: No valid HTML element or component type for variant "${variant}"`
    );
  }

  return (
    <Component
      className={cn(
        variantClass,
        weightClass,
        transformClass,
        trackingClass,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

export interface HeadingProps extends Omit<TypographyProps, "variant"> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function Heading({ level = 1, ...props }: HeadingProps) {
  const variant = `h${level}` as TypographyVariant;
  return <Typography variant={variant} {...props} />;
}

export interface LabelProps extends Omit<TypographyProps, "variant"> {
  size?: "default" | "sm";
}

export function Label({ size = "default", ...props }: LabelProps) {
  const variant = size === "sm" ? "label-sm" : "label";
  return <Typography variant={variant} as="label" {...props} />;
}

export interface BodyProps extends Omit<TypographyProps, "variant"> {
  size?: "sm" | "default" | "lg";
}

export function Body({ size = "default", ...props }: BodyProps) {
  const variant =
    size === "sm" ? "body-sm" : size === "lg" ? "body-lg" : "body";
  return <Typography variant={variant} {...props} />;
}

export interface CaptionProps extends Omit<TypographyProps, "variant"> {}

export function Caption(props: CaptionProps) {
  return <Typography variant="caption" {...props} />;
}

export interface OverlineProps extends Omit<TypographyProps, "variant"> {}

export function Overline(props: OverlineProps) {
  return <Typography variant="overline" {...props} />;
}
