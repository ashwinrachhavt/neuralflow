import { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  boards: (userId?: string) => ['boards', userId] as const,
  board: (boardId: string) => ['board', boardId] as const,
  cards: (boardId: string) => ['cards', boardId] as const,
  card: (cardId: string) => ['card', cardId] as const,
  notes: () => ['notes'] as const,
  note: (noteId: string) => ['note', noteId] as const,
};

export function createQueryClient() {
  return new QueryClient();
}

