import { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  boards: (userId?: string) => ['boards', userId] as const,
  board: (boardId: string) => ['board', boardId] as const,
  cards: (boardId: string) => ['cards', boardId] as const,
  card: (cardId: string) => ['card', cardId] as const,
  notes: () => ['notes'] as const,
  note: (noteId: string) => ['note', noteId] as const,
  projects: () => ['projects'] as const,
};

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000, // keep data fresh for 30s to reduce thrash
        gcTime: 5 * 60_000, // retain cache for 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
