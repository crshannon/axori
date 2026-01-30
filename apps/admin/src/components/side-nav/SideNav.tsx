import { Link, useLocation } from "@tanstack/react-router";
import { UserButton } from "@clerk/clerk-react";
import {
  BookOpen,
  Bot,
  Flag,
  Kanban,
  LayoutDashboard,
  Scale,
  Settings,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";
import type { AdminFeature } from "@axori/permissions";
import { useAdminAuth } from "@/hooks/use-admin-auth";

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  /** Feature required to see this nav item (optional) */
  feature?: AdminFeature;
  /** Only visible if NOT read-only */
  requiresWrite?: boolean;
}

// Forge navigation items (engineering workflow)
const forgeNavItems: Array<NavItem> = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/board", icon: Kanban, label: "Board", feature: "forge:board" },
  { to: "/milestones", icon: Flag, label: "Milestones", feature: "forge:tickets" },
  { to: "/registry", icon: BookOpen, label: "Registry", feature: "forge:registry" },
  { to: "/decisions", icon: Scale, label: "Decisions", feature: "forge:tickets" },
  { to: "/budget", icon: Wallet, label: "Budget", feature: "forge:budget" },
  {
    to: "/agents",
    icon: Bot,
    label: "Agents",
    feature: "forge:agents",
    requiresWrite: true,
  },
];

// Admin navigation items (operations/management)
const adminNavItems: Array<NavItem> = [
  { to: "/admin/users", icon: Users, label: "Users", feature: "admin:users" },
  {
    to: "/admin/settings",
    icon: Settings,
    label: "Settings",
    feature: "admin:settings",
  },
];

export function SideNav() {
  const location = useLocation();
  const { canAccess, canAccessForge, canAccessAdmin, isReadOnly } =
    useAdminAuth();

  // Filter nav items based on user permissions
  const filterNavItems = (items: Array<NavItem>): Array<NavItem> => {
    return items.filter((item) => {
      // If no feature required, always show
      if (!item.feature) return true;

      // Check feature access
      if (!canAccess(item.feature)) return false;

      // Check write requirement
      if (item.requiresWrite && isReadOnly) return false;

      return true;
    });
  };

  // Get visible nav items based on permissions
  const visibleForgeItems = canAccessForge ? filterNavItems(forgeNavItems) : [];
  const visibleAdminItems = canAccessAdmin ? filterNavItems(adminNavItems) : [];

  return (
    <nav className="fixed left-0 top-0 z-50 flex h-screen w-[60px] flex-col items-center border-r border-white/10 bg-[#0f172a] py-4">
      {/* Logo */}
      <Link
        to="/"
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors"
      >
        <Zap className="h-5 w-5 text-white" />
      </Link>

      {/* Navigation Items */}
      <div className="flex flex-1 flex-col items-center gap-2">
        {/* Forge Section */}
        {visibleForgeItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-violet-600/20 text-violet-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />

              {/* Tooltip */}
              <span className="absolute left-full ml-2 hidden rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-white group-hover:block whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Divider between Forge and Admin */}
        {visibleForgeItems.length > 0 && visibleAdminItems.length > 0 && (
          <div className="my-2 h-px w-6 bg-white/10" />
        )}

        {/* Admin Section */}
        {visibleAdminItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-amber-600/20 text-amber-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />

              {/* Tooltip */}
              <span className="absolute left-full ml-2 hidden rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-white group-hover:block whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col items-center gap-2">
        {canAccess("admin:settings") && (
          <Link
            to={"/settings" as string}
            className={clsx(
              "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              location.pathname === "/settings"
                ? "bg-violet-600/20 text-violet-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Settings className="h-5 w-5" />

            {/* Tooltip */}
            <span className="absolute left-full ml-2 hidden rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-white group-hover:block whitespace-nowrap">
              Settings
            </span>
          </Link>
        )}

        <div className="mt-2">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        </div>
      </div>
    </nav>
  );
}
