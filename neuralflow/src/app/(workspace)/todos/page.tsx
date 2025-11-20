import { TodosPane } from "@/components/todos/todos-pane";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";

export default function TodosPage() {
  return (
    <PageShell>
      <SectionHeader />
      <TodosPane />
    </PageShell>
  );
}
