import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { taskManagerAgent } from "@/lib/ai/agents/taskManagerAgent";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { prompt } = body;

        const result = await taskManagerAgent.run({
            userId,
            brainDumpText: prompt, // Reusing brainDumpText field for generic prompt
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Prisma agent error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
