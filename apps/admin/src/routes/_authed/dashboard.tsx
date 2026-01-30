import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  GitPullRequest,
  TrendingUp,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/_authed/dashboard" as any)({
  component: DashboardPage,
});

function DashboardPage() {
  // Get current time for greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
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
              {greeting}, sir. It's {time}.
            </h1>
            <p className="text-slate-400">
              I've been productive while you were away.
            </p>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overnight Autopilot Report */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Overnight Autopilot Report
          </h2>

          <div className="space-y-4">
            {/* Completed Tasks */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  3 tasks completed
                </p>
                <p className="text-xs text-slate-400">
                  AXO-101, AXO-103, AXO-107
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
                  2 PRs ready for review
                </p>
                <p className="text-xs text-slate-400">
                  #42 (Property Score), #43 (Auth Flow)
                </p>
              </div>
            </div>

            {/* Failures */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  1 task needs attention
                </p>
                <p className="text-xs text-slate-400">
                  AXO-105: Tests failing on validation
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
                  67,420 tokens consumed
                </p>
                <p className="text-xs text-slate-400">~$1.80 spent overnight</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors">
              Review PRs
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors">
              View Details
            </button>
          </div>
        </div>

        {/* Today's Focus */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Today's Focus
          </h2>

          <div className="space-y-3">
            <p className="text-sm text-slate-400 mb-4">
              Based on your milestone deadline and current velocity, I recommend:
            </p>

            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-violet-400">
                  AXO-108
                </span>
                <span className="rounded-full bg-orange-400/10 px-2 py-0.5 text-xs text-orange-400">
                  high
                </span>
              </div>
              <h3 className="text-sm font-medium text-white mb-1">
                Property Score Calculation API
              </h3>
              <p className="text-xs text-slate-400">
                Blocking 3 other tickets • 5 story points
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-violet-400">
                  AXO-110
                </span>
                <span className="rounded-full bg-yellow-400/10 px-2 py-0.5 text-xs text-yellow-400">
                  medium
                </span>
              </div>
              <h3 className="text-sm font-medium text-white mb-1">
                Transaction Import Wizard
              </h3>
              <p className="text-xs text-slate-400">3 story points</p>
            </div>
          </div>

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
                  strokeDashoffset="75"
                  className="text-violet-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">70%</span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Today's usage</span>
                <span className="text-white">350k / 500k</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Autopilot</span>
                <span className="text-white">67k / 100k</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Cost today</span>
                <span className="text-white">$3.50</span>
              </div>
            </div>
          </div>
        </div>

        {/* Code Health Score */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Code Health Score
          </h2>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">84</div>
              <div className="text-xs text-slate-400">out of 100</div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-green-400">
                <TrendingUp className="h-4 w-4" />
                <span>+3 from last week</span>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Test coverage</span>
                  <span className="text-white">76%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Type safety</span>
                  <span className="text-white">94%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Bundle size</span>
                  <span className="text-white">412kb</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex items-center gap-3 text-sm text-slate-400">
        <Clock className="h-4 w-4" />
        <span>Quick actions:</span>
        <button className="rounded-lg bg-white/5 px-3 py-1 text-white hover:bg-white/10 transition-colors">
          Review PRs
        </button>
        <button className="rounded-lg bg-white/5 px-3 py-1 text-white hover:bg-white/10 transition-colors">
          Continue AXO-108
        </button>
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
