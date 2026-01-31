// apps/admin/src/components/foundry/timeline-view.tsx
import { useState } from "react";
import { clsx } from "clsx";
import * as Icons from "lucide-react";
import { Calendar, Loader2, Plus } from "lucide-react";
import type { ForgeFeature, ForgeFoundry, ForgeMilestone } from "@axori/db/types";
import type { ProjectWithRelations } from "@/hooks/api/use-projects";
import { useMilestones } from "@/hooks/api/use-milestones";
import { useFoundries } from "@/hooks/api/use-foundries";
import { useFeatures } from "@/hooks/api/use-features";
import { useCreateProject, useProjects } from "@/hooks/api/use-projects";

interface EpicCellProps {
  epics: Array<ProjectWithRelations>;
  feature: ForgeFeature;
  release: ForgeMilestone;
  isActiveRelease: boolean;
  onCreateEpic: (featureId: string, milestoneId: string) => void;
}

function EpicCell({ epics, feature, release, isActiveRelease, onCreateEpic }: EpicCellProps) {
  if (epics.length === 0) {
    return (
      <button
        onClick={() => onCreateEpic(feature.id, release.id)}
        className={clsx(
          "w-full h-full min-h-[60px] rounded-lg border-2 border-dashed transition-colors",
          "border-white/10 text-slate-500 hover:border-amber-500/30 hover:text-amber-400",
          "flex items-center justify-center gap-1 text-xs"
        )}
      >
        <Plus className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {epics.map((epic) => (
        <div
          key={epic.id}
          className={clsx(
            "rounded-lg p-2 text-xs transition-colors cursor-pointer",
            isActiveRelease
              ? "bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20"
              : "bg-white/5 border border-white/10 hover:bg-white/10"
          )}
        >
          <div className="font-medium text-white truncate">{epic.name}</div>
          <div className="flex items-center justify-between mt-1 text-slate-400">
            <span>{epic.ticketCount} tickets</span>
          </div>
        </div>
      ))}
      <button
        onClick={() => onCreateEpic(feature.id, release.id)}
        className="w-full rounded-lg border border-dashed border-white/10 py-1 text-xs text-slate-500 hover:border-amber-500/30 hover:text-amber-400 transition-colors"
      >
        <Plus className="h-3 w-3 inline" />
      </button>
    </div>
  );
}

export function TimelineView() {
  const { data: milestones, isLoading: milestonesLoading } = useMilestones();
  const { data: foundries, isLoading: foundriesLoading } = useFoundries();
  const { data: features, isLoading: featuresLoading } = useFeatures();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const createProject = useCreateProject();

  const isLoading = milestonesLoading || foundriesLoading || featuresLoading || projectsLoading;

  // Sort releases by target date
  const sortedReleases = [...(milestones || [])].sort((a, b) => {
    if (a.isActive) return -1;
    if (b.isActive) return 1;
    if (!a.targetDate && !b.targetDate) return 0;
    if (!a.targetDate) return 1;
    if (!b.targetDate) return -1;
    return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
  });

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

  // Group projects (epics) by feature + milestone
  const epicsByFeatureRelease = (projects || []).reduce<Record<string, Array<ProjectWithRelations>>>(
    (acc, project) => {
      if (project.featureId && project.milestoneId) {
        const key = `${project.featureId}-${project.milestoneId}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(project);
      }
      return acc;
    },
    {}
  );

  const getIcon = (iconName: string | null) => {
    if (!iconName) return Icons.Box;
    const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
    return IconComponent || Icons.Box;
  };

  const handleCreateEpic = (featureId: string, milestoneId: string) => {
    const feature = features?.find((f) => f.id === featureId);
    const release = milestones?.find((m) => m.id === milestoneId);
    if (!feature || !release) return;

    createProject.mutate({
      name: `${feature.name} for ${release.name}`,
      featureId,
      milestoneId,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading timeline...</span>
        </div>
      </div>
    );
  }

  if (!milestones?.length || !features?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="h-12 w-12 text-amber-500/30 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Set up your roadmap</h3>
        <p className="text-sm text-slate-400 max-w-md">
          {!milestones?.length && !features?.length
            ? "Create releases and features to see your roadmap timeline."
            : !milestones?.length
              ? "Create releases to see your roadmap timeline."
              : "Create features in your foundries to see them in the timeline."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[800px]">
        <thead>
          <tr>
            <th className="sticky left-0 bg-slate-900 z-10 p-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide border-b border-white/10 min-w-[200px]">
              Features
            </th>
            {sortedReleases.map((release) => (
              <th
                key={release.id}
                className={clsx(
                  "p-3 text-center text-xs font-medium uppercase tracking-wide border-b min-w-[180px]",
                  release.isActive
                    ? "bg-amber-500/5 border-amber-500/30 text-amber-400"
                    : "border-white/10 text-slate-400"
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    {release.isActive && (
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                      </span>
                    )}
                    <span>{release.name}</span>
                    {release.version && (
                      <span className="text-xs font-normal opacity-60">
                        {release.version}
                      </span>
                    )}
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(foundries || []).map((foundry) => {
            const foundryFeatures = featuresByFoundry[foundry.id] || [];
            if (foundryFeatures.length === 0) return null;

            const FoundryIcon = getIcon(foundry.icon);

            return (
              <>
                {/* Foundry header row */}
                <tr key={`foundry-${foundry.id}`}>
                  <td
                    colSpan={sortedReleases.length + 1}
                    className="sticky left-0 bg-slate-900 z-10 p-2 border-b border-white/5"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium" style={{ color: foundry.color || "#f59e0b" }}>
                      <FoundryIcon className="h-4 w-4" />
                      {foundry.name}
                    </div>
                  </td>
                </tr>

                {/* Feature rows */}
                {foundryFeatures.map((feature) => {
                  const FeatureIcon = getIcon(feature.icon);

                  return (
                    <tr key={feature.id} className="hover:bg-white/[0.02]">
                      <td className="sticky left-0 bg-slate-900 z-10 p-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <FeatureIcon
                            className="h-4 w-4"
                            style={{ color: feature.color || "#94a3b8" }}
                          />
                          <span className="text-sm text-white">{feature.name}</span>
                        </div>
                      </td>
                      {sortedReleases.map((release) => {
                        const epics = epicsByFeatureRelease[`${feature.id}-${release.id}`] || [];
                        return (
                          <td
                            key={release.id}
                            className={clsx(
                              "p-2 border-b align-top",
                              release.isActive
                                ? "bg-amber-500/5 border-amber-500/10"
                                : "border-white/5"
                            )}
                          >
                            <EpicCell
                              epics={epics}
                              feature={feature}
                              release={release}
                              isActiveRelease={release.isActive || false}
                              onCreateEpic={handleCreateEpic}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </>
            );
          })}

          {/* Unassigned features */}
          {featuresByFoundry["unassigned"]?.length > 0 && (
            <>
              <tr>
                <td
                  colSpan={sortedReleases.length + 1}
                  className="sticky left-0 bg-slate-900 z-10 p-2 border-b border-white/5"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                    <Icons.Box className="h-4 w-4" />
                    Unassigned Features
                  </div>
                </td>
              </tr>
              {featuresByFoundry["unassigned"].map((feature) => {
                const FeatureIcon = getIcon(feature.icon);

                return (
                  <tr key={feature.id} className="hover:bg-white/[0.02]">
                    <td className="sticky left-0 bg-slate-900 z-10 p-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <FeatureIcon
                          className="h-4 w-4"
                          style={{ color: feature.color || "#94a3b8" }}
                        />
                        <span className="text-sm text-white">{feature.name}</span>
                      </div>
                    </td>
                    {sortedReleases.map((release) => {
                      const epics = epicsByFeatureRelease[`${feature.id}-${release.id}`] || [];
                      return (
                        <td
                          key={release.id}
                          className={clsx(
                            "p-2 border-b align-top",
                            release.isActive
                              ? "bg-amber-500/5 border-amber-500/10"
                              : "border-white/5"
                          )}
                        >
                          <EpicCell
                            epics={epics}
                            feature={feature}
                            release={release}
                            isActiveRelease={release.isActive || false}
                            onCreateEpic={handleCreateEpic}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
