import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getUserOr401 } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const user = await getUserOr401();
  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get("weekStart");
  if (!weekStart) return NextResponse.json({ events: [] });

  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const events = await prisma.calendarEvent.findMany({
    where: { userId: user.id, startAt: { gte: start, lt: end } },
    orderBy: { startAt: "asc" },
  });
  return NextResponse.json({ events });
}
