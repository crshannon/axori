import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Info,
  Landmark,
  Percent,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";

export const Route = createFileRoute("/_authed/learning-hub/calculators/")({
  component: CalculatorsPage,
});

// Calculator definitions
interface CalculatorDef {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  glossaryRef?: string;
}

const CALCULATORS: Array<CalculatorDef> = [
  {
    id: "cap-rate-calculator",
    title: "Cap Rate Calculator",
    description: "Calculate capitalization rate to compare property values",
    icon: TrendingUp,
    glossaryRef: "cap-rate",
  },
  {
    id: "cash-on-cash-calculator",
    title: "Cash-on-Cash Return",
    description: "Measure annual return on cash invested in a property",
    icon: DollarSign,
    glossaryRef: "cash-on-cash-return",
  },
  {
    id: "dscr-calculator",
    title: "DSCR Calculator",
    description: "Calculate Debt Service Coverage Ratio for loan qualification",
    icon: Landmark,
    glossaryRef: "dscr",
  },
  {
    id: "mortgage-calculator",
    title: "Mortgage Calculator",
    description: "Calculate monthly payments and total interest",
    icon: Calculator,
    glossaryRef: "amortization",
  },
  {
    id: "depreciation-calculator",
    title: "Depreciation Calculator",
    description: "Estimate annual depreciation deduction for tax benefits",
    icon: Percent,
    glossaryRef: "depreciation",
  },
];

function CalculatorsPage() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const [expandedCalculator, setExpandedCalculator] = useState<string | null>(
    "cap-rate-calculator"
  );

  // Scroll to calculator if hash is present
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && CALCULATORS.some((c) => c.id === hash)) {
      setExpandedCalculator(hash);
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

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
          Calculator Hub
        </h1>
        <p className={cn("text-sm", isDark ? "text-white/60" : "text-slate-500")}>
          Interactive calculators to analyze deals and understand key metrics.
        </p>
      </div>

      {/* Calculator List */}
      <div className="space-y-4">
        {CALCULATORS.map((calc) => {
          const isExpanded = expandedCalculator === calc.id;
          const Icon = calc.icon;

          return (
            <div
              key={calc.id}
              id={calc.id}
              className={cn(
                "rounded-2xl border overflow-hidden transition-all duration-300",
                isDark ? "border-white/10" : "border-slate-200"
              )}
            >
              {/* Calculator Header */}
              <button
                onClick={() =>
                  setExpandedCalculator(isExpanded ? null : calc.id)
                }
                className={cn(
                  "w-full p-4 flex items-center gap-4 text-left transition-colors",
                  isDark
                    ? "bg-white/5 hover:bg-white/10"
                    : "bg-slate-50 hover:bg-slate-100"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border",
                    isDark
                      ? "bg-gradient-to-br from-[#E8FF4D]/20 to-[#E8FF4D]/5 border-[#E8FF4D]/20 text-[#E8FF4D]"
                      : "bg-gradient-to-br from-violet-100 to-violet-50 border-violet-200 text-violet-600"
                  )}
                >
                  <Icon size={24} />
                </div>
                <div className="flex-grow">
                  <h3
                    className={cn(
                      "font-bold",
                      isDark ? "text-white" : "text-slate-900"
                    )}
                  >
                    {calc.title}
                  </h3>
                  <p
                    className={cn(
                      "text-sm",
                      isDark ? "text-white/60" : "text-slate-500"
                    )}
                  >
                    {calc.description}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp
                    size={20}
                    className={isDark ? "text-white/50" : "text-slate-400"}
                  />
                ) : (
                  <ChevronDown
                    size={20}
                    className={isDark ? "text-white/50" : "text-slate-400"}
                  />
                )}
              </button>

              {/* Calculator Content */}
              {isExpanded && (
                <div
                  className={cn(
                    "p-6",
                    isDark ? "bg-white/[0.02]" : "bg-white"
                  )}
                >
                  {calc.id === "cap-rate-calculator" && (
                    <CapRateCalculator isDark={isDark} />
                  )}
                  {calc.id === "cash-on-cash-calculator" && (
                    <CashOnCashCalculator isDark={isDark} />
                  )}
                  {calc.id === "dscr-calculator" && (
                    <DSCRCalculator isDark={isDark} />
                  )}
                  {calc.id === "mortgage-calculator" && (
                    <MortgageCalculator isDark={isDark} />
                  )}
                  {calc.id === "depreciation-calculator" && (
                    <DepreciationCalculator isDark={isDark} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Shared Input Component
interface CalculatorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  helpText?: string;
  isDark: boolean;
}

function CalculatorInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  helpText,
  isDark,
}: CalculatorInputProps) {
  return (
    <div className="space-y-1">
      <label
        className={cn(
          "block text-sm font-medium",
          isDark ? "text-white/80" : "text-slate-700"
        )}
      >
        {label}
        {helpText && (
          <span
            className={cn(
              "ml-2 text-xs font-normal",
              isDark ? "text-white/40" : "text-slate-400"
            )}
          >
            ({helpText})
          </span>
        )}
      </label>
      <div className="relative">
        {prefix && (
          <span
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 text-sm",
              isDark ? "text-white/40" : "text-slate-400"
            )}
          >
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            // Allow only numbers, decimals, and empty
            const v = e.target.value.replace(/[^0-9.]/g, "");
            onChange(v);
          }}
          className={cn(
            "w-full py-2.5 rounded-lg border text-sm outline-none transition-colors",
            prefix ? "pl-8" : "pl-3",
            suffix ? "pr-12" : "pr-3",
            isDark
              ? "bg-white/5 border-white/10 text-white focus:border-[#E8FF4D]/50"
              : "bg-white border-slate-200 text-slate-900 focus:border-violet-300"
          )}
        />
        {suffix && (
          <span
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 text-sm",
              isDark ? "text-white/40" : "text-slate-400"
            )}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// Shared Result Display
interface CalculatorResultProps {
  label: string;
  value: string;
  highlight?: boolean;
  isDark: boolean;
}

function CalculatorResult({
  label,
  value,
  highlight,
  isDark,
}: CalculatorResultProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg",
        highlight
          ? isDark
            ? "bg-[#E8FF4D]/20"
            : "bg-violet-100"
          : isDark
            ? "bg-white/5"
            : "bg-slate-50"
      )}
    >
      <div
        className={cn(
          "text-xs font-bold uppercase tracking-wider mb-1",
          isDark ? "text-white/60" : "text-slate-500"
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "text-2xl font-black",
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
    </div>
  );
}

// Cap Rate Calculator
function CapRateCalculator({ isDark }: { isDark: boolean }) {
  const [noi, setNoi] = useState("50000");
  const [propertyValue, setPropertyValue] = useState("500000");

  const capRate =
    parseFloat(noi) && parseFloat(propertyValue)
      ? ((parseFloat(noi) / parseFloat(propertyValue)) * 100).toFixed(2)
      : "0.00";

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "p-4 rounded-lg flex gap-3",
          isDark ? "bg-white/5" : "bg-blue-50"
        )}
      >
        <Info
          size={18}
          className={isDark ? "text-white/60 flex-shrink-0" : "text-blue-600 flex-shrink-0"}
        />
        <div
          className={cn("text-sm", isDark ? "text-white/60" : "text-blue-800")}
        >
          <strong>Cap Rate = NOI / Property Value</strong>
          <br />
          Cap rate measures return independent of financing. Higher cap rates
          indicate higher returns but often higher risk.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CalculatorInput
          label="Net Operating Income (NOI)"
          value={noi}
          onChange={setNoi}
          prefix="$"
          helpText="Annual"
          isDark={isDark}
        />
        <CalculatorInput
          label="Property Value"
          value={propertyValue}
          onChange={setPropertyValue}
          prefix="$"
          isDark={isDark}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CalculatorResult
          label="Cap Rate"
          value={`${capRate}%`}
          highlight
          isDark={isDark}
        />
        <CalculatorResult
          label="NOI"
          value={`$${parseInt(noi || "0").toLocaleString()}`}
          isDark={isDark}
        />
        <CalculatorResult
          label="Property Value"
          value={`$${parseInt(propertyValue || "0").toLocaleString()}`}
          isDark={isDark}
        />
      </div>
    </div>
  );
}

// Cash-on-Cash Calculator
function CashOnCashCalculator({ isDark }: { isDark: boolean }) {
  const [annualCashFlow, setAnnualCashFlow] = useState("6000");
  const [totalCashInvested, setTotalCashInvested] = useState("50000");

  const cashOnCash =
    parseFloat(annualCashFlow) && parseFloat(totalCashInvested)
      ? ((parseFloat(annualCashFlow) / parseFloat(totalCashInvested)) * 100).toFixed(2)
      : "0.00";

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "p-4 rounded-lg flex gap-3",
          isDark ? "bg-white/5" : "bg-blue-50"
        )}
      >
        <Info
          size={18}
          className={isDark ? "text-white/60 flex-shrink-0" : "text-blue-600 flex-shrink-0"}
        />
        <div
          className={cn("text-sm", isDark ? "text-white/60" : "text-blue-800")}
        >
          <strong>Cash-on-Cash = Annual Cash Flow / Total Cash Invested</strong>
          <br />
          This measures your actual return on the cash you put into the deal,
          accounting for leverage.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CalculatorInput
          label="Annual Cash Flow"
          value={annualCashFlow}
          onChange={setAnnualCashFlow}
          prefix="$"
          helpText="After all expenses & debt"
          isDark={isDark}
        />
        <CalculatorInput
          label="Total Cash Invested"
          value={totalCashInvested}
          onChange={setTotalCashInvested}
          prefix="$"
          helpText="Down payment + closing costs"
          isDark={isDark}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CalculatorResult
          label="Cash-on-Cash Return"
          value={`${cashOnCash}%`}
          highlight
          isDark={isDark}
        />
        <CalculatorResult
          label="Monthly Cash Flow"
          value={`$${Math.round(parseFloat(annualCashFlow || "0") / 12).toLocaleString()}`}
          isDark={isDark}
        />
        <CalculatorResult
          label="Total Invested"
          value={`$${parseInt(totalCashInvested || "0").toLocaleString()}`}
          isDark={isDark}
        />
      </div>
    </div>
  );
}

// DSCR Calculator
function DSCRCalculator({ isDark }: { isDark: boolean }) {
  const [noi, setNoi] = useState("50000");
  const [annualDebtService, setAnnualDebtService] = useState("40000");

  const dscr =
    parseFloat(noi) && parseFloat(annualDebtService)
      ? (parseFloat(noi) / parseFloat(annualDebtService)).toFixed(2)
      : "0.00";

  const dscrNum = parseFloat(dscr);
  const dscrStatus =
    dscrNum >= 1.25 ? "Strong" : dscrNum >= 1.0 ? "Borderline" : "Below 1.0";
  const dscrColor =
    dscrNum >= 1.25 ? "emerald" : dscrNum >= 1.0 ? "amber" : "rose";

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "p-4 rounded-lg flex gap-3",
          isDark ? "bg-white/5" : "bg-blue-50"
        )}
      >
        <Info
          size={18}
          className={isDark ? "text-white/60 flex-shrink-0" : "text-blue-600 flex-shrink-0"}
        />
        <div
          className={cn("text-sm", isDark ? "text-white/60" : "text-blue-800")}
        >
          <strong>DSCR = NOI / Annual Debt Service</strong>
          <br />
          Lenders typically require DSCR of 1.20-1.25+. A DSCR of 1.25 means
          income exceeds debt payments by 25%.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CalculatorInput
          label="Net Operating Income (NOI)"
          value={noi}
          onChange={setNoi}
          prefix="$"
          helpText="Annual"
          isDark={isDark}
        />
        <CalculatorInput
          label="Annual Debt Service"
          value={annualDebtService}
          onChange={setAnnualDebtService}
          prefix="$"
          helpText="P&I payments"
          isDark={isDark}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CalculatorResult
          label="DSCR"
          value={dscr}
          highlight
          isDark={isDark}
        />
        <div
          className={cn(
            "p-4 rounded-lg",
            isDark ? "bg-white/5" : "bg-slate-50"
          )}
        >
          <div
            className={cn(
              "text-xs font-bold uppercase tracking-wider mb-1",
              isDark ? "text-white/60" : "text-slate-500"
            )}
          >
            Status
          </div>
          <div
            className={cn(
              "text-lg font-bold",
              dscrColor === "emerald" &&
                (isDark ? "text-emerald-400" : "text-emerald-600"),
              dscrColor === "amber" &&
                (isDark ? "text-amber-400" : "text-amber-600"),
              dscrColor === "rose" && (isDark ? "text-rose-400" : "text-rose-600")
            )}
          >
            {dscrStatus}
          </div>
        </div>
        <CalculatorResult
          label="Monthly Debt Service"
          value={`$${Math.round(parseFloat(annualDebtService || "0") / 12).toLocaleString()}`}
          isDark={isDark}
        />
      </div>
    </div>
  );
}

// Mortgage Calculator
function MortgageCalculator({ isDark }: { isDark: boolean }) {
  const [loanAmount, setLoanAmount] = useState("400000");
  const [interestRate, setInterestRate] = useState("7.0");
  const [loanTerm, setLoanTerm] = useState("30");

  const principal = parseFloat(loanAmount) || 0;
  const rate = (parseFloat(interestRate) || 0) / 100 / 12;
  const payments = (parseFloat(loanTerm) || 30) * 12;

  let monthlyPayment = 0;
  let totalPayment = 0;
  let totalInterest = 0;

  if (principal > 0 && rate > 0 && payments > 0) {
    monthlyPayment =
      (principal * (rate * Math.pow(1 + rate, payments))) /
      (Math.pow(1 + rate, payments) - 1);
    totalPayment = monthlyPayment * payments;
    totalInterest = totalPayment - principal;
  }

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "p-4 rounded-lg flex gap-3",
          isDark ? "bg-white/5" : "bg-blue-50"
        )}
      >
        <Info
          size={18}
          className={isDark ? "text-white/60 flex-shrink-0" : "text-blue-600 flex-shrink-0"}
        />
        <div
          className={cn("text-sm", isDark ? "text-white/60" : "text-blue-800")}
        >
          Calculate your monthly mortgage payment using the standard amortization
          formula. Includes principal and interest only (not taxes/insurance).
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CalculatorInput
          label="Loan Amount"
          value={loanAmount}
          onChange={setLoanAmount}
          prefix="$"
          isDark={isDark}
        />
        <CalculatorInput
          label="Interest Rate"
          value={interestRate}
          onChange={setInterestRate}
          suffix="%"
          helpText="Annual"
          isDark={isDark}
        />
        <CalculatorInput
          label="Loan Term"
          value={loanTerm}
          onChange={setLoanTerm}
          suffix="years"
          isDark={isDark}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CalculatorResult
          label="Monthly Payment"
          value={`$${Math.round(monthlyPayment).toLocaleString()}`}
          highlight
          isDark={isDark}
        />
        <CalculatorResult
          label="Total Payment"
          value={`$${Math.round(totalPayment).toLocaleString()}`}
          isDark={isDark}
        />
        <CalculatorResult
          label="Total Interest"
          value={`$${Math.round(totalInterest).toLocaleString()}`}
          isDark={isDark}
        />
        <CalculatorResult
          label="Interest Ratio"
          value={`${principal > 0 ? ((totalInterest / principal) * 100).toFixed(0) : 0}%`}
          isDark={isDark}
        />
      </div>
    </div>
  );
}

// Depreciation Calculator
function DepreciationCalculator({ isDark }: { isDark: boolean }) {
  const [buildingValue, setBuildingValue] = useState("320000");
  const [landValue, setLandValue] = useState("80000");
  const [propertyType, setPropertyType] = useState<"residential" | "commercial">(
    "residential"
  );

  const depreciableBase = parseFloat(buildingValue) || 0;
  const years = propertyType === "residential" ? 27.5 : 39;
  const annualDepreciation = depreciableBase / years;
  const monthlyDepreciation = annualDepreciation / 12;

  // Assuming 24% tax bracket
  const taxSavings = annualDepreciation * 0.24;

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "p-4 rounded-lg flex gap-3",
          isDark ? "bg-white/5" : "bg-blue-50"
        )}
      >
        <Info
          size={18}
          className={isDark ? "text-white/60 flex-shrink-0" : "text-blue-600 flex-shrink-0"}
        />
        <div
          className={cn("text-sm", isDark ? "text-white/60" : "text-blue-800")}
        >
          <strong>
            Annual Depreciation = Building Value / {years} years
          </strong>
          <br />
          Only the building (not land) can be depreciated. Residential is 27.5
          years, commercial is 39 years.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CalculatorInput
          label="Building Value"
          value={buildingValue}
          onChange={setBuildingValue}
          prefix="$"
          helpText="Structure only"
          isDark={isDark}
        />
        <CalculatorInput
          label="Land Value"
          value={landValue}
          onChange={setLandValue}
          prefix="$"
          helpText="Not depreciable"
          isDark={isDark}
        />
        <div className="space-y-1">
          <label
            className={cn(
              "block text-sm font-medium",
              isDark ? "text-white/80" : "text-slate-700"
            )}
          >
            Property Type
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setPropertyType("residential")}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors",
                propertyType === "residential"
                  ? isDark
                    ? "bg-[#E8FF4D] text-black"
                    : "bg-violet-600 text-white"
                  : isDark
                    ? "bg-white/10 text-white"
                    : "bg-slate-100 text-slate-700"
              )}
            >
              Residential
            </button>
            <button
              onClick={() => setPropertyType("commercial")}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors",
                propertyType === "commercial"
                  ? isDark
                    ? "bg-[#E8FF4D] text-black"
                    : "bg-violet-600 text-white"
                  : isDark
                    ? "bg-white/10 text-white"
                    : "bg-slate-100 text-slate-700"
              )}
            >
              Commercial
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CalculatorResult
          label="Annual Depreciation"
          value={`$${Math.round(annualDepreciation).toLocaleString()}`}
          highlight
          isDark={isDark}
        />
        <CalculatorResult
          label="Monthly Depreciation"
          value={`$${Math.round(monthlyDepreciation).toLocaleString()}`}
          isDark={isDark}
        />
        <CalculatorResult
          label={`Est. Tax Savings (24%)`}
          value={`$${Math.round(taxSavings).toLocaleString()}`}
          isDark={isDark}
        />
        <CalculatorResult
          label="Depreciation Period"
          value={`${years} years`}
          isDark={isDark}
        />
      </div>
    </div>
  );
}
