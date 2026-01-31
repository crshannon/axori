// apps/admin/src/routes/_authed/registry.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Boxes, Loader2, ScanSearch, Search } from "lucide-react";
import type { ForgeRegistry } from "@axori/db/types";
import type { RegistryFormData } from "@/components/registry/registry-modal";
import {
  useDeleteRegistryItem,
  useRegistry,
  useScanRegistry,
  useUpdateRegistryItem,
} from "@/hooks/api/use-registry";
import { RegistryCard } from "@/components/registry/registry-card";
import { RegistryModal } from "@/components/registry/registry-modal";

export const Route = createFileRoute("/_authed/registry")({
  component: RegistryPage,
});

const TYPES = [
  { value: "", label: "All Types" },
  { value: "component", label: "Component" },
  { value: "hook", label: "Hook" },
  { value: "utility", label: "Utility" },
  { value: "api", label: "API" },
  { value: "table", label: "Table" },
  { value: "integration", label: "Integration" },
] as const;

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "deprecated", label: "Deprecated" },
  { value: "planned", label: "Planned" },
] as const;

type RegistryType = ForgeRegistry["type"];
type RegistryStatus = NonNullable<ForgeRegistry["status"]>;

function RegistryPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<RegistryType | "">("");
  const [statusFilter, setStatusFilter] = useState<RegistryStatus | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ForgeRegistry | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");

  const { data: registryItems, isLoading } = useRegistry({
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const updateRegistryItem = useUpdateRegistryItem();
  const deleteRegistryItem = useDeleteRegistryItem();
  const scanRegistry = useScanRegistry();

  const handleViewItem = (item: ForgeRegistry) => {
    setSelectedItem(item);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleSave = (data: RegistryFormData) => {
    if (selectedItem) {
      updateRegistryItem.mutate(
        { id: selectedItem.id, ...data },
        { onSuccess: handleCloseModal }
      );
    }
  };

  const handleScanCodebase = () => {
    scanRegistry.mutate({});
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600/20">
              <Boxes className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Registry</h1>
              <p className="text-sm text-slate-400">
                Codebase components, hooks, and utilities
              </p>
            </div>
          </div>
          <button
            onClick={handleScanCodebase}
            disabled={scanRegistry.isPending}
            className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scanRegistry.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ScanSearch className="h-4 w-4" />
            )}
            {scanRegistry.isPending ? "Scanning..." : "Scan Codebase"}
          </button>
        </div>

        {/* Scan result message */}
        {scanRegistry.isSuccess && (
          <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
            Scan complete: Found {scanRegistry.data.itemsFound} items
            {scanRegistry.data.created !== undefined &&
              `, ${scanRegistry.data.created} created`}
            {scanRegistry.data.updated !== undefined &&
              `, ${scanRegistry.data.updated} updated`}
          </div>
        )}

        {scanRegistry.isError && (
          <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            Scan failed: {scanRegistry.error.message}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none"
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as RegistryType | "")}
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
        >
          {TYPES.map((type) => (
            <option key={type.value} value={type.value} className="bg-slate-900">
              {type.label}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as RegistryStatus | "")
          }
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
        >
          {STATUSES.map((status) => (
            <option
              key={status.value}
              value={status.value}
              className="bg-slate-900"
            >
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading registry items...</span>
          </div>
        </div>
      ) : registryItems && registryItems.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {registryItems.map((item) => (
            <RegistryCard
              key={item.id}
              item={item}
              onView={handleViewItem}
              onDelete={(id) => deleteRegistryItem.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Boxes className="h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No registry items
          </h3>
          <p className="text-sm text-slate-400 mb-4 max-w-md">
            {search || typeFilter || statusFilter
              ? "No items match your current filters. Try adjusting your search criteria."
              : "Scan your codebase to discover components, hooks, and utilities. The registry helps agents understand your codebase structure."}
          </p>
          {!search && !typeFilter && !statusFilter && (
            <button
              onClick={handleScanCodebase}
              disabled={scanRegistry.isPending}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanRegistry.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ScanSearch className="h-4 w-4" />
              )}
              {scanRegistry.isPending ? "Scanning..." : "Scan Codebase"}
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      <RegistryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        item={selectedItem}
        isPending={updateRegistryItem.isPending}
        mode={modalMode}
      />
    </div>
  );
}
