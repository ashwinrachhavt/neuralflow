import { KanbanBoard } from '@/components/kanban-board';
import { PageShell } from '@/components/layout/page-shell';
import { SectionHeader } from '@/components/section-header';

export const metadata = {
  title: 'Board',
  description: 'Kanban board view',
};

// Next 16: params is now a Promise and must be awaited
export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  return (
    <PageShell>
      <SectionHeader
        title="Board"
        description="Drag tasks between columns or use AI tools on cards."
      />
      <KanbanBoard boardId={boardId} />
    </PageShell>
  );
}
