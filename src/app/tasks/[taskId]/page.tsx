import { PageShell } from "@/components/layout/page-shell";
import TaskPageClient from "@/components/cards/TaskPageClient";
import { TaskPageHeader } from "@/components/cards/TaskPageHeader";

export const metadata = {
  title: "Task",
  description: "Full task editor",
};

export default async function TaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  return (
    <PageShell>
      <TaskPageHeader taskId={taskId} />
      <TaskPageClient taskId={taskId} />
    </PageShell>
  );
}
