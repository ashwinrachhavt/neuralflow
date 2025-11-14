

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



# Dao – AI Layer v1

*Quiet intelligence for flow, not friction*

## 0. Document metadata

* **Owner:** Ashwin Rachha
* **Product:** Dao (Next.js + Clerk + ShadCN)
* **Status:** Draft v1
* **Scope:** AI features that sit on top of existing workspace: To-Do, Kanban, Pomodoro, Gem system (planned)

---

## 1. Vision & philosophy

Dao is a **flow-first productivity workspace**: To-Dos, Kanban, and Pomodoro designed to help you enter Mihaly Csikszentmihalyi’s “flow state” – deep, intrinsically motivated focus where time disappears and work feels autotelic.([Wikipedia][1])

Our AI layer should **not** feel like a generic chatbot bolted onto a task list. Instead, it should behave like a **quiet, observant guide** that:

* Removes friction when you’re already moving
* Reflects back what you’re doing well and where you’re stuck
* Helps you design days and weeks that actually support flow (balance of challenge/skill, clear goals, immediate feedback)([Wikipedia][1])

We take inspiration from tools like Sunsama (calm daily planning, “forced thoughtfulness”)([Sunsama][2]), Motion (AI planning and scheduling),([Motion][3]) and Slack AI (channel recaps, summaries, and daily digests)([Slack][4]) – but with a **single-player**, deeply personalized angle.

The “master feature” is an **LLM Performance Agent** that builds and continuously refines a **personal evaluation framework** from onboarding:

> “What do you want to get better at?” → “Okay, here’s how we’ll measure and coach you, gently, over time.”

---

## 2. Goals & non-goals

### 2.1 Goals

1. **Make planning effortless but thoughtful**

   * Turn messy intentions into crisp plans, without taking control away.

2. **Create a personal performance mirror**

   * Track real behavior (tasks, focus, breaks) and highlight strengths, weaknesses, and growth areas—aligned with the user’s own goals, not arbitrary scores.

3. **Guide, don’t nag**

   * Provide tiny, context-aware suggestions (“soft nudges”) where the user already is: while adding a todo, finishing a sprint, or closing the day.

4. **Build toward long-term habit change**

   * Use proven behavior-change mechanisms like self-monitoring, goal setting, and prompts/cues, delivered via AI and personalization.([JMIR Publications][5])

5. **Gamify with meaning, not dopamine spam**

   * Gems and lore reflect actual patterns of work and growth.

### 2.2 Non-goals (for v1)

* No full calendar integration or auto-scheduling (Motion-style) in v1.
* No social/leaderboards.
* No complex, multi-turn coaching conversations; feedback is short, episodic, and contextual.
* No predictive “you should do X at 3:15pm” micromanagement.

---

## 3. Users & use cases

### 3.1 Primary user persona

**“The Conscious Builder”**

* Early-career or mid-career engineer, PM, founder, or researcher.
* Uses Dao as a **daily cockpit** for:

  * Job search prep
  * System design / deep learning
  * Shipping side projects
* Wants to improve **skill, consistency, and focus**, not just “check more boxes.”

### 3.2 Core scenarios

1. **Morning: Describe → Plan → Commit**

   * User describes their day → AI Flow Planner breaks it into tasks and suggested focus blocks → user accepts → todos appear in To-Do and Kanban.

2. **During the day: Quiet nudges**

   * While adding tasks, app suggests breaking them down, starting a sprint, or drafting an email.

3. **End of day: Reflect & close the loop**

   * One click generates a reflection: what they did, what type of work dominated, and one gentle suggestion for tomorrow.

4. **End of week: Performance review with Performance Agent**

   * Agent analyzes the week (tasks, deep vs shallow work, completion patterns, Pomodoro usage), compares against personal goals, and returns:

     * strengths
     * weaknesses
     * a “focus plan” for next week

5. **Long-term: Building a Gem Gallery**

   * Completing AI-planned tasks and focus rituals unlocks gems with little AI-written stories, turning work history into a personal mythos.

---

## 4. Product pillars & features

### Pillar A – Calm Planning & Execution

#### A1. AI Flow Planner (Describe → Plan → Todos + Kanban)

**What**

A floating dialog where the user describes their intended work; AI returns a structured plan:

* 3–10 tasks with:

  * `title`
  * `description?`
  * `estimateMinutes` (20–90)
  * `kind` (`deep` | `shallow`)
  * `priority` (`high` | `medium` | `low`)

A deterministic scheduler then turns them into focus + break blocks (Pomodoro-style). Tasks are created in the shared `Task` model and appear in:

* **To-Do → Today’s Focus**
* **Kanban → Backlog / TODO column**

**Why it fits**

* Encourages **thoughtful planning** while removing grunt work, like Sunsama’s “forced thoughtfulness” but with AI assistance.([Sunsama][2])
* Deterministic schedule keeps you in control; AI suggests, you accept.

**Key requirements**

* Use **Vercel AI SDK** structured output (`streamObject`) for tasks; streaming array mode so tasks appear one-by-one in the dialog.([Sunsama][6])
* Pure TypeScript scheduler (25/5/15 Pomodoro heuristic) for repeatable schedules.
* Unified `Task` model powering To-Do + Kanban.

---

#### A2. Brain Dump → Clean Todos

**What**

A “Brain Dump” box under Quick Add:

* User dumps messy text (“Tomorrow: email recruiter, finish Paces design notes, read LangGraph docs, call VT, workout”).
* AI converts to **structured lists**:

  * e.g., “Job Search” / “Learning” / “Admin” sections with tasks.

**Why it fits**

* Matches how people naturally offload mental clutter.
* AI is a quiet janitor, not a guru.

**Key requirements**

* LLM with schema: `{ lists: [{ label, tasks: [{ title, description? }] }] }`.
* UX: Show preview, allow “Add all” or selection.

---

#### A3. Soft Suggestions in To-Do (“Little helpers”)

**What**

When a todo is added, Dao may attach a tiny AI suggestion tag:

* “Looks like an email – want a quick draft?”
* “This seems big – break into 3 smaller tasks?”
* “Study task – start a 25-min focus block?”

**Why it fits**

* Inspired by tools that offer contextual AI actions inside tasks (Twos, Slack AI’s contextual suggestions).([Slack][4])
* Suggestions are **opt-in** and minimal—no pop-ups.

**Key requirements**

* Lightweight classifier endpoint:

  * Input: todo text
  * Output: `{actionType, suggestionText, extraData?}`.
* The UI surfaces one subtle icon/button per todo when appropriate.

---

#### A4. “Next Best Thing” – AI-Assisted Next Action

**What**

On the To-Do page, a **“What should I do now?”** button:

* AI sees:

  * All open tasks
  * Priority, estimates, kind (deep/shallow)
  * Time of day & user’s energy preference (from onboarding, later)
* Suggests:

  * 1 primary task
  * 1 backup option
  * 1-sentence reasoning

**Why it fits**

* Similar in spirit to Motion’s AI “builds the perfect to-do list,” but we don’t auto-shuffle; we just point a flashlight.([Motion][3])

**Key requirements**

* API route reading current tasks + simple heuristics + LLM ranking.
* Highlight recommended task with a soft glow / badge.
* Quick action: “Start focus sprint” on that task.

---

### Pillar B – Reflection, Flow, and Coaching

#### B1. End-of-Day Reflection

**What**

Button: **“Reflect on Today”**:

* Inputs:

  * Completed vs incomplete tasks
  * Task types (deep/shallow, categories)
  * Focus sprints run, breaks taken/skipped
* Output (LLM, structured):

```ts
{
  summary: string;
  deepWorkCount: number;
  shallowWorkCount: number;
  highlights: string[];
  improvementSuggestion: string;
}
```

**Why it fits**

* Mirrors Slack AI recaps, but for your own work day.([Slack][4])
* Integrates behavior-change techniques like self-monitoring + reflection.([JMIR Publications][5])

**Key requirements**

* Single “card” UI that feels like a short journal entry, not a report.
* One clear “tomorrow experiment” suggestion.

---

#### B2. Flow-Aware Pomodoro Coach

**What**

On the Pomodoro page, a “Review my focus” button:

* Inputs (last N sessions):

  * How often sprints are aborted
  * Break adherence
  * Task types you actually focus on
* Output:

  * 2–3 bullet insights on your patterns
  * 1–2 suggested experiments (e.g., “Try smaller sprints on tasks you label ‘hard’”).

**Why it fits**

* Aligns with flow research: need to tune challenge/skill ratio and reduce distractions.([Wikipedia][1])

**Key requirements**

* Local logging of Pomodoro events (start/pause/skip/finish).
* LLM summarization over a compact event stream.

---

#### B3. Weekly Flow Review (Powered by Performance Agent)

**What**

Once a week, user can run **“Weekly Flow Review”**:

* Uses the same engine as the Performance Agent (see Pillar C), but summarized in a friendly view:

  * What kind of work dominated?
  * Did your week match your stated focus (e.g., “Improve system design”)?
  * Where did you show consistency? Where did you fall off?

**Why it fits**

* Feels like a **mini retro**, not a grade.
* Supports long-term habit formation (weekly check-ins, progress tracking).([JMIR Publications][5])

---

### Pillar C – Memory, Search, and Gem Lore

#### C1. Semantic Recall (“What was that thing I did on LangGraph?”)

**What**

A global search that feels like:

> “What did I work on last time I prepped for a Paces interview?”

Rather than keyword only, we:

* Embed tasks/notes (once you store them as longer descriptions).
* Retrieve relevant items and ask AI to answer in natural language, with links to the original tasks/cards.

**Why it fits**

* Many modern productivity tools (Notion, Slack AI, Motion) add AI-search over work artifacts to reduce “scroll time.”([Motion][3])

**Key requirements**

* Embedding pipeline (backed by pgvector or similar) for tasks/notes.
* `/api/search` route:

  * Input: query
  * Steps: embed → vector search → AI summarization.
* UI: results card + list of linked tasks.

---

#### C2. Gem Lore & Rewards

**What**

Tie the existing gem artwork into meaningful achievements:

* When you complete certain thresholds (e.g., 3 deep-work focus blocks in a day, or fully execute an AI-planned day), you earn a **gem**.
* AI generates:

  * `title` (e.g., “Obsidian Focus Gem”)
  * `oneLineLore` describing what you did to earn it.

**Why it fits**

* Builds a **narrative memory** of your work, not just points.
* AI acts as a storyteller, giving emotional color to your habits.

**Key requirements**

* Gem model: `{id, imageUrl, title, lore, earnedAt, relatedTaskIds[]}`.
* Event triggers when certain conditions are met.
* Gallery view: cards with gem art + lore.

---

### Pillar D – Master Feature: Performance Coach Agent

This is the backbone of your AI system: a **long-horizon, personalized evaluation agent**.

#### D1. Concept

From onboarding, the user answers:

* “What do you want Dao to help you improve?”

  * Examples:

    * “Deep work on system design”
    * “Consistency in job search”
    * “Learning algorithms”
* They also optionally rate themselves on a few dimensions (1–5):

  * Focus consistency
  * Energy management
  * Task completion follow-through
  * Learning vs shipping balance

The **Performance Coach Agent** then:

1. Creates a **custom evaluation framework** (dimensions + metrics) for this user.
2. Passively tracks behavior through Dao events.
3. Periodically (on user request) returns:

   * Strengths
   * Weaknesses
   * Top 1–3 focus levers for improvement
   * Concrete practice suggestions (what to do more of / less of).

Research in mobile behavior-change / personalization shows that tailored feedback, self-monitoring, and goal alignment significantly improve adherence and outcomes; we’re applying that to knowledge work and skill improvement.([JMIR Publications][5])

#### D2. Evaluation framework – structure

For each user, define a **UserEvalProfile**:

```ts
type EvalDimension =
  | 'Consistency'
  | 'DeepWork'
  | 'TaskDesign'
  | 'FollowThrough'
  | 'EnergyPacing'
  | 'LearningFocus'
  | 'ShippingFocus'
  | 'Custom';

type EvalMetric = {
  id: string;
  dimension: EvalDimension;
  label: string;
  description: string;
  formula: string;      // human-readable description
  weight: number;       // 0–1
};

type UserEvalProfile = {
  goals: string[];            // from onboarding
  primaryFocusAreas: EvalDimension[];
  metrics: EvalMetric[];
};
```

**Examples**

* **Consistency**

  * `% of days with at least 1 completed task`
  * `% of days with ≥ 1 Pomodoro session`
* **DeepWork**

  * `Number of deep-work blocks per week`
  * `% of time spent on deep tasks vs shallow`
* **TaskDesign**

  * `% of tasks completed without being edited 3+ times`
  * Ratio of small tasks vs giant, repeated tasks (“prepare system design” appears 10 times unfinished).
* **FollowThrough**

  * Tasks started vs tasks completed
* **EnergyPacing**

  * Break adherence
  * Over-long endless focus sessions without breaks (anti-flow).

#### D3. Data sources

The Performance Agent draws from:

* Task-level data:

  * Titles, descriptions, tags (deep/shallow, categories)
  * CreatedAt, completedAt
  * Whether AI-planned
* Pomodoro sessions:

  * Focus vs break durations
  * Aborted / skipped sessions
* Feature usage events:

  * Use of Flow Planner, Brain Dump, Reflection
* Gem unlocks:

  * Which types of achievements are common/rare

All of this is aggregated into a **weekly snapshot** (no need to store raw logs forever for v1).

#### D4. Evaluation cadence & UX

1. **Weekly Performance Review**

   * User clicks **“Ask Flow Coach”** on a dedicated Performance page.
   * Agent loads the latest weekly snapshot and the `UserEvalProfile`.
   * It computes:

     * A 3–5 line narrative summary
     * A table of dimensions with qualitative labels (“strong”, “developing”, “fragile”)
     * 1–3 **focus levers** for next week (e.g., “protect 2 deep blocks before noon 3x/week”).

2. **Dimension deep-dive**

   * User can ask: “How am I doing on Deep Work?”.
   * Agent responds with:

     * Trend (up/down/flat)
     * Concrete examples from recent tasks/sprints
     * One experiment to run (e.g., “Try 10-minute warmup sprint on scary tasks”).

3. **Onboarding + recalibration**

   * Onboarding: agent proposes an initial profile.
   * Every few weeks: brief 2–3 question check-in to adjust focus areas.

#### D5. Safety & tone

The agent should:

* Never assign a numeric “score” or “grade” to the user in a judgmental way.
* Always frame feedback as:

  * Observations (“Here’s what I notice”),
  * Positive reinforcement,
  * Experiments, not prescriptions.
* Avoid clinical or diagnostic language.

#### D6. Implementation sketch

* **LLM**: OpenAI GPT-4.x / 4o for analytic steps (structured outputs).

* **Pipelines**:

  1. **Profile builder**

     * Input: onboarding answers.
     * Output: `UserEvalProfile` JSON.
  2. **Snapshot builder**

     * Input: events DB.
     * Output: weekly stats JSON.
  3. **Review generator**

     * Input: `UserEvalProfile` + snapshot.
     * Output: structured result:

       ```ts
       {
         summary: string;
         dimensionInsights: {
           dimension: EvalDimension;
           status: 'strong' | 'developing' | 'fragile';
           explanation: string;
         }[];
         recommendedExperiments: { title: string; description: string }[];
       }
       ```

* **Storage**:

  * `user_eval_profile` table
  * `weekly_eval_snapshot` table

---

## 5. Success metrics (product-level)

We measure success not just by raw usage but by **felt helpfulness** and behavior change.

### Quantitative

* % of active users who:

  * Use AI Flow Planner at least 2× per week.
  * Trigger “Reflect on Today” at least 2× per week.
  * Run Performance Review weekly.
* Change over 4–8 weeks in:

  * Avg. number of completed tasks/day.
  * Avg. deep-work blocks/week.
  * Consistency: number of days with at least 1 task completed.

### Qualitative

* Self-reported:

  * “Dao helps me understand how I work” (Likert).
  * “Dao’s AI feels like a guide, not a boss.”
* Screenshot+quote gems from users about specific moments where the agent’s feedback changed their approach.

---

## 6. Phasing & priorities

To avoid shipping a blob, we phase:

### Phase 1 – Foundation

* AI Flow Planner (A1)
* Brain Dump → Clean Todos (A2)
* Shared Task model between To-Do and Kanban
* Minimal embeddings pipeline (for future search)

### Phase 2 – Everyday Nudges & Reflection

* Soft Suggestions in To-Do (A3)
* Next Best Thing (A4)
* End-of-Day Reflection (B1)
* Flow-Aware Pomodoro Coach (B2)

### Phase 3 – Performance Agent & Gems

* Performance Coach Agent (Pillar D)

  * Onboarding profile
  * Weekly review
* Gem triggers + lore generation (C2)
* Weekly Flow Review (B3, powered by Performance Agent)

### Phase 4 – Semantic Recall

* Full semantic search + recall (C1)
* Deeper integration of historical context into Performance Agent’s insights

---

## 7. Open questions

* **Data persistence scope**
  Start purely local for tasks, or introduce Postgres/Prisma now? (Strongly recommended once Performance Agent + metrics go in.)

* **Model tiers & cost**

  * Use cheaper models (e.g., 4.1-mini) for frequent actions (suggestions, planner).
  * Reserve higher-end models for weekly Performance Reviews.

* **Privacy stance**

  * Clear settings: user can opt out of analytics for Performance Agent.
  * Transparent explanation of what’s stored and how it’s used.

* **Future multi-device context**

  * Potential later integration with phone usage/wearables for more accurate energy pacing? (Defer.)

---

If you’d like, next step I can:

* Turn this PRD into a **Tech Spec** for Phase 1 (Flow Planner + Brain Dump + shared Task model), with concrete endpoints, types, and component breakdowns.
* Or draft the **onboarding flow** prompts + screens that seed the Performance Coach Agent from day one.

[1]: https://en.wikipedia.org/wiki/Mihaly_Csikszentmihalyi?utm_source=chatgpt.com "Mihaly Csikszentmihalyi"
[2]: https://www.sunsama.com/?utm_source=chatgpt.com "Sunsama - Make work-life balance a reality."
[3]: https://www.usemotion.com/?utm_source=chatgpt.com "Motion: AI Employees That 10x Your Team's Output"
[4]: https://slack.com/features/ai?utm_source=chatgpt.com "Slack AI: AI that Fits in Your Flow of Work"
[5]: https://www.jmir.org/2024/1/e54375/?utm_source=chatgpt.com "Digital Behavior Change Intervention Designs for Habit ..."
[6]: https://www.sunsama.com/features/ai?utm_source=chatgpt.com "Sunsama AI"
