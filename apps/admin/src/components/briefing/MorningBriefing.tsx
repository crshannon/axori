import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  GitPullRequest,
  Zap,
} from "lucide-react";
import { useBriefing } from "@/hooks/api/use-briefing";
import { generateBriefingCopy } from "@/lib/briefing/personality";

/**
 * Skeleton loader for briefing cards
 */
function BriefingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-white/10" />
          <div>
            <div className="h-6 w-64 bg-white/10 rounded mb-2" />
            <div className="h-4 w-48 bg-white/10 rounded" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 h-64"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Error state with Jarvis personality
 */
function BriefingError({ error }: { error: Error }) {
  return (
    <div className="min-h-screen p-8">
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          I seem to have misplaced the data, sir.
        </h2>
        <p className="text-slate-400 mb-4">
          {error.message ||
            "An unexpected error occurred while fetching the briefing."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
        >
          Attempt Recovery
        </button>
      </div>
    </div>
  );
}

/**
 * Morning Briefing Dashboard Component
 */
export function MorningBriefing() {
  const { data: briefing, isLoading, error } = useBriefing();

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <BriefingSkeleton />
      </div>
    );
  }

  if (error) {
    return <BriefingError error={error as Error} />;
  }

  if (!briefing) {
    return null;
  }

  // Generate personalized copy
  const copy = generateBriefingCopy(briefing);

  const time = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="min-h-screen p-8">
      {/* Header Greeting */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {copy.greeting} It's {time}.
            </h1>
            <p className="text-slate-400">{copy.statusQuip}</p>
            {copy.easterEgg && (
              <p className="text-violet-400 text-sm mt-1 italic">
                {copy.easterEgg}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overnight Report */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Overnight Report
          </h2>

          <div className="space-y-4">
            {/* Completed Tasks */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {briefing.overnight.completedTickets.length} tasks completed
                </p>
                <p className="text-xs text-slate-400">
                  {briefing.overnight.completedTickets.length > 0
                    ? briefing.overnight.completedTickets
                        .slice(0, 3)
                        .map((t) => t.identifier)
                        .join(", ")
                    : "No completions overnight"}
                </p>
              </div>
            </div>

            {/* PRs Ready */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <GitPullRequest className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {briefing.overnight.prsReady.length} PRs ready for review
                </p>
                <p className="text-xs text-slate-400">
                  {briefing.overnight.prsReady.length > 0
                    ? briefing.overnight.prsReady
                        .slice(0, 3)
                        .map((t) => `#${t.prNumber}`)
                        .join(", ")
                    : "No PRs awaiting review"}
                </p>
              </div>
            </div>

            {/* Needs Attention */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {briefing.overnight.needsAttention.length} items need attention
                </p>
                <p className="text-xs text-slate-400">
                  {briefing.overnight.needsAttention.length > 0
                    ? briefing.overnight.needsAttention
                        .slice(0, 3)
                        .map((t) => `${t.identifier}: ${t.reason}`)
                        .join(", ")
                    : "All clear, sir"}
                </p>
              </div>
            </div>

            {/* Token Usage */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <Zap className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {briefing.tokenBudget.usedTokens.toLocaleString()} tokens
                  consumed
                </p>
                <p className="text-xs text-slate-400">
                  ~${(briefing.tokenBudget.usedCents / 100).toFixed(2)} spent
                  today
                </p>
              </div>
            </div>
          </div>

          {briefing.overnight.prsReady.length > 0 && (
            <div className="mt-6 flex gap-2">
              <button className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors">
                Review PRs
              </button>
            </div>
          )}
        </div>

        {/* Today's Focus */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Today's Focus
          </h2>

          {briefing.todaysFocus.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-400 mb-4">
                Based on priority and current workload, I recommend:
              </p>

              {briefing.todaysFocus.slice(0, 3).map((ticket, index) => (
                <div
                  key={ticket.id}
                  className={`rounded-xl border p-4 ${
                    index === 0
                      ? "border-violet-500/20 bg-violet-500/5"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-violet-400">
                      {ticket.identifier}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        ticket.priority === "critical"
                          ? "bg-red-400/10 text-red-400"
                          : ticket.priority === "high"
                            ? "bg-orange-400/10 text-orange-400"
                            : "bg-yellow-400/10 text-yellow-400"
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1">
                    {ticket.title}
                  </h3>
                  {ticket.estimate && (
                    <p className="text-xs text-slate-400">
                      {ticket.estimate} story points
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">
                No high-priority tickets at present. A rare moment of peace.
              </p>
            </div>
          )}

          <Link
            to="/board"
            className="mt-6 flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            View full board
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Token Budget */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Token Budget</h2>

          <div className="flex items-center gap-6">
            {/* Circular Progress */}
            <div className="relative h-24 w-24">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-white/10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray="251"
                  strokeDashoffset={
                    251 - (251 * briefing.tokenBudget.percentUsed) / 100
                  }
                  className={
                    briefing.tokenBudget.percentUsed >= 90
                      ? "text-red-500"
                      : briefing.tokenBudget.percentUsed >= 70
                        ? "text-yellow-500"
                        : "text-violet-500"
                  }
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {briefing.tokenBudget.percentUsed}%
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Today's usage</span>
                <span className="text-white">
                  {(briefing.tokenBudget.usedTokens / 1000).toFixed(0)}k /{" "}
                  {(briefing.tokenBudget.limitTokens / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Cost today</span>
                <span className="text-white">
                  ${(briefing.tokenBudget.usedCents / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Budget limit</span>
                <span className="text-white">
                  ${(briefing.tokenBudget.limitCents / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Agent Activity
          </h2>

          {briefing.recentExecutions.length > 0 ? (
            <div className="space-y-3">
              {briefing.recentExecutions.slice(0, 5).map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-white">
                    {execution.ticketId
                      ? `Ticket ${execution.ticketId.slice(0, 8)}...`
                      : "System task"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      execution.status === "completed"
                        ? "bg-green-400/10 text-green-400"
                        : execution.status === "failed"
                          ? "bg-red-400/10 text-red-400"
                          : execution.status === "running"
                            ? "bg-blue-400/10 text-blue-400"
                            : "bg-slate-400/10 text-slate-400"
                    }`}
                  >
                    {execution.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">
                No recent executions. The agents await your command.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex items-center gap-3 text-sm text-slate-400">
        <Clock className="h-4 w-4" />
        <span>Quick actions:</span>
        {briefing.overnight.prsReady.length > 0 && (
          <button className="rounded-lg bg-white/5 px-3 py-1 text-white hover:bg-white/10 transition-colors">
            Review PRs
          </button>
        )}
        {briefing.todaysFocus.length > 0 && (
          <button className="rounded-lg bg-white/5 px-3 py-1 text-white hover:bg-white/10 transition-colors">
            Start {briefing.todaysFocus[0].identifier}
          </button>
        )}
        <Link
          to="/board"
          className="rounded-lg bg-white/5 px-3 py-1 text-white hover:bg-white/10 transition-colors"
        >
          View Board
        </Link>
      </div>
    </div>
  );
}
