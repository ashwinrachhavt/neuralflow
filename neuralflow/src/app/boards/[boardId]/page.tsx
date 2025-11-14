import { KanbanBoard } from '@/components/kanban-board';

export const metadata = {
  title: 'Board',
  description: 'Kanban board view',
};

export default function BoardPage() {
  return (
    <main className="p-6 mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Board</h1>
        <p className="text-sm text-muted-foreground">Drag tasks between columns or use AI tools on cards.</p>
      </div>
      <KanbanBoard />
    </main>
  );
}

