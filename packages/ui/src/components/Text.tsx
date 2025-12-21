import { HTMLAttributes } from "react";
import { cn } from "../utils/cn";
import { BaseComponentProps, Size } from "../types";

export interface TextProps
  extends HTMLAttributes<HTMLParagraphElement>,
    BaseComponentProps {
  as?: "p" | "span" | "div";
  size?: Size;
  weight?: "normal" | "medium" | "semibold" | "bold";
}

const textSizes: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

const textWeights = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

export const Text = ({
  as: Component = "p",
  size = "md",
  weight = "normal",
  className,
  children,
  ...props
}: TextProps) => {
  return (
    <Component
      className={cn(textSizes[size], textWeights[weight], className)}
      {...props}
    >
      {children}
    </Component>
  );
};

