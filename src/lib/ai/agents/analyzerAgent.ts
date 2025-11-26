import { generateObject } from "ai";
import { z } from "zod";
import { prisma } from "../../prisma";
import { textModel } from "../config";
import type { AnalyzerAgentResult, AnalyzerMetricSummary } from "../../types/agents";

const InsightSchema = z.object({
    title: z.string(),
    insight: z.string(),
    evidence: z.string(),
    suggestion: z.string().optional(),
});

const InsightsArraySchema = z.object({
    insights: z.array(InsightSchema),
});

import { unstable_cache } from "next/cache";

async function runAnalyzerAgentInternal(input: {
    userId: string;
    period: "daily" | "weekly";
    start: Date;
    end: Date;
}): Promise<AnalyzerAgentResult> {
    const { userId, period, start, end } = input;

    // 1. Fetch data
    const [tasks, pomodoros, snapshots, gamification, learnings] = await Promise.all([
        prisma.task.findMany({
            where: {
                board: { userId },
                updatedAt: { gte: start, lte: end },
            },
        }),
        prisma.pomodoroSession.findMany({
            where: {
                userId,
                startTime: { gte: start, lte: end },
            },
        }),
        prisma.userDailySnapshot.findMany({
            where: {
                userId,
                date: { gte: start, lte: end },
            },
        }),
        prisma.userGamificationProfile.findUnique({
            where: { userId },
        }),
        prisma.taskLearning.findMany({ where: { userId, createdAt: { gte: start, lte: end } }, select: { id: true, tags: true } }),
    ]);

    // 2. Compute aggregates
    const tasksTotal = tasks.length;
    const tasksCompleted = tasks.filter((t) => t.status === "DONE").length;
    const tasksCompletionRate = tasksTotal > 0 ? tasksCompleted / tasksTotal : 0;

    const pomodorosTotal = pomodoros.length;
    const deepWorkPomodoros = pomodoros.filter((_p) => {
        // Heuristic: if task type is DEEP_WORK or duration > 25
        // We'll assume standard pomodoro is deep work for now unless tagged otherwise
        return true;
    }).length;

    const focusMinutesTotal = pomodoros.reduce((acc, p) => acc + p.durationMinutes, 0);

    // Tag breakdown
    const tagBreakdown: Record<string, number> = {};
    tasks.forEach((t) => {
        t.tags.forEach((tag) => {
            tagBreakdown[tag] = (tagBreakdown[tag] || 0) + 1;
        });
    });

    const aggregates: Record<string, number> = {
        tasks_total: tasksTotal,
        tasks_completed: tasksCompleted,
        tasks_completion_rate: tasksCompletionRate,
        pomodoros_total: pomodorosTotal,
        deep_work_pomodoros: deepWorkPomodoros,
        focus_minutes_total: focusMinutesTotal,
        learnings_total: learnings.length,
        // Add more from snapshots if needed
        quiz_attempts: snapshots.reduce((acc, s) => acc + s.quizAttempts, 0),
        flashcards_reviewed: snapshots.reduce((acc, s) => acc + s.flashcardsReviewed, 0),
    };

    if (gamification) {
        aggregates["current_streak"] = gamification.currentDailyStreak;
        aggregates["xp_total"] = gamification.xp;
    }

    // Learning tag breakdown
    const learnTagBreakdown: Record<string, number> = {};
    for (const l of learnings) (l.tags || []).forEach(t => { learnTagBreakdown[t] = (learnTagBreakdown[t] || 0) + 1; });

    const metrics: AnalyzerMetricSummary = {
        period,
        startIso: start.toISOString(),
        endIso: end.toISOString(),
        aggregates,
        tagBreakdown: { ...(tagBreakdown || {}), ...(learnTagBreakdown || {}) },
    };

    // 3. Generate insights
    const { object } = await generateObject({
        model: textModel("gpt-4o-mini"), // Use a fast model
        schema: InsightsArraySchema,
        system: `You are a calm productivity analyst. Given numeric metrics, derive concise insights.
    Focus on:
    - Trends (up/down)
    - Balance (deep vs shallow)
    - Consistency
    - Neglected areas
    `,
        prompt: JSON.stringify(metrics, null, 2),
    });

    return {
        metrics,
        insights: object.insights,
    };
}

export const runAnalyzerAgent = unstable_cache(
    runAnalyzerAgentInternal,
    ["analyzer-agent"],
    {
        revalidate: 300, // Cache for 5 minutes
        tags: ["analyzer"],
    }
);
