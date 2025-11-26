import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401, readJson } from "@/lib/api-helpers";
import { TASK_TOPICS } from "@/lib/ai/taxonomy";

export async function GET() {
  const user = await getUserOr401();
  // getUserOr401 may return a NextResponse when unauthorized
  // If so, return early
  if ((user as any)?.json) return user as any;

  const projects = await prisma.project.findMany({
    where: { userId: (user as any).id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, slug: true, updatedAt: true },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const user = await getUserOr401();
  if ((user as any)?.json) return user as any;
  const userId = (user as any).id as string;

  const body = await readJson<{ title?: string; titles?: string[]; topics?: string[] }>(req);
  const titles: string[] = [];

  if (body?.topics && Array.isArray(body.topics)) {
    const allowed = new Set(TASK_TOPICS as readonly string[]);
    for (const t of body.topics) {
      if (typeof t === 'string' && allowed.has(t)) titles.push(t);
    }
  }
  if (!titles.length && body?.titles && Array.isArray(body.titles)) {
    for (const t of body.titles) if (typeof t === 'string' && t.trim()) titles.push(t.trim());
  }
  if (!titles.length && body?.title && typeof body.title === 'string' && body.title.trim()) {
    titles.push(body.title.trim());
  }

  if (!titles.length) {
    return NextResponse.json({ message: "Provide 'title', 'titles', or valid 'topics'" }, { status: 400 });
  }

  // Avoid creating duplicates for same user/title
  const existing = await prisma.project.findMany({ where: { userId, title: { in: titles } }, select: { id: true, title: true } });
  const existingTitles = new Set(existing.map(p => p.title));
  const toCreate = titles.filter(t => !existingTitles.has(t));

  const created = toCreate.length
    ? await prisma.$transaction(
        toCreate.map((title) =>
          prisma.project.create({ data: { userId, title } })
        )
      )
    : [];

  const result = [...existing, ...created].sort((a, b) => a.title.localeCompare(b.title));
  return NextResponse.json({ created: created.map(p => ({ id: p.id, title: p.title })), projects: result });
}

