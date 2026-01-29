import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { clsx } from "clsx";
import { TicketCard } from "./ticket-card";
import type { ForgeTicket } from "@axori/db";

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tickets: ForgeTicket[];
}

export function KanbanColumn({ id, title, color, tickets }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      className={clsx(
        "flex h-full w-[280px] min-w-[280px] flex-col rounded-xl border transition-colors",
        isOver
          ? "border-violet-500/50 bg-violet-500/5"
          : "border-white/10 bg-white/5"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={clsx("h-2 w-2 rounded-full", color)} />
          <h3 className="text-sm font-medium text-white">{title}</h3>
          <span className="text-xs text-slate-400">{tickets.length}</span>
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-2"
      >
        <SortableContext
          items={tickets.map((t) => t.id!)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </SortableContext>

        {/* Empty State */}
        {tickets.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-white/10 text-sm text-slate-500">
            No tickets
          </div>
        )}
      </div>
    </div>
  );
}
