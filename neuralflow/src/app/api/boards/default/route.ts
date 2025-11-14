import { NextResponse } from 'next/server';
import { getOrCreateDbUser } from '@/lib/get-or-create-user';
import { getOrCreateDefaultBoard } from '@/server/db/boards';

export async function GET() {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const res = await getOrCreateDefaultBoard(user.id);
  if (!res.ok) return NextResponse.json({ message: 'Failed' }, { status: 500 });
  return NextResponse.json({ id: res.value.id, title: res.value.title });
}

