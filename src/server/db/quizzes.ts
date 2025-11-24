import { prisma } from '@/lib/prisma';

type Flashcard = { front: string; back: string };
type QuizQ = { question: string; answer: string };

export async function createDeckForNote(userId: string, noteId: string, title: string) {
  return prisma.flashcardDeck.create({ data: { userId, sourceNoteId: noteId, title } });
}

export async function createFlashcards(deckId: string, cards: Flashcard[]) {
  if (cards.length === 0) return { count: 0 };
  const data = cards.map(c => ({ deckId, question: c.front, answer: c.back }));
  // createMany won't return created rows; returning count is fine
  return prisma.flashcard.createMany({ data });
}

export async function createQuizForNote(userId: string, noteId: string, deckId: string | null, title: string, questions: QuizQ[]) {
  const quiz = await prisma.quiz.create({
    data: {
      userId,
      sourceNoteId: noteId,
      deckId: deckId ?? undefined,
      title,
      questions: { create: questions.map(q => ({ promptMarkdown: q.question, type: 'SHORT_ANSWER', correctAnswer: q.answer })) as any },
    },
  });
  return quiz;
}
