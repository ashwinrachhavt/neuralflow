import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getUserOr401 } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ noteId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { noteId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const note = await prisma.note.findFirst({ where: { id: noteId, task: { board: { userId: (user as any).id } } } });
  if (!note) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const text = note.contentMarkdown || "";
  const summary = text.length > 120 ? text.slice(0, 120) + "…" : (text || "No content to summarize.");
  const bullets = ["Key point 1", "Key point 2", "Key point 3"];
  return NextResponse.json({ summary, bullets });
}
