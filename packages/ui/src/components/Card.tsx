import { HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bento" | "rounded";
  theme?: "light" | "dark";
  padding?: "sm" | "md" | "lg" | "xl";
  radius?: "sm" | "md" | "lg" | "xl";
  children?: ReactNode;
}

export const Card = ({ 
  className, 
  children, 
  variant = "default",
  theme,
  padding = "md",
  radius = "md",
  ...props 
}: CardProps) => {
  const isBento = variant === "bento";
  const isRounded = variant === "rounded";
  
  // Padding mapping for rounded variant
  const paddingMap = {
    sm: "p-6",
    md: "p-8",
    lg: "p-10",
    xl: "p-12",
  };

  // Radius mapping for rounded variant
  const radiusMap = {
    sm: "rounded-[2rem]",
    md: "rounded-[2.5rem]",
    lg: "rounded-[3rem]",
    xl: "rounded-[3.5rem]",
  };
  
  return (
    <div
      className={cn(
        "transition-all duration-500",
        // Default variant
        variant === "default" && `
          rounded-lg border border-gray-200 bg-white shadow-sm
        `,
        // Bento variant with theme support - larger rounded corners
        isBento && "rounded-2xl shadow-sm",
        isBento && theme === "dark" && "bg-white text-black",
        isBento && theme === "light" && "bg-slate-900 text-white",
        isBento && !theme && "border border-gray-200 bg-white",
        // Rounded variant - modern card style used throughout the app
        isRounded && `
          border border-slate-200 bg-white shadow-sm
          dark:border-white/5 dark:bg-[#1A1A1A]
        `,
        isRounded && paddingMap[padding],
        isRounded && radiusMap[radius],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}
export const CardHeader = ({ className, children }: CardHeaderProps) => {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)}>
      {children}
    </div>
  );
};

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode;
}
export const CardTitle = ({ className, children }: CardTitleProps) => {
  return (
    <h3 className={cn("text-2xl leading-none font-semibold tracking-tight", className)}>
      {children}
    </h3>
  );
};

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
}
export const CardDescription = ({ className, children }: CardDescriptionProps) => {
  return (
    <p className={cn("text-sm text-gray-500", className)}>
      {children}
    </p>
  );
};

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}
export const CardContent = ({ className, children }: CardContentProps) => {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
};

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}
export const CardFooter = ({ className, children }: CardFooterProps) => {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)}>
      {children}
    </div>
  );
};

