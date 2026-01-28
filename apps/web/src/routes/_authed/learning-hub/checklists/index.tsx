import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  FileText,
  Home,
  Key,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";

export const Route = createFileRoute("/_authed/learning-hub/checklists/")({
  component: ChecklistsPage,
});

// Checklist template types
interface ChecklistItem {
  id: string;
  text: string;
  description?: string;
  glossarySlug?: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  items: Array<ChecklistItem>;
}

interface ChecklistTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: "violet" | "emerald" | "amber" | "blue";
  sections: Array<ChecklistSection>;
}

// Checklist templates
const CHECKLIST_TEMPLATES: Array<ChecklistTemplate> = [
  {
    id: "pre-offer-due-diligence",
    title: "Pre-Offer Due Diligence",
    description: "Research checklist before making an offer on a property",
    icon: Search,
    color: "violet",
    sections: [
      {
        id: "market-research",
        title: "Market Research",
        items: [
          {
            id: "comps",
            text: "Research comparable sales (comps) in the area",
            description: "Look at 3-5 similar properties sold in the last 6 months",
            glossarySlug: "comps",
          },
          {
            id: "rent-comps",
            text: "Research rental rates for comparable properties",
            glossarySlug: "market-rent",
          },
          {
            id: "neighborhood",
            text: "Analyze neighborhood trends and growth potential",
          },
          {
            id: "crime-stats",
            text: "Check crime statistics for the area",
          },
          {
            id: "school-ratings",
            text: "Review school ratings (affects tenant demand)",
          },
          {
            id: "employment",
            text: "Research major employers and job market stability",
          },
        ],
      },
      {
        id: "financial-analysis",
        title: "Financial Analysis",
        items: [
          {
            id: "cap-rate",
            text: "Calculate cap rate and compare to market",
            glossarySlug: "cap-rate",
          },
          {
            id: "cash-on-cash",
            text: "Project cash-on-cash return",
            glossarySlug: "cash-on-cash-return",
          },
          {
            id: "dscr",
            text: "Calculate DSCR for financing qualification",
            glossarySlug: "dscr",
          },
          {
            id: "operating-expenses",
            text: "Estimate all operating expenses",
            glossarySlug: "operating-expenses",
          },
          {
            id: "capex",
            text: "Budget for capital expenditures and repairs",
            glossarySlug: "capex",
          },
          {
            id: "vacancy",
            text: "Factor in realistic vacancy rate",
            glossarySlug: "vacancy-rate",
          },
        ],
      },
      {
        id: "property-research",
        title: "Property Research",
        items: [
          {
            id: "tax-records",
            text: "Pull property tax records and history",
          },
          {
            id: "ownership-history",
            text: "Review ownership and sales history",
          },
          {
            id: "permits",
            text: "Check building permits and any open violations",
          },
          {
            id: "zoning",
            text: "Verify zoning and any restrictions",
          },
          {
            id: "hoa",
            text: "Research HOA rules, fees, and financials (if applicable)",
          },
          {
            id: "flood-zone",
            text: "Check flood zone status and insurance requirements",
          },
        ],
      },
    ],
  },
  {
    id: "property-inspection",
    title: "Property Inspection",
    description: "Detailed inspection checklist for evaluating a property",
    icon: Home,
    color: "emerald",
    sections: [
      {
        id: "exterior",
        title: "Exterior & Structure",
        items: [
          {
            id: "roof",
            text: "Inspect roof condition, age, and material",
            description: "Look for missing shingles, sagging, or water damage",
          },
          {
            id: "foundation",
            text: "Check foundation for cracks or settling",
          },
          {
            id: "siding",
            text: "Examine siding, stucco, or brick for damage",
          },
          {
            id: "windows",
            text: "Check windows and doors for seal integrity",
          },
          {
            id: "drainage",
            text: "Evaluate drainage and grading around foundation",
          },
          {
            id: "driveway",
            text: "Inspect driveway, walkways, and parking areas",
          },
        ],
      },
      {
        id: "interior",
        title: "Interior Systems",
        items: [
          {
            id: "hvac",
            text: "Test HVAC system and check age/condition",
            description: "Get maintenance history if available",
          },
          {
            id: "plumbing",
            text: "Test all faucets, toilets, and check water pressure",
          },
          {
            id: "electrical",
            text: "Check electrical panel, outlets, and GFCIs",
          },
          {
            id: "water-heater",
            text: "Inspect water heater age and condition",
          },
          {
            id: "appliances",
            text: "Test all included appliances",
          },
          {
            id: "smoke-detectors",
            text: "Verify smoke and CO detectors are present",
          },
        ],
      },
      {
        id: "living-spaces",
        title: "Living Spaces",
        items: [
          {
            id: "flooring",
            text: "Inspect flooring condition throughout",
          },
          {
            id: "walls",
            text: "Check walls and ceilings for cracks or water stains",
          },
          {
            id: "kitchen",
            text: "Evaluate kitchen cabinets, counters, and layout",
          },
          {
            id: "bathrooms",
            text: "Check bathrooms for leaks, mold, and ventilation",
          },
          {
            id: "closets",
            text: "Open all closets and storage areas",
          },
          {
            id: "basement",
            text: "Inspect basement/crawlspace for moisture or pests",
          },
        ],
      },
      {
        id: "documentation",
        title: "Documentation",
        items: [
          {
            id: "photos",
            text: "Take detailed photos of all areas",
          },
          {
            id: "measurements",
            text: "Measure rooms and verify square footage",
          },
          {
            id: "notes",
            text: "Note all repair items with cost estimates",
          },
          {
            id: "professional",
            text: "Schedule professional inspection if proceeding",
          },
        ],
      },
    ],
  },
  {
    id: "closing-documents",
    title: "Closing Document Review",
    description: "Documents to review before signing at closing",
    icon: FileText,
    color: "amber",
    sections: [
      {
        id: "loan-documents",
        title: "Loan Documents",
        items: [
          {
            id: "closing-disclosure",
            text: "Review Closing Disclosure (compare to Loan Estimate)",
            description: "Verify all fees, rate, and terms match expectations",
          },
          {
            id: "promissory-note",
            text: "Review Promissory Note terms",
            description: "Confirm interest rate, payment amount, and due date",
          },
          {
            id: "deed-of-trust",
            text: "Review Deed of Trust / Mortgage",
          },
          {
            id: "prepayment",
            text: "Confirm prepayment penalty terms (if any)",
            glossarySlug: "prepayment-penalty",
          },
        ],
      },
      {
        id: "title-documents",
        title: "Title Documents",
        items: [
          {
            id: "title-commitment",
            text: "Review title commitment and exceptions",
            glossarySlug: "title-insurance",
          },
          {
            id: "survey",
            text: "Review property survey for encroachments",
          },
          {
            id: "deed",
            text: "Verify deed is in correct name/entity",
          },
          {
            id: "liens",
            text: "Confirm all liens will be paid at closing",
          },
        ],
      },
      {
        id: "property-documents",
        title: "Property Documents",
        items: [
          {
            id: "seller-disclosures",
            text: "Review all seller disclosures",
          },
          {
            id: "inspection-repairs",
            text: "Verify all agreed repairs were completed",
          },
          {
            id: "hoa-docs",
            text: "Review HOA documents and estoppel letter (if applicable)",
          },
          {
            id: "lease-info",
            text: "Get copies of existing leases and tenant info",
          },
        ],
      },
      {
        id: "financial-review",
        title: "Financial Review",
        items: [
          {
            id: "cash-to-close",
            text: "Verify cash-to-close amount and wire instructions",
            glossarySlug: "closing-costs",
          },
          {
            id: "prorations",
            text: "Review tax and rent prorations",
          },
          {
            id: "escrow",
            text: "Understand escrow account setup",
          },
          {
            id: "insurance",
            text: "Confirm insurance is in place (bring proof)",
          },
        ],
      },
    ],
  },
  {
    id: "post-purchase",
    title: "Post-Purchase Setup",
    description: "Tasks to complete after closing on a rental property",
    icon: Key,
    color: "blue",
    sections: [
      {
        id: "immediate",
        title: "Immediate Actions (Day 1-7)",
        items: [
          {
            id: "keys",
            text: "Get all keys, garage openers, and access codes",
          },
          {
            id: "utilities",
            text: "Transfer utilities to your name or tenant",
          },
          {
            id: "locks",
            text: "Change all locks (or re-key)",
          },
          {
            id: "walkthrough",
            text: "Do a detailed move-in walkthrough with photos",
          },
          {
            id: "emergency-contacts",
            text: "Create emergency contact list for tenants",
          },
          {
            id: "insurance",
            text: "Verify landlord insurance is active",
          },
        ],
      },
      {
        id: "tenant-setup",
        title: "Tenant Setup",
        items: [
          {
            id: "introduce",
            text: "Introduce yourself to existing tenants",
          },
          {
            id: "payment-setup",
            text: "Set up rent payment method (Venmo, Zelle, etc.)",
          },
          {
            id: "contact-info",
            text: "Collect tenant contact and emergency info",
          },
          {
            id: "lease-review",
            text: "Review lease terms with tenants",
          },
          {
            id: "maintenance-process",
            text: "Explain maintenance request process",
          },
        ],
      },
      {
        id: "systems",
        title: "Systems & Organization",
        items: [
          {
            id: "tracking",
            text: "Add property to Axori for tracking",
          },
          {
            id: "bank-account",
            text: "Set up dedicated bank account for property",
          },
          {
            id: "bookkeeping",
            text: "Set up bookkeeping/expense tracking system",
          },
          {
            id: "vendors",
            text: "Build vendor list (plumber, electrician, handyman)",
          },
          {
            id: "reserves",
            text: "Fund capital expense reserves",
            glossarySlug: "capex",
          },
        ],
      },
      {
        id: "legal-tax",
        title: "Legal & Tax",
        items: [
          {
            id: "llc",
            text: "Transfer to LLC if applicable",
            glossarySlug: "llc",
          },
          {
            id: "tax-records",
            text: "Organize all closing documents for taxes",
          },
          {
            id: "depreciation",
            text: "Calculate depreciation basis for tax purposes",
            glossarySlug: "depreciation",
          },
          {
            id: "cost-seg",
            text: "Consider cost segregation study for larger properties",
            glossarySlug: "cost-segregation",
          },
        ],
      },
    ],
  },
];

// Storage key for user checklists
const STORAGE_KEY = "axori:learning-hub:checklists";

interface UserChecklist {
  templateId: string;
  name: string;
  createdAt: string;
  completedItems: Array<string>; // Array of item IDs
}

function getStoredChecklists(): Array<UserChecklist> {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveChecklists(checklists: Array<UserChecklist>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checklists));
}

function ChecklistsPage() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const [userChecklists, setUserChecklists] = useState<Array<UserChecklist>>([]);
  const [activeChecklist, setActiveChecklist] = useState<UserChecklist | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Load user checklists from localStorage
  useEffect(() => {
    setUserChecklists(getStoredChecklists());
  }, []);

  // Get active template
  const activeTemplate = useMemo(() => {
    if (!activeChecklist) return null;
    return CHECKLIST_TEMPLATES.find((t) => t.id === activeChecklist.templateId);
  }, [activeChecklist]);

  // Calculate progress
  const progress = useMemo(() => {
    if (!activeChecklist || !activeTemplate) return { completed: 0, total: 0 };
    const total = activeTemplate.sections.reduce(
      (sum, s) => sum + s.items.length,
      0
    );
    return {
      completed: activeChecklist.completedItems.length,
      total,
      percent: total > 0 ? (activeChecklist.completedItems.length / total) * 100 : 0,
    };
  }, [activeChecklist, activeTemplate]);

  // Create a new checklist from template
  const createChecklist = useCallback((template: ChecklistTemplate) => {
    const newChecklist: UserChecklist = {
      templateId: template.id,
      name: `${template.title} - ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      completedItems: [],
    };
    const updated = [...getStoredChecklists(), newChecklist];
    saveChecklists(updated);
    setUserChecklists(updated);
    setActiveChecklist(newChecklist);
    // Expand all sections by default
    setExpandedSections(new Set(template.sections.map((s) => s.id)));
  }, []);

  // Toggle item completion
  const toggleItem = useCallback(
    (itemId: string) => {
      if (!activeChecklist) return;

      const updatedChecklist = { ...activeChecklist };
      if (updatedChecklist.completedItems.includes(itemId)) {
        updatedChecklist.completedItems = updatedChecklist.completedItems.filter(
          (id) => id !== itemId
        );
      } else {
        updatedChecklist.completedItems = [...updatedChecklist.completedItems, itemId];
      }

      const updatedList = userChecklists.map((c) =>
        c.createdAt === activeChecklist.createdAt ? updatedChecklist : c
      );
      saveChecklists(updatedList);
      setUserChecklists(updatedList);
      setActiveChecklist(updatedChecklist);
    },
    [activeChecklist, userChecklists]
  );

  // Delete checklist
  const deleteChecklist = useCallback(
    (checklist: UserChecklist) => {
      const updated = userChecklists.filter((c) => c.createdAt !== checklist.createdAt);
      saveChecklists(updated);
      setUserChecklists(updated);
      if (activeChecklist?.createdAt === checklist.createdAt) {
        setActiveChecklist(null);
      }
    },
    [userChecklists, activeChecklist]
  );

  // Reset checklist
  const resetChecklist = useCallback(() => {
    if (!activeChecklist) return;
    const updatedChecklist = { ...activeChecklist, completedItems: [] };
    const updatedList = userChecklists.map((c) =>
      c.createdAt === activeChecklist.createdAt ? updatedChecklist : c
    );
    saveChecklists(updatedList);
    setUserChecklists(updatedList);
    setActiveChecklist(updatedChecklist);
  }, [activeChecklist, userChecklists]);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <div className="p-6 xl:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className={cn(
            "text-2xl font-black mb-2",
            isDark ? "text-white" : "text-slate-900"
          )}
        >
          Investment Checklists
        </h1>
        <p className={cn("text-sm", isDark ? "text-white/60" : "text-slate-500")}>
          Use these checklists to stay organized throughout your investment process.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Templates & My Checklists */}
        <div className="space-y-8">
          {/* Templates */}
          <div>
            <div
              className={cn(
                "text-xs font-bold uppercase tracking-wider mb-4",
                isDark ? "text-white/60" : "text-slate-500"
              )}
            >
              Templates
            </div>
            <div className="space-y-3">
              {CHECKLIST_TEMPLATES.map((template) => {
                const Icon = template.icon;
                const colorClasses = {
                  violet: isDark
                    ? "bg-violet-500/20 text-violet-400"
                    : "bg-violet-100 text-violet-600",
                  emerald: isDark
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-emerald-100 text-emerald-600",
                  amber: isDark
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-amber-100 text-amber-600",
                  blue: isDark
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-blue-100 text-blue-600",
                };

                return (
                  <button
                    key={template.id}
                    onClick={() => createChecklist(template)}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all group",
                      isDark
                        ? "bg-white/5 border-white/10 hover:bg-white/10"
                        : "bg-white border-slate-200 hover:border-violet-200 hover:shadow-md"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          colorClasses[template.color]
                        )}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className={cn(
                              "font-bold text-sm",
                              isDark ? "text-white" : "text-slate-900"
                            )}
                          >
                            {template.title}
                          </h3>
                          <Copy
                            size={14}
                            className={cn(
                              "opacity-0 group-hover:opacity-100 transition-opacity",
                              isDark ? "text-[#E8FF4D]" : "text-violet-600"
                            )}
                          />
                        </div>
                        <p
                          className={cn(
                            "text-xs mt-1",
                            isDark ? "text-white/50" : "text-slate-500"
                          )}
                        >
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* My Checklists */}
          {userChecklists.length > 0 && (
            <div>
              <div
                className={cn(
                  "text-xs font-bold uppercase tracking-wider mb-4",
                  isDark ? "text-white/60" : "text-slate-500"
                )}
              >
                My Checklists
              </div>
              <div className="space-y-2">
                {userChecklists.map((checklist) => {
                  const template = CHECKLIST_TEMPLATES.find(
                    (t) => t.id === checklist.templateId
                  );
                  if (!template) return null;

                  const total = template.sections.reduce(
                    (sum, s) => sum + s.items.length,
                    0
                  );
                  const completed = checklist.completedItems.length;
                  const isActive =
                    activeChecklist?.createdAt === checklist.createdAt;

                  return (
                    <div
                      key={checklist.createdAt}
                      className={cn(
                        "p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-all",
                        isActive
                          ? isDark
                            ? "bg-[#E8FF4D]/10 border-[#E8FF4D]/30"
                            : "bg-violet-50 border-violet-200"
                          : isDark
                            ? "bg-white/5 border-white/10 hover:bg-white/10"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      )}
                      onClick={() => {
                        setActiveChecklist(checklist);
                        setExpandedSections(
                          new Set(template.sections.map((s) => s.id))
                        );
                      }}
                    >
                      <ClipboardList
                        size={16}
                        className={isDark ? "text-white/50" : "text-slate-400"}
                      />
                      <div className="flex-grow min-w-0">
                        <div
                          className={cn(
                            "text-sm font-medium truncate",
                            isDark ? "text-white" : "text-slate-900"
                          )}
                        >
                          {checklist.name}
                        </div>
                        <div
                          className={cn(
                            "text-xs",
                            isDark ? "text-white/40" : "text-slate-400"
                          )}
                        >
                          {completed}/{total} completed
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChecklist(checklist);
                        }}
                        className={cn(
                          "p-1 rounded opacity-50 hover:opacity-100 transition-opacity",
                          isDark ? "hover:bg-white/10" : "hover:bg-slate-200"
                        )}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Active Checklist */}
        <div className="lg:col-span-2">
          {activeChecklist && activeTemplate ? (
            <div
              className={cn(
                "rounded-xl border",
                isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-slate-200"
              )}
            >
              {/* Checklist Header */}
              <div
                className={cn(
                  "p-6 border-b",
                  isDark ? "border-white/10" : "border-slate-200"
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2
                      className={cn(
                        "text-xl font-black",
                        isDark ? "text-white" : "text-slate-900"
                      )}
                    >
                      {activeChecklist.name}
                    </h2>
                    <p
                      className={cn(
                        "text-sm",
                        isDark ? "text-white/60" : "text-slate-500"
                      )}
                    >
                      {activeTemplate.description}
                    </p>
                  </div>
                  <button
                    onClick={resetChecklist}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isDark
                        ? "bg-white/10 text-white/60 hover:bg-white/20"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    )}
                    title="Reset checklist"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className={isDark ? "text-white/60" : "text-slate-500"}>
                      Progress
                    </span>
                    <span
                      className={cn(
                        "font-bold",
                        isDark ? "text-white" : "text-slate-900"
                      )}
                    >
                      {progress.completed} / {progress.total} items
                    </span>
                  </div>
                  <div
                    className={cn(
                      "h-2 rounded-full overflow-hidden",
                      isDark ? "bg-white/10" : "bg-slate-100"
                    )}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        progress.percent === 100
                          ? "bg-emerald-500"
                          : isDark
                            ? "bg-[#E8FF4D]"
                            : "bg-violet-500"
                      )}
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>

                {progress.percent === 100 && (
                  <div
                    className={cn(
                      "mt-4 p-3 rounded-lg flex items-center gap-2 text-sm font-bold",
                      isDark
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    <CheckCircle2 size={18} />
                    Checklist Complete!
                  </div>
                )}
              </div>

              {/* Checklist Sections */}
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {activeTemplate.sections.map((section) => {
                  const isExpanded = expandedSections.has(section.id);
                  const sectionCompleted = section.items.filter((item) =>
                    activeChecklist.completedItems.includes(item.id)
                  ).length;

                  return (
                    <div key={section.id}>
                      {/* Section Header */}
                      <button
                        onClick={() => toggleSection(section.id)}
                        className={cn(
                          "w-full p-4 flex items-center justify-between text-left transition-colors",
                          isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "text-sm font-bold",
                              isDark ? "text-white" : "text-slate-900"
                            )}
                          >
                            {section.title}
                          </span>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              sectionCompleted === section.items.length
                                ? isDark
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-emerald-100 text-emerald-700"
                                : isDark
                                  ? "bg-white/10 text-white/60"
                                  : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {sectionCompleted}/{section.items.length}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown
                            size={18}
                            className={isDark ? "text-white/50" : "text-slate-400"}
                          />
                        ) : (
                          <ChevronRight
                            size={18}
                            className={isDark ? "text-white/50" : "text-slate-400"}
                          />
                        )}
                      </button>

                      {/* Section Items */}
                      {isExpanded && (
                        <div className="pb-4 px-4 space-y-2">
                          {section.items.map((item) => {
                            const isChecked =
                              activeChecklist.completedItems.includes(item.id);

                            return (
                              <div
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className={cn(
                                  "p-3 rounded-lg flex items-start gap-3 cursor-pointer transition-all",
                                  isChecked
                                    ? isDark
                                      ? "bg-emerald-500/10"
                                      : "bg-emerald-50"
                                    : isDark
                                      ? "bg-white/5 hover:bg-white/10"
                                      : "bg-slate-50 hover:bg-slate-100"
                                )}
                              >
                                <div
                                  className={cn(
                                    "w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                                    isChecked
                                      ? "bg-emerald-500 border-emerald-500 text-white"
                                      : isDark
                                        ? "border-white/20"
                                        : "border-slate-300"
                                  )}
                                >
                                  {isChecked && <Check size={12} />}
                                </div>
                                <div className="flex-grow min-w-0">
                                  <div
                                    className={cn(
                                      "text-sm",
                                      isChecked
                                        ? isDark
                                          ? "text-white/50 line-through"
                                          : "text-slate-400 line-through"
                                        : isDark
                                          ? "text-white"
                                          : "text-slate-900"
                                    )}
                                  >
                                    {item.text}
                                  </div>
                                  {item.description && (
                                    <div
                                      className={cn(
                                        "text-xs mt-1",
                                        isDark ? "text-white/40" : "text-slate-400"
                                      )}
                                    >
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "rounded-xl border p-12 text-center",
                isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
              )}
            >
              <ClipboardList
                size={48}
                className={cn(
                  "mx-auto mb-4",
                  isDark ? "text-white/20" : "text-slate-300"
                )}
              />
              <p
                className={cn(
                  "font-bold mb-2",
                  isDark ? "text-white" : "text-slate-900"
                )}
              >
                Select a checklist template
              </p>
              <p
                className={cn(
                  "text-sm",
                  isDark ? "text-white/60" : "text-slate-500"
                )}
              >
                Choose a template from the left to create a new checklist, or select
                an existing checklist to continue.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
