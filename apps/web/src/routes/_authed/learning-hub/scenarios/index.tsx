import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  DollarSign,
  Home,
  Percent,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";

export const Route = createFileRoute("/_authed/learning-hub/scenarios/")({
  component: ScenariosPage,
});

// Scenario types
type ScenarioType = "rate-change" | "vacancy" | "appreciation" | "refinance";

interface ScenarioInputs {
  propertyValue: number;
  monthlyRent: number;
  currentRate: number;
  loanBalance: number;
  loanTerm: number;
  vacancyRate: number;
  operatingExpenses: number;
}

const DEFAULT_INPUTS: ScenarioInputs = {
  propertyValue: 400000,
  monthlyRent: 2500,
  currentRate: 7.0,
  loanBalance: 320000,
  loanTerm: 30,
  vacancyRate: 5,
  operatingExpenses: 800,
};

function ScenariosPage() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const [activeScenario, setActiveScenario] = useState<ScenarioType>("rate-change");
  const [inputs, setInputs] = useState<ScenarioInputs>(DEFAULT_INPUTS);

  const updateInput = (key: keyof ScenarioInputs, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputs((prev) => ({ ...prev, [key]: numValue }));
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
          Scenario Modeler
        </h1>
        <p className={cn("text-sm", isDark ? "text-white/60" : "text-slate-500")}>
          Explore what-if scenarios to understand how changes affect your investment.
        </p>
      </div>

      {/* Base Property Inputs */}
      <div
        className={cn(
          "rounded-2xl border p-6 mb-8",
          isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
        )}
      >
        <div
          className={cn(
            "text-xs font-bold uppercase tracking-wider mb-4",
            isDark ? "text-white/60" : "text-slate-500"
          )}
        >
          Base Property Data
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <ScenarioInput
            label="Property Value"
            value={inputs.propertyValue}
            onChange={(v) => updateInput("propertyValue", v)}
            prefix="$"
            isDark={isDark}
          />
          <ScenarioInput
            label="Monthly Rent"
            value={inputs.monthlyRent}
            onChange={(v) => updateInput("monthlyRent", v)}
            prefix="$"
            isDark={isDark}
          />
          <ScenarioInput
            label="Loan Balance"
            value={inputs.loanBalance}
            onChange={(v) => updateInput("loanBalance", v)}
            prefix="$"
            isDark={isDark}
          />
          <ScenarioInput
            label="Interest Rate"
            value={inputs.currentRate}
            onChange={(v) => updateInput("currentRate", v)}
            suffix="%"
            isDark={isDark}
          />
          <ScenarioInput
            label="Loan Term"
            value={inputs.loanTerm}
            onChange={(v) => updateInput("loanTerm", v)}
            suffix="yrs"
            isDark={isDark}
          />
          <ScenarioInput
            label="Vacancy Rate"
            value={inputs.vacancyRate}
            onChange={(v) => updateInput("vacancyRate", v)}
            suffix="%"
            isDark={isDark}
          />
          <ScenarioInput
            label="Monthly Expenses"
            value={inputs.operatingExpenses}
            onChange={(v) => updateInput("operatingExpenses", v)}
            prefix="$"
            isDark={isDark}
          />
        </div>
      </div>

      {/* Scenario Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <ScenarioTab
          active={activeScenario === "rate-change"}
          onClick={() => setActiveScenario("rate-change")}
          icon={Percent}
          label="Interest Rate Impact"
          isDark={isDark}
        />
        <ScenarioTab
          active={activeScenario === "vacancy"}
          onClick={() => setActiveScenario("vacancy")}
          icon={Home}
          label="Vacancy Impact"
          isDark={isDark}
        />
        <ScenarioTab
          active={activeScenario === "appreciation"}
          onClick={() => setActiveScenario("appreciation")}
          icon={TrendingUp}
          label="Appreciation Scenarios"
          isDark={isDark}
        />
        <ScenarioTab
          active={activeScenario === "refinance"}
          onClick={() => setActiveScenario("refinance")}
          icon={RefreshCw}
          label="Refinance Analysis"
          isDark={isDark}
        />
      </div>

      {/* Scenario Content */}
      {activeScenario === "rate-change" && (
        <RateChangeScenario inputs={inputs} isDark={isDark} />
      )}
      {activeScenario === "vacancy" && (
        <VacancyScenario inputs={inputs} isDark={isDark} />
      )}
      {activeScenario === "appreciation" && (
        <AppreciationScenario inputs={inputs} isDark={isDark} />
      )}
      {activeScenario === "refinance" && (
        <RefinanceScenario inputs={inputs} isDark={isDark} />
      )}
    </div>
  );
}

// Scenario Input Component
interface ScenarioInputProps {
  label: string;
  value: number;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  isDark: boolean;
}

function ScenarioInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  isDark,
}: ScenarioInputProps) {
  return (
    <div>
      <label
        className={cn(
          "block text-xs font-medium mb-1",
          isDark ? "text-white/60" : "text-slate-500"
        )}
      >
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 text-xs",
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
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          className={cn(
            "w-full py-2 rounded-lg border text-sm outline-none transition-colors",
            prefix ? "pl-6" : "pl-3",
            suffix ? "pr-10" : "pr-3",
            isDark
              ? "bg-white/10 border-white/20 text-white focus:border-[#E8FF4D]/50"
              : "bg-white border-slate-200 text-slate-900 focus:border-violet-300"
          )}
        />
        {suffix && (
          <span
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 text-xs",
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

// Scenario Tab Component
interface ScenarioTabProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  isDark: boolean;
}

function ScenarioTab({
  active,
  onClick,
  icon: Icon,
  label,
  isDark,
}: ScenarioTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
        active
          ? isDark
            ? "bg-[#E8FF4D] text-black"
            : "bg-violet-600 text-white"
          : isDark
            ? "bg-white/5 border border-white/10 text-white hover:bg-white/10"
            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
      )}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

// Calculate monthly payment
function calculatePayment(principal: number, rate: number, termYears: number): number {
  if (principal <= 0 || rate <= 0 || termYears <= 0) return 0;
  const monthlyRate = rate / 100 / 12;
  const payments = termYears * 12;
  return (
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, payments))) /
    (Math.pow(1 + monthlyRate, payments) - 1)
  );
}

// Rate Change Scenario
function RateChangeScenario({
  inputs,
  isDark,
}: {
  inputs: ScenarioInputs;
  isDark: boolean;
}) {
  const scenarios = useMemo(() => {
    const rates = [-2, -1, 0, 1, 2];
    return rates.map((delta) => {
      const newRate = inputs.currentRate + delta;
      const payment = calculatePayment(inputs.loanBalance, newRate, inputs.loanTerm);
      const currentPayment = calculatePayment(
        inputs.loanBalance,
        inputs.currentRate,
        inputs.loanTerm
      );
      const monthlyChange = payment - currentPayment;
      const annualChange = monthlyChange * 12;

      // Calculate cash flow
      const effectiveRent = inputs.monthlyRent * (1 - inputs.vacancyRate / 100);
      const cashFlow = effectiveRent - inputs.operatingExpenses - payment;

      return {
        rate: newRate,
        delta,
        payment,
        monthlyChange,
        annualChange,
        cashFlow,
      };
    });
  }, [inputs]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(v);

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
            isDark ? "bg-violet-500/20 text-violet-400" : "bg-violet-100 text-violet-600"
          )}
        >
          <Percent size={20} />
        </div>
        <div>
          <h2
            className={cn(
              "text-lg font-bold",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            Interest Rate Impact
          </h2>
          <p
            className={cn(
              "text-sm",
              isDark ? "text-white/60" : "text-slate-500"
            )}
          >
            See how rate changes affect your monthly payment and cash flow
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className={cn(
                "text-xs font-bold uppercase tracking-wider",
                isDark ? "text-white/60" : "text-slate-500"
              )}
            >
              <th className="text-left py-3 pr-4">Rate</th>
              <th className="text-right py-3 px-4">Monthly Payment</th>
              <th className="text-right py-3 px-4">Change</th>
              <th className="text-right py-3 px-4">Annual Impact</th>
              <th className="text-right py-3 pl-4">Monthly Cash Flow</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s) => (
              <tr
                key={s.rate}
                className={cn(
                  "border-t",
                  isDark ? "border-white/5" : "border-slate-100",
                  s.delta === 0 &&
                    (isDark ? "bg-[#E8FF4D]/10" : "bg-violet-50")
                )}
              >
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-bold",
                        isDark ? "text-white" : "text-slate-900"
                      )}
                    >
                      {s.rate.toFixed(1)}%
                    </span>
                    {s.delta !== 0 && (
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          s.delta > 0
                            ? isDark
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-rose-100 text-rose-700"
                            : isDark
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        {s.delta > 0 ? `+${s.delta}%` : `${s.delta}%`}
                      </span>
                    )}
                    {s.delta === 0 && (
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          isDark
                            ? "bg-white/10 text-white/60"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        Current
                      </span>
                    )}
                  </div>
                </td>
                <td
                  className={cn(
                    "text-right py-4 px-4 font-mono",
                    isDark ? "text-white" : "text-slate-900"
                  )}
                >
                  {formatCurrency(s.payment)}
                </td>
                <td className="text-right py-4 px-4">
                  {s.delta !== 0 && (
                    <div
                      className={cn(
                        "inline-flex items-center gap-1 font-mono",
                        s.monthlyChange > 0
                          ? isDark
                            ? "text-rose-400"
                            : "text-rose-600"
                          : isDark
                            ? "text-emerald-400"
                            : "text-emerald-600"
                      )}
                    >
                      {s.monthlyChange > 0 ? (
                        <ArrowUp size={14} />
                      ) : (
                        <ArrowDown size={14} />
                      )}
                      {formatCurrency(Math.abs(s.monthlyChange))}
                    </div>
                  )}
                  {s.delta === 0 && (
                    <span className={isDark ? "text-white/40" : "text-slate-400"}>
                      —
                    </span>
                  )}
                </td>
                <td className="text-right py-4 px-4">
                  {s.delta !== 0 && (
                    <span
                      className={cn(
                        "font-mono",
                        s.annualChange > 0
                          ? isDark
                            ? "text-rose-400"
                            : "text-rose-600"
                          : isDark
                            ? "text-emerald-400"
                            : "text-emerald-600"
                      )}
                    >
                      {s.annualChange > 0 ? "+" : ""}
                      {formatCurrency(s.annualChange)}
                    </span>
                  )}
                  {s.delta === 0 && (
                    <span className={isDark ? "text-white/40" : "text-slate-400"}>
                      —
                    </span>
                  )}
                </td>
                <td
                  className={cn(
                    "text-right py-4 pl-4 font-mono font-bold",
                    s.cashFlow >= 0
                      ? isDark
                        ? "text-emerald-400"
                        : "text-emerald-600"
                      : isDark
                        ? "text-rose-400"
                        : "text-rose-600"
                  )}
                >
                  {formatCurrency(s.cashFlow)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className={cn(
          "mt-6 p-4 rounded-lg text-sm",
          isDark ? "bg-white/5 text-white/70" : "bg-blue-50 text-blue-800"
        )}
      >
        <strong>Key Insight:</strong> Every 1% increase in interest rate adds
        approximately {formatCurrency(Math.abs(scenarios[3].monthlyChange))} to your
        monthly payment on this loan. Consider locking in rates when they&apos;re
        favorable.
      </div>
    </div>
  );
}

// Vacancy Scenario
function VacancyScenario({
  inputs,
  isDark,
}: {
  inputs: ScenarioInputs;
  isDark: boolean;
}) {
  const scenarios = useMemo(() => {
    const vacancies = [0, 5, 8, 10, 15, 20];
    const monthlyPayment = calculatePayment(
      inputs.loanBalance,
      inputs.currentRate,
      inputs.loanTerm
    );

    return vacancies.map((vacancy) => {
      const effectiveRent = inputs.monthlyRent * (1 - vacancy / 100);
      const monthlyIncome = effectiveRent;
      const monthlyCashFlow = monthlyIncome - inputs.operatingExpenses - monthlyPayment;
      const annualCashFlow = monthlyCashFlow * 12;
      const lostRent = (inputs.monthlyRent * vacancy) / 100;

      return {
        vacancy,
        effectiveRent,
        lostRent,
        monthlyCashFlow,
        annualCashFlow,
        isBreakeven: Math.abs(monthlyCashFlow) < 50,
        isNegative: monthlyCashFlow < -50,
      };
    });
  }, [inputs]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(v);

  // Find breakeven vacancy
  const breakevenVacancy = useMemo(() => {
    for (let v = 0; v <= 100; v++) {
      const effectiveRent = inputs.monthlyRent * (1 - v / 100);
      const monthlyPayment = calculatePayment(
        inputs.loanBalance,
        inputs.currentRate,
        inputs.loanTerm
      );
      const cashFlow = effectiveRent - inputs.operatingExpenses - monthlyPayment;
      if (cashFlow <= 0) return v;
    }
    return 100;
  }, [inputs]);

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
            isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600"
          )}
        >
          <Home size={20} />
        </div>
        <div>
          <h2
            className={cn(
              "text-lg font-bold",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            Vacancy Impact
          </h2>
          <p
            className={cn(
              "text-sm",
              isDark ? "text-white/60" : "text-slate-500"
            )}
          >
            Understand how vacancy affects your cash flow
          </p>
        </div>
      </div>

      {/* Breakeven Alert */}
      <div
        className={cn(
          "mb-6 p-4 rounded-lg",
          isDark ? "bg-amber-500/20" : "bg-amber-50"
        )}
      >
        <div
          className={cn(
            "text-sm font-bold",
            isDark ? "text-amber-400" : "text-amber-800"
          )}
        >
          Breakeven Vacancy Rate: {breakevenVacancy}%
        </div>
        <div
          className={cn(
            "text-sm",
            isDark ? "text-amber-400/70" : "text-amber-700"
          )}
        >
          Your property can tolerate up to {breakevenVacancy}% vacancy before going
          cash flow negative.
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {scenarios.map((s) => (
          <div
            key={s.vacancy}
            className={cn(
              "p-4 rounded-lg text-center",
              s.vacancy === inputs.vacancyRate
                ? isDark
                  ? "bg-[#E8FF4D]/20 ring-2 ring-[#E8FF4D]/50"
                  : "bg-violet-100 ring-2 ring-violet-300"
                : isDark
                  ? "bg-white/5"
                  : "bg-slate-50"
            )}
          >
            <div
              className={cn(
                "text-2xl font-black mb-1",
                isDark ? "text-white" : "text-slate-900"
              )}
            >
              {s.vacancy}%
            </div>
            <div
              className={cn(
                "text-xs font-bold uppercase tracking-wider mb-3",
                isDark ? "text-white/60" : "text-slate-500"
              )}
            >
              Vacancy
            </div>
            <div
              className={cn(
                "text-lg font-bold mb-1",
                s.monthlyCashFlow >= 0
                  ? isDark
                    ? "text-emerald-400"
                    : "text-emerald-600"
                  : isDark
                    ? "text-rose-400"
                    : "text-rose-600"
              )}
            >
              {formatCurrency(s.monthlyCashFlow)}
            </div>
            <div
              className={cn(
                "text-xs",
                isDark ? "text-white/40" : "text-slate-400"
              )}
            >
              monthly
            </div>
            <div
              className={cn(
                "text-xs mt-2",
                isDark ? "text-white/50" : "text-slate-500"
              )}
            >
              Lost: {formatCurrency(s.lostRent)}/mo
            </div>
          </div>
        ))}
      </div>

      <div
        className={cn(
          "mt-6 p-4 rounded-lg text-sm",
          isDark ? "bg-white/5 text-white/70" : "bg-blue-50 text-blue-800"
        )}
      >
        <strong>Pro Tip:</strong> Factor in 5-8% vacancy for single-family rentals
        and 3-5% for well-located multifamily. Always have 3-6 months of reserves
        to cover unexpected vacancies.
      </div>
    </div>
  );
}

// Appreciation Scenario
function AppreciationScenario({
  inputs,
  isDark,
}: {
  inputs: ScenarioInputs;
  isDark: boolean;
}) {
  const scenarios = useMemo(() => {
    const rates = [0, 3, 5, 7, 10];
    const years = [1, 3, 5, 10];

    return rates.map((rate) => {
      const yearlyValues = years.map((year) => {
        const value = inputs.propertyValue * Math.pow(1 + rate / 100, year);
        const equity = value - inputs.loanBalance;
        const gain = value - inputs.propertyValue;
        return { year, value, equity, gain };
      });
      return { rate, yearlyValues };
    });
  }, [inputs]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(v);

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
            isDark
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-emerald-100 text-emerald-600"
          )}
        >
          <TrendingUp size={20} />
        </div>
        <div>
          <h2
            className={cn(
              "text-lg font-bold",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            Appreciation Scenarios
          </h2>
          <p
            className={cn(
              "text-sm",
              isDark ? "text-white/60" : "text-slate-500"
            )}
          >
            Project future property values and equity growth
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className={cn(
                "text-xs font-bold uppercase tracking-wider",
                isDark ? "text-white/60" : "text-slate-500"
              )}
            >
              <th className="text-left py-3 pr-4">Annual Rate</th>
              <th className="text-right py-3 px-4">1 Year</th>
              <th className="text-right py-3 px-4">3 Years</th>
              <th className="text-right py-3 px-4">5 Years</th>
              <th className="text-right py-3 pl-4">10 Years</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s) => (
              <tr
                key={s.rate}
                className={cn(
                  "border-t",
                  isDark ? "border-white/5" : "border-slate-100"
                )}
              >
                <td className="py-4 pr-4">
                  <span
                    className={cn(
                      "font-bold",
                      isDark ? "text-white" : "text-slate-900"
                    )}
                  >
                    {s.rate}%
                  </span>
                </td>
                {s.yearlyValues.map((yv) => (
                  <td key={yv.year} className="text-right py-4 px-4">
                    <div
                      className={cn(
                        "font-mono font-bold",
                        isDark ? "text-white" : "text-slate-900"
                      )}
                    >
                      {formatCurrency(yv.value)}
                    </div>
                    <div
                      className={cn(
                        "text-xs",
                        yv.gain > 0
                          ? isDark
                            ? "text-emerald-400"
                            : "text-emerald-600"
                          : isDark
                            ? "text-white/40"
                            : "text-slate-400"
                      )}
                    >
                      {yv.gain > 0 && "+"}
                      {formatCurrency(yv.gain)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Equity Growth Chart Placeholder */}
      <div
        className={cn(
          "mt-6 p-6 rounded-lg flex items-center justify-center",
          isDark ? "bg-white/5" : "bg-slate-50"
        )}
      >
        <div className="text-center">
          <BarChart3
            size={48}
            className={cn(
              "mx-auto mb-2",
              isDark ? "text-white/20" : "text-slate-300"
            )}
          />
          <p
            className={cn(
              "text-sm",
              isDark ? "text-white/40" : "text-slate-400"
            )}
          >
            Interactive chart coming soon
          </p>
        </div>
      </div>

      <div
        className={cn(
          "mt-6 p-4 rounded-lg text-sm",
          isDark ? "bg-white/5 text-white/70" : "bg-blue-50 text-blue-800"
        )}
      >
        <strong>Historical Context:</strong> U.S. real estate has historically
        appreciated 3-5% annually on average. However, appreciation varies widely
        by market—some areas see 7-10% while others may be flat or decline.
      </div>
    </div>
  );
}

// Refinance Scenario
function RefinanceScenario({
  inputs,
  isDark,
}: {
  inputs: ScenarioInputs;
  isDark: boolean;
}) {
  const scenarios = useMemo(() => {
    const newRates = [4.5, 5.0, 5.5, 6.0, 6.5];
    const currentPayment = calculatePayment(
      inputs.loanBalance,
      inputs.currentRate,
      inputs.loanTerm
    );
    const closingCostPercent = 2.5; // Typical refinance closing costs
    const closingCosts = inputs.loanBalance * (closingCostPercent / 100);

    return newRates.map((rate) => {
      const newPayment = calculatePayment(inputs.loanBalance, rate, 30);
      const monthlySavings = currentPayment - newPayment;
      const annualSavings = monthlySavings * 12;
      const breakeven = monthlySavings > 0 ? closingCosts / monthlySavings : Infinity;

      return {
        rate,
        newPayment,
        monthlySavings,
        annualSavings,
        closingCosts,
        breakeven: Math.ceil(breakeven),
        worthIt: breakeven <= 36, // Worth it if breakeven under 3 years
      };
    });
  }, [inputs]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(v);

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
            isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"
          )}
        >
          <RefreshCw size={20} />
        </div>
        <div>
          <h2
            className={cn(
              "text-lg font-bold",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            Refinance Analysis
          </h2>
          <p
            className={cn(
              "text-sm",
              isDark ? "text-white/60" : "text-slate-500"
            )}
          >
            Compare refinancing to a new 30-year loan
          </p>
        </div>
      </div>

      {/* Current Loan Info */}
      <div
        className={cn(
          "mb-6 p-4 rounded-lg flex items-center justify-between",
          isDark ? "bg-white/5" : "bg-slate-50"
        )}
      >
        <div>
          <div
            className={cn(
              "text-xs font-bold uppercase tracking-wider mb-1",
              isDark ? "text-white/60" : "text-slate-500"
            )}
          >
            Current Loan
          </div>
          <div className={isDark ? "text-white" : "text-slate-900"}>
            {inputs.currentRate}% rate •{" "}
            {formatCurrency(
              calculatePayment(inputs.loanBalance, inputs.currentRate, inputs.loanTerm)
            )}
            /mo
          </div>
        </div>
        <div className="text-right">
          <div
            className={cn(
              "text-xs font-bold uppercase tracking-wider mb-1",
              isDark ? "text-white/60" : "text-slate-500"
            )}
          >
            Est. Closing Costs
          </div>
          <div className={isDark ? "text-white" : "text-slate-900"}>
            {formatCurrency(scenarios[0].closingCosts)} (2.5%)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {scenarios.map((s) => (
          <div
            key={s.rate}
            className={cn(
              "p-4 rounded-lg",
              s.worthIt
                ? isDark
                  ? "bg-emerald-500/10 ring-1 ring-emerald-500/30"
                  : "bg-emerald-50 ring-1 ring-emerald-200"
                : isDark
                  ? "bg-white/5"
                  : "bg-slate-50"
            )}
          >
            <div
              className={cn(
                "text-2xl font-black mb-1",
                isDark ? "text-white" : "text-slate-900"
              )}
            >
              {s.rate}%
            </div>
            <div
              className={cn(
                "text-xs font-bold uppercase tracking-wider mb-3",
                isDark ? "text-white/60" : "text-slate-500"
              )}
            >
              New Rate
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={isDark ? "text-white/60" : "text-slate-500"}>
                  Payment
                </span>
                <span className={isDark ? "text-white" : "text-slate-900"}>
                  {formatCurrency(s.newPayment)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={isDark ? "text-white/60" : "text-slate-500"}>
                  Savings
                </span>
                <span
                  className={
                    s.monthlySavings > 0
                      ? isDark
                        ? "text-emerald-400"
                        : "text-emerald-600"
                      : isDark
                        ? "text-rose-400"
                        : "text-rose-600"
                  }
                >
                  {formatCurrency(s.monthlySavings)}/mo
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={isDark ? "text-white/60" : "text-slate-500"}>
                  Breakeven
                </span>
                <span className={isDark ? "text-white" : "text-slate-900"}>
                  {s.monthlySavings > 0 ? `${s.breakeven} mo` : "Never"}
                </span>
              </div>
            </div>

            {s.worthIt && (
              <div
                className={cn(
                  "mt-3 text-xs font-bold text-center py-1 rounded",
                  isDark
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-emerald-100 text-emerald-700"
                )}
              >
                Worth It!
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        className={cn(
          "mt-6 p-4 rounded-lg text-sm",
          isDark ? "bg-white/5 text-white/70" : "bg-blue-50 text-blue-800"
        )}
      >
        <strong>Rule of Thumb:</strong> Refinancing typically makes sense if you
        can break even on closing costs within 2-3 years and plan to hold the
        property long-term. Also consider &quot;no-cost&quot; refinances where costs are
        rolled into a slightly higher rate.
      </div>
    </div>
  );
}
