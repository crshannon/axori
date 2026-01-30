import { createFileRoute } from "@tanstack/react-router";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export const Route = createFileRoute("/_authed/board" as any)({
  component: BoardPage,
});

function BoardPage() {
  return (
    <div className="h-screen overflow-hidden">
      <KanbanBoard />
    </div>
  );
}
