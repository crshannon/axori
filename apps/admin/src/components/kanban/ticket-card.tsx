import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { clsx } from "clsx";
import {
  AlertCircle,
  Bug,
  ExternalLink,
  FileText,
  GitBranch,
  Lightbulb,
  Paintbrush,
  RefreshCw,
  Square,
  Wrench,
  Zap,
} from "lucide-react";
import type { ForgeTicket } from "@axori/db/types";
import { useCancelExecution } from "@/hooks/api/use-agents";

interface TicketCardProps {
  ticket: ForgeTicket;
  isDragging?: boolean;
  onClick?: (ticket: ForgeTicket) => void;
}

const PRIORITY_COLORS = {
  critical: "text-red-400 bg-red-400/10",
  high: "text-orange-400 bg-orange-400/10",
  medium: "text-yellow-400 bg-yellow-400/10",
  low: "text-slate-400 bg-slate-400/10",
};

const TYPE_ICONS = {
  feature: Lightbulb,
  bug: Bug,
  chore: Wrench,
  refactor: RefreshCw,
  docs: FileText,
  spike: Zap,
  design: Paintbrush,
};

export function TicketCard({ ticket, isDragging = false, onClick }: TicketCardProps) {
  const cancelExecution = useCancelExecution();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: ticket.id,
  });

  const handleCancelAgent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (ticket.agentSessionId) {
      cancelExecution.mutate(ticket.agentSessionId);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const TypeIcon = TYPE_ICONS[ticket.type as keyof typeof TYPE_ICONS] || Lightbulb;
  const priorityColor = PRIORITY_COLORS[ticket.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.medium;

  // Handle click - only trigger if not dragging
  const handleClick = () => {
    // Don't open drawer if we're in the middle of a drag
    if (isSortableDragging || isDragging) return;
    onClick?.(ticket);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={clsx(
        "ticket-card cursor-grab rounded-lg border bg-[#1e293b] p-3 active:cursor-grabbing",
        isDragging || isSortableDragging
          ? "border-violet-500 shadow-lg shadow-violet-500/20 opacity-90"
          : "border-white/10 hover:border-white/20",
        onClick && "cursor-pointer"
      )}
    >
      {/* Header: ID + Priority */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-violet-400">
          {ticket.identifier}
        </span>
        <div
          className={clsx(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            priorityColor
          )}
        >
          {ticket.priority === "critical" && (
            <AlertCircle className="h-3 w-3" />
          )}
          {ticket.priority}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-white line-clamp-2 mb-2">
        {ticket.title}
      </h4>

      {/* Type + Estimate */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-300">
          <TypeIcon className="h-3 w-3" />
          {ticket.type}
        </div>
        {ticket.estimate && (
          <div className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-300">
            {ticket.estimate} pts
          </div>
        )}
      </div>

      {/* Labels */}
      {ticket.labels && ticket.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {ticket.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-300"
            >
              {label}
            </span>
          ))}
          {ticket.labels.length > 3 && (
            <span className="text-xs text-slate-500">
              +{ticket.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: Branch + Preview */}
      {(ticket.branchName || ticket.previewUrl) && (
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          {ticket.branchName && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <GitBranch className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{ticket.branchName}</span>
            </div>
          )}
          {ticket.previewUrl && (
            <a
              href={ticket.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
              <ExternalLink className="h-3 w-3" />
              Preview
            </a>
          )}
        </div>
      )}

      {/* Agent Status (if assigned) */}
      {ticket.assignedAgent && (
        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-400 agent-active" />
            <span className="text-xs text-green-400">
              {ticket.assignedAgent.replace(/_/g, " ")}
            </span>
          </div>
          <button
            onClick={handleCancelAgent}
            disabled={cancelExecution.isPending}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
            title="Cancel agent execution"
          >
            <Square className="h-3 w-3" />
            {cancelExecution.isPending ? "..." : "Stop"}
          </button>
        </div>
      )}
    </div>
  );
}
