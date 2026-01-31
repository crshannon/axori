// apps/admin/src/components/registry/registry-modal.tsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import type { ForgeRegistry } from "@axori/db/types";

interface RegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RegistryFormData) => void;
  item?: ForgeRegistry | null;
  isPending?: boolean;
  mode?: "view" | "edit";
}

export interface RegistryFormData {
  name: string;
  type: ForgeRegistry["type"];
  filePath: string;
  description: string | null;
  status: NonNullable<ForgeRegistry["status"]>;
  exports: Array<string> | null;
  dependencies: Array<string> | null;
  tags: Array<string> | null;
}

const TYPES = [
  { value: "component", label: "Component" },
  { value: "hook", label: "Hook" },
  { value: "utility", label: "Utility" },
  { value: "api", label: "API" },
  { value: "table", label: "Table" },
  { value: "integration", label: "Integration" },
] as const;

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "deprecated", label: "Deprecated" },
  { value: "planned", label: "Planned" },
] as const;

export function RegistryModal({
  isOpen,
  onClose,
  onSave,
  item,
  isPending,
  mode = "edit",
}: RegistryModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ForgeRegistry["type"]>("component");
  const [filePath, setFilePath] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<NonNullable<ForgeRegistry["status"]>>("active");
  const [exportsInput, setExportsInput] = useState("");
  const [itemExports, setItemExports] = useState<Array<string>>([]);
  const [dependenciesInput, setDependenciesInput] = useState("");
  const [dependencies, setDependencies] = useState<Array<string>>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<Array<string>>([]);

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";

  // Reset form when modal opens/closes or item changes
  useEffect(() => {
    if (isOpen && item) {
      setName(item.name);
      setType(item.type);
      setFilePath(item.filePath);
      setDescription(item.description || "");
      setStatus(item.status || "active");
      setItemExports(item.exports || []);
      setDependencies(item.dependencies || []);
      setTags(item.tags || []);
    } else if (isOpen) {
      setName("");
      setType("component");
      setFilePath("");
      setDescription("");
      setStatus("active");
      setItemExports([]);
      setDependencies([]);
      setTags([]);
    }
    setExportsInput("");
    setDependenciesInput("");
    setTagsInput("");
  }, [isOpen, item]);

  const handleAddExport = () => {
    const value = exportsInput.trim();
    if (value && !itemExports.includes(value)) {
      setItemExports([...itemExports, value]);
    }
    setExportsInput("");
  };

  const handleRemoveExport = (value: string) => {
    setItemExports(itemExports.filter((e) => e !== value));
  };

  const handleAddDependency = () => {
    const value = dependenciesInput.trim();
    if (value && !dependencies.includes(value)) {
      setDependencies([...dependencies, value]);
    }
    setDependenciesInput("");
  };

  const handleRemoveDependency = (value: string) => {
    setDependencies(dependencies.filter((d) => d !== value));
  };

  const handleAddTag = () => {
    const tag = tagsInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagsInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = () => {
    if (!name.trim() || !filePath.trim()) return;

    onSave({
      name: name.trim(),
      type,
      filePath: filePath.trim(),
      description: description.trim() || null,
      status,
      exports: itemExports.length > 0 ? itemExports : null,
      dependencies: dependencies.length > 0 ? dependencies : null,
      tags: tags.length > 0 ? tags : null,
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
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            {isViewMode
              ? "Registry Item"
              : item
                ? "Edit Registry Item"
                : "Add Registry Item"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
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
            {isViewMode ? (
              <p className="text-white">{name}</p>
            ) : (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Button, useAuth, formatDate..."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
            )}
          </div>

          {/* Type & Status Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Type *
              </label>
              {isViewMode ? (
                <p className="text-white capitalize">{type}</p>
              ) : (
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ForgeRegistry["type"])}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-slate-900">
                      {t.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status *
              </label>
              {isViewMode ? (
                <p className="text-white capitalize">{status}</p>
              ) : (
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as NonNullable<ForgeRegistry["status"]>)
                  }
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value} className="bg-slate-900">
                      {s.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* File Path */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              File Path *
            </label>
            {isViewMode ? (
              <p className="text-white font-mono text-sm">{filePath}</p>
            ) : (
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="packages/ui/src/components/Button.tsx"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 font-mono text-sm focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            {isViewMode ? (
              <p className="text-slate-400">{description || "No description"}</p>
            ) : (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this item..."
                rows={2}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
            )}
          </div>

          {/* Exports */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Exports
            </label>
            {isEditMode && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={exportsInput}
                  onChange={(e) => setExportsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddExport();
                    }
                  }}
                  placeholder="Button, ButtonProps..."
                  className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
                <button
                  type="button"
                  onClick={handleAddExport}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                >
                  Add
                </button>
              </div>
            )}
            {itemExports.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {itemExports.map((exp) => (
                  <span
                    key={exp}
                    className="flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-300"
                  >
                    {exp}
                    {isEditMode && (
                      <button
                        onClick={() => handleRemoveExport(exp)}
                        aria-label={`Remove export ${exp}`}
                        className="hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              isViewMode && <p className="text-slate-500 text-sm">No exports</p>
            )}
          </div>

          {/* Dependencies */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Dependencies
            </label>
            {isEditMode && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={dependenciesInput}
                  onChange={(e) => setDependenciesInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddDependency();
                    }
                  }}
                  placeholder="clsx, react..."
                  className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
                <button
                  type="button"
                  onClick={handleAddDependency}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                >
                  Add
                </button>
              </div>
            )}
            {dependencies.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {dependencies.map((dep) => (
                  <span
                    key={dep}
                    className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-300"
                  >
                    {dep}
                    {isEditMode && (
                      <button
                        onClick={() => handleRemoveDependency(dep)}
                        aria-label={`Remove dependency ${dep}`}
                        className="hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              isViewMode && (
                <p className="text-slate-500 text-sm">No dependencies</p>
              )
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tags
            </label>
            {isEditMode && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="ui, form, auth..."
                  className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                >
                  Add
                </button>
              </div>
            )}
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-violet-500/20 px-2 py-1 text-xs text-violet-300"
                  >
                    {tag}
                    {isEditMode && (
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        aria-label={`Remove tag ${tag}`}
                        className="hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              isViewMode && <p className="text-slate-500 text-sm">No tags</p>
            )}
          </div>

          {/* Additional Info (View Mode Only) */}
          {isViewMode && item && (
            <>
              {/* Used By */}
              {item.usedBy && item.usedBy.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Used By
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {item.usedBy.map((usedByItem) => (
                      <span
                        key={usedByItem}
                        className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-300"
                      >
                        {usedByItem}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Tickets */}
              {item.relatedTickets && item.relatedTickets.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Related Tickets
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {item.relatedTickets.map((ticket) => (
                      <span
                        key={ticket}
                        className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300 font-mono"
                      >
                        {ticket}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Deprecation Info */}
              {item.status === "deprecated" && item.deprecationNotes && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Deprecation Notes
                  </label>
                  <p className="text-red-400 text-sm">{item.deprecationNotes}</p>
                </div>
              )}

              {/* Last Updated */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Last Updated
                </label>
                <p className="text-slate-400 text-sm">
                  {new Date(item.lastUpdated).toLocaleString()}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-white"
          >
            {isViewMode ? "Close" : "Cancel"}
          </button>
          {isEditMode && (
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || !filePath.trim() || isPending}
              className={clsx(
                "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                "bg-violet-600 hover:bg-violet-500 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isPending ? "Saving..." : item ? "Save Changes" : "Add Item"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
