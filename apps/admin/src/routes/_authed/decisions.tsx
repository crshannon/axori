// apps/admin/src/routes/_authed/decisions.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Scale, Search } from "lucide-react";
import type { ForgeDecision } from "@axori/db/types";
import type { DecisionFormData } from "@/components/decisions/decision-modal";
import {
  useCreateDecision,
  useDecisions,
  useDeleteDecision,
  useToggleDecision,
  useUpdateDecision,
} from "@/hooks/api/use-decisions";
import { DecisionCard } from "@/components/decisions/decision-card";
import { DecisionModal } from "@/components/decisions/decision-modal";

export const Route = createFileRoute("/_authed/decisions")({
  component: DecisionsPage,
});

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "code_standards", label: "Code Standards" },
  { value: "architecture", label: "Architecture" },
  { value: "testing", label: "Testing" },
  { value: "design", label: "Design" },
  { value: "process", label: "Process" },
  { value: "tooling", label: "Tooling" },
  { value: "product", label: "Product" },
  { value: "performance", label: "Performance" },
] as const;

type DecisionCategory = ForgeDecision["category"];

function DecisionsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<DecisionCategory | "">("");
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<ForgeDecision | null>(null);

  const { data: decisions, isLoading } = useDecisions({
    category: categoryFilter || undefined,
    active: showInactive ? undefined : true,
    search: search || undefined,
  });

  const createDecision = useCreateDecision();
  const updateDecision = useUpdateDecision();
  const toggleDecision = useToggleDecision();
  const deleteDecision = useDeleteDecision();

  const handleOpenModal = (decision?: ForgeDecision) => {
    setEditingDecision(decision || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDecision(null);
  };

  const handleSave = (data: DecisionFormData) => {
    if (editingDecision) {
      updateDecision.mutate(
        { id: editingDecision.id, ...data },
        { onSuccess: handleCloseModal }
      );
    } else {
      createDecision.mutate(data, { onSuccess: handleCloseModal });
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20">
              <Scale className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Decisions</h1>
              <p className="text-sm text-slate-400">
                Institutional memory for your codebase
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Decision
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions..."
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as DecisionCategory | "")}
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-violet-500/50 focus:outline-none"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value} className="bg-slate-900">
              {cat.label}
            </option>
          ))}
        </select>

        {/* Show Inactive Toggle */}
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-white/20 bg-white/5 text-violet-600 focus:ring-violet-500/50"
          />
          Show inactive
        </label>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">Loading decisions...</div>
        </div>
      ) : decisions && decisions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {decisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              onEdit={handleOpenModal}
              onToggle={(id) => toggleDecision.mutate(id)}
              onDelete={(id) => deleteDecision.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Scale className="h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No decisions yet
          </h3>
          <p className="text-sm text-slate-400 mb-4 max-w-md">
            Capture coding decisions, architectural choices, and conventions.
            They'll be injected into agent prompts to maintain consistency.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            <Plus className="h-4 w-4" />
            Capture Your First Decision
          </button>
        </div>
      )}

      {/* Modal */}
      <DecisionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        decision={editingDecision}
        isPending={createDecision.isPending || updateDecision.isPending}
      />
    </div>
  );
}
