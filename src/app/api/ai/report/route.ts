import { NextRequest, NextResponse } from "next/server";
import { runWeeklyReview } from "@/lib/ai/orchestrator";
import { z } from "zod";

const BodySchema = z.object({
    userId: z.string(),
    startIso: z.string().optional(),
    endIso: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, startIso, endIso } = BodySchema.parse(body);

        // Default to last 7 days if not provided
        const end = endIso ? new Date(endIso) : new Date();
        const start = startIso ? new Date(startIso) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const result = await runWeeklyReview(userId, start, end);

        return NextResponse.json(result);
    } catch (error) {
        console.error("[API] Report generation failed", error);
        return NextResponse.json(
            { error: "Failed to generate report", details: String(error) },
            { status: 500 }
        );
    }
}
