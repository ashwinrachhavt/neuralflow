import Link from 'next/link';
import { TodoList } from '@/components/todo-list';

export const metadata = {
  title: 'Dashboard',
  description: 'Overview of your tasks and shortcuts',
};

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your current todos at a glance</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link className="rounded border px-3 py-2" href="/boards">Open Board</Link>
          <Link className="rounded border px-3 py-2" href="/learn">Learn</Link>
        </div>
      </div>
      <TodoList />
    </main>
  );
}

