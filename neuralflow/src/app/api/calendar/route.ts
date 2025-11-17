import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserOr401 } from '@/lib/api-helpers';

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun - 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

export async function GET(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const { searchParams } = new URL(req.url);
  const ws = searchParams.get('weekStart');
  const base = ws ? new Date(ws) : startOfWeek(new Date());
  const start = startOfWeek(base);
  const end = new Date(start); end.setDate(end.getDate() + 7);

  const events = await prisma.calendarEvent.findMany({
    where: { userId: user.id, startAt: { gte: start }, endAt: { lte: end } },
    orderBy: { startAt: 'asc' },
  });
  return NextResponse.json({ events });
}
