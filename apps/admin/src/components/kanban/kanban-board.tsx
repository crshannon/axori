import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  
  
  DragOverlay,
  
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Filter, Loader2, Plus, Search } from "lucide-react";
import { KanbanColumn } from "./kanban-column";
import { TicketCard } from "./ticket-card";
import type {DragEndEvent, DragOverEvent, DragStartEvent} from "@dnd-kit/core";
import type { ForgeTicket } from "@axori/db/types";
import { TicketDrawer } from "@/components/tickets";
import { AssignAgentModal } from "@/components/agents/assign-agent-modal";
import { useTickets, useUpdateTicketStatus } from "@/hooks/api/use-tickets";

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

// Mock data fallback for when API is not available
const MOCK_TICKETS: Array<ForgeTicket> = [
  {
    id: "1",
    identifier: "FORGE-001",
    title: "Create Kanban Board Component",
    description: null,
    status: "in_progress",
    priority: "high",
    type: "feature",
    phase: "implementation",
    releaseClassification: "feature",
    parentId: null,
    projectId: null,
    milestoneId: null,
    statusOrder: 0,
    estimate: 5,
    currentPhase: "implementation",
    assignedAgent: null,
    agentSessionId: null,
    lastExecutionId: null,
    executionHistory: null,
    branchName: null,
    previewUrl: null,
    prNumber: null,
    prUrl: null,
    isBreakingChange: false,
    migrationNotes: null,
    blocksDeploy: false,
    labels: ["frontend", "ui"],
    createdAt: new Date(),
    updatedAt: new Date(),
    startedAt: null,
    completedAt: null,
  },
  {
    id: "2",
    identifier: "FORGE-002",
    title: "Set up Forge Database Schema",
    description: null,
    status: "done",
    priority: "critical",
    type: "feature",
    phase: "implementation",
    releaseClassification: "feature",
    parentId: null,
    projectId: null,
    milestoneId: null,
    statusOrder: 0,
    estimate: 3,
    currentPhase: "implementation",
    assignedAgent: null,
    agentSessionId: null,
    lastExecutionId: null,
    executionHistory: null,
    branchName: null,
    previewUrl: null,
    prNumber: null,
    prUrl: null,
    isBreakingChange: false,
    migrationNotes: null,
    blocksDeploy: false,
    labels: ["database"],
    createdAt: new Date(),
    updatedAt: new Date(),
    startedAt: null,
    completedAt: new Date(),
  },
  {
    id: "3",
    identifier: "FORGE-003",
    title: "Implement Agent Orchestrator",
    description: null,
    status: "backlog",
    priority: "high",
    type: "feature",
    phase: "planning",
    releaseClassification: "feature",
    parentId: null,
    projectId: null,
    milestoneId: null,
    statusOrder: 0,
    estimate: 8,
    currentPhase: "planning",
    assignedAgent: null,
    agentSessionId: null,
    lastExecutionId: null,
    executionHistory: null,
    branchName: null,
    previewUrl: null,
    prNumber: null,
    prUrl: null,
    isBreakingChange: false,
    migrationNotes: null,
    blocksDeploy: false,
    labels: ["backend", "ai"],
    createdAt: new Date(),
    updatedAt: new Date(),
    startedAt: null,
    completedAt: null,
  },
];

export function KanbanBoard() {
  // Fetch tickets from API
  const { data: apiTickets, isLoading, error } = useTickets();
  const updateTicketStatus = useUpdateTicketStatus();

  // Use API data if available, otherwise fall back to mock data
  const tickets = useMemo(() => {
    if (apiTickets && apiTickets.length > 0) {
      return apiTickets;
    }
    // Show mock data when API returns empty or on error
    if (!isLoading && (error || !apiTickets || apiTickets.length === 0)) {
      return MOCK_TICKETS;
    }
    return [];
  }, [apiTickets, isLoading, error]);

  const [activeTicket, setActiveTicket] = useState<ForgeTicket | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Map<string, TicketStatus>
  >(new Map());

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ForgeTicket | undefined>(undefined);

  // Agent modal state
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentModalTicket, setAgentModalTicket] = useState<ForgeTicket | null>(null);

  // Drawer handlers
  const handleNewTicket = () => {
    setSelectedTicket(undefined);
    setIsDrawerOpen(true);
  };

  const handleTicketClick = (ticket: ForgeTicket) => {
    setSelectedTicket(ticket);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedTicket(undefined);
  };

  // Handle assign agent - close drawer first, then open modal
  const handleAssignAgent = (ticket: ForgeTicket) => {
    setIsDrawerOpen(false);
    setSelectedTicket(undefined);
    setAgentModalTicket(ticket);
    setIsAgentModalOpen(true);
  };

  const handleAgentModalClose = () => {
    setIsAgentModalOpen(false);
    setAgentModalTicket(null);
  };

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

  // Apply optimistic updates to tickets
  const ticketsWithOptimisticUpdates = useMemo(() => {
    return tickets.map((ticket) => {
      const optimisticStatus = optimisticUpdates.get(ticket.id);
      if (optimisticStatus) {
        return { ...ticket, status: optimisticStatus };
      }
      return ticket;
    });
  }, [tickets, optimisticUpdates]);

  const getTicketsByStatus = useCallback(
    (status: TicketStatus) => {
      return ticketsWithOptimisticUpdates
        .filter((ticket) => ticket.status === status)
        .filter(
          (ticket) =>
            !searchQuery ||
            ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.identifier?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    },
    [ticketsWithOptimisticUpdates, searchQuery]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const ticket = ticketsWithOptimisticUpdates.find(
      (t) => t.id === active.id
    );
    if (ticket) {
      setActiveTicket(ticket);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id;

    const ticket = ticketsWithOptimisticUpdates.find((t) => t.id === activeId);
    const overTicket = ticketsWithOptimisticUpdates.find(
      (t) => t.id === overId
    );

    if (!ticket) return;

    // If dropping on a column directly
    const isOverColumn = COLUMNS.some((col) => col.id === overId);
    if (isOverColumn) {
      const newStatus = overId as TicketStatus;
      if (ticket.status !== newStatus) {
        // Apply optimistic update
        setOptimisticUpdates((prev) => new Map(prev).set(activeId, newStatus));
      }
      return;
    }

    // If dropping on another ticket
    if (overTicket && ticket.status !== overTicket.status) {
      setOptimisticUpdates((prev) =>
        new Map(prev).set(activeId, overTicket.status as TicketStatus)
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over) {
      // Drag cancelled - clear optimistic update
      setOptimisticUpdates((prev) => {
        const next = new Map(prev);
        next.delete(active.id as string);
        return next;
      });
      return;
    }

    const activeId = active.id as string;
    // overId would be used for reordering within columns (future enhancement)
    void over.id;

    const ticket = ticketsWithOptimisticUpdates.find((t) => t.id === activeId);
    if (!ticket) return;

    // Get the final status (from optimistic update or current)
    const newStatus =
      optimisticUpdates.get(activeId) || (ticket.status as TicketStatus);
    const originalStatus = tickets.find((t) => t.id === activeId)?.status;

    // Clear optimistic update
    setOptimisticUpdates((prev) => {
      const next = new Map(prev);
      next.delete(activeId);
      return next;
    });

    // If status changed, persist to API
    if (newStatus !== originalStatus) {
      updateTicketStatus.mutate(
        { id: activeId, status: newStatus },
        {
          onError: () => {
            // Revert on error (the query will refetch anyway)
            console.error("Failed to update ticket status");
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading tickets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">Board</h1>
          <span className="text-sm text-slate-400">
            {ticketsWithOptimisticUpdates.length} tickets
          </span>
          {error && (
            <span className="text-xs text-yellow-400">
              (showing mock data - API unavailable)
            </span>
          )}
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
          <button
            onClick={handleNewTicket}
            className="flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
          >
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
                onTicketClick={handleTicketClick}
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

      {/* Ticket Drawer */}
      <TicketDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        ticket={selectedTicket}
        onAssignAgent={handleAssignAgent}
      />

      {/* Agent Assignment Modal */}
      <AssignAgentModal
        isOpen={isAgentModalOpen}
        onClose={handleAgentModalClose}
        ticket={agentModalTicket}
      />
    </div>
  );
}
