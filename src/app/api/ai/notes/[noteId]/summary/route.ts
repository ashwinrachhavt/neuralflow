import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";
import { generateObject } from "ai";
import { z } from "zod";
import { openai } from "@/lib/ai/client";

type Ctx = { params: Promise<{ noteId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { noteId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const note = await prisma.note.findFirst({ where: { id: noteId, task: { board: { userId: (user as any).id } } } });
  if (!note) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const text = (note.contentMarkdown || "").trim();
  if (!text) return NextResponse.json({ summary: "No content to summarize.", bullets: [] });

  const Schema = z.object({
    summary: z.string(),
    bullets: z.array(z.string()).min(0).max(10),
  });

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: Schema,
      system: "You are a concise technical summarizer. Return a crisp 2–3 sentence summary and 3–7 key bullets.",
      prompt: text.slice(0, 6000),
    });
    return NextResponse.json(object);
  } catch (_e) {
    const summary = text.length > 200 ? text.slice(0, 200) + "…" : text;
    return NextResponse.json({ summary, bullets: [] });
  }
}
