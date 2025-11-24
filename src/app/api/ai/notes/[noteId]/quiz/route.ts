import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ noteId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { noteId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const note = await prisma.note.findFirst({ where: { id: noteId, task: { board: { userId: (user as any).id } } } });
  if (!note) return NextResponse.json({ message: "Not found" }, { status: 404 });
  // Stubbed response; later we can create deck + quiz rows
  return NextResponse.json({ deckId: "deck_stub", createdCards: 8, quizId: "quiz_stub", questions: 6 });
}
