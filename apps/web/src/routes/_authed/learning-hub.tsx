import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { GraduationCap, BookOpen, Search } from "lucide-react";
import { PageHeader } from "@/components/layouts/PageHeader";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";

export const Route = createFileRoute("/_authed/learning-hub")({
  component: LearningHubLayout,
});

function LearningHubLayout() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const location = useLocation();

  const tabs = [
    { path: "/learning-hub", label: "Home", icon: GraduationCap, exact: true },
    { path: "/learning-hub/glossary", label: "Glossary", icon: BookOpen },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <main className="flex-grow flex flex-col overflow-y-auto max-h-screen">
      <PageHeader
        title="Learning Hub"
        rightContent={
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search terms, articles..."
                className={cn(
                  "pl-12 pr-6 py-3 rounded-full text-xs font-bold border transition-all w-72 outline-none",
                  isDark
                    ? "bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-[#E8FF4D]/30"
                    : "bg-slate-100 border-slate-200 text-slate-900 focus:bg-white focus:shadow-lg focus:border-violet-300 shadow-inner"
                )}
              />
            </div>
          </div>
        }
      />

      {/* Tab Navigation */}
      <div
        className={cn(
          "border-b px-6",
          isDark ? "border-white/10" : "border-slate-200"
        )}
      >
        <nav className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path, tab.exact);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all",
                  active
                    ? isDark
                      ? "border-[#E8FF4D] text-[#E8FF4D]"
                      : "border-violet-600 text-violet-600"
                    : isDark
                      ? "border-transparent text-white/60 hover:text-white"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                )}
              >
                <Icon size={16} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Route Content */}
      <div className="flex-grow overflow-y-auto">
        <Outlet />
      </div>
    </main>
  );
}
