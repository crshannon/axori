import { HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bento";
  theme?: "light" | "dark";
  children?: ReactNode;
}

export const Card = ({ 
  className, 
  children, 
  variant = "default",
  theme,
  ...props 
}: CardProps) => {
  const isBento = variant === "bento";
  
  return (
    <div
      className={cn(
        "shadow-sm transition-all duration-500",
        // Default variant
        variant === "default" && "rounded-lg border border-gray-200 bg-white",
        // Bento variant with theme support - larger rounded corners
        isBento && "rounded-2xl",
        isBento && theme === "dark" && "bg-white text-black",
        isBento && theme === "light" && "bg-slate-900 text-white",
        isBento && !theme && "border border-gray-200 bg-white",
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
    <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)}>
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

