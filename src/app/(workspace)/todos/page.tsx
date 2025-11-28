import { PageShell } from "@/components/layout/page-shell";
import { TodosMinimal } from "@/components/todos/todos-minimal";

export const metadata = {
  title: "Todos",
  description: "Your tasks at a glance",
};

export default function TodosPage() {
  return (
    <PageShell>
      <TodosMinimal />
    </PageShell>
  );
}
