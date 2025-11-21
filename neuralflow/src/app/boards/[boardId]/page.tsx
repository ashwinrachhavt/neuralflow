import { KanbanBoard } from '@/components/kanban-board';
import { PageShell } from '@/components/layout/page-shell';
import { SectionHeader } from '@/components/section-header';

export const metadata = {
  title: 'Board',
  description: 'Kanban board view',
};

export default async function BoardPage({ params }: { params: { boardId: string } }) {
  const { boardId } = params;
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
