// apps/admin/src/components/registry/registry-card.tsx
import { clsx } from "clsx";
import { Eye, FileCode, MoreVertical, Package, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ForgeRegistry } from "@axori/db/types";

interface RegistryCardProps {
  item: ForgeRegistry;
  onView: (item: ForgeRegistry) => void;
  onDelete: (id: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  component: "bg-blue-500/20 text-blue-400",
  hook: "bg-purple-500/20 text-purple-400",
  utility: "bg-green-500/20 text-green-400",
  api: "bg-amber-500/20 text-amber-400",
  table: "bg-cyan-500/20 text-cyan-400",
  integration: "bg-pink-500/20 text-pink-400",
};

const TYPE_LABELS: Record<string, string> = {
  component: "Component",
  hook: "Hook",
  utility: "Utility",
  api: "API",
  table: "Table",
  integration: "Integration",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  deprecated: "bg-red-500/20 text-red-400",
  planned: "bg-slate-500/20 text-slate-400",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  deprecated: "Deprecated",
  planned: "Planned",
};

export function RegistryCard({ item, onView, onDelete }: RegistryCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const exportsCount = item.exports?.length ?? 0;
  const dependenciesCount = item.dependencies?.length ?? 0;

  return (
    <div
      className={clsx(
        "group relative rounded-xl border p-4 transition-all cursor-pointer",
        item.status === "deprecated"
          ? "border-white/5 bg-white/[0.02] opacity-60"
          : "border-white/10 bg-white/5 hover:border-white/20"
      )}
      onClick={() => onView(item)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              TYPE_COLORS[item.type] || "bg-slate-500/20 text-slate-400"
            )}
          >
            {TYPE_LABELS[item.type] || item.type}
          </span>
          {item.status && item.status !== "active" && (
            <span
              className={clsx(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                STATUS_COLORS[item.status] || "bg-slate-500/20 text-slate-400"
              )}
            >
              {STATUS_LABELS[item.status] || item.status}
            </span>
          )}
        </div>

        {/* Actions Menu */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
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
                    onView(item);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this registry item?")) {
                      onDelete(item.id);
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

      {/* Name */}
      <p className="text-sm font-medium text-white mb-1">{item.name}</p>

      {/* File Path */}
      <div className="flex items-center gap-1.5 mb-3">
        <FileCode className="h-3 w-3 text-slate-500" />
        <p className="text-xs text-slate-400 font-mono truncate">
          {item.filePath}
        </p>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-xs text-slate-400 mb-3 line-clamp-2">
          {item.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mb-3 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Package className="h-3 w-3" />
          <span>{exportsCount} exports</span>
        </div>
        <div className="flex items-center gap-1">
          <span>{dependenciesCount} deps</span>
        </div>
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-slate-700/50 px-1.5 py-0.5 text-xs text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
