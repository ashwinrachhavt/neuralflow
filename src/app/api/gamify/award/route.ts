import { NextResponse } from 'next/server';
import { getUserOr401, readJson } from '@/lib/api-helpers';
import { gamificationEngine as engine } from '@/lib/gamification/engine';
import type { GemSlug } from '@/lib/gamification/catalog';

export async function POST(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const body = (await readJson<{ slug?: GemSlug; withLore?: boolean; source?: string }>(req)) ?? {};
  const slug = body.slug ?? 'quartz';
  try {
    await engine.ensureCatalog();
    // Use internal awardStone via claim flow
    const created = await (await import('@/lib/prisma')).prisma.userStone.create({
      data: {
        userId: (user as any).id,
        stoneId: (await (await import('@/lib/prisma')).prisma.stoneDefinition.findFirstOrThrow({ where: { slug } })).id,
        source: body.source ?? 'TEST',
      },
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 400 });
  }
}

