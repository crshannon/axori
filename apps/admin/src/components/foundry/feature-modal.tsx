// apps/admin/src/components/foundry/feature-modal.tsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import type { ForgeFeature, ForgeFoundry } from "@axori/db/types";

interface FeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FeatureFormData) => void;
  feature?: ForgeFeature | null;
  foundries: Array<ForgeFoundry>;
  defaultFoundryId?: string | null;
  isPending?: boolean;
}

export interface FeatureFormData {
  name: string;
  description: string | null;
  foundryId: string | null;
  color: string | null;
  icon: string | null;
  status: "active" | "deprecated" | "planned";
  owner: string | null;
  sortOrder: number;
}

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "planned", label: "Planned" },
  { value: "deprecated", label: "Deprecated" },
] as const;

const ICONS = [
  { value: "Box", label: "Box" },
  { value: "Shield", label: "Shield" },
  { value: "Lock", label: "Lock" },
  { value: "CreditCard", label: "CreditCard" },
  { value: "LayoutDashboard", label: "Dashboard" },
  { value: "FileText", label: "FileText" },
  { value: "Bell", label: "Bell" },
  { value: "Mail", label: "Mail" },
  { value: "Settings", label: "Settings" },
  { value: "Search", label: "Search" },
  { value: "Database", label: "Database" },
  { value: "Globe", label: "Globe" },
  { value: "Workflow", label: "Workflow" },
  { value: "GitBranch", label: "Git" },
  { value: "Palette", label: "Palette" },
];

const COLORS = [
  { value: "#94a3b8", label: "Default" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#10b981", label: "Emerald" },
  { value: "#f43f5e", label: "Rose" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#ec4899", label: "Pink" },
];

export function FeatureModal({
  isOpen,
  onClose,
  onSave,
  feature,
  foundries,
  defaultFoundryId,
  isPending,
}: FeatureModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [foundryId, setFoundryId] = useState<string>("");
  const [color, setColor] = useState<string>("#94a3b8");
  const [icon, setIcon] = useState<string>("Box");
  const [status, setStatus] = useState<"active" | "deprecated" | "planned">("active");
  const [owner, setOwner] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  // Reset form when modal opens/closes or feature changes
  useEffect(() => {
    if (isOpen && feature) {
      setName(feature.name);
      setDescription(feature.description || "");
      setFoundryId(feature.foundryId || "");
      setColor(feature.color || "#94a3b8");
      setIcon(feature.icon || "Box");
      setStatus((feature.status as "active" | "deprecated" | "planned") || "active");
      setOwner(feature.owner || "");
      setSortOrder(feature.sortOrder || 0);
    } else if (isOpen) {
      setName("");
      setDescription("");
      setFoundryId(defaultFoundryId || "");
      setColor("#94a3b8");
      setIcon("Box");
      setStatus("active");
      setOwner("");
      setSortOrder(0);
    }
  }, [isOpen, feature, defaultFoundryId]);

  const handleSubmit = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      foundryId: foundryId || null,
      color: color || null,
      icon: icon || null,
      status,
      owner: owner.trim() || null,
      sortOrder,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            {feature ? "Edit Feature" : "Create Feature"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Authentication, Dashboard, etc."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this feature do?"
              rows={2}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>

          {/* Foundry */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Foundry
            </label>
            <select
              value={foundryId}
              onChange={(e) => setFoundryId(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            >
              <option value="" className="bg-slate-900">
                No Foundry
              </option>
              {foundries.map((f) => (
                <option key={f.id} value={f.id} className="bg-slate-900">
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "deprecated" | "planned")}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value} className="bg-slate-900">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Owner */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Owner
            </label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Person responsible for this feature"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={clsx(
                    "h-8 w-8 rounded-lg transition-all",
                    color === c.value
                      ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900"
                      : "hover:scale-110"
                  )}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Icon
            </label>
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            >
              {ICONS.map((i) => (
                <option key={i.value} value={i.value} className="bg-slate-900">
                  {i.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Sort Order
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isPending}
            className={clsx(
              "rounded-xl px-4 py-2 text-sm font-medium transition-all",
              "bg-amber-600 hover:bg-amber-500 text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isPending ? "Saving..." : feature ? "Save Changes" : "Create Feature"}
          </button>
        </div>
      </div>
    </div>
  );
}
