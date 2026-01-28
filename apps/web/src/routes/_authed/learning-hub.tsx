import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { ChevronDown, Search } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";

export const Route = createFileRoute("/_authed/learning-hub")({
  component: LearningHubLayout,
});

// Journey/persona options based on onboarding
const JOURNEYS = [
  { id: "builder", label: "Builder", description: "Building your portfolio" },
  { id: "optimizer", label: "Optimizer", description: "Maximizing returns" },
  { id: "explorer", label: "Explorer", description: "Just getting started" },
] as const;

// Context for sharing state with child routes
interface LearningHubContextType {
  selectedJourney: string;
  setSelectedJourney: (journey: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const LearningHubContext = createContext<LearningHubContextType | null>(null);

export function useLearningHubContext() {
  const context = useContext(LearningHubContext);
  if (!context) {
    // Return defaults if not within provider
    return {
      selectedJourney: "builder",
      setSelectedJourney: () => {},
      searchQuery: "",
      setSearchQuery: () => {},
    };
  }
  return context;
}

function LearningHubLayout() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const location = useLocation();
  const [selectedJourney, setSelectedJourney] = useState<string>("builder");
  const [journeyDropdownOpen, setJourneyDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = [
    { path: "/learning-hub", label: "HOME", exact: true },
    { path: "/learning-hub/glossary", label: "GLOSSARY" },
    { path: "/learning-hub/paths", label: "PATHS" },
    { path: "/learning-hub/articles", label: "ARTICLES" },
    { path: "/learning-hub/calculators", label: "CALCULATORS" },
    { path: "/learning-hub/analyzer", label: "ANALYZER" },
    { path: "/learning-hub/scenarios", label: "SCENARIOS" },
    { path: "/learning-hub/freedom", label: "FREEDOM" },
    { path: "/learning-hub/checklists", label: "CHECKLISTS" },
    { path: "/learning-hub/achievements", label: "ACHIEVEMENTS" },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const currentJourney = JOURNEYS.find((j) => j.id === selectedJourney) || JOURNEYS[0];

  return (
    <LearningHubContext.Provider
      value={{ selectedJourney, setSelectedJourney, searchQuery, setSearchQuery }}
    >
      <main className="flex-grow flex flex-col overflow-y-auto max-h-screen">
        {/* Header Section */}
        <div
          className={cn(
            "px-6 xl:px-8 pt-8 pb-6",
            isDark ? "bg-[#0a0a0a]" : "bg-slate-50"
          )}
        >
          {/* Top Row: Title + Search + Journey */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            {/* Title */}
            <div>
              <h1
                className={cn(
                  "text-4xl md:text-5xl xl:text-6xl font-black tracking-tight leading-none",
                  isDark ? "text-white" : "text-slate-900"
                )}
              >
                KNOWLEDGE
                <br />
                <span className={isDark ? "text-[#E8FF4D]" : "text-violet-600"}>
                  ASSET
                </span>{" "}
                BASE.
              </h1>
            </div>

            {/* Right Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search
                  className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2",
                    isDark ? "text-white/40" : "text-slate-400"
                  )}
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search protocols and tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "pl-12 pr-6 py-3.5 rounded-full text-sm border transition-all w-full sm:w-72 outline-none",
                    isDark
                      ? "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-white/20"
                      : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:shadow-lg focus:border-violet-300"
                  )}
                />
              </div>

              {/* Journey Selector */}
              <div className="relative">
                <button
                  onClick={() => setJourneyDropdownOpen(!journeyDropdownOpen)}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3.5 rounded-full border transition-all w-full sm:w-auto justify-between sm:justify-start",
                    isDark
                      ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                      : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        isDark ? "bg-[#E8FF4D]" : "bg-emerald-500"
                      )}
                    />
                    <span className="text-sm font-bold uppercase tracking-wide">
                      Journey: {currentJourney.label}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "transition-transform",
                      journeyDropdownOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Dropdown */}
                {journeyDropdownOpen && (
                  <div
                    className={cn(
                      "absolute right-0 top-full mt-2 w-64 rounded-xl border shadow-xl z-50 overflow-hidden",
                      isDark
                        ? "bg-[#1a1a1a] border-white/10"
                        : "bg-white border-slate-200"
                    )}
                  >
                    {JOURNEYS.map((journey) => (
                      <button
                        key={journey.id}
                        onClick={() => {
                          setSelectedJourney(journey.id);
                          setJourneyDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-3 text-left transition-all",
                          selectedJourney === journey.id
                            ? isDark
                              ? "bg-[#E8FF4D]/10 text-[#E8FF4D]"
                              : "bg-violet-50 text-violet-700"
                            : isDark
                              ? "text-white hover:bg-white/5"
                              : "text-slate-900 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {selectedJourney === journey.id && (
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full",
                                isDark ? "bg-[#E8FF4D]" : "bg-violet-600"
                              )}
                            />
                          )}
                          <span className="font-bold text-sm">{journey.label}</span>
                        </div>
                        <p
                          className={cn(
                            "text-xs mt-0.5",
                            selectedJourney === journey.id
                              ? isDark
                                ? "text-[#E8FF4D]/60"
                                : "text-violet-500"
                              : isDark
                                ? "text-white/40"
                                : "text-slate-500"
                          )}
                        >
                          {journey.description}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
            {tabs.map((tab) => {
              const active = isActive(tab.path, tab.exact);
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-shrink-0",
                    active
                      ? isDark
                        ? "bg-white text-black"
                        : "bg-slate-900 text-white"
                      : isDark
                        ? "text-white/60 hover:text-white hover:bg-white/5"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Route Content */}
        <div
          className={cn(
            "flex-grow overflow-y-auto",
            isDark ? "bg-[#0a0a0a]" : "bg-slate-50"
          )}
        >
          <Outlet />
        </div>
      </main>
    </LearningHubContext.Provider>
  );
}
