import { computeFreeWindows, computeFocusSuggestion, computeGymSuggestion, computeShallowSuggestion, type GymPreference, type Suggestion } from "@/lib/scheduler/engine";

export type SchedulerPrefs = {
  workStartHour?: number; // default 9
  workEndHour?: number;   // default 17
  shallowStartHour?: number; // default 18
  favoriteTopics?: string[];
  gym?: { enabled?: boolean; days?: number[]; startHour?: number; endHour?: number };
  vibeProjects?: string[]; // e.g., project slugs or friendly names
};

export type SchedulerContext = {
  now: Date;
  userId: string;
  free: { start: Date; end: Date }[];
  topicCounts: Record<string, number>;
  boostedTopics: string[];
  prefs: SchedulerPrefs;
};

export interface Rule {
  id: string;
  description: string;
  evaluate: (ctx: SchedulerContext) => Suggestion[];
}

function firstFreeWithin(free: { start: Date; end: Date }[], minMinutes = 20): { start: Date; end: Date } | null {
  for (const w of free) {
    const start = w.start;
    const end = new Date(Math.min(w.end.getTime(), start.getTime() + minMinutes * 60 * 1000));
    if (end > start) return { start, end };
  }
  return null;
}

export function workHoursFocusRule(): Rule {
  return {
    id: "work-hours-focus",
    description: "During work hours, suggest a focus session based on backlog topics.",
    evaluate: (ctx) => {
      const workStart = Number(ctx.prefs.workStartHour ?? 9);
      const workEnd = Number(ctx.prefs.workEndHour ?? 17);
      const hour = ctx.now.getHours();
      if (hour < workStart || hour >= workEnd) return [];
      const s = computeFocusSuggestion(ctx.free, ctx.topicCounts);
      return s ? [s] : [];
    },
  };
}

export function afterHoursVibeLogRule(): Rule {
  return {
    id: "after-hours-vibe-log",
    description: "After work hours, suggest logging hours (vibe coding) on preferred projects/topics.",
    evaluate: (ctx) => {
      const workEnd = Number(ctx.prefs.workEndHour ?? 17);
      const hour = ctx.now.getHours();
      if (hour < workEnd) return [];
      const win = firstFreeWithin(ctx.free, 25);
      if (!win) return [];

      const preferredTopics = [
        ...(ctx.prefs.favoriteTopics || []),
        ...(ctx.boostedTopics || []),
      ];
      const project = (ctx.prefs.vibeProjects || [])[0];
      const titleBase = project ? `Log hours: ${project}` : "Log hours: Vibe coding";
      return [{
        id: `log_${win.start.getTime()}`,
        kind: 'LOG_HOURS',
        title: titleBase,
        startAt: win.start.toISOString(),
        endAt: win.end.toISOString(),
        project: project,
      }];
    },
  };
}

export function eveningShallowRule(): Rule {
  return {
    id: "evening-shallow",
    description: "In the evening (shallowStartHour+), suggest a shallow/vibe coding block with preferred topics.",
    evaluate: (ctx) => {
      const shallowStart = Number(ctx.prefs.shallowStartHour ?? 18);
      const hour = ctx.now.getHours();
      if (hour < shallowStart) return [];
      const preferredTopics = [
        ...(ctx.prefs.favoriteTopics || []),
        ...(ctx.boostedTopics || []),
      ];
      const shallow = computeShallowSuggestion(ctx.now, ctx.free, shallowStart, {
        title: 'Vibe coding',
        preferredTopics,
        topicCounts: ctx.topicCounts,
      });
      return shallow ? [shallow] : [];
    },
  };
}

export function gymRule(): Rule {
  return {
    id: "gym-reminder",
    description: "Suggest a gym reminder in configured evening window on eligible days.",
    evaluate: (ctx) => {
      const g = ctx.prefs.gym || {};
      const pref: GymPreference = {
        dayOfWeek: Array.isArray(g.days) ? g.days! : [0,1,2,3,4,5,6],
        startHour: Number(g.startHour ?? 19),
        endHour: Number(g.endHour ?? 21),
      };
      const s = computeGymSuggestion(ctx.now, ctx.free, pref);
      return s ? [s] : [];
    },
  };
}

export function runRules(rules: Rule[], ctx: SchedulerContext): Suggestion[] {
  const all: Suggestion[] = [];
  for (const r of rules) {
    try {
      const out = r.evaluate(ctx) || [];
      for (const s of out) all.push(s);
    } catch (_e) {
      // Ignore rule errors to keep engine resilient
    }
  }
  // Deduplicate by kind+startAt to avoid overlap
  const seen = new Set<string>();
  const deduped: Suggestion[] = [];
  for (const s of all) {
    const key = `${s.kind}:${s.startAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(s);
  }
  return deduped.slice(0, 5); // keep it concise
}

export function defaultRules(): Rule[] {
  return [
    workHoursFocusRule(),
    eveningShallowRule(),
    afterHoursVibeLogRule(),
    gymRule(),
  ];
}

