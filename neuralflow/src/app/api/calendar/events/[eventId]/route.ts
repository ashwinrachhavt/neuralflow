import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserOr401, readJson, jsonError } from '@/lib/api-helpers';

const allowedTypes = ['FOCUS', 'MEETING', 'PERSONAL', 'BREAK'] as const;
type EventType = (typeof allowedTypes)[number];

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function PATCH(
  req: Request,
  { params }: { params: { eventId: string } },
) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const body = await readJson<Record<string, any>>(req);
  if (!body) return jsonError('Invalid JSON payload', 400);

  const event = await prisma.calendarEvent.findFirst({
    where: { id: params.eventId, userId: (user as any).id },
  });
  if (!event) return jsonError('Event not found', 404);

  const updates: Record<string, any> = {};
  if (typeof body.title === 'string') {
    const title = body.title.trim();
    if (title) updates.title = title;
  }
  if (typeof body.descriptionMarkdown === 'string') {
    updates.descriptionMarkdown = body.descriptionMarkdown;
  }
  if (typeof body.location === 'string') {
    updates.location = body.location || null;
  }
  if (Array.isArray(body.tags)) {
    updates.tags = body.tags.filter((tag) => typeof tag === 'string');
  }
  if (typeof body.type === 'string' && allowedTypes.includes(body.type as EventType)) {
    updates.type = body.type as EventType;
  }

  const startAt = parseDate(body.startAt);
  if (startAt) updates.startAt = startAt;
  const endAt = parseDate(body.endAt);
  if (endAt) updates.endAt = endAt;

  if (updates.startAt && updates.endAt && updates.startAt >= updates.endAt) {
    return jsonError('startAt must be before endAt', 400);
  }
  if (updates.startAt && !updates.endAt && event.endAt <= updates.startAt) {
    return jsonError('startAt must be before endAt', 400);
  }
  if (updates.endAt && !updates.startAt && updates.endAt <= event.startAt) {
    return jsonError('endAt must be after startAt', 400);
  }

  if (!Object.keys(updates).length) {
    return jsonError('No updatable fields provided', 400);
  }

  const updated = await prisma.calendarEvent.update({
    where: { id: event.id },
    data: updates,
  });
  return NextResponse.json({ event: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { eventId: string } },
) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const event = await prisma.calendarEvent.findFirst({
    where: { id: params.eventId, userId: (user as any).id },
  });
  if (!event) return jsonError('Event not found', 404);
  await prisma.calendarEvent.delete({ where: { id: event.id } });
  return NextResponse.json({ success: true });
}
