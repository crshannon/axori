// apps/admin/src/components/decisions/decision-modal.tsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import type { ForgeDecision } from "@axori/db/types";

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DecisionFormData) => void;
  decision?: ForgeDecision | null;
  isPending?: boolean;
}

export interface DecisionFormData {
  decision: string;
  context: string | null;
  category: ForgeDecision["category"];
  scope: Array<string> | null;
}

const CATEGORIES = [
  { value: "code_standards", label: "Code Standards" },
  { value: "architecture", label: "Architecture" },
  { value: "testing", label: "Testing" },
  { value: "design", label: "Design" },
  { value: "process", label: "Process" },
  { value: "tooling", label: "Tooling" },
  { value: "product", label: "Product" },
  { value: "performance", label: "Performance" },
] as const;

export function DecisionModal({
  isOpen,
  onClose,
  onSave,
  decision,
  isPending,
}: DecisionModalProps) {
  const [decisionText, setDecisionText] = useState("");
  const [context, setContext] = useState("");
  const [category, setCategory] = useState<ForgeDecision["category"]>("code_standards");
  const [scopeInput, setScopeInput] = useState("");
  const [scope, setScope] = useState<Array<string>>([]);

  // Reset form when modal opens/closes or decision changes
  useEffect(() => {
    if (isOpen && decision) {
      setDecisionText(decision.decision);
      setContext(decision.context || "");
      setCategory(decision.category);
      setScope(decision.scope || []);
    } else if (isOpen) {
      setDecisionText("");
      setContext("");
      setCategory("code_standards");
      setScope([]);
    }
    setScopeInput("");
  }, [isOpen, decision]);

  const handleAddScope = () => {
    const tag = scopeInput.trim().toLowerCase();
    if (tag && !scope.includes(tag)) {
      setScope([...scope, tag]);
    }
    setScopeInput("");
  };

  const handleRemoveScope = (tag: string) => {
    setScope(scope.filter((t) => t !== tag));
  };

  const handleSubmit = () => {
    if (!decisionText.trim()) return;

    onSave({
      decision: decisionText.trim(),
      context: context.trim() || null,
      category,
      scope: scope.length > 0 ? scope : null,
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
            {decision ? "Edit Decision" : "Capture Decision"}
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
          {/* Decision */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Decision *
            </label>
            <textarea
              value={decisionText}
              onChange={(e) => setDecisionText(e.target.value)}
              placeholder="Always use Zod for API validation"
              rows={3}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
          </div>

          {/* Context */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Context (why?)
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Had runtime type errors in production..."
              rows={2}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ForgeDecision["category"])}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-slate-900">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Scope Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Scope Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={scopeInput}
                onChange={(e) => setScopeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddScope();
                  }
                }}
                placeholder="api, validation, hooks..."
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
              <button
                type="button"
                onClick={handleAddScope}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
              >
                Add
              </button>
            </div>
            {scope.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {scope.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-violet-500/20 px-2 py-1 text-xs text-violet-300"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveScope(tag)}
                      className="hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
            disabled={!decisionText.trim() || isPending}
            className={clsx(
              "rounded-xl px-4 py-2 text-sm font-medium transition-all",
              "bg-violet-600 hover:bg-violet-500 text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isPending ? "Saving..." : decision ? "Save Changes" : "Save Decision"}
          </button>
        </div>
      </div>
    </div>
  );
}
