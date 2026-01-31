// apps/admin/src/components/foundry/releases-view.tsx
import { useState } from "react";
import { Layers, Loader2, Plus } from "lucide-react";
import { ReleaseCard } from "./release-card";
import { ReleaseModal } from "./release-modal";
import type { ForgeMilestone } from "@axori/db/types";
import type { ReleaseFormData } from "./release-modal";
import {
  useActivateRelease,
  useCreateMilestone,
  useDeleteMilestone,
  useMilestones,
  useUpdateMilestone,
} from "@/hooks/api/use-milestones";

export function ReleasesView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<ForgeMilestone | null>(null);

  const { data: releases, isLoading } = useMilestones();

  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();
  const activateRelease = useActivateRelease();

  // Find active release
  const activeRelease = releases?.find((r) => r.isActive);

  // Handlers
  const handleOpenModal = (release?: ForgeMilestone) => {
    setEditingRelease(release || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRelease(null);
  };

  const handleSave = (data: ReleaseFormData) => {
    if (editingRelease) {
      updateMilestone.mutate(
        { id: editingRelease.id, ...data },
        { onSuccess: handleCloseModal }
      );
    } else {
      createMilestone.mutate(data, { onSuccess: handleCloseModal });
    }
  };

  const handleDelete = (id: string) => {
    deleteMilestone.mutate(id);
  };

  const handleActivate = (id: string) => {
    activateRelease.mutate(id);
  };

  // Sort releases: active first, then by target date
  const sortedReleases = [...(releases || [])].sort((a, b) => {
    if (a.isActive) return -1;
    if (b.isActive) return 1;
    if (!a.targetDate && !b.targetDate) return 0;
    if (!a.targetDate) return 1;
    if (!b.targetDate) return -1;
    return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading releases...</span>
        </div>
      </div>
    );
  }

  if (!releases || releases.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Layers className="h-12 w-12 text-amber-500/30 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No releases yet
          </h3>
          <p className="text-sm text-slate-400 mb-6 max-w-md">
            Create releases to track your product roadmap. Each release represents
            a milestone like MVP, Alpha, Beta, or a versioned release.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create First Release
          </button>
        </div>

        <ReleaseModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          release={editingRelease}
          isPending={createMilestone.isPending || updateMilestone.isPending}
        />
      </>
    );
  }

  return (
    <>
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Releases
          </h3>
          <p className="text-sm text-slate-400">
            {activeRelease
              ? `Active: ${activeRelease.name}${activeRelease.version ? ` (${activeRelease.version})` : ""}`
              : "No active release set"}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Release
        </button>
      </div>

      {/* Release Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedReleases.map((release) => (
          <ReleaseCard
            key={release.id}
            release={release}
            isActive={release.isActive || false}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
            onActivate={handleActivate}
          />
        ))}
      </div>

      {/* Modal */}
      <ReleaseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        release={editingRelease}
        isPending={createMilestone.isPending || updateMilestone.isPending}
      />
    </>
  );
}
