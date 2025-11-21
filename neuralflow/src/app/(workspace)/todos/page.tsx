import { TodosPane } from "@/components/todos/todos-pane";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";

export default function TodosPage() {
  return (
    <PageShell>
      <SectionHeader
        title="Todos"
        description="Capture quick tasks, enrich them with AI, and drag the most important work into focus."
      />
      <TodosPane />
    </PageShell>
  );
}
