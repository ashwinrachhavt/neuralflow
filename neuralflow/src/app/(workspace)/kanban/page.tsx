import { KanbanBoard } from "@/components/kanban-board";

export default function KanbanPage() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Kanban Board</h1>
        <p className="text-muted-foreground">
          Balance your workflow by dragging cards between columns. Perfect for
          visualising experiments, research, or release tasks in motion.
        </p>
      </div>
      <KanbanBoard />
    </div>
  );
}
