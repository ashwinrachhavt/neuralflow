import { prisma } from "@/lib/prisma";
import { generateText } from "ai";
import { openai } from "@/lib/ai/client";
import type { GemSlug } from "./catalog";
import { GEM_ICON_PATHS, GEM_META } from "./catalog";

type Trigger = "TASK_COMPLETED" | "POMODORO_COMPLETED" | "END_OF_DAY";

type RuleCtx = {
  userId: string;
  now: Date;
  task?: { id: string; priority: "LOW" | "MEDIUM" | "HIGH"; createdAt: Date; estimatedPomodoros: number | null; tags: string[] } | null;
  daily?: any; // UserDailySnapshot
};

type Rule = {
  slug: GemSlug;
  trigger: Trigger;
  shouldAward: (ctx: RuleCtx) => Promise<boolean>;
};

async function hasStone(userId: string, slug: GemSlug) {
  const stone = await prisma.stoneDefinition.findFirst({ where: { slug } });
  if (!stone) return false;
  const existing = await prisma.userStone.findFirst({ where: { userId, stoneId: stone.id } });
  return !!existing;
}

async function ensureCatalog() {
  await Promise.all(
    (Object.keys(GEM_META) as GemSlug[]).map(async (slug) => {
      const meta = GEM_META[slug];
      await prisma.stoneDefinition.upsert({
        where: { slug },
        create: {
          slug,
          name: meta.name,
          description: meta.theme,
          imagePath: GEM_ICON_PATHS[slug],
          rarity: meta.rarity as any,
        },
        update: {
          name: meta.name,
          description: meta.theme,
          imagePath: GEM_ICON_PATHS[slug],
          rarity: meta.rarity as any,
        },
      });
    })
  );
}

async function generateLore(slug: GemSlug, userSummary: string) {
  const meta = GEM_META[slug];
  const { text } = await generateText({
    model: openai("gpt-4.1-mini"),
    prompt: `User just earned the gem "${meta.name}" (${meta.theme}).\nContext about recent behavior: ${userSummary}.\n\nWrite 1–2 sentences of lore that:\n- feels like a mythic artifact description\n- ties to their behavior\n- grounded, not cringe\n- second person or neutral is fine.`,
  });
  return text.trim();
}

async function awardStone(userId: string, slug: GemSlug, source: string, sourceId?: string, withLore = true) {
  await ensureCatalog();
  const stone = await prisma.stoneDefinition.findFirstOrThrow({ where: { slug } });
  let lore: string | undefined;
  if (withLore) {
    // Minimal summary: pick from daily snapshot
    const today = new Date(); today.setUTCHours(0,0,0,0);
    const daily = await prisma.userDailySnapshot.findUnique({ where: { userId_date: { userId, date: today } } });
    const summary = daily ? JSON.stringify(daily) : "";
    lore = await generateLore(slug, summary);
  }
  const created = await prisma.userStone.create({ data: { userId, stoneId: stone.id, source, note: lore ?? undefined, relatedTaskIds: sourceId ? [sourceId] : [] } });
  return created;
}

async function addShards(userId: string, slug: GemSlug, shards = 1) {
  await ensureCatalog();
  const stone = await prisma.stoneDefinition.findFirstOrThrow({ where: { slug } });
  const progress = await prisma.userStoneProgress.upsert({
    where: { userId_stoneId: { userId, stoneId: stone.id } },
    create: { userId, stoneId: stone.id, currentShards: shards },
    update: { currentShards: { increment: shards } },
  });
  if (progress.currentShards + shards >= progress.targetShards) {
    const over = progress.currentShards + shards - progress.targetShards;
    await awardStone(userId, slug, "SHARDS");
    await prisma.userStoneProgress.update({
      where: { userId_stoneId: { userId, stoneId: stone.id } },
      data: { currentShards: over },
    });
    return { leveled: true, over };
  }
  return { leveled: false };
}

export const RULES: Rule[] = [
  // Quartz – first 3 task day
  {
    slug: "quartz",
    trigger: "TASK_COMPLETED",
    async shouldAward(ctx) {
      if (await hasStone(ctx.userId, "quartz")) return false;
      const today = new Date(ctx.now); today.setUTCHours(0,0,0,0);
      const daily = await prisma.userDailySnapshot.findUnique({ where: { userId_date: { userId: ctx.userId, date: today } } });
      return (daily?.tasksCompleted ?? 0) >= 3;
    },
  },
  // Topaz – 5-day streak
  {
    slug: "topaz",
    trigger: "END_OF_DAY",
    async shouldAward(ctx) {
      if (await hasStone(ctx.userId, "topaz")) return false;
      const profile = await prisma.userGamificationProfile.findUnique({ where: { userId: ctx.userId } });
      return (profile?.currentDailyStreak ?? 0) >= 5;
    },
  },
  // Emerald – learning day (flashcards + quiz)
  {
    slug: "emerald",
    trigger: "END_OF_DAY",
    async shouldAward(ctx) {
      if (await hasStone(ctx.userId, "emerald")) return false;
      const daily = ctx.daily ?? (await prisma.userDailySnapshot.findFirst({ where: { userId: ctx.userId }, orderBy: { date: "desc" } }));
      return (daily?.flashcardsReviewed ?? 0) > 0 && (daily?.quizAttempts ?? 0) > 0 && (daily?.avgQuizScore ?? 0) >= 70;
    },
  },
  // Sapphire – 6 deep work pomodoros in 7 days
  {
    slug: "sapphire",
    trigger: "END_OF_DAY",
    async shouldAward(ctx) {
      if (await hasStone(ctx.userId, "sapphire")) return false;
      const end = new Date(ctx.now); end.setUTCHours(0,0,0,0);
      const start = new Date(end); start.setUTCDate(end.getUTCDate() - 6);
      const days = await prisma.userDailySnapshot.findMany({ where: { userId: ctx.userId, date: { gte: start, lte: end } } });
      const totalDeep = days.reduce((a, d) => a + (d.deepWorkPomodoros ?? 0), 0);
      return totalDeep >= 6;
    },
  },
  // Garnet – reflections 3 days in a row
  {
    slug: "garnet",
    trigger: "END_OF_DAY",
    async shouldAward(ctx) {
      if (await hasStone(ctx.userId, "garnet")) return false;
      const end = new Date(ctx.now); end.setUTCHours(0,0,0,0);
      for (let i = 0; i < 3; i++) {
        const day = new Date(end); day.setUTCDate(end.getUTCDate() - i);
        const snap = await prisma.userDailySnapshot.findUnique({ where: { userId_date: { userId: ctx.userId, date: day } } });
        if ((snap?.reflectionsWritten ?? 0) === 0) return false;
      }
      return true;
    },
  },
  // Ruby – hard task shipped
  {
    slug: "ruby",
    trigger: "TASK_COMPLETED",
    async shouldAward(ctx) {
      if (!ctx.task) return false;
      if (await hasStone(ctx.userId, "ruby")) return false;
      const { priority, estimatedPomodoros, createdAt } = ctx.task;
      const ageDays = Math.floor((ctx.now.getTime() - createdAt.getTime()) / 86400000);
      return priority === "HIGH" && (estimatedPomodoros ?? 0) >= 3 && ageDays >= 3;
    },
  },
  // Diamond – mastery thresholds
  {
    slug: "diamond",
    trigger: "END_OF_DAY",
    async shouldAward(ctx) {
      if (await hasStone(ctx.userId, "diamond")) return false;
      const profile = await prisma.userGamificationProfile.findUnique({ where: { userId: ctx.userId } });
      return (profile?.totalDeepWorkBlocks ?? 0) >= 100 && (profile?.longestDailyStreak ?? 0) >= 28;
    },
  },
];

export const gamificationEngine = {
  ensureCatalog,

  async onTaskCompleted(userId: string, taskId: string) {
    const now = new Date();
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { shards: [], awards: [] as string[] };

    // Update daily snapshot and profile XP/counters
    const day = new Date(now); day.setUTCHours(0,0,0,0);
    const isDeep = (task.tags ?? []).some((t) => t.toLowerCase().includes("deep"));
    const isLearning = (task.tags ?? []).some((t) => t.toLowerCase().includes("learn"));
    await prisma.$transaction([
      prisma.userDailySnapshot.upsert({
        where: { userId_date: { userId, date: day } },
        create: {
          userId,
          date: day,
          tasksCompleted: 1,
          highPriorityCompleted: task.priority === "HIGH" ? 1 : 0,
          deepWorkTasks: isDeep ? 1 : 0,
          learningTasks: isLearning ? 1 : 0,
        },
        update: {
          tasksCompleted: { increment: 1 },
          highPriorityCompleted: { increment: task.priority === "HIGH" ? 1 : 0 },
          deepWorkTasks: { increment: isDeep ? 1 : 0 },
          learningTasks: { increment: isLearning ? 1 : 0 },
        },
      }),
      prisma.userGamificationProfile.upsert({
        where: { userId },
        create: {
          userId,
          xp: 10 + Math.max(0, (task.estimatedPomodoros ?? 0)) * 5,
          totalTasksCompleted: 1,
          lastActivityDate: now,
        },
        update: {
          xp: { increment: 10 + Math.max(0, (task.estimatedPomodoros ?? 0)) * 5 },
          totalTasksCompleted: { increment: 1 },
          lastActivityDate: now,
        },
      }),
    ]);

    // Simple shard mapping by tags/priority
    const tags = task.tags ?? [];
    if (tags.some((t) => t.toLowerCase().includes("deep"))) await addShards(userId, "sapphire", 1);
    if (tags.some((t) => t.toLowerCase().includes("learn"))) await addShards(userId, "emerald", 1);
    if (task.priority === "HIGH") await addShards(userId, "ruby", 1);

    // Ensure a delightful first unlock: if user has no stones yet, award Quartz immediately
    const ownedCount = await prisma.userStone.count({ where: { userId } });
    const awards: string[] = [];
    if (ownedCount === 0) {
      await awardStone(userId, "quartz", "FIRST_TASK", taskId);
      awards.push("quartz");
    }

    // Rule-based award checks (task-completed)
    const ctx: RuleCtx = {
      userId,
      now,
      task: {
        id: task.id,
        priority: task.priority as any,
        createdAt: task.createdAt,
        estimatedPomodoros: task.estimatedPomodoros ?? null,
        tags,
      },
    };
    for (const rule of RULES.filter((r) => r.trigger === "TASK_COMPLETED")) {
      if (await rule.shouldAward(ctx)) {
        await awardStone(userId, rule.slug, "RULE", taskId);
        awards.push(rule.slug);
      }
    }
    return { shards: [], awards };
  },

  async onPomodoroCompleted(userId: string, sessionId: string) {
    const session = await prisma.pomodoroSession.findUnique({ where: { id: sessionId }, include: { task: true } });
    if (!session) return { shards: [], awards: [] };
    // Count deep pomodoros via task tag
    const tags = session.task?.tags ?? [];
    if (tags.some((t) => t.toLowerCase().includes("deep"))) await addShards(userId, "sapphire", 1);
    if ((session.reflectionMarkdown ?? "").trim().length > 0) await addShards(userId, "garnet", 1);

    const now = new Date();
    const day = new Date(session.startTime); day.setUTCHours(0,0,0,0);
    const isDeep = tags.some((t) => t.toLowerCase().includes("deep"));
    await prisma.$transaction([
      prisma.userDailySnapshot.upsert({
        where: { userId_date: { userId, date: day } },
        create: {
          userId,
          date: day,
          pomodoroCount: 1,
          focusMinutes: session.durationMinutes,
          deepWorkPomodoros: isDeep ? 1 : 0,
          reflectionsWritten: (session.reflectionMarkdown ?? "").trim().length > 0 ? 1 : 0,
        },
        update: {
          pomodoroCount: { increment: 1 },
          focusMinutes: { increment: session.durationMinutes },
          deepWorkPomodoros: { increment: isDeep ? 1 : 0 },
          reflectionsWritten: { increment: (session.reflectionMarkdown ?? "").trim().length > 0 ? 1 : 0 },
        },
      }),
      prisma.userGamificationProfile.upsert({
        where: { userId },
        create: {
          userId,
          xp: 5,
          totalPomodoros: 1,
          totalDeepWorkBlocks: isDeep ? 1 : 0,
          lastActivityDate: now,
        },
        update: {
          xp: { increment: 5 },
          totalPomodoros: { increment: 1 },
          totalDeepWorkBlocks: { increment: isDeep ? 1 : 0 },
          lastActivityDate: now,
        },
      }),
    ]);
    return { shards: [], awards: [] };
  },

  async onEndOfDay(userId: string, date: Date = new Date()) {
    const now = date;
    const day = new Date(now); day.setUTCHours(0,0,0,0);
    const daily = await prisma.userDailySnapshot.findUnique({ where: { userId_date: { userId, date: day } } });
    // Update streaks: if active today, increment streak; else reset
    const hadActivity = (daily?.tasksCompleted ?? 0) > 0 || (daily?.pomodoroCount ?? 0) > 0 || (daily?.flashcardsReviewed ?? 0) > 0 || (daily?.quizAttempts ?? 0) > 0;
    await prisma.userGamificationProfile.upsert({
      where: { userId },
      create: {
        userId,
        currentDailyStreak: hadActivity ? 1 : 0,
        longestDailyStreak: hadActivity ? 1 : 0,
        lastActivityDate: now,
      },
      update: {
        currentDailyStreak: hadActivity ? { increment: 1 } : 0,
        longestDailyStreak: hadActivity ? undefined : undefined,
        lastActivityDate: now,
      },
    });
    // Maintain longest if surpassed
    const prof = await prisma.userGamificationProfile.findUnique({ where: { userId } });
    if (prof && prof.currentDailyStreak > (prof.longestDailyStreak ?? 0)) {
      await prisma.userGamificationProfile.update({ where: { userId }, data: { longestDailyStreak: prof.currentDailyStreak } });
    }
    const ctx: RuleCtx = { userId, now, daily };
    const awards: string[] = [];
    for (const rule of RULES.filter((r) => r.trigger === "END_OF_DAY")) {
      if (await rule.shouldAward(ctx)) {
        await awardStone(userId, rule.slug, "RULE");
        awards.push(rule.slug);
      }
    }
    return { awards };
  },

  async getClaimables(userId: string) {
    await ensureCatalog();
    const stones = await prisma.stoneDefinition.findMany();
    const progress = await prisma.userStoneProgress.findMany({ where: { userId } });
    const owned = await prisma.userStone.findMany({ where: { userId } });
    return stones
      .map((s) => {
        const p = progress.find((x) => x.stoneId === s.id);
        const current = p?.currentShards ?? 0;
        const target = p?.targetShards ?? 10;
        const ready = current >= target;
        return {
          slug: s.slug,
          name: s.name,
          rarity: s.rarity,
          image: s.imagePath,
          shards: { current, target },
          ownedCount: owned.filter((e) => e.stoneId === s.id).length,
          ready,
        };
      })
      .filter((it) => it.ready);
  },

  async claim(userId: string, slug: keyof typeof GEM_ICON_PATHS) {
    await ensureCatalog();
    const stone = await prisma.stoneDefinition.findFirstOrThrow({ where: { slug } });
    const progress = await prisma.userStoneProgress.findUnique({ where: { userId_stoneId: { userId, stoneId: stone.id } } });
    const current = progress?.currentShards ?? 0;
    const target = progress?.targetShards ?? 10;
    if (current < target) {
      return { ok: false as const, reason: "NOT_ENOUGH_SHARDS" };
    }
    await awardStone(userId, slug, "CLAIM");
    await prisma.userStoneProgress.upsert({
      where: { userId_stoneId: { userId, stoneId: stone.id } },
      create: { userId, stoneId: stone.id, currentShards: 0, targetShards: target },
      update: { currentShards: current - target },
    });
    return { ok: true as const };
  },
};
