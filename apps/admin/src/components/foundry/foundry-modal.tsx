// apps/admin/src/components/foundry/foundry-modal.tsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import type { ForgeFoundry } from "@axori/db/types";

interface FoundryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FoundryFormData) => void;
  foundry?: ForgeFoundry | null;
  isPending?: boolean;
}

export interface FoundryFormData {
  name: string;
  description: string | null;
  color: string;
  icon: string;
  sortOrder: number;
}

const ICONS = [
  { value: "Briefcase", label: "Briefcase" },
  { value: "Code", label: "Code" },
  { value: "Megaphone", label: "Megaphone" },
  { value: "Search", label: "Search" },
  { value: "BarChart3", label: "Analytics" },
  { value: "Cpu", label: "CPU" },
  { value: "Settings", label: "Settings" },
  { value: "Shield", label: "Shield" },
  { value: "Users", label: "Users" },
  { value: "Zap", label: "Zap" },
  { value: "Layers", label: "Layers" },
  { value: "Globe", label: "Globe" },
];

const COLORS = [
  { value: "#f59e0b", label: "Amber" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#10b981", label: "Emerald" },
  { value: "#f43f5e", label: "Rose" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#ec4899", label: "Pink" },
  { value: "#64748b", label: "Slate" },
];

export function FoundryModal({
  isOpen,
  onClose,
  onSave,
  foundry,
  isPending,
}: FoundryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#f59e0b");
  const [icon, setIcon] = useState("Briefcase");
  const [sortOrder, setSortOrder] = useState(0);

  // Reset form when modal opens/closes or foundry changes
  useEffect(() => {
    if (isOpen && foundry) {
      setName(foundry.name);
      setDescription(foundry.description || "");
      setColor(foundry.color || "#f59e0b");
      setIcon(foundry.icon || "Briefcase");
      setSortOrder(foundry.sortOrder || 0);
    } else if (isOpen) {
      setName("");
      setDescription("");
      setColor("#f59e0b");
      setIcon("Briefcase");
      setSortOrder(0);
    }
  }, [isOpen, foundry]);

  const handleSubmit = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      color,
      icon,
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
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            {foundry ? "Edit Foundry" : "Create Foundry"}
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
              placeholder="Engineering, Marketing, etc."
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
              placeholder="What does this foundry cover?"
              rows={2}
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
            {isPending ? "Saving..." : foundry ? "Save Changes" : "Create Foundry"}
          </button>
        </div>
      </div>
    </div>
  );
}
