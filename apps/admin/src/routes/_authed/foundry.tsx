// apps/admin/src/routes/_authed/foundry.tsx
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Building2, Calendar, Flame, Layers } from "lucide-react";
import { clsx } from "clsx";
import { FoundriesView } from "@/components/foundry/foundries-view";
import { ReleasesView } from "@/components/foundry/releases-view";
import { TimelineView } from "@/components/foundry/timeline-view";

type FoundryTab = "timeline" | "releases" | "foundries";

interface FoundrySearch {
  tab?: FoundryTab;
}

export const Route = createFileRoute("/_authed/foundry")({
  component: FoundryPage,
  validateSearch: (search: Record<string, unknown>): FoundrySearch => {
    const tab = search.tab as FoundryTab | undefined;
    return {
      tab: tab && ["timeline", "releases", "foundries"].includes(tab) ? tab : undefined,
    };
  },
});

const TABS = [
  { id: "timeline" as const, label: "Timeline", icon: Calendar },
  { id: "releases" as const, label: "Releases", icon: Layers },
  { id: "foundries" as const, label: "Foundries", icon: Building2 },
];

function FoundryPage() {
  const search = useSearch({ from: "/_authed/foundry" });
  const navigate = useNavigate();
  const activeTab: FoundryTab = search.tab || "timeline";

  const handleTabChange = (tab: FoundryTab) => {
    navigate({
      to: "/foundry",
      search: tab === "timeline" ? {} : { tab },
    });
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
            <Flame className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Foundry</h1>
            <p className="text-sm text-slate-400">
              Product roadmap and release planning
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-1 rounded-xl bg-white/5 p-1 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={clsx(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
        {activeTab === "timeline" && <TimelineView />}
        {activeTab === "releases" && <ReleasesView />}
        {activeTab === "foundries" && <FoundriesView />}
      </div>
    </div>
  );
}



