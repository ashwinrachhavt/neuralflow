import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDbUser } from '@/lib/get-or-create-user';

export async function POST(req: Request) {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { title, type = 'FOCUS', startAt, endAt, descriptionMarkdown = '', location = null, tags = [] } = body ?? {};
  if (!title || !startAt || !endAt) return NextResponse.json({ message: 'title, startAt, endAt required' }, { status: 400 });
  const event = await prisma.calendarEvent.create({
    data: { userId: user.id, title, type, startAt: new Date(startAt), endAt: new Date(endAt), descriptionMarkdown, location, tags },
  });
  return NextResponse.json({ event });
}

