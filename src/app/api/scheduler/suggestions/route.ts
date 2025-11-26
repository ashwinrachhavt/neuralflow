import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";
import { computeFreeWindows, parseDefaultGymPrefs, computeGymSuggestion, computeFocusSuggestion, computeShallowSuggestion } from "@/lib/scheduler/engine";

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;

  const now = new Date();
  // Load user preferences from ReporterProfile.trendNotes.schedulerPrefs (fallback to env/defaults)
  const profile = await prisma.reporterProfile.findUnique({ where: { userId: (user as any).id as string }, select: { trendNotes: true } });
  const prefs = (profile?.trendNotes as any)?.schedulerPrefs || {};
  const workStartHour = Number(prefs.workStartHour ?? process.env.WORK_START_HOUR ?? 9);
  const startOfDay = new Date(now); startOfDay.setHours(workStartHour,0,0,0);
  const endOfDay = new Date(now); endOfDay.setHours(21,0,0,0);

  // Fetch today’s events and user tasks
  const [events, tasks] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { userId, startAt: { gte: startOfDay, lt: endOfDay } },
      orderBy: { startAt: 'asc' },
      select: { startAt: true, endAt: true },
    }),
    prisma.task.findMany({
      where: { board: { userId }, status: { in: ['TODO','IN_PROGRESS'] } },
      select: { id: true, topics: true, primaryTopic: true },
      take: 300,
    }),
  ]);

  const free = computeFreeWindows(events.map(e => ({ startAt: e.startAt, endAt: e.endAt })), startOfDay, endOfDay, 20);

  // Topic counts for backlog
  const topicCounts: Record<string, number> = {};
  for (const t of tasks) {
    const tops = (t.topics as any as string[] | null) ?? [];
    const primary = (t.primaryTopic as any as string | null) ?? null;
    if (primary) topicCounts[primary] = (topicCounts[primary] || 0) + 1;
    for (const x of tops) topicCounts[x] = (topicCounts[x] || 0) + 1;
  }

  const suggestions: any[] = [];
  const gymPref = typeof prefs.gym === 'object' ? { enabled: !!prefs.gym.enabled, startHour: Number(prefs.gym.startHour ?? 19), endHour: Number(prefs.gym.endHour ?? 21), days: Array.isArray(prefs.gym.days) ? prefs.gym.days : [0,1,2,3,4,5,6] } : parseDefaultGymPrefs();
  if (gymPref.enabled) {
    const gym = computeGymSuggestion(now, free, gymPref);
    if (gym) suggestions.push(gym);
  }
  // Evening shallow preference
  const shallowPref = prefs.shallow || { enabled: true, startHour: 18, title: 'Vibe coding' };
  const nowHour = now.getHours();
  // In evening hours, prefer shallow suggestion over deep focus
  if (shallowPref.enabled && nowHour >= Number(shallowPref.startHour ?? 18)) {
    const shallow = computeShallowSuggestion(now, free, Number(shallowPref.startHour ?? 18), { title: String(shallowPref.title || 'Vibe coding'), preferredTopics: Array.isArray(prefs.favoriteTopics) ? prefs.favoriteTopics : [], topicCounts });
    if (shallow) suggestions.push(shallow);
  } else {
    const focus = computeFocusSuggestion(free, topicCounts);
    if (focus) suggestions.push(focus);
  }

  return NextResponse.json({ suggestions });
}
