import { generateObject } from "ai";
import { z } from "zod";
import { prisma } from "../../prisma";
import { textModel, STRONG_TEXT_MODEL } from "../config";
import type { AnalyzerInsight, AnalyzerMetricSummary, ReporterAgentResult, ReporterExperiment } from "../../types/agents";
import type { ReporterProfile } from "@prisma/client";

const ExperimentSchema = z.object({
    title: z.string(),
    description: z.string(),
    expectedImpact: z.string().optional(),
});

const ReporterResultSchema = z.object({
    summary: z.string(),
    highlights: z.array(z.string()),
    improvementIdeas: z.array(z.string()),
    experiments: z.array(ExperimentSchema),
    sentiment: z.enum(["CALM", "FOCUSED", "STRETCHED", "RECOVER"]).optional(),
    swot: z.object({
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
        opportunities: z.array(z.string()),
        threats: z.array(z.string()),
    }),
});

const ProfileUpdateSchema = z.object({
    personalityNotes: z.record(z.string(), z.any()).optional(),
    trendNotes: z.record(z.string(), z.any()).optional(),
    experiments: z.array(z.record(z.string(), z.any())).optional(),
});

export async function runReporterAgent(input: {
    userId: string;
    metrics: AnalyzerMetricSummary;
    insights: AnalyzerInsight[];
    profile: ReporterProfile | null;
}): Promise<ReporterAgentResult & { swot: any }> {
    const { metrics, insights, profile } = input;

    const systemPrompt = `
You are Dao, the user's personal productivity storyteller.

You will create:
- 1–2 paragraph summary of the period
- 3–7 bullet highlights (wins)
- 3–7 improvement ideas
- 2–4 small, testable experiments
- A high-level sentiment label (CALM, FOCUSED, STRETCHED, RECOVER)
- A compact SWOT analysis (Strengths / Weaknesses / Opportunities / Threats)

Style:
- Calm, grounded, non-judgmental
- Concrete, not fluffy
- Use "you" sparingly; no toxic positivity
`;

    const { object } = await generateObject({
        model: textModel(STRONG_TEXT_MODEL),
        schema: ReporterResultSchema,
        system: systemPrompt,
        prompt: JSON.stringify({
            metrics,
            insights,
            profile: profile
                ? {
                    personalityNotes: profile.personalityNotes,
                    experiments: profile.experiments,
                    trendNotes: profile.trendNotes,
                }
                : {},
        }),
    });

    return object as ReporterAgentResult & { swot: any };
}

export async function updateReporterProfile(input: {
    userId: string;
    previousProfile: ReporterProfile | null;
    latestMetrics: AnalyzerMetricSummary;
    latestInsights: AnalyzerInsight[];
    latestExperiments: ReporterExperiment[];
}): Promise<ReporterProfile> {
    const { userId, previousProfile, latestMetrics, latestInsights, latestExperiments } = input;

    const { object } = await generateObject({
        model: textModel("gpt-4o-mini"),
        schema: ProfileUpdateSchema,
        system: `
You maintain a compact profile about a single user.
Given previous profile, new metrics and insights, and latest experiments,
update the profile WITHOUT repeating old long text. Keep it small and structured.
`,
        prompt: JSON.stringify({
            previousProfile: previousProfile
                ? {
                    personalityNotes: previousProfile.personalityNotes,
                    experiments: previousProfile.experiments,
                    trendNotes: previousProfile.trendNotes,
                }
                : {},
            latestMetrics,
            latestInsights,
            latestExperiments,
        }),
    });

    // Merge logic could be more sophisticated, but for now we'll trust the LLM to return the new state
    // or we could merge it here. The prompt asks to "update", so let's assume it returns the NEW state.
    // However, to be safe, we might want to merge manually if the LLM only returns diffs.
    // For now, let's assume it returns the full compact state.

    return await prisma.reporterProfile.upsert({
        where: { userId },
        create: {
            userId,
            personalityNotes: object.personalityNotes ?? {},
            trendNotes: object.trendNotes ?? {},
            experiments: object.experiments ?? [],
        },
        update: {
            personalityNotes: object.personalityNotes ?? undefined,
            trendNotes: object.trendNotes ?? undefined,
            experiments: object.experiments ?? undefined,
        },
    });
}
