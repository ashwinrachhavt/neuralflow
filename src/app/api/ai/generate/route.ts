import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { getUserOr401 } from "@/lib/api-helpers";

export async function POST(req: Request) {
    const user = await getUserOr401();
    if (!(user as any).id) return new NextResponse("Unauthorized", { status: 401 });

    const { prompt } = await req.json();

    try {
        const { text } = await generateText({
            model: openai("gpt-4o-mini"),
            prompt: prompt,
            system: "You are a helpful AI assistant embedded in a project management tool. Keep your responses concise and relevant to the context.",
        });

        return NextResponse.json({ text });
    } catch (error) {
        console.error("AI Generation Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
