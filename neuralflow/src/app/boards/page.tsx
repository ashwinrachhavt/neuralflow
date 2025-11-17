import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateDefaultBoard } from '@/server/db/boards';

export default async function BoardsIndex() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const res = await getOrCreateDefaultBoard(userId);
  if (!res.ok) redirect('/dashboard');
  redirect(`/boards/${res.value.id}`);
}
