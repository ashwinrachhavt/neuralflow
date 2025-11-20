// Plan feature removed
type PlannedTask = never;

export type ScheduledBlock =
  | { type: "focus"; taskIndex: number; minutes: number }
  | { type: "break"; minutes: number };

export function scheduleBlocks(tasks: PlannedTask[]): ScheduledBlock[] {
  const FOCUS_LEN = 25;
  const SHORT_BREAK = 5;
  const LONG_BREAK = 15;
  const LONG_EVERY = 4;

  // Sort: deep & high priority first
  const priorityRank: Record<PlannedTask["priority"], number> = {
    high: 0,
    medium: 1,
    low: 2,
  } as const as any;

  const sortedTasks = [...tasks].sort((a, b) => {
    const pDiff = priorityRank[a.priority] - priorityRank[b.priority];
    if (pDiff !== 0) return pDiff;
    if (a.kind !== b.kind) return a.kind === "deep" ? -1 : 1;
    return 0;
  });

  const blocks: ScheduledBlock[] = [];
  let focusCount = 0;

  sortedTasks.forEach((task, idx) => {
    let remaining = Math.max(1, Math.floor(task.estimateMinutes));

    while (remaining > 0) {
      const focusMinutes = Math.min(FOCUS_LEN, remaining);
      blocks.push({ type: "focus", taskIndex: idx, minutes: focusMinutes });
      remaining -= focusMinutes;
      focusCount++;

      // add break between focus blocks (not after the very last one)
      if (remaining > 0) {
        const breakMinutes = focusCount % LONG_EVERY === 0 ? LONG_BREAK : SHORT_BREAK;
        blocks.push({ type: "break", minutes: breakMinutes });
      }
    }

    // small separation break between tasks (optional)
    if (idx < sortedTasks.length - 1) {
      blocks.push({ type: "break", minutes: SHORT_BREAK });
    }
  });

  return blocks;
}
