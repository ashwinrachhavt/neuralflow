import { TodoList } from "@/components/todo-list";

export default function TodosPage() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">To-Do List</h1>
        <p className="text-muted-foreground">
          Capture the ideas you want to make progress on today. Keep it nimble—move
          bigger work into the Kanban board when it needs more structure.
        </p>
      </div>
      <TodoList />
    </div>
  );
}
