import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";
import TaskPageClient from "@/components/cards/TaskPageClient";

export default async function TaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  return (
    <PageShell>
      <SectionHeader title="Task" description="Full view" />
      {/* Client renderer uses hooks for data + editing */}
      {/* eslint-disable-next-line @next/next/no-async-client-component */}
      <TaskPageClient taskId={taskId} />
    </PageShell>
  );
}

