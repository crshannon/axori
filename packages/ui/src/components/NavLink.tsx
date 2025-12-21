import { ButtonHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export interface NavLinkProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "admin";
}

export const NavLink = ({
  className,
  variant = "default",
  children,
  ...props
}: NavLinkProps) => {
  if (variant === "admin") {
    return (
      <button
        className={cn(
          "text-[10px] font-black uppercase tracking-[0.3em] text-red-500/50 hover:text-red-500 transition-colors px-3 py-1 border border-red-500/20 rounded-full",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      className={cn(
        "text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

