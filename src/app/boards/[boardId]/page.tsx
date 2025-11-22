import { KanbanBoard } from '@/components/kanban-board';
import { PageShell } from '@/components/layout/page-shell';
import { SectionHeader } from '@/components/section-header';
import { BoardAIButton } from '@/components/board/BoardAIButton';

export const metadata = {
  title: 'Board',
  description: 'Kanban board view',
};

// Next 16: params is now a Promise and must be awaited
import { AI } from "@/app/actions";

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  return (
    <AI>
      <PageShell size="xl">
        <SectionHeader
          title="Board"
          description="Drag tasks between columns or use AI tools on cards."
          actions={<BoardAIButton boardId={boardId} />}
        />
        <KanbanBoard boardId={boardId} />
      </PageShell>
    </AI>
  );
}
