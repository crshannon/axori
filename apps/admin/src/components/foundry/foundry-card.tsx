// apps/admin/src/components/foundry/foundry-card.tsx
import { clsx } from "clsx";
import * as Icons from "lucide-react";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ForgeFeature, ForgeFoundry } from "@axori/db/types";

interface FoundryCardProps {
  foundry: ForgeFoundry;
  features: Array<ForgeFeature>;
  onEdit: (foundry: ForgeFoundry) => void;
  onDelete: (id: string) => void;
  onAddFeature: (foundryId: string) => void;
  onEditFeature: (feature: ForgeFeature) => void;
}

export function FoundryCard({
  foundry,
  features,
  onEdit,
  onDelete,
  onAddFeature,
  onEditFeature,
}: FoundryCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Get icon component by name
  const getIcon = (iconName: string | null) => {
    if (!iconName) return Icons.Briefcase;
    const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
    return IconComponent || Icons.Briefcase;
  };

  const FoundryIcon = getIcon(foundry.icon);

  return (
    <div
      className={clsx(
        "group relative rounded-xl border p-5 transition-all",
        "border-white/10 bg-white/5 hover:border-amber-500/30"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${foundry.color}20` }}
          >
            <FoundryIcon
              className="h-5 w-5"
              style={{ color: foundry.color || "#f59e0b" }}
            />
          </div>
          <div>
            <h3 className="font-semibold text-white">{foundry.name}</h3>
            {foundry.description && (
              <p className="text-xs text-slate-400 line-clamp-1">
                {foundry.description}
              </p>
            )}
          </div>
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
                    onEdit(foundry);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this foundry? All features will be unassigned.")) {
                      onDelete(foundry.id);
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

      {/* Features */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Features ({features.length})
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {features.map((feature) => {
            const FeatureIcon = getIcon(feature.icon);
            return (
              <button
                key={feature.id}
                onClick={() => onEditFeature(feature)}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white",
                  feature.status === "deprecated" && "opacity-50"
                )}
              >
                <FeatureIcon className="h-3 w-3" style={{ color: feature.color || "#94a3b8" }} />
                {feature.name}
                {feature.status === "deprecated" && (
                  <span className="text-slate-500">(deprecated)</span>
                )}
              </button>
            );
          })}

          {/* Add Feature Button */}
          <button
            onClick={() => onAddFeature(foundry.id)}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              "border border-dashed border-white/20 text-slate-400 hover:border-amber-500/50 hover:text-amber-400"
            )}
          >
            <Plus className="h-3 w-3" />
            Add Feature
          </button>
        </div>
      </div>
    </div>
  );
}
