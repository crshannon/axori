import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Calendar,
  ChevronRight,
  DollarSign,
  HelpCircle,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { Property } from "@/hooks/api/useProperties";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";
import { useProperties } from "@/hooks/api/useProperties";

export const Route = createFileRoute("/_authed/learning-hub/freedom/")({
  component: FreedomTrackerPage,
});

// Helper to parse numeric string values
function parseNum(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return parseFloat(value) || 0;
}

// Calculate portfolio metrics
function calculatePortfolioMetrics(properties: Array<Property>) {
  let totalEquity = 0;
  let totalMonthlyIncome = 0;
  let totalMonthlyExpenses = 0;
  let totalValue = 0;
  let totalDebt = 0;

  for (const property of properties) {
    if (property.status !== "active") continue;

    // Value
    const currentValue =
      parseNum(property.valuation?.currentValue) ||
      parseNum(property.acquisition?.currentValue) ||
      parseNum(property.acquisition?.purchasePrice) ||
      0;
    totalValue += currentValue;

    // Debt
    const loanBalance =
      property.loans?.reduce((sum, loan) => {
        return sum + parseNum(loan.currentBalance || loan.originalAmount);
      }, 0) || 0;
    totalDebt += loanBalance;

    // Equity
    totalEquity += currentValue - loanBalance;

    // Income
    const monthlyRent = parseNum(property.rentalIncome?.monthlyRent) || 0;
    const otherIncome =
      parseNum(property.rentalIncome?.otherIncomeMonthly) +
      parseNum(property.rentalIncome?.parkingIncomeMonthly) +
      parseNum(property.rentalIncome?.laundryIncomeMonthly) +
      parseNum(property.rentalIncome?.petRentMonthly) +
      parseNum(property.rentalIncome?.storageIncomeMonthly);
    const vacancyRate = parseNum(property.operatingExpenses?.vacancyRate) / 100 || 0.05;
    const effectiveIncome = (monthlyRent + otherIncome) * (1 - vacancyRate);
    totalMonthlyIncome += effectiveIncome;

    // Expenses
    const propertyTax = parseNum(property.operatingExpenses?.propertyTaxAnnual) / 12;
    const insurance = parseNum(property.operatingExpenses?.insuranceAnnual) / 12;
    const hoa = parseNum(property.operatingExpenses?.hoaMonthly);
    const managementRate = parseNum(property.operatingExpenses?.managementRate) / 100;
    const maintenanceRate = parseNum(property.operatingExpenses?.maintenanceRate) / 100;
    const management = effectiveIncome * managementRate;
    const maintenance = effectiveIncome * maintenanceRate;

    // Debt service
    let monthlyDebtService = 0;
    if (property.loans) {
      for (const loan of property.loans) {
        const balance = parseNum(loan.currentBalance || loan.originalAmount);
        const rate = parseNum(loan.interestRate) / 100 / 12;
        const termMonths = parseNum(loan.loanTerm) * 12;
        if (balance > 0 && rate > 0 && termMonths > 0) {
          const payment =
            (balance * (rate * Math.pow(1 + rate, termMonths))) /
            (Math.pow(1 + rate, termMonths) - 1);
          monthlyDebtService += payment;
        }
      }
    }

    totalMonthlyExpenses +=
      propertyTax + insurance + hoa + management + maintenance + monthlyDebtService;
  }

  const monthlyCashFlow = totalMonthlyIncome - totalMonthlyExpenses;
  const annualCashFlow = monthlyCashFlow * 12;

  return {
    totalEquity,
    totalValue,
    totalDebt,
    totalMonthlyIncome,
    totalMonthlyExpenses,
    monthlyCashFlow,
    annualCashFlow,
    propertyCount: properties.filter((p) => p.status === "active").length,
  };
}

function FreedomTrackerPage() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const { data: properties, isLoading } = useProperties();

  // Freedom number inputs
  const [monthlyExpenses, setMonthlyExpenses] = useState(5000);
  const [targetCushion, setTargetCushion] = useState(25); // 25% above expenses

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    if (!properties) return null;
    return calculatePortfolioMetrics(properties);
  }, [properties]);

  // Calculate freedom metrics
  const freedomMetrics = useMemo(() => {
    if (!portfolioMetrics) return null;

    const freedomNumber = monthlyExpenses * 12 * (1 + targetCushion / 100);
    const currentPassiveIncome = portfolioMetrics.annualCashFlow;
    const progress = freedomNumber > 0 ? (currentPassiveIncome / freedomNumber) * 100 : 0;
    const gap = freedomNumber - currentPassiveIncome;
    const monthlyGap = gap / 12;

    // Estimate time to freedom (simplified)
    const avgCashFlowPerProperty =
      portfolioMetrics.propertyCount > 0
        ? portfolioMetrics.annualCashFlow / portfolioMetrics.propertyCount
        : 5000; // Default assumption
    const propertiesNeeded = gap > 0 ? Math.ceil(gap / avgCashFlowPerProperty) : 0;

    return {
      freedomNumber,
      currentPassiveIncome,
      progress: Math.min(progress, 100),
      gap,
      monthlyGap,
      propertiesNeeded,
      isFree: progress >= 100,
    };
  }, [portfolioMetrics, monthlyExpenses, targetCushion]);

  // Format currency
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

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
          Freedom Number Tracker
        </h1>
        <p className={cn("text-sm", isDark ? "text-white/60" : "text-slate-500")}>
          Track your progress toward financial independence through real estate.
        </p>
      </div>

      {isLoading ? (
        <div
          className={cn(
            "p-12 rounded-2xl border text-center",
            isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
          )}
        >
          <div
            className={cn("animate-pulse", isDark ? "text-white/40" : "text-slate-400")}
          >
            Loading portfolio data...
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Freedom Number Calculator */}
          <div
            className={cn(
              "rounded-2xl border p-6",
              isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
            )}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isDark
                    ? "bg-[#E8FF4D]/20 text-[#E8FF4D]"
                    : "bg-violet-100 text-violet-600"
                )}
              >
                <Target size={20} />
              </div>
              <div>
                <h2
                  className={cn(
                    "font-bold",
                    isDark ? "text-white" : "text-slate-900"
                  )}
                >
                  Calculate Your Freedom Number
                </h2>
                <p
                  className={cn(
                    "text-sm",
                    isDark ? "text-white/60" : "text-slate-500"
                  )}
                >
                  The annual passive income needed to cover your expenses
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  className={cn(
                    "block text-sm font-medium mb-2",
                    isDark ? "text-white/80" : "text-slate-700"
                  )}
                >
                  Monthly Living Expenses
                  <button
                    className="ml-1 opacity-50 hover:opacity-100"
                    title="Include: housing, food, transportation, utilities, insurance, etc."
                  >
                    <HelpCircle size={14} className="inline" />
                  </button>
                </label>
                <div className="relative">
                  <span
                    className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2",
                      isDark ? "text-white/40" : "text-slate-400"
                    )}
                  >
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={monthlyExpenses}
                    onChange={(e) =>
                      setMonthlyExpenses(parseInt(e.target.value.replace(/\D/g, "")) || 0)
                    }
                    className={cn(
                      "w-full py-3 pl-8 pr-4 rounded-2xl border text-lg font-bold outline-none transition-colors",
                      isDark
                        ? "bg-white/10 border-white/20 text-white focus:border-[#E8FF4D]/50"
                        : "bg-white border-slate-200 text-slate-900 focus:border-violet-300"
                    )}
                  />
                </div>
              </div>

              <div>
                <label
                  className={cn(
                    "block text-sm font-medium mb-2",
                    isDark ? "text-white/80" : "text-slate-700"
                  )}
                >
                  Safety Cushion
                  <button
                    className="ml-1 opacity-50 hover:opacity-100"
                    title="Extra buffer above expenses for unexpected costs"
                  >
                    <HelpCircle size={14} className="inline" />
                  </button>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={targetCushion}
                    onChange={(e) =>
                      setTargetCushion(parseInt(e.target.value.replace(/\D/g, "")) || 0)
                    }
                    className={cn(
                      "w-full py-3 px-4 pr-8 rounded-2xl border text-lg font-bold outline-none transition-colors",
                      isDark
                        ? "bg-white/10 border-white/20 text-white focus:border-[#E8FF4D]/50"
                        : "bg-white border-slate-200 text-slate-900 focus:border-violet-300"
                    )}
                  />
                  <span
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2",
                      isDark ? "text-white/40" : "text-slate-400"
                    )}
                  >
                    %
                  </span>
                </div>
              </div>

              <div
                className={cn(
                  "p-4 rounded-xl flex flex-col justify-center",
                  isDark ? "bg-[#E8FF4D]/10" : "bg-violet-50"
                )}
              >
                <div
                  className={cn(
                    "text-xs font-bold uppercase tracking-wider mb-1",
                    isDark ? "text-[#E8FF4D]/70" : "text-violet-600"
                  )}
                >
                  Your Freedom Number
                </div>
                <div
                  className={cn(
                    "text-3xl font-black",
                    isDark ? "text-[#E8FF4D]" : "text-violet-700"
                  )}
                >
                  {formatCurrency(freedomMetrics?.freedomNumber || 0)}
                </div>
                <div
                  className={cn(
                    "text-sm",
                    isDark ? "text-[#E8FF4D]/60" : "text-violet-500"
                  )}
                >
                  per year in passive income
                </div>
              </div>
            </div>
          </div>

          {/* Progress Display */}
          {freedomMetrics && portfolioMetrics && (
            <>
              {/* Main Progress */}
              <div
                className={cn(
                  "rounded-2xl border p-6",
                  isDark
                    ? "bg-white/[0.02] border-white/10"
                    : "bg-white border-slate-200"
                )}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        isDark
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-emerald-100 text-emerald-600"
                      )}
                    >
                      <TrendingUp size={20} />
                    </div>
                    <h2
                      className={cn(
                        "font-bold text-lg",
                        isDark ? "text-white" : "text-slate-900"
                      )}
                    >
                      Your Progress
                    </h2>
                  </div>
                  {freedomMetrics.isFree && (
                    <div
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold",
                        isDark
                          ? "bg-[#E8FF4D] text-black"
                          : "bg-violet-600 text-white"
                      )}
                    >
                      <Sparkles size={16} />
                      Financially Free!
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className={isDark ? "text-white/60" : "text-slate-500"}>
                      Current Passive Income
                    </span>
                    <span
                      className={cn(
                        "font-bold",
                        isDark ? "text-white" : "text-slate-900"
                      )}
                    >
                      {formatCurrency(freedomMetrics.currentPassiveIncome)} /{" "}
                      {formatCurrency(freedomMetrics.freedomNumber)}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "h-6 rounded-full overflow-hidden",
                      isDark ? "bg-white/10" : "bg-slate-100"
                    )}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2",
                        freedomMetrics.progress >= 100
                          ? "bg-gradient-to-r from-emerald-500 to-[#E8FF4D]"
                          : freedomMetrics.progress >= 50
                            ? "bg-emerald-500"
                            : "bg-violet-500"
                      )}
                      style={{ width: `${Math.max(freedomMetrics.progress, 5)}%` }}
                    >
                      {freedomMetrics.progress >= 20 && (
                        <span className="text-xs font-bold text-white">
                          {freedomMetrics.progress.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  {freedomMetrics.progress < 20 && (
                    <div
                      className={cn(
                        "text-sm font-bold mt-1",
                        isDark ? "text-white" : "text-slate-900"
                      )}
                    >
                      {freedomMetrics.progress.toFixed(1)}% Complete
                    </div>
                  )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard
                    label="Monthly Cash Flow"
                    value={formatCurrency(portfolioMetrics.monthlyCashFlow)}
                    icon={DollarSign}
                    color={portfolioMetrics.monthlyCashFlow >= 0 ? "emerald" : "rose"}
                    isDark={isDark}
                  />
                  <MetricCard
                    label="Monthly Gap"
                    value={formatCurrency(Math.abs(freedomMetrics.monthlyGap))}
                    icon={Target}
                    color={freedomMetrics.monthlyGap <= 0 ? "emerald" : "amber"}
                    isDark={isDark}
                    subtext={
                      freedomMetrics.monthlyGap <= 0 ? "Exceeded!" : "Still needed"
                    }
                  />
                  <MetricCard
                    label="Total Equity"
                    value={formatCurrency(portfolioMetrics.totalEquity)}
                    icon={Building2}
                    color="violet"
                    isDark={isDark}
                  />
                  <MetricCard
                    label="Properties"
                    value={portfolioMetrics.propertyCount.toString()}
                    icon={Building2}
                    color="blue"
                    isDark={isDark}
                    subtext={
                      freedomMetrics.propertiesNeeded > 0
                        ? `~${freedomMetrics.propertiesNeeded} more needed`
                        : "Target reached!"
                    }
                  />
                </div>
              </div>

              {/* Recommendations */}
              {!freedomMetrics.isFree && (
                <div
                  className={cn(
                    "rounded-2xl border p-6",
                    isDark
                      ? "bg-white/[0.02] border-white/10"
                      : "bg-white border-slate-200"
                  )}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        isDark
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-amber-100 text-amber-600"
                      )}
                    >
                      <Zap size={20} />
                    </div>
                    <h2
                      className={cn(
                        "font-bold text-lg",
                        isDark ? "text-white" : "text-slate-900"
                      )}
                    >
                      How to Accelerate
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <RecommendationCard
                      title="Add More Properties"
                      description={`Each property averaging ${formatCurrency(
                        portfolioMetrics.propertyCount > 0
                          ? portfolioMetrics.annualCashFlow / portfolioMetrics.propertyCount
                          : 5000
                      )}/year gets you closer.`}
                      link="/property-hub"
                      linkText="Add Property"
                      isDark={isDark}
                    />
                    <RecommendationCard
                      title="Increase Rents"
                      description="Review market rates and consider annual rent increases of 3-5%."
                      link="/learning-hub/glossary/market-rent"
                      linkText="Learn More"
                      isDark={isDark}
                    />
                    <RecommendationCard
                      title="Reduce Expenses"
                      description="Optimize operating costs, refinance to lower rates, or self-manage."
                      link="/learning-hub/scenarios"
                      linkText="Run Scenarios"
                      isDark={isDark}
                    />
                  </div>
                </div>
              )}

              {/* Learn More */}
              <div
                className={cn(
                  "p-6 rounded-xl",
                  isDark ? "bg-white/5" : "bg-blue-50"
                )}
              >
                <div className="flex items-start gap-4">
                  <Calendar
                    size={24}
                    className={isDark ? "text-white/60" : "text-blue-600"}
                  />
                  <div>
                    <div
                      className={cn(
                        "font-bold mb-1",
                        isDark ? "text-white" : "text-blue-900"
                      )}
                    >
                      The 4% Rule
                    </div>
                    <p
                      className={cn(
                        "text-sm mb-3",
                        isDark ? "text-white/70" : "text-blue-800"
                      )}
                    >
                      Your Freedom Number is based on the principle that you can
                      safely withdraw 4% of your wealth annually. With real estate,
                      this translates to generating enough cash flow to cover
                      expenses plus a cushion for unexpected costs and reinvestment.
                    </p>
                    <Link
                      to="/learning-hub/glossary/fire"
                      className={cn(
                        "inline-flex items-center gap-1 text-sm font-bold",
                        isDark ? "text-[#E8FF4D]" : "text-violet-600"
                      )}
                    >
                      Learn about FIRE
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {portfolioMetrics?.propertyCount === 0 && (
            <div
              className={cn(
                "text-center py-12 rounded-2xl border",
                isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
              )}
            >
              <Building2
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
                No properties yet
              </p>
              <p
                className={cn(
                  "text-sm mb-4",
                  isDark ? "text-white/60" : "text-slate-500"
                )}
              >
                Add properties to your portfolio to track your freedom progress.
              </p>
              <Link
                to="/property-hub"
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors",
                  isDark
                    ? "bg-[#E8FF4D] text-black hover:bg-[#d4eb45]"
                    : "bg-violet-600 text-white hover:bg-violet-700"
                )}
              >
                Go to Property Hub
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: "emerald" | "amber" | "violet" | "blue" | "rose";
  isDark: boolean;
  subtext?: string;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  isDark,
  subtext,
}: MetricCardProps) {
  const colorClasses = {
    emerald: isDark
      ? "bg-emerald-500/20 text-emerald-400"
      : "bg-emerald-100 text-emerald-600",
    amber: isDark
      ? "bg-amber-500/20 text-amber-400"
      : "bg-amber-100 text-amber-600",
    violet: isDark
      ? "bg-violet-500/20 text-violet-400"
      : "bg-violet-100 text-violet-600",
    blue: isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600",
    rose: isDark ? "bg-rose-500/20 text-rose-400" : "bg-rose-100 text-rose-600",
  };

  return (
    <div
      className={cn(
        "p-4 rounded-xl",
        isDark ? "bg-white/5" : "bg-slate-50"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            colorClasses[color]
          )}
        >
          <Icon size={16} />
        </div>
        <div
          className={cn(
            "text-xs font-bold uppercase tracking-wider",
            isDark ? "text-white/60" : "text-slate-500"
          )}
        >
          {label}
        </div>
      </div>
      <div
        className={cn(
          "text-2xl font-black",
          isDark ? "text-white" : "text-slate-900"
        )}
      >
        {value}
      </div>
      {subtext && (
        <div
          className={cn(
            "text-xs mt-1",
            isDark ? "text-white/40" : "text-slate-400"
          )}
        >
          {subtext}
        </div>
      )}
    </div>
  );
}

// Recommendation Card Component
interface RecommendationCardProps {
  title: string;
  description: string;
  link: string;
  linkText: string;
  isDark: boolean;
}

function RecommendationCard({
  title,
  description,
  link,
  linkText,
  isDark,
}: RecommendationCardProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl",
        isDark ? "bg-white/5" : "bg-slate-50"
      )}
    >
      <h3
        className={cn(
          "font-bold mb-2",
          isDark ? "text-white" : "text-slate-900"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-sm mb-3",
          isDark ? "text-white/60" : "text-slate-500"
        )}
      >
        {description}
      </p>
      <Link
        to={link}
        className={cn(
          "inline-flex items-center gap-1 text-sm font-bold transition-colors",
          isDark
            ? "text-[#E8FF4D] hover:text-[#E8FF4D]/80"
            : "text-violet-600 hover:text-violet-700"
        )}
      >
        {linkText}
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
