import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;

  const now = new Date();
  const inSevenDays = new Date(now);
  inSevenDays.setDate(inSevenDays.getDate() + 7);

  const [events, meetings] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { userId, startAt: { gte: now, lt: inSevenDays }, NOT: { type: 'MEETING' } },
      orderBy: { startAt: 'asc' },
      select: {
        id: true,
        title: true,
        type: true,
        startAt: true,
        endAt: true,
        descriptionMarkdown: true,
        relatedTaskId: true,
        location: true,
        tags: true,
      },
    }),
    prisma.calendarEvent.findMany({
      where: { userId, startAt: { gte: now, lt: inSevenDays }, type: 'MEETING' },
      orderBy: { startAt: 'asc' },
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        descriptionMarkdown: true,
      },
    }),
  ]);

  const res = NextResponse.json({ events, meetings });
  // Light caching: safe to serve slightly stale for a snappier dashboard
  res.headers.set('Cache-Control', 'private, max-age=0, s-maxage=30, stale-while-revalidate=300');
  return res;
}

