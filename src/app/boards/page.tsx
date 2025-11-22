import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateDefaultBoard } from '@/server/db/boards';

// Ensure this page always runs on the server and doesn't get statically
// optimized in a way that could interfere with redirects/auth.
export const dynamic = 'force-dynamic';

export default async function BoardsIndex() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const res = await getOrCreateDefaultBoard(userId);
  if (!res.ok) redirect('/dashboard');
  redirect(`/boards/${res.value.id}`);
}
