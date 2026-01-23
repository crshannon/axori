import { HTMLAttributes, ReactNode } from "react";
import { Typography } from "./Typography";
import { cn } from "../utils/cn";
import type { LucideIcon } from "lucide-react";

export interface MenuItemProps extends HTMLAttributes<HTMLButtonElement> {
  /** Icon to display before the label */
  icon?: LucideIcon;
  /** Menu item label */
  label: ReactNode;
  /** Whether this is a destructive/danger action (red styling) */
  destructive?: boolean;
  /** Whether the item is disabled */
  disabled?: boolean;
}

/**
 * MenuItem - Individual menu item component
 *
 * Used within Menu component for consistent menu item styling.
 */
export const MenuItem = ({
  icon: Icon,
  label,
  destructive = false,
  disabled = false,
  className,
  ...props
}: MenuItemProps) => {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        `
          flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left
          text-sm font-bold transition-colors
          disabled:cursor-not-allowed disabled:opacity-50
        `,
        destructive
          ? `
            text-rose-600
            hover:bg-rose-50
            dark:text-rose-400
            dark:hover:bg-rose-900/20
          `
          : `
            text-slate-700
            hover:bg-slate-50
            dark:text-slate-300
            dark:hover:bg-white/5
          `,
        className
      )}
      {...props}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      <Typography variant="body-sm" weight="bold" className="flex-1">
        {label}
      </Typography>
    </button>
  );
};

export interface MenuProps extends HTMLAttributes<HTMLDivElement> {
  /** Menu items */
  children: ReactNode;
  /** Optional width override */
  width?: "sm" | "md" | "lg" | "auto";
}

const widthClasses = {
  sm: "w-40",
  md: "w-48",
  lg: "w-56",
  auto: "w-auto",
};

/**
 * Menu - Dropdown menu component
 *
 * A reusable dropdown menu container with consistent styling.
 * Use MenuItem components as children for menu items.
 *
 * @example
 * ```tsx
 * <Menu>
 *   <MenuItem icon={Archive} label="Archive" onClick={handleArchive} />
 *   <MenuItem icon={Trash2} label="Delete" destructive onClick={handleDelete} />
 * </Menu>
 * ```
 */
export const Menu = ({
  children,
  width = "md",
  className,
  ...props
}: MenuProps) => {
  return (
    <div
      className={cn(
        `
          absolute top-full right-0 z-50 mt-2 overflow-hidden rounded-2xl border
          border-slate-200 bg-white shadow-xl
          dark:border-white/10 dark:bg-slate-900
        `,
        widthClasses[width],
        className
      )}
      {...props}
    >
      <div className="py-1" role="menu" aria-orientation="vertical">
        {children}
      </div>
    </div>
  );
};

/**
 * MenuDivider - Visual separator between menu items
 *
 * Use between MenuItem components to create visual separation.
 */
export const MenuDivider = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(`
        my-1 h-px bg-slate-200
        dark:bg-white/10
      `, className)}
      role="separator"
      {...props}
    />
  );
};
