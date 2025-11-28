import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserOr401 } from '@/lib/api-helpers';

type Ctx = { params: Promise<{ boardId: string }> };

const STANDARD = [
  { key: 'BACKLOG', name: 'Backlog' },
  { key: 'TODO', name: 'Todo' },
  { key: 'IN_PROGRESS', name: 'In Progress' },
  { key: 'DONE', name: 'Done' },
];

function matchKey(name: string): 'BACKLOG'|'TODO'|'IN_PROGRESS'|'DONE'|null {
  const n = name.trim().toLowerCase();
  if (n.includes('backlog')) return 'BACKLOG';
  if (n === 'todo' || n.includes('to do')) return 'TODO';
  if (n.includes('progress') || n === 'doing') return 'IN_PROGRESS';
  if (n.includes('done')) return 'DONE';
  return null;
}

export async function POST(_req: Request, ctx: Ctx) {
  const { boardId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  // Ensure ownership
  const board = await prisma.board.findFirst({ where: { id: boardId, userId: (user as any).id }, select: { id: true } });
  if (!board) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const existing: { id: string; name: string; position: number }[] = await prisma.column.findMany({
    where: { boardId },
    orderBy: { position: 'asc' },
    select: { id: true, name: true, position: true },
  });

  const byKey: Record<string, { id: string; name: string; position: number } | undefined> = {} as any;
  for (const c of existing) {
    const key = matchKey(c.name);
    if (key && !byKey[key]) byKey[key] = c;
  }

  // Create any missing
  let maxPos = -1;
  for (const c of existing) {
    if (c.position > maxPos) maxPos = c.position;
  }
  let pos = maxPos + 1;
  for (const std of STANDARD) {
    if (!byKey[std.key]) {
      const created = await prisma.column.create({ data: { boardId, name: std.name, position: pos++ }, select: { id: true, name: true, position: true } });
      byKey[std.key] = created;
    }
  }

  // Reorder standard columns to positions 0..3
  await prisma.$transaction(
    STANDARD.map((std: { key: string }, index: number) =>
      prisma.column.update({ where: { id: byKey[std.key]!.id }, data: { position: index } }),
    ),
  );

  // Leave non-standard columns after these; if any now collide on position, push them below
  const others = await prisma.column.findMany({ where: { boardId }, orderBy: { position: 'asc' }, select: { id: true, name: true, position: true } });
  let next = STANDARD.length;
  for (const c of others) {
    const k = matchKey(c.name);
    if (k) continue; // already handled
    if (c.position < STANDARD.length) {
      await prisma.column.update({ where: { id: c.id }, data: { position: next++ } });
    } else {
      next = Math.max(next, c.position + 1);
    }
  }

  return NextResponse.json({
    ok: true,
    columns: STANDARD.map((s: { key: string }) => ({ key: s.key, id: byKey[s.key]!.id })),
  });
}
