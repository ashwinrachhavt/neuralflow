import { NextRequest, NextResponse } from "next/server";
import { gamifyAgent } from "@/lib/ai/agents/gamifyAgent";
import { z } from "zod";

const BodySchema = z.object({
    action: z.string(), // e.g., "TASK_COMPLETE", "POMODORO_COMPLETE"
    details: z.record(z.string(), z.any()).optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, details } = BodySchema.parse(body);

        // Mock context
        const ctx: any = {
            userId: "debug-user",
            gamification: {
                action,
                ...details,
            },
        };

        const result = await gamifyAgent.run({ ...ctx, context: ctx });

        return NextResponse.json(result);
    } catch (error) {
        console.error("[API] Gamify agent failed", error);
        return NextResponse.json(
            { error: "Failed to run gamify agent", details: String(error) },
            { status: 500 }
        );
    }
}
