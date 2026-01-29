import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { Plus, Search, Filter } from "lucide-react";
import { KanbanColumn } from "./kanban-column";
import { TicketCard } from "./ticket-card";
import type { ForgeTicket } from "@axori/db";

// Ticket status columns configuration
const COLUMNS = [
  { id: "backlog", title: "Backlog", color: "bg-slate-500" },
  { id: "design", title: "Design", color: "bg-purple-500" },
  { id: "planned", title: "Planned", color: "bg-blue-500" },
  { id: "in_progress", title: "In Progress", color: "bg-yellow-500" },
  { id: "in_review", title: "In Review", color: "bg-orange-500" },
  { id: "testing", title: "Testing", color: "bg-violet-500" },
  { id: "done", title: "Done", color: "bg-green-500" },
] as const;

type TicketStatus = (typeof COLUMNS)[number]["id"];

// Mock data for initial development
const MOCK_TICKETS: Partial<ForgeTicket>[] = [
  {
    id: "1",
    identifier: "AXO-001",
    title: "Create Kanban Board Component",
    status: "in_progress",
    priority: "high",
    type: "feature",
    estimate: 5,
    labels: ["frontend", "ui"],
  },
  {
    id: "2",
    identifier: "AXO-002",
    title: "Set up Forge Database Schema",
    status: "done",
    priority: "critical",
    type: "feature",
    estimate: 3,
    labels: ["database"],
  },
  {
    id: "3",
    identifier: "AXO-003",
    title: "Implement Agent Orchestrator",
    status: "backlog",
    priority: "high",
    type: "feature",
    estimate: 8,
    labels: ["backend", "ai"],
  },
  {
    id: "4",
    identifier: "AXO-004",
    title: "Add Token Budget Tracking",
    status: "planned",
    priority: "medium",
    type: "feature",
    estimate: 3,
    labels: ["backend"],
  },
  {
    id: "5",
    identifier: "AXO-005",
    title: "Design Morning Briefing UI",
    status: "design",
    priority: "medium",
    type: "design",
    estimate: 2,
    labels: ["design", "ui"],
  },
  {
    id: "6",
    identifier: "AXO-006",
    title: "Fix preview deployment webhook",
    status: "in_review",
    priority: "high",
    type: "bug",
    estimate: 1,
    labels: ["devops"],
  },
];

export function KanbanBoard() {
  const [tickets, setTickets] = useState<Partial<ForgeTicket>[]>(MOCK_TICKETS);
  const [activeTicket, setActiveTicket] = useState<Partial<ForgeTicket> | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getTicketsByStatus = useCallback(
    (status: TicketStatus) => {
      return tickets
        .filter((ticket) => ticket.status === status)
        .filter(
          (ticket) =>
            !searchQuery ||
            ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.identifier?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    },
    [tickets, searchQuery]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const ticket = tickets.find((t) => t.id === active.id);
    if (ticket) {
      setActiveTicket(ticket);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the containers (columns)
    const activeTicket = tickets.find((t) => t.id === activeId);
    const overTicket = tickets.find((t) => t.id === overId);

    if (!activeTicket) return;

    // If dropping on a column directly
    const isOverColumn = COLUMNS.some((col) => col.id === overId);
    if (isOverColumn) {
      const newStatus = overId as TicketStatus;
      if (activeTicket.status !== newStatus) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === activeId ? { ...t, status: newStatus } : t
          )
        );
      }
      return;
    }

    // If dropping on another ticket
    if (overTicket && activeTicket.status !== overTicket.status) {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overTicket.status } : t
        )
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeTicket = tickets.find((t) => t.id === activeId);
    const overTicket = tickets.find((t) => t.id === overId);

    if (!activeTicket) return;

    // Reorder within the same column
    if (overTicket && activeTicket.status === overTicket.status) {
      const columnTickets = tickets.filter(
        (t) => t.status === activeTicket.status
      );
      const oldIndex = columnTickets.findIndex((t) => t.id === activeId);
      const newIndex = columnTickets.findIndex((t) => t.id === overId);

      if (oldIndex !== newIndex) {
        const reorderedColumn = arrayMove(columnTickets, oldIndex, newIndex);
        setTickets((prev) => {
          const otherTickets = prev.filter(
            (t) => t.status !== activeTicket.status
          );
          return [...otherTickets, ...reorderedColumn];
        });
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">Board</h1>
          <span className="text-sm text-slate-400">
            {tickets.length} tickets
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-64 rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* Filter */}
          <button className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-300 hover:bg-white/10 transition-colors">
            <Filter className="h-4 w-4" />
            Filter
          </button>

          {/* New Ticket */}
          <button className="flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-500 transition-colors">
            <Plus className="h-4 w-4" />
            New Ticket
          </button>
        </div>
      </header>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full gap-4">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                tickets={getTicketsByStatus(column.id)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTicket ? (
              <TicketCard ticket={activeTicket} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
