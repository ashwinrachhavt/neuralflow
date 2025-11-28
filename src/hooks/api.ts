"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';

// Types for common shapes
export type BoardSummary = { id: string; title: string };
export type BoardNormalized = {
  board: {
    id: string;
    title: string;
    columnOrder: string[];
    columns: Record<string, { id: string; name: string; position: number; taskIds: string[] }>;
    tasks: Record<string, { id: string; title: string; descriptionMarkdown: string | null; columnId: string; dueDate?: string | null; priority?: 'LOW'|'MEDIUM'|'HIGH'|null; estimatedPomodoros?: number | null; type?: 'DEEP_WORK'|'SHALLOW_WORK'|'LEARNING'|'SHIP'|'MAINTENANCE'|null }>;
  };
};

export type CardDetail = {
  task: {
    id: string;
    title: string;
    descriptionMarkdown: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
    estimatedPomodoros?: number | null;
    dueDate?: string | null;
    column?: { id: string; title: string } | null;
    tags?: string[];
    topics?: string[] | null;
    primaryTopic?: string | null;
    project?: { id: string; title: string } | null;
    location?: string | null;
    aiSuggestedColumnId?: string | null;
    aiSuggestedPriority?: string | null;
    aiSuggestedEstimateMin?: number | null;
    aiNextAction?: string | null;
    aiState?: string | null;
    aiConfidence?: number | null;
    suggestedColumn?: { id: string; title: string } | null;
  };
  note?: { id: string; title: string; contentJson: string; contentMarkdown: string } | null;
};
export type NoteListItem = { id: string; title: string; updatedAt: string };
export type NoteDetail = { id: string; title: string; contentJson: string; contentMarkdown: string; updatedAt: string };

async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}

// Queries
export function useBoard(boardId: string) {
  return useQuery<BoardNormalized>({ queryKey: queryKeys.board(boardId), queryFn: () => getJSON(`/api/boards/${boardId}`), staleTime: 5000, enabled: !!boardId });
}

export function useBoards() {
  return useQuery<BoardSummary[]>({ queryKey: queryKeys.boards(), queryFn: () => getJSON('/api/boards'), staleTime: 10000 });
}

export function useCards(boardId: string) {
  return useQuery<{ id: string; title: string; descriptionMarkdown: string | null; columnId: string }[]>({
    queryKey: queryKeys.cards(boardId),
    queryFn: () => getJSON(`/api/boards/${boardId}/cards`),
    staleTime: 5000,
  });
}

export function useCard(cardId: string) {
  return useQuery<CardDetail>({ queryKey: queryKeys.card(cardId), queryFn: () => getJSON(`/api/cards/${cardId}`), staleTime: 5000 });
}

// Projects
export type ProjectSummary = { id: string; title: string };
export function useProjects() {
  return useQuery<ProjectSummary[]>({ queryKey: queryKeys.projects(), queryFn: () => getJSON('/api/projects'), staleTime: 10_000 });
}

// Notes APIs removed

// Mutations (cards)
export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { boardId: string; columnId: string; title: string; descriptionMarkdown?: string; priority?: 'LOW'|'MEDIUM'|'HIGH'; type?: 'DEEP_WORK'|'SHALLOW_WORK'|'LEARNING'|'SHIP'|'MAINTENANCE'; tags?: string[]; estimatedPomodoros?: number }) =>
      getJSON<{ id: string }>(`/api/tasks`, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: async (_res, vars) => {
      await qc.invalidateQueries({ queryKey: queryKeys.board(vars.boardId) });
      await qc.invalidateQueries({ queryKey: queryKeys.cards(vars.boardId) });
    },
  });
}

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { taskId: string; title: string; boardId?: string }) =>
      getJSON(`/api/tasks/${input.taskId}`, { method: 'PATCH', body: JSON.stringify({ title: input.title }) }),
    onSuccess: async (_res, vars) => {
      if (vars.boardId) await qc.invalidateQueries({ queryKey: queryKeys.board(vars.boardId) });
      await qc.invalidateQueries({ queryKey: queryKeys.card(vars.taskId) });
    },
  });
}

export function useUpdateCardDescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { taskId: string; descriptionMarkdown: string; boardId?: string }) =>
      getJSON(`/api/tasks/${input.taskId}`, { method: 'PATCH', body: JSON.stringify({ descriptionMarkdown: input.descriptionMarkdown }) }),
    onSuccess: async (_res, vars) => {
      if (vars.boardId) await qc.invalidateQueries({ queryKey: queryKeys.board(vars.boardId) });
      await qc.invalidateQueries({ queryKey: queryKeys.card(vars.taskId) });
      await qc.invalidateQueries({ queryKey: ['my-todos','TODO'] });
    },
  });
}

export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { taskId: string; boardId?: string }) =>
      getJSON(`/api/tasks/${input.taskId}`, { method: 'DELETE' }),
    onSuccess: async (_res, vars) => {
      if (vars.boardId) await qc.invalidateQueries({ queryKey: queryKeys.board(vars.boardId) });
    },
  });
}

export function useMoveCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { taskId: string; columnId: string }) =>
      getJSON(`/api/tasks/${input.taskId}/column`, { method: 'PATCH', body: JSON.stringify({ columnId: input.columnId }) }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.board(boardId) });
      const prev = qc.getQueryData<BoardNormalized>(queryKeys.board(boardId));
      if (prev) {
        const next: BoardNormalized = JSON.parse(JSON.stringify(prev));
        // remove taskId from any column.taskIds
        for (const colId of next.board.columnOrder) {
          const arr = next.board.columns[colId].taskIds;
          const idx = arr.indexOf(input.taskId);
          if (idx >= 0) arr.splice(idx, 1);
        }
        // add to destination at end
        next.board.columns[input.columnId].taskIds.push(input.taskId);
        qc.setQueryData(queryKeys.board(boardId), next);
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.board(boardId), ctx.prev);
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
  });
}

export function useMarkDone(boardId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => getJSON(`/api/tasks/${taskId}/done`, { method: 'PATCH' }),
    onMutate: async (taskId: string) => {
      await qc.cancelQueries({ queryKey: ['my-todos','TODO'] });
      const prev = qc.getQueryData<{ tasks: MyTodo[] }>(['my-todos','TODO']);
      if (prev) {
        const next = { tasks: prev.tasks.filter(t => t.id !== taskId) };
        qc.setQueryData(['my-todos','TODO'], next);
      }
      return { prevTodos: prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevTodos) qc.setQueryData(['my-todos','TODO'], ctx.prevTodos);
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ['my-todos','TODO'] });
      if (boardId) await qc.invalidateQueries({ queryKey: queryKeys.board(boardId) });
      await qc.invalidateQueries({ queryKey: queryKeys.notes() });
    },
  });
}

// Boards
export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string }) => getJSON<{ id: string }>(`/api/boards`, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.boards() });
    },
  });
}

export function useDefaultBoardId() {
  return useQuery<{ id: string; title: string }>({ queryKey: ['boards', 'default'], queryFn: () => getJSON('/api/boards/default'), staleTime: 5000 });
}

// Aggregated per-user snapshot
export type UserOverview = {
  user: { id: string; email: string | null; name: string | null; image: string | null; createdAt: string } | null;
  boards: {
    id: string;
    title: string;
    columns: { id: string; name: string; position: number }[];
    tasks: { id: string; title: string; descriptionMarkdown: string | null; status: string; priority: 'LOW'|'MEDIUM'|'HIGH'|null; type?: string | null; columnId: string; projectId: string | null; docId: string | null; tags?: string[]; estimatedPomodoros?: number | null; dueDate?: string | null; createdAt: string; updatedAt: string }[];
  }[];
  calendar: { events: any[]; meetings: any[] };
  projects: { id: string; slug: string; title: string; description: string | null; status: string; points: number; notionUrl: string | null; updatedAt: string; _count: { tasks: number; docs: number } }[];
  gamification: { profile: any | null; stones: any[]; stoneProgresses: any[]; achievements: any[] };
  flashcards: { decks: any[]; reviews: any[] };
  quizzes: { id: string; title: string; createdAt: string; updatedAt: string; _count: { questions: number; attempts: number } }[];
  focus: { sessions: any[] };
  memberships: any[];
  reporterProfile: any | null;
  fetchedAt: string;
};
export function useMyOverview() {
  return useQuery<UserOverview>({ queryKey: ['me','overview'], queryFn: () => getJSON('/api/me/overview'), staleTime: 5000 });
}

// Split ME endpoints (lightweight, parallelizable)
export type BoardsSlim = {
  boards: {
    id: string;
    title: string;
    columns: { id: string; name: string; position: number }[];
    tasks: { id: string; title: string; descriptionMarkdown: string | null; status: string; priority: 'LOW'|'MEDIUM'|'HIGH'|null; type?: string | null; columnId: string; projectId: string | null; docId: string | null; tags?: string[]; topics?: string[] | null; primaryTopic?: string | null; estimatedPomodoros?: number | null; dueDate?: string | null; createdAt: string; updatedAt: string }[];
  }[];
};
export function useMyBoardsSlim() {
  return useQuery<BoardsSlim>({ queryKey: ['me','boards'], queryFn: () => getJSON('/api/me/boards'), staleTime: 5_000 });
}

export type CalendarSlim = {
  events: { id: string; title: string; type?: string; startAt: string; endAt: string; descriptionMarkdown?: string | null; relatedTaskId?: string | null; location?: string | null; tags?: string[] }[];
  meetings: { id: string; title: string; startAt: string; endAt: string; descriptionMarkdown?: string | null }[];
};
export function useMyCalendar() {
  return useQuery<CalendarSlim>({ queryKey: ['me','calendar'], queryFn: () => getJSON('/api/me/calendar'), staleTime: 30_000 });
}
// All-user todos (across boards)
export type MyTodo = {
  id: string;
  title: string;
  descriptionMarkdown: string | null;
  boardId: string;
  columnId: string;
  status: string;
  priority?: 'LOW'|'MEDIUM'|'HIGH'|null;
  estimatedPomodoros?: number | null;
  tags?: string[] | null;
  location?: string | null;
  aiPlanned?: boolean | null;
  dueDate?: string | null;
};
export function useMyTodos(status: 'TODO' | 'BACKLOG' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED' = 'TODO') {
  return useQuery<{ tasks: MyTodo[] }>({ queryKey: ['my-todos', status], queryFn: () => getJSON(`/api/tasks/my?status=${status}`), staleTime: 5000 });
}
