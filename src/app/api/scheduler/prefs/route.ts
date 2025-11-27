import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";

type Prefs = {
  workStartHour: number;
  workEndHour?: number;
  gym: { enabled: boolean; startHour: number; endHour: number; days: number[] };
  shallow?: { enabled: boolean; startHour: number; title?: string };
  favoriteTopics: string[];
  vibeProjects?: string[];
};

function defaults(): Prefs {
  return {
    workStartHour: Number(process.env.WORK_START_HOUR ?? 9),
    workEndHour: Number(process.env.WORK_END_HOUR ?? 17),
    gym: { enabled: true, startHour: 19, endHour: 21, days: [0,1,2,3,4,5,6] },
    shallow: { enabled: true, startHour: 18, title: 'Vibe coding' },
    favoriteTopics: [],
    vibeProjects: [],
  };
}

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;
  const profile = await prisma.reporterProfile.findUnique({ where: { userId } });
  const stored = (profile?.trendNotes as any)?.schedulerPrefs as Prefs | undefined;
  return NextResponse.json({ prefs: stored ?? defaults() });
}

export async function PUT(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;
  const body = await req.json().catch(() => ({}));
  const prefs = body?.prefs as Prefs | undefined;
  if (!prefs) return NextResponse.json({ message: 'prefs required' }, { status: 400 });

  const current = await prisma.reporterProfile.findUnique({ where: { userId }, select: { trendNotes: true } });
  const tn = (current?.trendNotes as any) ?? {};
  tn.schedulerPrefs = prefs;
  await prisma.reporterProfile.upsert({
    where: { userId },
    create: { userId, trendNotes: tn },
    update: { trendNotes: tn },
  });
  return NextResponse.json({ ok: true });
}
