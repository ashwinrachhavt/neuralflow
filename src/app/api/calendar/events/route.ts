import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";

export async function POST(request: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;
  const body = await request.json();
  const { title, type, startAt, endAt, descriptionMarkdown, location, tags } = body ?? {};
  if (!title || !startAt || !endAt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const created = await prisma.calendarEvent.create({
    data: {
      userId,
      title,
      type,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      descriptionMarkdown: descriptionMarkdown ?? null,
      location: location ?? null,
      tags: Array.isArray(tags) ? tags : [],
    },
    select: { id: true },
  });
  return NextResponse.json({ id: created.id });
}
