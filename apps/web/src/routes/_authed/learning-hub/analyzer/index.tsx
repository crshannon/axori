import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Calculator,
  ChevronRight,
  DollarSign,
  HelpCircle,
  Home,
  PiggyBank,
  TrendingUp,
} from "lucide-react";
import type { Property } from "@/hooks/api/useProperties";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";
import { useProperties } from "@/hooks/api/useProperties";

export const Route = createFileRoute("/_authed/learning-hub/analyzer/")({
  component: AnalyzerPage,
});

// Helper to parse numeric string values
function parseNum(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return parseFloat(value) || 0;
}

// Calculate metrics for a property
function calculateMetrics(property: Property) {
  // Valuation
  const currentValue = parseNum(property.valuation?.currentValue) ||
    parseNum(property.acquisition?.currentValue) ||
    parseNum(property.acquisition?.purchasePrice) ||
    0;
  const purchasePrice = parseNum(property.acquisition?.purchasePrice) || 0;
  const closingCosts = parseNum(property.acquisition?.closingCosts) || 0;

  // Income
  const monthlyRent = parseNum(property.rentalIncome?.monthlyRent) || 0;
  const otherIncome = parseNum(property.rentalIncome?.otherIncomeMonthly) +
    parseNum(property.rentalIncome?.parkingIncomeMonthly) +
    parseNum(property.rentalIncome?.laundryIncomeMonthly) +
    parseNum(property.rentalIncome?.petRentMonthly) +
    parseNum(property.rentalIncome?.storageIncomeMonthly) +
    parseNum(property.rentalIncome?.utilityReimbursementMonthly);
  const grossMonthlyIncome = monthlyRent + otherIncome;
  const grossAnnualIncome = grossMonthlyIncome * 12;

  // Expenses
  const vacancyRate = parseNum(property.operatingExpenses?.vacancyRate) / 100 || 0.05;
  const managementRate = parseNum(property.operatingExpenses?.managementRate) / 100 || 0;
  const maintenanceRate = parseNum(property.operatingExpenses?.maintenanceRate) / 100 || 0;
  const capexRate = parseNum(property.operatingExpenses?.capexRate) / 100 || 0;

  const propertyTaxAnnual = parseNum(property.operatingExpenses?.propertyTaxAnnual) || 0;
  const insuranceAnnual = parseNum(property.operatingExpenses?.insuranceAnnual) || 0;
  const hoaAnnual = parseNum(property.operatingExpenses?.hoaMonthly) * 12 || 0;

  // Calculate rate-based expenses
  const effectiveGrossIncome = grossAnnualIncome * (1 - vacancyRate);
  const vacancyLoss = grossAnnualIncome * vacancyRate;
  const managementExpense = effectiveGrossIncome * managementRate;
  const maintenanceExpense = effectiveGrossIncome * maintenanceRate;
  const capexReserve = effectiveGrossIncome * capexRate;

  // Total operating expenses
  const totalOperatingExpenses = propertyTaxAnnual + insuranceAnnual + hoaAnnual +
    managementExpense + maintenanceExpense + capexReserve;

  // NOI
  const noi = effectiveGrossIncome - totalOperatingExpenses;

  // Loan info
  const primaryLoan = property.loans?.find((l) => l.isPrimary) || property.loans?.[0];
  const totalLoanBalance = property.loans?.reduce((sum, loan) => {
    return sum + parseNum(loan.currentBalance || loan.originalAmount);
  }, 0) || 0;

  // Calculate monthly debt service
  let monthlyDebtService = 0;
  if (property.loans) {
    for (const loan of property.loans) {
      const balance = parseNum(loan.currentBalance || loan.originalAmount);
      const rate = parseNum(loan.interestRate) / 100 / 12;
      const termMonths = parseNum(loan.loanTerm) * 12;
      if (balance > 0 && rate > 0 && termMonths > 0) {
        const payment = (balance * (rate * Math.pow(1 + rate, termMonths))) /
          (Math.pow(1 + rate, termMonths) - 1);
        monthlyDebtService += payment;
      }
    }
  }
  const annualDebtService = monthlyDebtService * 12;

  // Cash flow
  const annualCashFlow = noi - annualDebtService;
  const monthlyCashFlow = annualCashFlow / 12;

  // Key ratios
  const capRate = currentValue > 0 ? (noi / currentValue) * 100 : 0;
  const grm = monthlyRent > 0 ? currentValue / (monthlyRent * 12) : 0;
  const ltv = currentValue > 0 ? (totalLoanBalance / currentValue) * 100 : 0;
  const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;
  const equity = currentValue - totalLoanBalance;

  // Cash invested (down payment + closing costs)
  const downPayment = purchasePrice - (primaryLoan ? parseNum(primaryLoan.originalAmount) : 0);
  const totalCashInvested = downPayment + closingCosts;
  const cashOnCash = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;

  // Tax benefits (estimated)
  const buildingValue = currentValue * 0.8; // Assume 80% building, 20% land
  const annualDepreciation = buildingValue / 27.5; // Residential
  const taxBracket = 0.24; // Assume 24% bracket
  const taxSavings = annualDepreciation * taxBracket;

  return {
    // Valuation
    currentValue,
    purchasePrice,
    equity,

    // Income
    grossMonthlyIncome,
    grossAnnualIncome,
    effectiveGrossIncome,
    vacancyLoss,

    // Expenses
    totalOperatingExpenses,
    noi,

    // Debt
    totalLoanBalance,
    monthlyDebtService,
    annualDebtService,

    // Cash Flow
    annualCashFlow,
    monthlyCashFlow,
    totalCashInvested,

    // Ratios
    capRate,
    grm,
    ltv,
    dscr,
    cashOnCash,

    // Tax
    annualDepreciation,
    taxSavings,
  };
}

function AnalyzerPage() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const { data: properties, isLoading } = useProperties();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Get active properties
  const activeProperties = useMemo(() => {
    return properties?.filter((p) => p.status === "active") || [];
  }, [properties]);

  // Get selected property
  const selectedProperty = useMemo(() => {
    if (!selectedPropertyId) return null;
    return activeProperties.find((p) => p.id === selectedPropertyId) || null;
  }, [selectedPropertyId, activeProperties]);

  // Calculate metrics for selected property
  const metrics = useMemo(() => {
    if (!selectedProperty) return null;
    return calculateMetrics(selectedProperty);
  }, [selectedProperty]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
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
          Property Analyzer
        </h1>
        <p className={cn("text-sm", isDark ? "text-white/60" : "text-slate-500")}>
          Get an educational breakdown of your property&apos;s key investment metrics.
        </p>
      </div>

      {/* Property Selector */}
      <div className="mb-8">
        <div
          className={cn(
            "text-xs font-bold uppercase tracking-wider mb-3",
            isDark ? "text-white/60" : "text-slate-500"
          )}
        >
          Select a Property
        </div>

        {isLoading ? (
          <div
            className={cn(
              "p-8 rounded-2xl border text-center",
              isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
            )}
          >
            <div
              className={cn(
                "animate-pulse",
                isDark ? "text-white/40" : "text-slate-400"
              )}
            >
              Loading properties...
            </div>
          </div>
        ) : activeProperties.length === 0 ? (
          <div
            className={cn(
              "p-8 rounded-2xl border text-center",
              isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
            )}
          >
            <Home
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
              No properties found
            </p>
            <p
              className={cn(
                "text-sm mb-4",
                isDark ? "text-white/60" : "text-slate-500"
              )}
            >
              Add a property to your portfolio to analyze it here.
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProperties.map((property) => (
              <button
                key={property.id}
                onClick={() => setSelectedPropertyId(property.id)}
                className={cn(
                  "p-4 rounded-2xl border text-left transition-all",
                  selectedPropertyId === property.id
                    ? isDark
                      ? "bg-[#E8FF4D]/20 border-[#E8FF4D]/50"
                      : "bg-violet-100 border-violet-300"
                    : isDark
                      ? "bg-white/5 border-white/10 hover:bg-white/10"
                      : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      selectedPropertyId === property.id
                        ? isDark
                          ? "bg-[#E8FF4D] text-black"
                          : "bg-violet-600 text-white"
                        : isDark
                          ? "bg-white/10 text-white"
                          : "bg-slate-100 text-slate-600"
                    )}
                  >
                    <Building2 size={20} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div
                      className={cn(
                        "font-bold truncate",
                        isDark ? "text-white" : "text-slate-900"
                      )}
                    >
                      {property.address}
                    </div>
                    <div
                      className={cn(
                        "text-sm",
                        isDark ? "text-white/60" : "text-slate-500"
                      )}
                    >
                      {property.city}, {property.state}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {selectedProperty && metrics && (
        <div className="space-y-8">
          {/* Valuation Section */}
          <AnalysisSection
            title="Valuation Analysis"
            icon={TrendingUp}
            isDark={isDark}
            color="violet"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                label="Current Value"
                value={formatCurrency(metrics.currentValue)}
                glossarySlug="arv"
                helpText="Estimated market value of the property"
                isDark={isDark}
              />
              <MetricCard
                label="Cap Rate"
                value={formatPercent(metrics.capRate)}
                glossarySlug="cap-rate"
                helpText="NOI / Property Value"
                highlight={metrics.capRate >= 6}
                isDark={isDark}
              />
              <MetricCard
                label="GRM"
                value={metrics.grm.toFixed(1)}
                glossarySlug="grm"
                helpText="Price / Annual Rent"
                isDark={isDark}
              />
            </div>
            <InfoBox isDark={isDark}>
              <strong>Cap Rate</strong> measures your property&apos;s return independent of
              financing. A higher cap rate means higher returns but often indicates
              higher risk or secondary markets. Typical ranges: 4-6% (A-class),
              6-8% (B-class), 8%+ (C-class or value-add).
            </InfoBox>
          </AnalysisSection>

          {/* Cash Flow Section */}
          <AnalysisSection
            title="Cash Flow Analysis"
            icon={DollarSign}
            isDark={isDark}
            color="emerald"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                label="Gross Annual Income"
                value={formatCurrency(metrics.grossAnnualIncome)}
                helpText="Total rental + other income"
                isDark={isDark}
              />
              <MetricCard
                label="Operating Expenses"
                value={formatCurrency(metrics.totalOperatingExpenses)}
                helpText="Taxes, insurance, maintenance, etc."
                isDark={isDark}
              />
              <MetricCard
                label="NOI"
                value={formatCurrency(metrics.noi)}
                glossarySlug="noi"
                helpText="Income minus operating expenses"
                isDark={isDark}
              />
              <MetricCard
                label="Monthly Cash Flow"
                value={formatCurrency(metrics.monthlyCashFlow)}
                glossarySlug="cash-flow"
                helpText="After debt service"
                highlight={metrics.monthlyCashFlow > 0}
                isDark={isDark}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <MetricCard
                label="Cash-on-Cash Return"
                value={formatPercent(metrics.cashOnCash)}
                glossarySlug="cash-on-cash-return"
                helpText="Annual cash flow / Cash invested"
                highlight={metrics.cashOnCash >= 8}
                isDark={isDark}
              />
              <MetricCard
                label="Total Cash Invested"
                value={formatCurrency(metrics.totalCashInvested)}
                helpText="Down payment + closing costs"
                isDark={isDark}
              />
            </div>
            <InfoBox isDark={isDark}>
              <strong>Cash-on-Cash Return</strong> is one of the most important metrics
              for real estate investors because it shows your actual return on the
              money you put into the deal. A typical target is 8-12% annually.
            </InfoBox>
          </AnalysisSection>

          {/* Tax Benefits Section */}
          <AnalysisSection
            title="Tax Benefits"
            icon={PiggyBank}
            isDark={isDark}
            color="amber"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                label="Annual Depreciation"
                value={formatCurrency(metrics.annualDepreciation)}
                glossarySlug="depreciation"
                helpText="Building value / 27.5 years"
                isDark={isDark}
              />
              <MetricCard
                label="Est. Tax Savings (24%)"
                value={formatCurrency(metrics.taxSavings)}
                helpText="Depreciation × tax rate"
                highlight
                isDark={isDark}
              />
              <MetricCard
                label="Effective Return Boost"
                value={formatPercent(
                  metrics.totalCashInvested > 0
                    ? (metrics.taxSavings / metrics.totalCashInvested) * 100
                    : 0
                )}
                helpText="Tax savings as % of investment"
                isDark={isDark}
              />
            </div>
            <InfoBox isDark={isDark}>
              <strong>Depreciation</strong> is a &quot;paper loss&quot; that reduces your taxable
              income even though you didn&apos;t spend any money. Residential properties
              depreciate over 27.5 years. Consider a <strong>cost segregation study</strong>{" "}
              to accelerate depreciation on high-value properties.
            </InfoBox>
          </AnalysisSection>

          {/* Leverage Section */}
          <AnalysisSection
            title="Leverage Analysis"
            icon={Calculator}
            isDark={isDark}
            color="blue"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                label="Total Loan Balance"
                value={formatCurrency(metrics.totalLoanBalance)}
                helpText="Outstanding debt"
                isDark={isDark}
              />
              <MetricCard
                label="Equity"
                value={formatCurrency(metrics.equity)}
                glossarySlug="equity"
                helpText="Value minus debt"
                highlight={metrics.equity > 0}
                isDark={isDark}
              />
              <MetricCard
                label="LTV"
                value={formatPercent(metrics.ltv)}
                glossarySlug="ltv"
                helpText="Loan / Value"
                isDark={isDark}
              />
              <MetricCard
                label="DSCR"
                value={metrics.dscr.toFixed(2)}
                glossarySlug="dscr"
                helpText="NOI / Debt Service"
                highlight={metrics.dscr >= 1.25}
                isDark={isDark}
              />
            </div>
            <InfoBox isDark={isDark}>
              <strong>DSCR (Debt Service Coverage Ratio)</strong> shows how many times
              your NOI covers your debt payments. Lenders typically require 1.20-1.25+
              for investment properties. A DSCR of 1.25 means you have 25% cushion
              above your loan payments.
            </InfoBox>
          </AnalysisSection>

          {/* Calculator Links */}
          <div
            className={cn(
              "p-6 rounded-2xl border",
              isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
            )}
          >
            <div
              className={cn(
                "text-sm font-bold mb-4",
                isDark ? "text-white" : "text-slate-900"
              )}
            >
              Try Different Scenarios
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/learning-hub/calculators"
                hash="cap-rate-calculator"
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  isDark
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <Calculator size={16} />
                Cap Rate Calculator
                <ChevronRight size={14} />
              </Link>
              <Link
                to="/learning-hub/calculators"
                hash="cash-on-cash-calculator"
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  isDark
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <DollarSign size={16} />
                Cash-on-Cash Calculator
                <ChevronRight size={14} />
              </Link>
              <Link
                to="/learning-hub/calculators"
                hash="dscr-calculator"
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  isDark
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <TrendingUp size={16} />
                DSCR Calculator
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Analysis Section Component
interface AnalysisSectionProps {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: "violet" | "emerald" | "amber" | "blue";
  isDark: boolean;
  children: React.ReactNode;
}

function AnalysisSection({
  title,
  icon: Icon,
  color,
  isDark,
  children,
}: AnalysisSectionProps) {
  const colorClasses = {
    violet: isDark ? "bg-violet-500/20 text-violet-400" : "bg-violet-100 text-violet-600",
    emerald: isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600",
    amber: isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600",
    blue: isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-6",
        isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-slate-200"
      )}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            colorClasses[color]
          )}
        >
          <Icon size={20} />
        </div>
        <h2
          className={cn(
            "text-lg font-bold",
            isDark ? "text-white" : "text-slate-900"
          )}
        >
          {title}
        </h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: string;
  helpText?: string;
  glossarySlug?: string;
  highlight?: boolean;
  isDark: boolean;
}

function MetricCard({
  label,
  value,
  helpText,
  glossarySlug,
  highlight,
  isDark,
}: MetricCardProps) {
  const content = (
    <div
      className={cn(
        "p-4 rounded-lg",
        highlight
          ? isDark
            ? "bg-[#E8FF4D]/10"
            : "bg-violet-50"
          : isDark
            ? "bg-white/5"
            : "bg-slate-50"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div
          className={cn(
            "text-xs font-bold uppercase tracking-wider",
            isDark ? "text-white/60" : "text-slate-500"
          )}
        >
          {label}
        </div>
        {glossarySlug && (
          <HelpCircle
            size={14}
            className={cn(
              "flex-shrink-0",
              isDark ? "text-white/40" : "text-slate-400"
            )}
          />
        )}
      </div>
      <div
        className={cn(
          "text-xl font-black",
          highlight
            ? isDark
              ? "text-[#E8FF4D]"
              : "text-violet-700"
            : isDark
              ? "text-white"
              : "text-slate-900"
        )}
      >
        {value}
      </div>
      {helpText && (
        <div
          className={cn(
            "text-xs mt-1",
            isDark ? "text-white/40" : "text-slate-400"
          )}
        >
          {helpText}
        </div>
      )}
    </div>
  );

  if (glossarySlug) {
    return (
      <Link
        to="/learning-hub/glossary/$slug"
        params={{ slug: glossarySlug }}
        className="block hover:scale-[1.02] transition-transform"
      >
        {content}
      </Link>
    );
  }

  return content;
}

// Info Box Component
interface InfoBoxProps {
  isDark: boolean;
  children: React.ReactNode;
}

function InfoBox({ isDark, children }: InfoBoxProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg text-sm",
        isDark ? "bg-white/5 text-white/70" : "bg-blue-50 text-blue-800"
      )}
    >
      {children}
    </div>
  );
}
