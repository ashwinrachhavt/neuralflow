import { NextRequest, NextResponse } from "next/server";
import { gamifyAgent } from "@/lib/ai/agents/gamifyAgent";
import { z } from "zod";

const BodySchema = z.object({
    userId: z.string(),
    action: z.enum(["TASK_COMPLETE", "POMODORO_COMPLETE"]),
    taskId: z.string().optional(),
    sessionId: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, action, taskId, sessionId } = BodySchema.parse(body);

        // Context for the agent
        const ctx: any = {
            userId,
            gamification: {
                action,
                taskId,
                sessionId,
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
