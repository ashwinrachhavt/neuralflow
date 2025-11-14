import { NextResponse } from 'next/server';
import { getOrCreateDbUser } from '@/lib/get-or-create-user';
import { prisma } from '@/server/db/client';
import { generateQuiz } from '@/lib/ai/agents/quizAgent';
import { createDeckForNote, createFlashcards, createQuizForNote } from '@/server/db/quizzes';
import { logAgentRunStart, logAgentRunFinish } from '@/server/db/agentRuns';

type RouteContext = { params: { noteId: string } };

export async function POST(_req: Request, { params }: RouteContext) {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const note = await prisma.note.findFirst({ where: { id: params.noteId, task: { board: { userId: user.id } } } });
  if (!note) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const startedAt = Date.now();
  const run = await logAgentRunStart({ userId: user.id, type: 'quiz-gen', model: process.env.AI_MODEL }).catch(() => null);
  try {
    const output = await generateQuiz({ markdown: note.contentMarkdown });
    // Persist: deck, cards, quiz with questions
    const deck = await createDeckForNote(user.id, note.id, `Cards • ${note.title}`);
    const cardsRes = await createFlashcards(deck.id, output.flashcards);
    const quiz = await createQuizForNote(user.id, note.id, deck.id, `Quiz • ${note.title}`, output.questions);
    await logAgentRunFinish({ runId: run?.id, status: 'ok', durationMs: Date.now() - startedAt, output: { flashcards: output.flashcards.length, questions: output.questions.length, deckId: deck.id, quizId: quiz.id } }).catch(() => {});
    return NextResponse.json({ deckId: deck.id, createdCards: cardsRes.count, quizId: quiz.id, questions: output.questions.length });
  } catch (e: any) {
    await logAgentRunFinish({ runId: run?.id, status: 'error', durationMs: Date.now() - startedAt, error: e?.message ?? String(e) }).catch(() => {});
    return NextResponse.json({ message: 'Failed to generate quiz' }, { status: 500 });
  }
}
