import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getUserOr401 } from "@/lib/api-helpers";

type Ctx = { params: { noteId: string } };

export async function POST(_req: Request, { params }: Ctx) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const note = await prisma.note.findFirst({ where: { id: params.noteId, task: { board: { userId: (user as any).id } } } });
  if (!note) return NextResponse.json({ message: "Not found" }, { status: 404 });
  // Stubbed response; later we can create deck + quiz rows
  return NextResponse.json({ deckId: "deck_stub", createdCards: 8, quizId: "quiz_stub", questions: 6 });
}
