# Dao – Technical Design Specification (MVP)

This document reflects the current implementation in the repository and serves as the engineering source of truth for the MVP.

## 0) Metadata

- Owner: Ashwin Rachha
- Product: Dao (flow-first productivity workspace)
- Stack:
  - Frontend: Next.js App Router (TypeScript), ShadCN UI, Tailwind, Clerk
  - Backend: Next.js API routes (`app/api/**`) on Edge/Node runtimes
  - AI: Vercel AI SDK + OpenAI (gpt-4o-mini / gpt-4.1-mini / gpt-4.1)
  - DB: Postgres + Prisma, pgvector extension for embeddings
  - Analytics: Vercel Analytics, optional Plausible
- Scope (MVP):
  - Todos (quick add, minimal list)
  - Kanban board (columns, cards)
  - Pomodoro focus card
  - AI: Plan (streaming), Brain Dump → Todos, task micro-actions (classify, enrich, suggest)
  - Gamification: stones, shards, celebrations
  - Seed preview (Projects/Docs/Tasks), embeddings visualization (basic)

Out of scope (present as stubs or later): Notion sync, weekly performance agent, full calendar autoplanning.

---

## 1) Architecture

### 1.1 Components (conceptual)

```text
[Browser (Dao UI)]
  |  Clerk session
  v
[Next.js App Router]
  - (workspace)/todos
  - (workspace)/pomodoro
  - boards/[boardId]
  - calendar
  - debug/dao, debug/seed-preview
  - api/** (REST endpoints)
      | Prisma client
      v
  [Postgres + pgvector]
    users, boards, columns, tasks, notes,
    pomodoro_sessions, embeddings,
    gamification (stones, achievements, daily snapshots),
    agent_runs + ai_events

[AI Layer]
  - streamObject / generateText (Vercel AI SDK)
  - Endpoints: /api/ai/plan, /api/ai/todo-agent,
               /api/ai/cards/* (classify|enrich|suggest),
               /api/ai/notes/* (summary|quiz)
```

### 1.2 Example request flow (Plan)

1) Client calls `POST /api/ai/plan` with `prompt` (free text).
2) Server constructs a system message from user context and streams a typed `PlanSchema` back (`tasks[]` with kind/priority/estimate).
3) Client renders streaming results; user optionally accepts tasks.
4) Tasks are created into the default board/column.

---

## 2) Stack details

### 2.1 Next.js & App Router

- Server Components by default; Client Components for interaction/streaming UIs.
- AI endpoints in `app/api/ai/*/route.ts` (mostly POST, streaming where relevant).
- Non‑AI CRUD in `app/api/*`.

### 2.2 Auth

- Clerk (`@clerk/nextjs`) guards app surfaces; server routes derive `userId` and scope queries.

### 2.3 Database

- Postgres + Prisma; pgvector enabled for embeddings.
- Key models (high‑level):
  - User, Board, Column, Task, Note
  - PomodoroSession, FocusSession, CalendarEvent
  - Embedding
  - Gamification: StoneDefinition, UserStone, UserStoneProgress, AchievementDefinition, UserAchievement, UserGamificationProfile, UserDailySnapshot
  - AI logging: AgentRun, AIEvent, AgentOutput
  - Projects/Docs: Project, Doc

### 2.4 AI SDK

- Vercel AI SDK:
- `streamObject` for typed streaming plans (`/api/ai/plan`)
- `generateText` for non‑streamed transformations (todo agent, enrich/classify/suggest)
- Provider: OpenAI. Default fast models: `gpt-4o-mini` / `gpt-4.1-mini`.

---

## 3) User scenarios (implemented in MVP)

1) Brain dump → Structured todos
   - POST `/api/ai/todo-agent` with `{ brainDumpText }` returns tasks (title, priority, tags, estimatedPomodoros).
   - Client can insert them into the default board.

2) Plan the day (streaming)
   - POST `/api/ai/plan` with `{ prompt }` streams a typed plan: tasks with `kind` (DEEP/SHALLOW), `estimateMinutes`, `priority`.

3) Minimal Todos + Quick Add
   - GET `/api/tasks/my?status=TODO` and POST `/api/tasks/quick` power `TodosMinimal`.

4) Pomodoro focus
   - `PomodoroCard` timer with keyboard shortcuts; auto‑move to In Progress on start when possible.
   - Completion and streaks feed gamification counters.

5) Gamification
   - Deterministic rules award shards/stones on task completion and pomodoros (see `src/lib/gamification/engine.ts`).
   - UI surfaces: Bag/Jewels and lightweight celebrate modals.

---

## 4) AI surface details

### 4.1 Plan (streaming)

- Endpoint: `POST /api/ai/plan`
- Schema: `{ rationale: string, tasks: [{ title, description?, estimateMinutes (5–120), priority (HIGH|MEDIUM|LOW), kind (DEEP|SHALLOW) }] }`
- Model: `gpt-4o-mini`
- Behavior: streams a valid JSON object via Vercel AI SDK; client renders incrementally.

### 4.2 Brain Dump → Todos

- Endpoint: `POST /api/ai/todo-agent`
- Input: `{ brainDumpText?: string; quickTodoText?: string }`
- Output: `{ tasks: [{ title, description?, estimatePomodoros?, priority, tags[] }], rationale? }`
- Failure: robust JSON extraction with fallback to empty tasks to avoid breaking flows.

### 4.3 Card micro‑actions (task‑scoped)

- Classify: `POST /api/ai/cards/[taskId]/classify`
  - Suggest column/priority/estimate, update `aiState=CLASSIFIED`, ensure embeddings.
- Enrich: `POST /api/ai/cards/[taskId]/enrich`
  - Produce improved description + suggested subtasks; derive minutes/pomodoros; update `aiState=ENRICHED`.
- Suggest next action: `POST /api/ai/cards/[taskId]/suggest`
  - Provide a concrete next step and optionally a column move; update `aiState=SUGGESTED`.

### 4.4 Notes (learning helpers)

- Summary: `POST /api/ai/notes/[noteId]/summary` (stubbed summarizer for now).
- Quiz: `POST /api/ai/notes/[noteId]/quiz` (stubbed; intended to create deck/cards and a quiz).

---

## 5) Data model (selected details)

- Task: status, priority, estimatedPomodoros, tags, AI fields (`aiState`, `aiSuggested*`, `aiSubtasks`, `aiNextAction`, `aiConfidence`).
- Note: rendered from a task; contentMarkdown; ties to embeddings/flashcards/quizzes.
- Gamification: deterministic rules award shards/stones; lore via LLM optional.
- Projects/Docs: organize tasks + notes; Notion URL is an optional reference.

See `prisma/schema.prisma` for full definitions.

## 6) Observability & Analytics

- Agent logging: `AgentRun`, `AIEvent`, `AgentOutput` via `src/server/db/agentRuns.ts`.
- Product analytics: `useProductAnalytics()` mirrors to Vercel Analytics and Plausible (if enabled).

## 7) Performance & Accessibility

- Interaction budgets: sub‑100ms feels instant; stream or skeleton beyond that.
- Keyboard‑first flows; predictable focus order; ARIA labels; avoid layout shift while streaming.

## 8) Seeding & Debug

- Seed data: `npx prisma db seed` loads a default user/tenant, board, columns, projects, docs, tasks.
- Debug UIs:
  - `/debug/seed-preview` shows Projects/Docs/Tasks map.
  - `/debug/dao` inspects AI orchestrations.

## 9) Future work (non‑blocking)

- Notion sync (command center → projects/docs/tasks)
- Weekly performance agent with trend insights
- Calendar integration and auto‑blocking for deep work

---
