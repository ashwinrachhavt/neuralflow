import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getUserOr401 } from "@/lib/api-helpers";

type EventRouteContext = { params: Promise<{ eventId: string }> };

export async function PUT(request: NextRequest, context: EventRouteContext) {
  const { eventId } = await context.params;
  const user = await getUserOr401();
  const body = await request.json();
  const { title, type, startAt, endAt, descriptionMarkdown, location, tags } = body ?? {};
  const updated = await prisma.calendarEvent.updateMany({
    where: { id: eventId, userId: user.id },
    data: {
      title,
      type,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      descriptionMarkdown: descriptionMarkdown ?? null,
      location: location ?? null,
      tags: Array.isArray(tags) ? tags : [],
    },
  });
  if (updated.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, context: EventRouteContext) {
  const { eventId } = await context.params;
  const user = await getUserOr401();
  const deleted = await prisma.calendarEvent.deleteMany({ where: { id: eventId, userId: user.id } });
  if (deleted.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
