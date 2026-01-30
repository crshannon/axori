/**
 * Ticket Drawer Component
 *
 * A drawer for creating and editing tickets in the Forge Kanban board.
 * Supports both "create" and "edit" modes.
 */

import { useEffect, useState } from "react";
import { Drawer } from "@axori/ui";
import {
  AlertTriangle,
  Bot,
  ExternalLink,
  GitBranch,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import type { ForgeTicket, ForgeTicketInsert } from "@axori/db/types";
import {
  useCreateTicket,
  useDeleteTicket,
  useUpdateTicket,
} from "@/hooks/api/use-tickets";

// =============================================================================
// Types
// =============================================================================

interface TicketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Ticket to edit - if undefined, drawer is in create mode */
  ticket?: ForgeTicket;
  /** Callback when ticket is saved */
  onSave?: (ticket: ForgeTicket) => void;
  /** Optional callback to open agent assignment */
  onAssignAgent?: (ticket: ForgeTicket) => void;
}

// =============================================================================
// Constants
// =============================================================================

const TICKET_TYPES = [
  { value: "feature", label: "Feature", color: "bg-violet-500" },
  { value: "bug", label: "Bug", color: "bg-red-500" },
  { value: "chore", label: "Chore", color: "bg-slate-500" },
  { value: "refactor", label: "Refactor", color: "bg-blue-500" },
  { value: "docs", label: "Docs", color: "bg-emerald-500" },
  { value: "spike", label: "Spike", color: "bg-amber-500" },
  { value: "design", label: "Design", color: "bg-pink-500" },
] as const;

const PRIORITIES = [
  { value: "critical", label: "Critical", color: "text-red-400" },
  { value: "high", label: "High", color: "text-orange-400" },
  { value: "medium", label: "Medium", color: "text-yellow-400" },
  { value: "low", label: "Low", color: "text-slate-400" },
] as const;

const STATUSES = [
  { value: "backlog", label: "Backlog" },
  { value: "design", label: "Design" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "testing", label: "Testing" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
] as const;

// =============================================================================
// Component
// =============================================================================

export function TicketDrawer({
  isOpen,
  onClose,
  ticket,
  onSave,
  onAssignAgent,
}: TicketDrawerProps) {
  const isEditMode = !!ticket;

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("feature");
  const [priority, setPriority] = useState<string>("medium");
  const [status, setStatus] = useState<string>("backlog");
  const [estimate, setEstimate] = useState<string>("");
  const [labels, setLabels] = useState<Array<string>>([]);
  const [labelInput, setLabelInput] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Mutations
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();

  // Initialize form when ticket changes
  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title || "");
      setDescription(ticket.description || "");
      setType(ticket.type || "feature");
      setPriority(ticket.priority || "medium");
      setStatus(ticket.status || "backlog");
      setEstimate(ticket.estimate?.toString() || "");
      setLabels(ticket.labels || []);
    } else {
      // Reset form for create mode
      setTitle("");
      setDescription("");
      setType("feature");
      setPriority("medium");
      setStatus("backlog");
      setEstimate("");
      setLabels([]);
    }
    setShowDeleteConfirm(false);
    setLabelInput("");
  }, [ticket, isOpen]);

  const handleSave = () => {
    if (!title.trim()) return;

    const ticketData: Partial<ForgeTicketInsert> = {
      title: title.trim(),
      description: description.trim() || null,
      type: type as ForgeTicketInsert["type"],
      priority: priority as ForgeTicketInsert["priority"],
      estimate: estimate ? parseInt(estimate, 10) : null,
      labels: labels.length > 0 ? labels : null,
    };

    if (isEditMode && ticket) {
      updateTicket.mutate(
        { id: ticket.id, ...ticketData, status: status as ForgeTicket["status"] },
        {
          onSuccess: (updated) => {
            onSave?.(updated);
            onClose();
          },
        }
      );
    } else {
      createTicket.mutate(ticketData as Omit<ForgeTicketInsert, "id" | "identifier">, {
        onSuccess: (created) => {
          onSave?.(created);
          onClose();
        },
      });
    }
  };

  const handleDelete = () => {
    if (!ticket) return;

    deleteTicket.mutate(ticket.id, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const handleAddLabel = () => {
    const label = labelInput.trim().toLowerCase();
    if (label && !labels.includes(label)) {
      setLabels([...labels, label]);
      setLabelInput("");
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(labels.filter((l) => l !== labelToRemove));
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddLabel();
    }
  };

  const isPending = createTicket.isPending || updateTicket.isPending;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? ticket?.identifier || "Edit Ticket" : "New Ticket"}
      subtitle={isEditMode ? "Edit ticket details" : "Create a new ticket"}
      width="lg"
      footer={
        <div className="flex items-center justify-between">
          <div>
            {isEditMode && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || isPending}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                "bg-violet-600 hover:bg-violet-500 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isPending ? "Saving..." : isEditMode ? "Save Changes" : "Create Ticket"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-300">Delete this ticket?</p>
                <p className="text-sm text-red-200/70 mt-1">
                  This action cannot be undone.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleDelete}
                    disabled={deleteTicket.isPending}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
                  >
                    {deleteTicket.isPending ? "Deleting..." : "Yes, Delete"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-white uppercase tracking-wide mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-white uppercase tracking-wide mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details, acceptance criteria, or context..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 resize-none"
          />
        </div>

        {/* Type & Priority Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-white uppercase tracking-wide mb-2">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 appearance-none cursor-pointer"
            >
              {TICKET_TYPES.map((t) => (
                <option key={t.value} value={t.value} className="bg-slate-900">
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-white uppercase tracking-wide mb-2">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 appearance-none cursor-pointer"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value} className="bg-slate-900">
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status (Edit mode only) & Estimate */}
        <div className="grid grid-cols-2 gap-4">
          {/* Status */}
          {isEditMode && (
            <div>
              <label className="block text-sm font-semibold text-white uppercase tracking-wide mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 appearance-none cursor-pointer"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-slate-900">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Estimate */}
          <div className={isEditMode ? "" : "col-span-2"}>
            <label className="block text-sm font-semibold text-white uppercase tracking-wide mb-2">
              Estimate (Story Points)
            </label>
            <input
              type="number"
              min="0"
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
              placeholder="e.g., 3"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
            />
          </div>
        </div>

        {/* Labels */}
        <div>
          <label className="block text-sm font-semibold text-white uppercase tracking-wide mb-2">
            Labels
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {labels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 text-sm"
              >
                <Tag className="w-3 h-3" />
                {label}
                <button
                  onClick={() => handleRemoveLabel(label)}
                  className="ml-1 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={handleLabelKeyDown}
              placeholder="Add a label..."
              className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
            />
            <button
              onClick={handleAddLabel}
              disabled={!labelInput.trim()}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>

        {/* Git Info (Edit mode with branch) */}
        {isEditMode && ticket?.branchName && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-3 flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Git Integration
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Branch</span>
                <code className="px-2 py-0.5 rounded bg-black/30 text-violet-300 font-mono text-xs">
                  {ticket.branchName}
                </code>
              </div>
              {ticket.prUrl && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Pull Request</span>
                  <a
                    href={ticket.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    #{ticket.prNumber}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {ticket.previewUrl && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Preview</span>
                  <a
                    href={ticket.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    View Preview
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Agent Assignment (Edit mode) */}
        {isEditMode && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-3 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Agent Assignment
            </h3>
            {ticket?.assignedAgent ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-violet-500/20">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                  </div>
                  <span className="text-white">{ticket.assignedAgent.replace(/_/g, " ")}</span>
                </div>
                <button
                  onClick={() => onAssignAgent?.(ticket)}
                  className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={() => ticket && onAssignAgent?.(ticket)}
                className="w-full py-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-violet-500/50 hover:bg-violet-500/5 transition-all flex items-center justify-center gap-2"
              >
                <Bot className="w-4 h-4" />
                Assign an AI Agent
              </button>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
