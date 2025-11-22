import { PageShell } from "@/components/layout/page-shell";
import { TodoList } from "@/components/todo-list";

export const metadata = {
  title: "Todos",
  description: "Minimal list of your current tasks.",
};

export default function LegacyTodoPage() {
  return (
    <PageShell>
      <TodoList />
    </PageShell>
  );
}
