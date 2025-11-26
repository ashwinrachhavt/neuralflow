// Types imported from Prisma are not needed here

export type GymPreference = { dayOfWeek: number[]; startHour: number; endHour: number };

export type Suggestion =
  | { id: string; kind: 'GYM_REMINDER'; title: string; startAt: string; endAt: string }
  | { id: string; kind: 'FOCUS_SESSION'; title: string; startAt: string; endAt: string; topic?: string }
  | { id: string; kind: 'SHALLOW_SESSION'; title: string; startAt: string; endAt: string; topic?: string };

export function computeFreeWindows(
  events: { startAt: Date; endAt: Date }[],
  dayStart: Date,
  dayEnd: Date,
  minMinutes = 20,
) {
  const sorted = [...events].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const windows: { start: Date; end: Date }[] = [];
  let cursor = new Date(Math.max(Date.now(), dayStart.getTime()));
  for (const e of sorted) {
    if (e.startAt > cursor) {
      const gapStart = cursor;
      const gapEnd = new Date(Math.min(e.startAt.getTime(), dayEnd.getTime()));
      if (gapEnd.getTime() - gapStart.getTime() >= minMinutes * 60 * 1000) {
        windows.push({ start: new Date(gapStart), end: new Date(gapEnd) });
      }
    }
    if (e.endAt > cursor) cursor = new Date(e.endAt);
    if (cursor >= dayEnd) break;
  }
  if (cursor < dayEnd && dayEnd.getTime() - cursor.getTime() >= minMinutes * 60 * 1000) {
    windows.push({ start: new Date(cursor), end: new Date(dayEnd) });
  }
  return windows;
}

export function parseDefaultGymPrefs(): GymPreference {
  // Default: any day 19:00–21:00, fallback to 17:00–21:00 envelope for evening
  return { dayOfWeek: [0,1,2,3,4,5,6], startHour: 19, endHour: 21 };
}

export function computeGymSuggestion(
  day: Date,
  free: { start: Date; end: Date }[],
  pref: GymPreference,
): Suggestion | null {
  const dow = day.getDay();
  if (!pref.dayOfWeek.includes(dow)) return null;
  // Preferred window bounds for the day
  const prefStart = new Date(day); prefStart.setHours(pref.startHour, 0, 0, 0);
  const prefEnd = new Date(day); prefEnd.setHours(pref.endHour, 0, 0, 0);
  // Find a free window overlapping preferred hours
  for (const w of free) {
    const s = new Date(Math.max(w.start.getTime(), prefStart.getTime()));
    const e = new Date(Math.min(w.end.getTime(), prefEnd.getTime()));
    if (e > s && (e.getTime() - s.getTime()) >= 30 * 60 * 1000) {
      // 45 min in the overlap if possible
      const end = new Date(Math.min(e.getTime(), s.getTime() + 45 * 60 * 1000));
      return { id: `gym_${s.getTime()}`, kind: 'GYM_REMINDER', title: 'Gym session', startAt: s.toISOString(), endAt: end.toISOString() };
    }
  }
  return null;
}

export function computeFocusSuggestion(
  free: { start: Date; end: Date }[],
  topicCounts: Record<string, number>,
): Suggestion | null {
  if (!free.length) return null;
  const [first] = free;
  const start = first.start;
  const end = new Date(Math.min(first.end.getTime(), first.start.getTime() + 25 * 60 * 1000));
  // Pick topic with highest backlog
  const entries = Object.entries(topicCounts).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
  const topic = entries.length ? entries[0][0] : undefined;
  const title = topic ? `Focus: ${topic}` : 'Focus session';
  return { id: `focus_${start.getTime()}`, kind: 'FOCUS_SESSION', title, startAt: start.toISOString(), endAt: end.toISOString(), topic };
}

export function computeShallowSuggestion(
  day: Date,
  free: { start: Date; end: Date }[],
  startHour: number,
  options?: { title?: string; preferredTopics?: string[]; topicCounts?: Record<string, number> },
): Suggestion | null {
  const windowStart = new Date(day); windowStart.setHours(startHour, 0, 0, 0);
  // find a free window that overlaps the evening shallow window start
  for (const w of free) {
    const s = new Date(Math.max(w.start.getTime(), windowStart.getTime()));
    const e = new Date(Math.min(w.end.getTime(), s.getTime() + 25 * 60 * 1000));
    if (e > s) {
      let topic: string | undefined = undefined;
      const counts = options?.topicCounts || {};
      const preferred = options?.preferredTopics || [];
      // Prefer favorite topics if provided, else use most common
      for (const t of preferred) { if ((counts[t] || 0) > 0) { topic = t; break; } }
      if (!topic) {
        const entries = Object.entries(counts).filter(([, c]) => c > 0).sort((a,b)=>b[1]-a[1]);
        topic = entries[0]?.[0];
      }
      const title = options?.title || (topic ? `Vibe code: ${topic}` : 'Vibe coding');
      return { id: `shallow_${s.getTime()}`, kind: 'SHALLOW_SESSION', title, startAt: s.toISOString(), endAt: e.toISOString(), topic };
    }
  }
  return null;
}
