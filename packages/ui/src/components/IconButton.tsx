import { ButtonHTMLAttributes, forwardRef } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "../utils/cn";

export type IconButtonSize = "sm" | "md" | "lg";
export type IconButtonVariant = "default" | "ghost" | "subtle" | "primary";
export type IconButtonShape = "square" | "rounded" | "circle";
export type IconButtonAnimation = "none" | "pulse" | "bounce";

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Size of the button */
  size?: IconButtonSize;
  /** Visual variant */
  variant?: IconButtonVariant;
  /** Shape of the button */
  shape?: IconButtonShape;
  /** Animation type */
  animation?: IconButtonAnimation;
  /** Icon size override (defaults based on button size) */
  iconSize?: number;
  /** Icon stroke width */
  iconStrokeWidth?: number;
  /** Custom aria-label for accessibility */
  "aria-label"?: string;
}

const sizeClasses: Record<IconButtonSize, string> = {
  sm: "p-2",
  md: "p-4",
  lg: "p-6",
};

const iconSizes: Record<IconButtonSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

const shapeClasses: Record<IconButtonShape, string> = {
  square: "rounded-lg",
  rounded: "rounded-2xl",
  circle: "rounded-full",
};

const variantClasses: Record<IconButtonVariant, string> = {
  default:
    "bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white",
  ghost:
    "bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 dark:text-white",
  subtle:
    "bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white",
  primary:
    "bg-violet-600 hover:bg-violet-700 text-white dark:bg-violet-600 dark:hover:bg-violet-700",
};

const animationClasses: Record<IconButtonAnimation, string> = {
  none: "",
  pulse: "animate-pulse",
  bounce: "animate-bounce",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon: Icon,
      size = "md",
      variant = "default",
      shape = "rounded",
      animation = "none",
      iconSize,
      iconStrokeWidth = 2,
      className,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const finalIconSize = iconSize || iconSizes[size];

    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        className={cn(
          "inline-flex items-center justify-center",
          "cursor-pointer transition-all",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          "focus:ring-violet-500 dark:focus:ring-[#E8FF4D]",
          "disabled:pointer-events-none",
          // Only apply opacity when disabled AND no animation (to preserve animation visibility)
          animation === "none" && "disabled:opacity-50",
          sizeClasses[size],
          shapeClasses[shape],
          variantClasses[variant],
          animationClasses[animation],
          className
        )}
        {...props}
      >
        <Icon size={finalIconSize} strokeWidth={iconStrokeWidth} />
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
