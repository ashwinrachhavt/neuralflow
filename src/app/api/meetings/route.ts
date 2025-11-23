import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json([], { status: 200 });
  const meetings = await prisma.meeting.findMany({
    where: { userId: user.id },
  });
  return NextResponse.json(meetings);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await req.json();
  const meeting = await prisma.meeting.create({
    data: { ...data, userId: user.id },
  });
  return NextResponse.json(meeting);
}
