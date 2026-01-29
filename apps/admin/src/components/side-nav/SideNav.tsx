import { Link, useLocation } from "@tanstack/react-router";
import { UserButton } from "@clerk/clerk-react";
import {
  BookOpen,
  Flag,
  Kanban,
  LayoutDashboard,
  Scale,
  Settings,
  Wallet,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/board", icon: Kanban, label: "Board" },
  { to: "/milestones", icon: Flag, label: "Milestones" },
  { to: "/registry", icon: BookOpen, label: "Registry" },
  { to: "/decisions", icon: Scale, label: "Decisions" },
  { to: "/budget", icon: Wallet, label: "Budget" },
];

export function SideNav() {
  const location = useLocation();

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
        {navItems.map((item) => {
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
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col items-center gap-2">
        <Link
          to={"/settings" as string}
          className={clsx(
            "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
            location.pathname === "/settings"
              ? "bg-violet-600/20 text-violet-400"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          )}
        >
          <Settings className="h-5 w-5" />
        </Link>

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
