// apps/admin/src/components/decisions/decision-card.tsx
import { clsx } from "clsx";
import { MoreVertical, Pencil, Power, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ForgeDecision } from "@axori/db/types";

interface DecisionCardProps {
  decision: ForgeDecision;
  onEdit: (decision: ForgeDecision) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  code_standards: "bg-blue-500/20 text-blue-400",
  architecture: "bg-purple-500/20 text-purple-400",
  testing: "bg-green-500/20 text-green-400",
  design: "bg-pink-500/20 text-pink-400",
  process: "bg-amber-500/20 text-amber-400",
  tooling: "bg-cyan-500/20 text-cyan-400",
  product: "bg-orange-500/20 text-orange-400",
  performance: "bg-red-500/20 text-red-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  code_standards: "Code Standards",
  architecture: "Architecture",
  testing: "Testing",
  design: "Design",
  process: "Process",
  tooling: "Tooling",
  product: "Product",
  performance: "Performance",
};

export function DecisionCard({
  decision,
  onEdit,
  onToggle,
  onDelete,
}: DecisionCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={clsx(
        "group relative rounded-xl border p-4 transition-all",
        decision.active
          ? "border-white/10 bg-white/5 hover:border-white/20"
          : "border-white/5 bg-white/[0.02] opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-500">
            {decision.identifier}
          </span>
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              CATEGORY_COLORS[decision.category] || "bg-slate-500/20 text-slate-400"
            )}
          >
            {CATEGORY_LABELS[decision.category] || decision.category}
          </span>
          {!decision.active && (
            <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-xs text-slate-500">
              Inactive
            </span>
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
                    onEdit(decision);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onToggle(decision.id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  <Power className="h-4 w-4" />
                  {decision.active ? "Disable" : "Enable"}
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this decision?")) {
                      onDelete(decision.id);
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

      {/* Decision Text */}
      <p className="text-sm text-white mb-2">{decision.decision}</p>

      {/* Context */}
      {decision.context && (
        <p className="text-xs text-slate-400 mb-3 line-clamp-2">
          {decision.context}
        </p>
      )}

      {/* Scope Tags */}
      {decision.scope && decision.scope.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {decision.scope.map((tag) => (
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
