import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;

  const [decks, reviews, quizzes] = await Promise.all([
    prisma.flashcardDeck.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        sourceNoteId: true,
        updatedAt: true,
        _count: { select: { cards: true, quizzes: true } },
      },
    }),
    prisma.flashcardReview.findMany({
      where: { userId },
      orderBy: { reviewedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        flashcardId: true,
        reviewedAt: true,
        easeFactor: true,
        intervalDays: true,
        grade: true,
      },
    }),
    prisma.quiz.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { questions: true, attempts: true } },
      },
      take: 50,
    }),
  ]);

  return NextResponse.json({ decks, reviews, quizzes });
}

