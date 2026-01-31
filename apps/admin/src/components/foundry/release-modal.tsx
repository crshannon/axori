// apps/admin/src/components/foundry/release-modal.tsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import type { ForgeMilestone } from "@axori/db/types";

interface ReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ReleaseFormData) => void;
  release?: ForgeMilestone | null;
  isPending?: boolean;
}

export interface ReleaseFormData {
  name: string;
  description: string | null;
  version: string | null;
  targetDate: string | null;
}

// Semver validation pattern
const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;

export function ReleaseModal({
  isOpen,
  onClose,
  onSave,
  release,
  isPending,
}: ReleaseModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [versionError, setVersionError] = useState<string | null>(null);

  // Reset form when modal opens/closes or release changes
  useEffect(() => {
    if (isOpen && release) {
      setName(release.name);
      setDescription(release.description || "");
      setVersion(release.version || "");
      setTargetDate(
        release.targetDate
          ? new Date(release.targetDate).toISOString().split("T")[0]
          : ""
      );
    } else if (isOpen) {
      setName("");
      setDescription("");
      setVersion("");
      setTargetDate("");
    }
    setVersionError(null);
  }, [isOpen, release]);

  const validateVersion = (v: string) => {
    if (!v) return true; // Empty is valid
    return SEMVER_REGEX.test(v);
  };

  const handleVersionChange = (v: string) => {
    setVersion(v);
    if (v && !validateVersion(v)) {
      setVersionError("Version must be semver format (e.g., 0.1.0, 1.0.0-alpha)");
    } else {
      setVersionError(null);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (version && !validateVersion(version)) return;

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      version: version.trim() || null,
      targetDate: targetDate || null,
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
            {release ? "Edit Release" : "Create Release"}
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
              placeholder="MVP, Alpha, Beta, v1.0, etc."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>

          {/* Version */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Version (semver)
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => handleVersionChange(e.target.value)}
              placeholder="0.1.0, 1.0.0-alpha, etc."
              className={clsx(
                "w-full rounded-xl bg-white/5 border px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-1",
                versionError
                  ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50"
                  : "border-white/10 focus:border-amber-500/50 focus:ring-amber-500/50"
              )}
            />
            {versionError && (
              <p className="mt-1 text-xs text-red-400">{versionError}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's included in this release?"
              rows={2}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Target Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
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
            disabled={!name.trim() || !!versionError || isPending}
            className={clsx(
              "rounded-xl px-4 py-2 text-sm font-medium transition-all",
              "bg-amber-600 hover:bg-amber-500 text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isPending ? "Saving..." : release ? "Save Changes" : "Create Release"}
          </button>
        </div>
      </div>
    </div>
  );
}
