// apps/admin/src/components/foundry/active-release-widget.tsx
import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Flame, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { useActiveRelease } from "@/hooks/api/use-milestones";

export function ActiveReleaseWidget() {
  const { data: activeRelease, isLoading } = useActiveRelease();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
            <Flame className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Active Release</h3>
            <p className="text-xs text-slate-400">Current roadmap focus</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (!activeRelease) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
            <Flame className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Active Release</h3>
            <p className="text-xs text-slate-400">Current roadmap focus</p>
          </div>
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-slate-400 mb-4">
            No active release set. Go to Foundry to activate a release.
          </p>
          <Link
            to="/foundry"
            search={{ tab: "releases" }}
            className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            Set Active Release
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Calculate days remaining
  const daysRemaining = activeRelease.targetDate
    ? Math.ceil(
        (new Date(activeRelease.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  // Format target date
  const formattedDate = activeRelease.targetDate
    ? new Date(activeRelease.targetDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const stats = activeRelease.stats;
  const progress = stats?.progress || 0;

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
            <Flame className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Active Release</h3>
            <p className="text-xs text-slate-400">Current roadmap focus</p>
          </div>
        </div>
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
        </span>
      </div>

      {/* Release Info */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-bold text-white">{activeRelease.name}</span>
          {activeRelease.version && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
              {activeRelease.version}
            </span>
          )}
        </div>
        {formattedDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span className="text-slate-400">Target: {formattedDate}</span>
            {daysRemaining !== null && (
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  daysRemaining < 0
                    ? "bg-red-500/20 text-red-400"
                    : daysRemaining <= 7
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-slate-500/20 text-slate-400"
                )}
              >
                {daysRemaining < 0
                  ? `${Math.abs(daysRemaining)} days overdue`
                  : daysRemaining === 0
                    ? "Due today"
                    : `${daysRemaining} days`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-400">Progress</span>
          <span className="text-amber-400 font-medium">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
        <span>{stats?.totalEpics || 0} epics</span>
        <span>{stats?.totalTickets || 0} tickets</span>
        {(stats?.blockedTickets || 0) > 0 && (
          <span className="text-red-400">{stats.blockedTickets} blocked</span>
        )}
      </div>

      {/* Link */}
      <Link
        to="/foundry"
        className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
      >
        View Roadmap
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
