// apps/admin/src/components/foundry/foundries-view.tsx
import { useState } from "react";
import { Building2, Loader2, Plus } from "lucide-react";
import { FoundryCard } from "./foundry-card";
import { FoundryModal } from "./foundry-modal";
import { FeatureModal } from "./feature-modal";
import type { ForgeFeature, ForgeFoundry } from "@axori/db/types";
import type { FeatureFormData } from "./feature-modal";
import type { FoundryFormData } from "./foundry-modal";
import {
  useCreateFeature,
  useDeleteFeature,
  useFeatures,
  useUpdateFeature,
} from "@/hooks/api/use-features";
import {
  useCreateFoundry,
  useDeleteFoundry,
  useFoundries,
  useUpdateFoundry,
} from "@/hooks/api/use-foundries";

export function FoundriesView() {
  const [isFoundryModalOpen, setIsFoundryModalOpen] = useState(false);
  const [editingFoundry, setEditingFoundry] = useState<ForgeFoundry | null>(null);

  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<ForgeFeature | null>(null);
  const [defaultFoundryId, setDefaultFoundryId] = useState<string | null>(null);

  const { data: foundries, isLoading: foundriesLoading } = useFoundries();
  const { data: features, isLoading: featuresLoading } = useFeatures();

  const createFoundry = useCreateFoundry();
  const updateFoundry = useUpdateFoundry();
  const deleteFoundry = useDeleteFoundry();

  const createFeature = useCreateFeature();
  const updateFeature = useUpdateFeature();
  const deleteFeature = useDeleteFeature();

  const isLoading = foundriesLoading || featuresLoading;

  // Foundry handlers
  const handleOpenFoundryModal = (foundry?: ForgeFoundry) => {
    setEditingFoundry(foundry || null);
    setIsFoundryModalOpen(true);
  };

  const handleCloseFoundryModal = () => {
    setIsFoundryModalOpen(false);
    setEditingFoundry(null);
  };

  const handleSaveFoundry = (data: FoundryFormData) => {
    if (editingFoundry) {
      updateFoundry.mutate(
        { id: editingFoundry.id, ...data },
        { onSuccess: handleCloseFoundryModal }
      );
    } else {
      createFoundry.mutate(data, { onSuccess: handleCloseFoundryModal });
    }
  };

  const handleDeleteFoundry = (id: string) => {
    deleteFoundry.mutate(id);
  };

  // Feature handlers
  const handleOpenFeatureModal = (feature?: ForgeFeature, foundryId?: string) => {
    setEditingFeature(feature || null);
    setDefaultFoundryId(foundryId || null);
    setIsFeatureModalOpen(true);
  };

  const handleCloseFeatureModal = () => {
    setIsFeatureModalOpen(false);
    setEditingFeature(null);
    setDefaultFoundryId(null);
  };

  const handleSaveFeature = (data: FeatureFormData) => {
    if (editingFeature) {
      updateFeature.mutate(
        { id: editingFeature.id, ...data },
        { onSuccess: handleCloseFeatureModal }
      );
    } else {
      createFeature.mutate(data, { onSuccess: handleCloseFeatureModal });
    }
  };

  // Group features by foundry
  const featuresByFoundry = (features || []).reduce<Record<string, Array<ForgeFeature>>>(
    (acc, feature) => {
      const key = feature.foundryId || "unassigned";
      if (!acc[key]) acc[key] = [];
      acc[key].push(feature);
      return acc;
    },
    {}
  );

  // Sort foundries by sortOrder
  const sortedFoundries = [...(foundries || [])].sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading foundries...</span>
        </div>
      </div>
    );
  }

  if (!foundries || foundries.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-12 w-12 text-amber-500/30 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No foundries yet
          </h3>
          <p className="text-sm text-slate-400 mb-6 max-w-md">
            Create foundries to organize your work by business area. Add features
            to track capabilities within each foundry.
          </p>
          <button
            onClick={() => handleOpenFoundryModal()}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create First Foundry
          </button>
        </div>

        <FoundryModal
          isOpen={isFoundryModalOpen}
          onClose={handleCloseFoundryModal}
          onSave={handleSaveFoundry}
          foundry={editingFoundry}
          isPending={createFoundry.isPending || updateFoundry.isPending}
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
            Business Areas
          </h3>
          <p className="text-sm text-slate-400">
            Organize your roadmap by foundry
          </p>
        </div>
        <button
          onClick={() => handleOpenFoundryModal()}
          className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Foundry
        </button>
      </div>

      {/* Foundry Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedFoundries.map((foundry) => (
          <FoundryCard
            key={foundry.id}
            foundry={foundry}
            features={featuresByFoundry[foundry.id] || []}
            onEdit={handleOpenFoundryModal}
            onDelete={handleDeleteFoundry}
            onAddFeature={(foundryId) => handleOpenFeatureModal(undefined, foundryId)}
            onEditFeature={(feature) => handleOpenFeatureModal(feature)}
          />
        ))}
      </div>

      {/* Unassigned Features */}
      {featuresByFoundry["unassigned"]?.length > 0 && (
        <div className="mt-8">
          <h4 className="text-sm font-medium text-slate-400 mb-3">
            Unassigned Features ({featuresByFoundry["unassigned"].length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {featuresByFoundry["unassigned"].map((feature) => (
              <button
                key={feature.id}
                onClick={() => handleOpenFeatureModal(feature)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                {feature.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <FoundryModal
        isOpen={isFoundryModalOpen}
        onClose={handleCloseFoundryModal}
        onSave={handleSaveFoundry}
        foundry={editingFoundry}
        isPending={createFoundry.isPending || updateFoundry.isPending}
      />

      <FeatureModal
        isOpen={isFeatureModalOpen}
        onClose={handleCloseFeatureModal}
        onSave={handleSaveFeature}
        feature={editingFeature}
        foundries={foundries || []}
        defaultFoundryId={defaultFoundryId}
        isPending={createFeature.isPending || updateFeature.isPending}
      />
    </>
  );
}
