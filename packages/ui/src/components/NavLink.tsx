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
          `
            rounded-full border border-red-500/20 px-3 py-1 text-[10px]
            font-black tracking-[0.3em] text-red-500/50 uppercase
            transition-colors
            hover:text-red-500
          `,
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
        `
          text-xs font-bold tracking-widest text-slate-400 uppercase
          transition-colors
          hover:text-slate-900
          dark:hover:text-white
        `,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

