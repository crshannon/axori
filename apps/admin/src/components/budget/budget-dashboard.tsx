/**
 * Budget Dashboard Component
 *
 * Displays token usage, budget status, and cost tracking
 */

import { clsx } from "clsx"
import {
  Wallet,
  Cpu,
  Bot,
  Zap,
  DollarSign,
  Calendar,
  Activity,
  AlertTriangle,
} from "lucide-react"
import {
  useTodayBudget,
  useBudgetStats,
  useTokenUsage,
  formatTokens,
  formatCost,
  formatDuration,
  getBudgetProgressColor,
} from "@/hooks/api/use-budget"

export function BudgetDashboard() {
  const { data: todayBudget, isLoading: loadingToday } = useTodayBudget()
  const { data: stats, isLoading: loadingStats } = useBudgetStats()
  const { data: usage, isLoading: loadingUsage } = useTokenUsage(7)

  const isLoading = loadingToday || loadingStats || loadingUsage

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/10 rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white/10 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10">
            <Wallet className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Token Budget
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Monitor AI agent token usage and costs
            </p>
          </div>
        </div>
      </div>

      {/* Today's Budget Alert */}
      {todayBudget && todayBudget.tokenPercentUsed >= 80 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">Budget Warning</p>
              <p className="text-sm text-amber-200/70 mt-1">
                You've used {todayBudget.tokenPercentUsed}% of today's token budget.
                {todayBudget.remainingTokens > 0
                  ? ` ${formatTokens(todayBudget.remainingTokens)} tokens remaining.`
                  : " Budget exhausted for today."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Usage */}
        <StatCard
          title="Today's Usage"
          value={formatTokens(todayBudget?.usedTokens || 0)}
          subtitle={`of ${formatTokens(todayBudget?.dailyLimitTokens || 500000)} limit`}
          icon={Zap}
          color="violet"
          progress={todayBudget?.tokenPercentUsed || 0}
        />

        {/* Today's Cost */}
        <StatCard
          title="Today's Cost"
          value={formatCost(todayBudget?.usedCents || 0)}
          subtitle={`of ${formatCost(todayBudget?.dailyLimitCents || 500)} budget`}
          icon={DollarSign}
          color="emerald"
          progress={todayBudget?.costPercentUsed || 0}
        />

        {/* Monthly Total */}
        <StatCard
          title="This Month"
          value={`$${stats?.thisMonth.totalDollars || "0.00"}`}
          subtitle={`${formatTokens(stats?.thisMonth.totalTokens || 0)} tokens`}
          icon={Calendar}
          color="blue"
        />

        {/* Execution Stats */}
        <StatCard
          title="Executions"
          value={stats?.executions.total?.toString() || "0"}
          subtitle={`${stats?.executions.successRate || 0}% success rate`}
          icon={Activity}
          color="amber"
        />
      </div>

      {/* Usage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Model */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide mb-4">
            Usage by Model
          </h2>
          <div className="space-y-3">
            {usage?.byModel && usage.byModel.length > 0 ? (
              usage.byModel.map((model) => (
                <ModelUsageRow key={model.model} {...model} />
              ))
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">
                No usage data available
              </p>
            )}
          </div>
        </div>

        {/* By Protocol */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide mb-4">
            Usage by Protocol
          </h2>
          <div className="space-y-3">
            {usage?.byProtocol && usage.byProtocol.length > 0 ? (
              usage.byProtocol.map((protocol) => (
                <ProtocolUsageRow key={protocol.protocol} {...protocol} />
              ))
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">
                No execution data available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Execution Performance */}
      {stats?.executions && stats.executions.total > 0 && (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide mb-4">
            Execution Performance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MiniStat
              label="Avg Tokens"
              value={formatTokens(stats.executions.avgTokens)}
            />
            <MiniStat
              label="Avg Cost"
              value={formatCost(stats.executions.avgCostCents)}
            />
            <MiniStat
              label="Avg Duration"
              value={formatDuration(stats.executions.avgDurationMs)}
            />
            <MiniStat
              label="Success Rate"
              value={`${stats.executions.successRate}%`}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Sub Components
// =============================================================================

interface StatCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  color: "violet" | "emerald" | "blue" | "amber"
  progress?: number
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  progress,
}: StatCardProps) {
  const colorClasses = {
    violet: "bg-violet-500/10 text-violet-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    blue: "bg-blue-500/10 text-blue-400",
    amber: "bg-amber-500/10 text-amber-400",
  }

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-start justify-between mb-3">
        <div className={clsx("p-2 rounded-lg", colorClasses[color])}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
          {title}
        </span>
      </div>
      <div className="text-2xl font-bold text-[var(--color-text-primary)]">
        {value}
      </div>
      <div className="text-sm text-[var(--color-text-secondary)] mt-1">
        {subtitle}
      </div>
      {progress !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={clsx(
                "h-full rounded-full transition-all",
                getBudgetProgressColor(progress)
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

interface ModelUsageRowProps {
  model: string
  totalInput: number
  totalOutput: number
  totalCost: number
  count: number
}

function ModelUsageRow({
  model,
  totalInput,
  totalOutput,
  totalCost,
  count,
}: ModelUsageRowProps) {
  const modelName = model.includes("opus")
    ? "Opus"
    : model.includes("sonnet")
      ? "Sonnet"
      : "Haiku"

  const ModelIcon = model.includes("opus")
    ? Cpu
    : model.includes("sonnet")
      ? Bot
      : Zap

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
      <div className="flex items-center gap-3">
        <ModelIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
        <div>
          <div className="text-sm font-medium text-[var(--color-text-primary)]">
            {modelName}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {count} calls
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-[var(--color-text-primary)]">
          {formatTokens(totalInput + totalOutput)}
        </div>
        <div className="text-xs text-[var(--color-text-muted)]">
          {formatCost(totalCost)}
        </div>
      </div>
    </div>
  )
}

interface ProtocolUsageRowProps {
  protocol: string
  totalTokens: number
  totalCost: number
  count: number
  avgDuration: number
}

function ProtocolUsageRow({
  protocol,
  totalTokens,
  totalCost,
  count,
  avgDuration,
}: ProtocolUsageRowProps) {
  const protocolName = protocol
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
      <div>
        <div className="text-sm font-medium text-[var(--color-text-primary)]">
          {protocolName}
        </div>
        <div className="text-xs text-[var(--color-text-muted)]">
          {count} executions · avg {formatDuration(avgDuration)}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-[var(--color-text-primary)]">
          {formatTokens(totalTokens)}
        </div>
        <div className="text-xs text-[var(--color-text-muted)]">
          {formatCost(totalCost)}
        </div>
      </div>
    </div>
  )
}

interface MiniStatProps {
  label: string
  value: string
}

function MiniStat({ label, value }: MiniStatProps) {
  return (
    <div className="p-3 rounded-lg bg-white/5 text-center">
      <div className="text-lg font-semibold text-[var(--color-text-primary)]">
        {value}
      </div>
      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
    </div>
  )
}
