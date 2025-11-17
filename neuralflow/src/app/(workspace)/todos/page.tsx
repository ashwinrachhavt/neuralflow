import { TodoList } from "@/components/todo-list";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";

export default function TodosPage() {
  return (
    <PageShell>
      <SectionHeader
        title="To‑Do List"
        description="Capture the ideas you want to make progress on today. Move bigger work into the Kanban board when it needs more structure."
      />
      <TodoList />
    </PageShell>
  );
}
