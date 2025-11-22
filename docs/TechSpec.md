

# Dao – AI Layer v1

*Technical Design Specification*

## 0. Metadata

* **Owner:** Ashwin Rachha
* **Repo(s):** `dao-web` (Next.js App Router)
* **Stack:**

  * Frontend: Next.js App Router (TS), ShadCN UI, Tailwind, Clerk
  * Backend: Next.js API routes (`app/api/**`), Edge/Node runtimes
  * AI: Vercel AI SDK + OpenAI (gpt-4.1 / 4.1-mini / 4o)([Vercel][1])
  * DB: Postgres + Prisma ORM, pgvector extension for embeddings([Supabase][2])
* **Scope (this spec):**

  * Phase 1 fully, plus scaffolding for later phases

    * A1 – AI Flow Planner
    * A2 – Brain Dump → Clean Todos
    * Shared Task model powering To-Do & Kanban
    * Event logging + basic embedding pipeline
  * Light stubs for: Soft suggestions, Reflection, Performance Agent

---

## 1. High-level architecture

### 1.1 Component diagram (conceptual)

```text
[Browser (Dao UI)]
  |  (Clerk session cookie, fetch)
  v
[Next.js App Router]
  - app/(dashboard)/todo
  - app/(dashboard)/kanban
  - app/(dashboard)/pomodoro
  - app/(dashboard)/performance
  - app/api/ai/*
  - app/api/tasks/*
  - app/api/events/*
  - app/api/search/*
      | (Prisma client)
      v
    [Postgres + pgvector]
      - users (via Clerk ID)
      - tasks
      - pomodoro_sessions
      - user_eval_profiles
      - weekly_eval_snapshots
      - gems
      - task_embeddings

[AI Service Layer]
  - LLMClient (OpenAI/Vercel AI SDK)
  - PlannerPipeline
  - BrainDumpPipeline
  - SuggestionsPipeline
  - ReflectionPipeline
  - PerformanceAgentPipeline
```

### 1.2 Request flow (AI Flow Planner example)

1. User opens **“Plan my day”** dialog (client component).
2. Types free-form description → clicks *“Generate plan”*.
3. `POST /api/ai/flow-planner` with description + optional config.
4. Route handler:

   * Validates Clerk auth.
   * Calls `PlannerPipeline.planDay()` -> uses Vercel AI SDK `streamObject` with schema to generate tasks.([Vercel][1])
   * Streams tasks back to client incrementally.
5. On user confirm:

   * Client calls `POST /api/tasks/bulk-create` with selected tasks.
   * Server persists tasks (`Task` entries), possibly also pre-creates Pomodoro schedule blocks.
6. UI updates To-Do / Kanban from shared Task model.

---

## 2. Tech stack details

### 2.1 Next.js & App Router

* Use **App Router** (`app/`) with:

  * Server Components by default.
  * Client Components for interactive pieces (dialogs, streaming UI).
* AI endpoints in `app/api/ai/*/route.ts` (POST only).
* Non-AI data CRUD (tasks, sessions, gems) in `app/api/*`.

### 2.2 Auth (Clerk)

* Clerk integrated via `@clerk/nextjs`:

  * `auth()` in server routes to get `userId`.
  * Middleware protected paths (e.g., `/app/**`) via `clerkMiddleware` and `createRouteMatcher` for protected routes.([Contentful][3])
* DB `User` records map to `clerkUserId` (string).

### 2.3 DB & ORM

* **Postgres** with **Prisma**:

  * `DATABASE_URL` managed via environment.
* **pgvector** extension enabled for semantic search & recall.([Supabase][2])
* Migration & seeding via `prisma migrate` / `prisma db seed`.

### 2.4 Vercel AI SDK + OpenAI

* Use **Vercel AI SDK** (latest) for:

  * Streaming text (`streamText`).
  * Structured outputs (`streamObject` with JSON schema).([Vercel][1])
* Provider: OpenAI

  * Default fast: `gpt-4.1-mini` (planner, brain dump, suggestions).
  * High-value: `gpt-4.1` or `gpt-4o` for weekly Performance Reviews.

---

## 3. Data model

Prisma schema snippets focused on new AI-related models.

### 3.1 User

You may already have a `User` table; extend minimally for eval profile:

```prisma
model User {
  id             String   @id @default(cuid())
  clerkUserId    String   @unique
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Preferences
  energyProfile  String?  // JSON of morning/evening preference etc.
  goals          String?  // Short free-form goals from onboarding

  evalProfile    UserEvalProfile?
  tasks          Task[]
  pomodoros      PomodoroSession[]
  gems           Gem[]
}
```

### 3.2 Task (core shared model)

```prisma
enum TaskKind {
  DEEP
  SHALLOW
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}

enum TaskStatus {
  BACKLOG
  TODO
  IN_PROGRESS
  DONE
  ARCHIVED
}

model Task {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id])

  title           String
  description     String?
  estimateMinutes Int?          // From AI planner or user
  kind            TaskKind?     // deep/shallow
  priority        TaskPriority? // high/med/low
  status          TaskStatus    @default(BACKLOG)

  // planning context
  plannedForDate  DateTime?     // date-level (not time)
  isAiPlanned     Boolean       @default(false)
  fromBrainDump   Boolean       @default(false)

  // timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  completedAt     DateTime?

  // AI-related
  embedding       Float[]?      @db.Vector(1536) // or 1024 depending on model
}
```

### 3.3 TaskList / Sections (for Brain Dump lists)

```prisma
model TaskList {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])

  label     String   // e.g., "Job Search", "Learning", "Admin"
  createdAt DateTime @default(now())

  tasks     Task[]   // optional, if we want list grouping
}
```

> Implementation note: for v1, grouping can be handled in the client without a persistent `TaskList`. But this model is included for future grouping/filters.

### 3.4 PomodoroSession (for Flow Coach later)

```prisma
enum PomodoroType {
  FOCUS
  BREAK
}

enum PomodoroStatus {
  COMPLETED
  ABORTED
  SKIPPED
  IN_PROGRESS
}

model PomodoroSession {
  id          String          @id @default(cuid())
  userId      String
  user        User            @relation(fields: [userId], references: [id])

  taskId      String?
  task        Task?           @relation(fields: [taskId], references: [id])

  type        PomodoroType
  plannedMinutes Int
  actualMinutes  Int?
  status      PomodoroStatus
  startedAt   DateTime?
  endedAt     DateTime?

  createdAt   DateTime        @default(now())
}
```

### 3.5 Event logging (for snapshots & Performance Agent)

```prisma
enum EventType {
  TASK_CREATED
  TASK_COMPLETED
  TASK_UPDATED
  POMODORO_STARTED
  POMODORO_COMPLETED
  POMODORO_ABORTED
  AI_PLANNER_USED
  BRAIN_DUMP_USED
  REFLECTION_RUN
}

model UserEvent {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])

  type      EventType
  payload   Json?
  createdAt DateTime  @default(now())

  // For weekly snapshot aggregation
  weekOf    DateTime  // Monday 00:00 for grouping
}
```

### 3.6 Eval profiles & snapshots

```prisma
model UserEvalProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])

  profileJson Json     // UserEvalProfile JSON from LLM
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model WeeklyEvalSnapshot {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  weekOf      DateTime // Monday 00:00
  statsJson   Json     // Pre-aggregated stats used by Performance Agent
  createdAt   DateTime @default(now())

  @@unique([userId, weekOf])
}
```

### 3.7 Gem system

```prisma
model Gem {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])

  slug          String   // e.g., "obsidian-focus"
  imageUrl      String
  title         String
  oneLineLore   String
  earnedAt      DateTime @default(now())
  relatedTaskIds String[] // stored as string array
}
```

---

## 4. Backend modules & APIs

### 4.1 Common infrastructure

#### 4.1.1 `lib/auth.ts`

* Helper to fetch current user:

```ts
import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getCurrentUserOrThrow() {
  const { userId: clerkUserId } = auth();
  if (!clerkUserId) throw new Error("UNAUTHENTICATED");

  let user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) {
    user = await prisma.user.create({ data: { clerkUserId } });
  }
  return user;
}
```

#### 4.1.2 `lib/aiClient.ts`

* Centralized AI client + model selection:

```ts
import { createClient } from "ai";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const ai = createClient({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: "https://api.openai.com/v1",
});

export const MODELS = {
  plannerFast: "gpt-4.1-mini",
  thinker: "gpt-4.1",
  reflection: "gpt-4.1-mini",
};
```

#### 4.1.3 `lib/events.ts`

* Basic user event logging:

```ts
export async function logEvent(userId: string, type: EventType, payload?: any) {
  const now = new Date();
  const weekOf = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  await prisma.userEvent.create({
    data: {
      userId,
      type,
      payload,
      weekOf,
    },
  });
}
```

---

## 5. Feature modules – Phase 1 in depth

### 5.1 A1 – AI Flow Planner

#### 5.1.1 API: `POST /api/ai/flow-planner`

**Purpose:** Transform natural-language description of the day into structured tasks.

* **Request body**

```ts
type FlowPlannerRequest = {
  description: string; // free text
  maxTasks?: number;   // default 8
  workdayMinutes?: number; // optional, e.g., 360
};
```

* **LLM schema**

```ts
type PlannedTask = {
  title: string;
  description?: string;
  estimateMinutes: number; // 20–90
  kind: "deep" | "shallow";
  priority: "high" | "medium" | "low";
};

type FlowPlannerResponse = {
  tasks: PlannedTask[];
  rationale: string; // summarizing how it allocated time
};
```

* **Route handler sketch**

```ts
// app/api/ai/flow-planner/route.ts
import { streamObject } from "ai"; // vercel ai sdk
import { MODELS, ai } from "@/lib/aiClient";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const user = await getCurrentUserOrThrow();
  const body = await req.json() as FlowPlannerRequest;

  // log event (async, fire-and-forget)
  logEvent(user.id, "AI_PLANNER_USED", { description: body.description });

  const result = await streamObject({
    model: ai.openai(MODELS.plannerFast),
    schema: {
      type: "object",
      properties: {
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              estimateMinutes: { type: "number" },
              kind: { type: "string", enum: ["deep", "shallow"] },
              priority: { type: "string", enum: ["high", "medium", "low"] },
            },
            required: ["title", "estimateMinutes", "kind", "priority"],
          },
        },
        rationale: { type: "string" },
      },
      required: ["tasks", "rationale"],
    },
    prompt: buildFlowPlannerPrompt(body, user),
  });

  return result.toTextStreamResponse(); // streamed to client
}
```

> Uses Vercel AI’s `streamObject` pattern for streaming structured JSON.([Vercel][1])

* **Prompt strategy:**

  * Inject:

    * User goals (if exist from `User.goals`).
    * Workday length and preferences (morning/afternoon deep work).
  * Strong constraints:

    * 3–10 tasks.
    * Estimates 20–90 minutes.
    * Rough balance of deep vs shallow.

#### 5.1.2 Client integration

* Component: `<FlowPlannerDialog />`

  * Uses `useState` for input description.
  * Calls `useObject`/`useChat` from Vercel AI SDK (client) to stream tasks.
  * Displays tasks incrementally in list with:

    * Checkbox “include” toggle.
    * Editable title/estimate before committing.
  * “Add to day” button → `POST /api/tasks/bulk-create`.

#### 5.1.3 `POST /api/tasks/bulk-create`

* **Request body**

```ts
type BulkCreateTasksRequest = {
  tasks: PlannedTask[];
  plannedForDate?: string; // ISO date
};
```

* **Server behavior**

  * `getCurrentUserOrThrow`.
  * Create tasks with `isAiPlanned = true`, `status = TODO` or `BACKLOG` depending on heuristics.
  * Optionally infer `plannedForDate` = today when omitted.

* **Response**

```ts
type BulkCreateTasksResponse = {
  tasks: Task[]; // sanitized (no internal fields)
};
```

---

### 5.2 A2 – Brain Dump → Clean Todos

#### 5.2.1 API: `POST /api/ai/brain-dump`

**Purpose:** Turn messy brain dump text into labeled lists & tasks.

* **Request body**

```ts
type BrainDumpRequest = {
  text: string;
  maxLists?: number; // default 4
};
```

* **LLM schema**

```ts
type BrainDumpResponse = {
  lists: {
    label: string; // e.g., "Job Search", "Learning"
    tasks: {
      title: string;
      description?: string;
    }[];
  }[];
};
```

* **Route handler sketch**

```ts
// app/api/ai/brain-dump/route.ts
export async function POST(req: Request) {
  const user = await getCurrentUserOrThrow();
  const body = await req.json() as BrainDumpRequest;

  logEvent(user.id, "BRAIN_DUMP_USED", { textLength: body.text.length });

  const result = await streamObject({
    model: ai.openai(MODELS.plannerFast),
    schema: /* BrainDumpResponse schema */,
    prompt: buildBrainDumpPrompt(body, user),
  });

  return result.toTextStreamResponse();
}
```

#### 5.2.2 Client integration

* UI: “Brain Dump” textarea under Quick Add.

  * On submit → show *“Organize with AI”* button.
  * Call `/api/ai/brain-dump`, stream sections and tasks.
* User can:

  * Toggle which lists to create.
  * Edit titles quickly.
* “Add selected” → `POST /api/tasks/bulk-create-from-brain-dump`.

#### 5.2.3 `POST /api/tasks/bulk-create-from-brain-dump`

* **Request body**

```ts
type BrainDumpCreateRequest = {
  lists: {
    label: string;
    tasks: { title: string; description?: string }[];
  }[];
};
```

* **Server behavior**

  * For v1: just create Tasks with `fromBrainDump = true`.
  * Optionally store `label` as tag in description or future `TaskList`.

---

## 6. Event logging & metrics pipeline

### 6.1 Event sources

* Task actions:

  * Created, completed, updated, status changed.
* AI usage:

  * Planner used, Brain Dump used, Reflection run.
* Pomodoro events:

  * Start, complete, abort.

Each relevant API route should call `logEvent(user.id, type, payload)`.

### 6.2 Snapshot builder (for Performance Agent later)

* **Cron / scheduled job** (later; for now can be a manual route):

  * `POST /api/internal/build-weekly-snapshot?weekOf=YYYY-MM-DD`.
* Process:

  1. Group `UserEvent` rows by `userId, weekOf`.
  2. For each user-week:

     * Compute:

       * Days with ≥ 1 task completed.
       * Tasks completed count.
       * Deep vs shallow distribution.
       * # of AI Planner invocations.
       * Pomodoro stats.
     * Store in `WeeklyEvalSnapshot.statsJson`.

---

## 7. Semantic embeddings (scaffolding)

### 7.1 Embedding generation

* When tasks are:

  * Created, or
  * Description is updated and length > N characters.
* Enqueue background job (for now, just fire-and-forget call) to:

  * Generate embedding via OpenAI embedding model (e.g., `text-embedding-3-small`).
  * Upsert embedding into `Task.embedding`.

Using pgvector is a common pattern in Postgres/Prisma for semantic search and RAG-style features.([Supabase][2])

### 7.2 Search API (stub): `GET /api/search`

* Params: `q: string`
* Steps:

  1. Compute query embedding.
  2. `SELECT` tasks with `ORDER BY embedding <-> query_embedding LIMIT 10`.
  3. Return tasks; in Phase 4, we’ll add LLM summarization.

---

## 8. Frontend architecture

### 8.1 State management

* **TanStack Query** for server state (tasks, sessions, profile).
* **Zustand** (or similar) for transient UI state (dialogs, modals, streaming responses).

### 8.2 Shared components

* `<TaskCard />`

  * Renders title, estimate, badges (`deep/shallow`, `priority`, AI-tag).
  * Reused in To-Do, Kanban, Planner preview.
* `<AiSuggestionChip />` (for later A3)

  * Icon + tooltip + click action (e.g., “Draft email”, “Break down”).

### 8.3 Pages

* `/app/todo`

  * List of today’s tasks (filter `Task.plannedForDate === today`).
  * Brain Dump panel.
  * “Flow Planner” button (dialog).
* `/app/kanban`

  * Columns from `TaskStatus`.
  * Drag-and-drop updates `status`.
* `/app/pomodoro`

  * Simple timer controlling `PomodoroSession` creation.
* `/app/performance`

  * For later: shows Performance Agent summaries.

---

## 9. LLM prompt guidelines

### 9.1 Shared principles

* **Few-shot examples** tuned to:

  * Use bullet-point, terse style.
  * Respect schema constraints strictly.
* Ask the model to **avoid over-optimistic scheduling**.
* Encourage **skill/focus** orientation:

  * E.g., “If the user mentions ‘system design practice’, mark as `kind: "deep"`.”

### 9.2 Flow Planner prompt (outline)

1. System: “You are a planning assistant for Dao, a flow-first productivity app. You help users break a day of work into tasks with realistic time estimates.”
2. Context:

   * User goals & energy profile if known.
3. User message:

   * Raw `description`.
   * Workday minutes, desired number of tasks.
4. Instructions:

   * Generate `tasks` only, conforming to JSON schema.
   * At least 1 deep-work task when possible.
   * Don’t exceed workdayMinutes by more than 20%.

### 9.3 Brain Dump prompt (outline)

1. System: “You are a helpful organizer that turns messy text into labeled task lists.”
2. User: raw brain dump text.
3. Instructions:

   * Identify 2–4 logical categories.
   * Under each, extract concise tasks.
   * No due dates, no prioritization in this phase.

---

## 10. Security, privacy, performance

### 10.1 Security

* All API routes:

  * Require auth via `getCurrentUserOrThrow`.
  * Reject unauthenticated with 401.
* No cross-user access:

  * Every `WHERE` clause uses `userId`.
* Environment secrets:

  * `OPENAI_API_KEY`, `DATABASE_URL`, `CLERK_SECRET_KEY`, etc., set via environment and not exposed to client.([Microsoft Learn][4])

### 10.2 Privacy

* Store only necessary user text:

  * Task titles/descriptions, brain dump text can be persisted as tasks only if user confirms.
  * Raw brain dump text itself may be discarded after LLM call (or anonymized).
* Clear privacy page: what’s logged & how it’s used (later product work).

### 10.3 Performance and cost

* Use **fast model** (`gpt-4.1-mini`) for frequent operations (Flow Planner, Brain Dump).
* Use rate limits per user:

  * e.g., 30 Planner calls/day.
* Simple caching:

  * If same `description` and same date, allow quick reuse (optional).

---

## 11. Observability

* Logging:

  * On server, add lightweight structured logs for AI routes: `userId`, `feature`, `latency`, `tokens`.
* Metrics:

  * Weekly export from DB (or use a simple dashboard) for:

    * Number of AI planner calls.
    * Average tasks generated vs accepted.
* Error handling:

  * Wrap AI calls in try/catch; return user-friendly message like:

    * “Dao’s AI is having trouble right now. Try again in a minute or plan manually.”

---

## 12. Phased delivery (engineering-focused)

### Phase 1 (2–3 weeks)

* Implement:

  * Prisma schema (User, Task, UserEvent, PomodoroSession minimal).
  * `FlowPlanner`: `/api/ai/flow-planner` + client dialog.
  * `BrainDump`: `/api/ai/brain-dump` + UI.
  * `bulk-create` task endpoints.
  * Event logging (`UserEvent`).
* QA:

  * End-to-end: create plan → tasks appear in To-Do/Kanban.
  * Load test: 10–20 concurrent planner calls.

### Phase 2 (later)

* Add:

  * Soft suggestions for todos.
  * End-of-day reflection.
  * Simple Pomodoro logging + “Review my focus”.

### Phase 3+

* Implement Performance Agent:

  * Profile builder, snapshot builder, review generator.
* Add Gem triggers + lore.


[1]: https://vercel.com/templates/next.js/ai-sdk-no-schema?utm_source=chatgpt.com "No Schema Output Mode with Vercel AI SDK"
[2]: https://supabase.com/docs/guides/database/extensions/pgvector?utm_source=chatgpt.com "pgvector: Embeddings and vector similarity"
[3]: https://www.contentful.com/blog/clerk-authentication/?utm_source=chatgpt.com "Clerk auth: What it is and how to add it to your Next.js project"
[4]: https://learn.microsoft.com/en-us/answers/questions/2278478/deploy-nextjs-app-with-clerk-authentication-on-azu?utm_source=chatgpt.com "Deploy Nextjs app with Clerk Authentication on Azure ..."
