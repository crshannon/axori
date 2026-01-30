/**
 * Execution Monitor Component
 *
 * Shows real-time status and logs for an agent execution
 */

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bot, CheckCircle, Clock, Copy, Check, Expand, Loader2, XCircle } from "lucide-react";
import { useExecution, agentKeys } from "@/hooks/api/use-agents";

interface ExecutionMonitorProps {
  executionId: string;
  onComplete?: () => void;
  /** When true, shows full-height expanded view */
  expanded?: boolean;
  /** Called when user clicks to expand the logs */
  onExpand?: () => void;
  /** Called when user clicks back from expanded view */
  onCollapse?: () => void;
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    label: "Pending",
  },
  running: {
    icon: Loader2,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    label: "Running",
    animate: true,
  },
  completed: {
    icon: CheckCircle,
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    label: "Completed",
  },
  failed: {
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    label: "Failed",
  },
  paused: {
    icon: Clock,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    label: "Paused",
  },
};

export function ExecutionMonitor({
  executionId,
  onComplete,
  expanded = false,
  onExpand,
  onCollapse,
}: ExecutionMonitorProps) {
  const queryClient = useQueryClient();
  const { data: execution, isLoading } = useExecution(executionId);

  // Copy state - MUST be before any early returns
  const [copied, setCopied] = useState(false);

  // Poll for updates while running
  useEffect(() => {
    if (!execution || execution.status === "completed" || execution.status === "failed") {
      if (execution?.status === "completed" || execution?.status === "failed") {
        onComplete?.();
      }
      return;
    }

    // Poll every 2 seconds while running
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: agentKeys.execution(executionId) });
    }, 2000);

    return () => clearInterval(interval);
  }, [execution?.status, executionId, queryClient, onComplete]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading execution...</span>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="text-sm text-slate-400">
        Execution not found
      </div>
    );
  }

  const config = STATUS_CONFIG[execution.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  // Parse logs into lines
  const logLines = execution.executionLog?.split("\n").filter(Boolean) || [];

  const handleCopyLogs = async () => {
    const logText = logLines.join("\n");
    await navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Expanded view - full height logs display
  if (expanded) {
    return (
      <div className="flex flex-col h-full">
        {/* Header with back button */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <button
            onClick={onCollapse}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to ticket</span>
          </button>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
              <StatusIcon
                className={`h-4 w-4 ${config.color} ${"animate" in config && config.animate ? "animate-spin" : ""}`}
              />
            </div>
            <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
          </div>
        </div>

        {/* Full height log area */}
        <div className="flex-1 rounded-lg bg-black/30 border border-white/5 p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
            <Bot className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-medium text-slate-300">Agent Activity Log</span>
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-xs text-slate-500">
                {logLines.length} entries
              </span>
              {logLines.length > 0 && (
                <button
                  onClick={handleCopyLogs}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          {logLines.length > 0 ? (
            <div className="space-y-2 font-mono text-sm">
              {logLines.map((line, i) => (
                <div key={i} className="text-slate-400 leading-relaxed hover:text-slate-300 transition-colors">
                  {line}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
              {execution.status === "running" ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Waiting for agent activity...</span>
                </div>
              ) : (
                <span>No log entries</span>
              )}
            </div>
          )}
        </div>

        {/* Footer with timestamps */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            {execution.startedAt && (
              <span>Started: {new Date(execution.startedAt).toLocaleTimeString()}</span>
            )}
            {execution.completedAt && (
              <span>Completed: {new Date(execution.completedAt).toLocaleTimeString()}</span>
            )}
          </div>
          {execution.tokensUsed && (
            <span>{execution.tokensUsed.toLocaleString()} tokens</span>
          )}
        </div>
      </div>
    );
  }

  // Compact view (default)
  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
            <StatusIcon
              className={`h-4 w-4 ${config.color} ${"animate" in config && config.animate ? "animate-spin" : ""}`}
            />
          </div>
          <div>
            <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
            <p className="text-xs text-slate-500">
              {execution.protocol.replace(/_/g, " ")}
            </p>
          </div>
        </div>
        {execution.tokensUsed && (
          <div className="text-xs text-slate-400">
            {execution.tokensUsed.toLocaleString()} tokens
          </div>
        )}
      </div>

      {/* Execution Log */}
      {logLines.length > 0 && (
        <div
          onClick={onExpand}
          className="rounded-lg bg-black/30 border border-white/5 p-3 max-h-48 overflow-y-auto cursor-pointer hover:border-violet-500/30 transition-colors group"
        >
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
            <Bot className="h-3 w-3 text-violet-400" />
            <span className="text-xs font-medium text-slate-300">Agent Activity</span>
            {onExpand && (
              <button className="ml-auto flex items-center gap-1 text-xs text-slate-500 group-hover:text-violet-400 transition-colors">
                <Expand className="h-3 w-3" />
                <span>Expand</span>
              </button>
            )}
          </div>
          <div className="space-y-1 font-mono text-xs">
            {logLines.slice(-10).map((line, i) => (
              <div key={i} className="text-slate-400 leading-relaxed">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Running indicator */}
      {execution.status === "running" && logLines.length === 0 && (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Agent is starting up...</span>
        </div>
      )}

      {/* Timestamps */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        {execution.startedAt && (
          <span>Started: {new Date(execution.startedAt).toLocaleTimeString()}</span>
        )}
        {execution.completedAt && (
          <span>Completed: {new Date(execution.completedAt).toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  );
}
