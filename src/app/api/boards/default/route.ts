import { NextResponse } from 'next/server';
import { getUserOr401 } from '@/lib/api-helpers';
import { getOrCreateDefaultBoard } from '@/server/db/boards';

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const res = await getOrCreateDefaultBoard((user as any).id);
  if (!res.ok) return NextResponse.json({ message: 'Failed' }, { status: 500 });
  return NextResponse.json({ id: res.value.id, title: res.value.title });
}
