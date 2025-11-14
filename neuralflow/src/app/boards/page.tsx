import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Boards',
  description: 'Browse your Kanban boards.',
};

export default async function BoardsIndex() {
  const res = await fetch(`/api/boards/default`, { cache: 'no-store' });
  if (!res.ok) redirect('/dashboard');
  const data = (await res.json()) as { id: string };
  redirect(`/boards/${data.id}`);
}
