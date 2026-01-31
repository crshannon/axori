// apps/admin/src/components/foundry/release-card.tsx
import { clsx } from "clsx";
import { Calendar, MoreVertical, Pencil, Power, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ForgeMilestone } from "@axori/db/types";

interface ReleaseCardProps {
  release: ForgeMilestone;
  isActive: boolean;
  onEdit: (release: ForgeMilestone) => void;
  onDelete: (id: string) => void;
  onActivate: (id: string) => void;
}

export function ReleaseCard({
  release,
  isActive,
  onEdit,
  onDelete,
  onActivate,
}: ReleaseCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Calculate days until target date
  const daysRemaining = release.targetDate
    ? Math.ceil(
        (new Date(release.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  // Format target date
  const formattedDate = release.targetDate
    ? new Date(release.targetDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      className={clsx(
        "group relative rounded-xl border p-5 transition-all",
        isActive
          ? "border-amber-500/50 bg-amber-500/5"
          : "border-white/10 bg-white/5 hover:border-white/20"
      )}
    >
      {/* Active Indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">{release.name}</h3>
            {release.version && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                {release.version}
              </span>
            )}
            {isActive && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Active
              </span>
            )}
          </div>
          {release.description && (
            <p className="text-xs text-slate-400 line-clamp-2">
              {release.description}
            </p>
          )}
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-white/10 bg-slate-900 py-1 shadow-xl">
                <button
                  onClick={() => {
                    onEdit(release);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                {!isActive && (
                  <button
                    onClick={() => {
                      onActivate(release.id);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10"
                  >
                    <Power className="h-4 w-4" />
                    Set Active
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm("Delete this release?")) {
                      onDelete(release.id);
                    }
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Target Date */}
      {formattedDate && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span className="text-slate-400">{formattedDate}</span>
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

      {/* Progress Placeholder - will be enhanced when epics are connected */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Progress</span>
          <span className="text-slate-400">--</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
            style={{ width: "0%" }}
          />
        </div>
      </div>

      {/* Stats Placeholder */}
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
        <span>0 epics</span>
        <span>0 tickets</span>
      </div>
    </div>
  );
}
