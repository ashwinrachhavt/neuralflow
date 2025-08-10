awesome—here’s a tight, engineering-ready **Tech Spec** for **Neural Flow** that your team can build from immediately. it’s scoped to the MVP but leaves clean seams for the Pro roadmap.

---

# Neural Flow — Technical Specification (MVP)

## 0) Goals & Non-Functional Requirements

**Primary goals**

* Time-to-First-Pomodoro (TTFP) < **10s** on cold start (P95).
* Minimal UX (≤ 3 actionable UI elements per screen).
* AI is optional; 1-sentence outputs; zero persistent memory.

**NFRs**

* **Latency**: AI response < **1.8s** P95 (when network available; otherwise cached).
* **Timer drift**: < **±1s** per 25-min focus session.
* **Stability**: Crash-free sessions > **99%**.
* **Offline**: Full Pomodoro + Kanban usable offline; AI gracefully degrades.
* **Privacy**: No accounts/sync by default; all task/session data local.

---

## 1) System Architecture

```
Client (Web: Next.js / Mobile: React Native)
 ├─ UI (shadcn / RN primitives)
 ├─ State (Zustand)
 ├─ Timer Engine (Worker/BackgroundTimer)
 ├─ Storage (Repository pattern)
 │    ├─ Local: localStorage / AsyncStorage
 │    └─ (Flagged) SupabaseSyncRepository [default OFF]
 ├─ AI Client (fetch -> /api/ai)
 └─ Telemetry (Sentry, PostHog – local queue, fire-and-forget)

Edge / Server (Web only, Vercel)
 └─ /api/ai  → Vercel AI SDK → OpenAI (gpt-4-turbo)
      ↳ Input validation (zod), output normalization, caching
```

**MVP stance:** “Local-first.” Supabase exists behind a **feature flag** for internal dogfooding; default **OFF** to honor “no accounts/sync.”

---

## 2) Client Architecture

### 2.1 Packages & Structure

**Web (Next.js, App Router)**

```
src/
  app/(dashboard)/page.tsx         // Board + Timer shell
  app/api/ai/route.ts              // AI proxy (edge)
  components/
    kanban/{Board,Column,TaskCard}.tsx
    pomodoro/{Timer,ZenMode}.tsx
    ui/{ai-button,toast,badge,button}.tsx
  lib/
    store.ts                       // Zustand slices
    timer.ts                       // Timer worker/client bridge
    repo/{local,supabase}.ts       // Repository implementations
    ai/{client,prompts,schemas}.ts
    security/sanitize.ts
    telemetry/{sentry,posthog}.ts
    flags.ts
    types.ts
```

**Mobile (React Native / Expo)**

```
app/
  screens/{BoardScreen,ZenScreen}.tsx
  components/...
  lib/ (mirror web libs where possible)
  lib/repo/asyncStorage.ts
  lib/timer/backgroundTimer.ts
```

> Shared logic (types, prompts, zod schemas) lives in `src/lib` and is duplicated or extracted to a small shared package if you enable monorepo later.

### 2.2 State Management (Zustand)

* **Slices**

  * `tasksSlice`: CRUD, Kanban column updates, write-through to repository.
  * `timerSlice`: finite state machine (FSM) + current task binding.
  * `uiSlice`: zen mode on/off, toasts, transient AI tooltip.
  * `aiSlice`: per-task suggestions cache.

```ts
// src/lib/store.ts (sketch)
type TimerMode = 'FOCUS'|'BREAK';
type TimerState = 'IDLE'|'RUNNING'|'PAUSED';

interface TimerSlice {
  mode: TimerMode;
  state: TimerState;
  remainingMs: number; // authoritative from worker
  taskId?: string;
  start(taskId: string): void;
  pause(): void;
  resume(): void;
  skip(): void; // toggles FOCUS<->BREAK
}

interface TasksSlice {
  tasks: Task[];
  upsert(t: Task): void;
  move(taskId: ID, column: ColumnId): void;
  incrementPomodoros(taskId: ID, n?: number): void;
  hydrate(): Promise<void>;
}
```

### 2.3 Timer Engine (Drift-safe)

* **Web**: Use a **Dedicated Web Worker** with `performance.now()` anchoring and tick messages every 250ms. UI displays MM\:SS, but logic uses millisecond deltas.
* **Mobile**: Use `react-native-background-timer` (or Expo TaskManager alternative) to keep countdown reliable in background/locked screen. Anchor with `Date.now()` snapshots plus drift correction on resume.

**Timer FSM**

```
IDLE -> RUNNING (start)
RUNNING -> PAUSED (pause)
PAUSED -> RUNNING (resume)
RUNNING -> IDLE (complete)  // auto-log, switch to BREAK
RUNNING -> RUNNING (skip)   // toggle mode and reset remaining
```

```ts
// src/lib/timer.ts (worker message contract)
type TimerMsgIn =
  | {type:'INIT'; focusMs:number; breakMs:number}
  | {type:'START'; anchor: number}
  | {type:'PAUSE'}
  | {type:'RESUME'; anchor: number}
  | {type:'SKIP'; to:'FOCUS'|'BREAK'}
  | {type:'STOP'};

type TimerMsgOut =
  | {type:'TICK'; remainingMs:number; mode:'FOCUS'|'BREAK'}
  | {type:'COMPLETE'; mode:'FOCUS'|'BREAK'};
```

On `COMPLETE` (FOCUS), client:

1. increments `pom_count` for bound task,
2. logs a `sessions` row (local),
3. optionally calls AI summary (flagged; default OFF for MVP).

---

## 3) Data & Storage

### 3.1 Types

```ts
export type ID = string;
export type ColumnId = 'todo'|'doing'|'done';

export interface Task {
  id: ID;
  title: string;         // ≤ 50 chars
  notes?: string | null; // sanitized
  pom_count: number;     // >= 0
  column_id: ColumnId;
  created_at: string;    // ISO
}

export interface Session {
  id: ID;
  task_id: ID;
  start_time: string;
  end_time: string;
  status: 'completed'|'aborted';
}
```

### 3.2 Repository Pattern

```ts
export interface Repository {
  getTasks(): Promise<Task[]>;
  saveTasks(tasks: Task[]): Promise<void>;
  appendSession(s: Session): Promise<void>;
}

export class LocalRepository implements Repository {
  // localStorage (web) / AsyncStorage (mobile)
}
export class SupabaseRepository implements Repository { /* flagged */ }
```

**Local schema**: one `tasks` JSON, one `sessions` JSON; append-only sessions; periodic compaction.

### 3.3 Input Hygiene

* `sanitize(notes)` on every write; strip tags/URLs; truncate at 2k chars.
* Titles trimmed to 50 chars (UX shows counter).

---

## 4) AI Integration

### 4.1 API Contract (Edge)

**POST** `/api/ai`
Request:

```json
{
  "task": {
    "title": "Fix login bug",
    "notes": "API issue on /oauth"
  },
  "promptType": "SUBTASK" | "ESTIMATE" | "SUMMARY"
}
```

Response:

```json
{ "suggestion": "🔧 Test OAuth callback; Estimate: 2 pomodoros" }
```

### 4.2 Schemas (zod)

```ts
const TaskInput = z.object({
  title: z.string().min(1).max(50),
  notes: z.string().max(2000).optional().nullable()
});

const AiRequest = z.object({
  task: TaskInput,
  promptType: z.enum(['SUBTASK','ESTIMATE','SUMMARY'])
});

const AiResponse = z.object({
  suggestion: z.string().min(3).max(160)
});
```

### 4.3 Prompt Templates (1-sentence policy)

```ts
export function getPrompt(type: 'SUBTASK'|'ESTIMATE'|'SUMMARY', t: Task): string {
  const notes = t.notes ? `Notes: ${t.notes}` : 'No notes.';
  if (type === 'SUBTASK')
    return `Suggest exactly one actionable subtask for "${t.title}". ${notes} Reply as one sentence, ≤120 chars, start with a verb and include at most one emoji.`;
  if (type === 'ESTIMATE')
    return `Estimate pomodoros (25m each) for "${t.title}". ${notes} Reply as one sentence: "Estimate: N pomodoros" optionally with one emoji.`;
  return `Summarize progress on "${t.title}" in 10 words max. ${notes} Reply starting with "Summary:" one sentence only.`;
}
```

### 4.4 Caching & Rate Limits

* **Cache key**: `AI::<promptType>::sha256(title|notes)` → local cache TTL **24h**.
* **Budget**: ≤ **1** AI call per task per 10 minutes (client-side throttle).
* **Server**: per-IP **30 req/min** (simple LRU token bucket at edge).

---

## 5) UI / UX Implementation Notes

* **Kanban**

  * `@dnd-kit/core` + sortable; debounced state writes (300ms).
  * Active card shows 80% opacity + 2px indigo outline.
* **Task Card**

  * Badge `🍅 {pom_count}`; AI sparkles button (tooltip auto-dismiss 5s).
* **Zen Mode**

  * Optional Three.js stars (feature flag `zenStars`); default OFF for perf.
  * Large mono timer; Pause / Skip only.
* **Accessibility**

  * All controls keyboard reachable; ARIA roles (`list`, `listitem`, `button`).
  * High-contrast theme toggle; prefers-reduced-motion respects OS setting.
  * Screen reader labels: “Start Pomodoro for {task}”, etc.

---

## 6) Security

* **API keys** only on server (/api/ai). Never in client bundle.
* **CSP (web)**: script/style hashes; connect-src only to own domain + OpenAI (server).
* **Sanitization**: DOMPurify (web) for notes rendering; no innerHTML.
* **Rate limiting** on `/api/ai` (edge runtime).
* **No PII** beyond free-text task notes (user warned in empty-state copy).

---

## 7) Observability

* **Sentry**: runtime errors (frontend & edge), release + sourcemaps.
* **PostHog**: event stream (TTFP, AI button CTR, session complete).

  * Events:

    * `app_opened`, `ttfp_ms`, `pomodoro_started`, `pomodoro_completed`,
    * `ai_button_clicked`, `ai_response_shown`, `task_moved`.
* **Sampling**: 100% in beta; dial down later.

---

## 8) Testing Strategy

* **Unit (Vitest/Jest)**

  * Timer math (edge cases at 00:00 boundaries).
  * Store reducers (move, incrementPomodoros).
  * Prompt templates (character limits, emojis ≤ 1).
* **Integration (RTL / Detox on RN)**

  * Start/Pause/Resume/Skip flows.
  * Drag-drop between columns.
  * AI tooltip appears and auto-dismisses.
* **E2E (Cypress)**

  * TTFP measurement on cold start.
  * Offline mode (network disabled): timer + Kanban still usable.
* **Performance**

  * Worker tick jitter; long-session drift under 1s.
  * Lighthouse PWA checks (web).

---

## 9) Deployment & Release

* **Web**: Vercel; `/api/ai` as **edge** function.
* **Mobile**: Expo EAS builds (internal beta channels).
* **Env**

  * `OPENAI_API_KEY` (server only)
  * Optional Supabase keys behind `FEATURE_SUPABASE_SYNC=false`
* **Feature Flags** (`src/lib/flags.ts`)

  * `supabaseSync` (OFF)
  * `zenStars` (OFF)
  * `autoSummaryOnComplete` (OFF)

---

## 10) Error Handling & UX Fallbacks

* **AI request failed** → toast: “AI is busy—try again soon.” (no modal)
* **Timer worker crash** → auto-restart worker; preserve `remainingMs` from last tick.
* **Storage quota exceeded** → compact sessions (keep last 90 days), toast.

---

## 11) Cost & Limits (MVP)

* **OpenAI**: ≤ 500 tokens/request, ≤ 1 call per task per 10 min; with caching, expected <\$20/month for 500 WAU in beta.
* **Vercel**: 1 edge function; modest traffic; within hobby/pro tier initially.
* **No Supabase** traffic by default (flagged OFF).

---

## 12) Concrete Interfaces & Snippets

### 12.1 AI Edge Route (Next.js)

```ts
// src/app/api/ai/route.ts
import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { z } from 'zod';
import { AiRequest, AiResponse } from '@/lib/ai/schemas';
import { getPrompt } from '@/lib/ai/prompts';
import { rateLimit } from '@/lib/ai/ratelimit'; // simple token bucket

export const runtime = 'edge';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = AiRequest.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  // rate limit by IP
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(ip)) return NextResponse.json({ error: 'Rate limit' }, { status: 429 });

  const { task, promptType } = parsed.data;
  const prompt = getPrompt(promptType, task);

  try {
    const { text } = await generateText({
      model: openai('gpt-4-turbo'),
      system: 'You are a concise productivity assistant. Respond with one sentence.',
      prompt,
      maxTokens: 120
    });
    const out = AiResponse.parse({ suggestion: text.slice(0, 160) });
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: 'AI unavailable' }, { status: 503 });
  }
}
```

### 12.2 Timer Hook (Web, worker-backed)

```ts
// src/lib/timer-client.ts
export function useTimer() {
  const [remainingMs, setRemaining] = useState(25*60*1000);
  const [mode, setMode] = useState<'FOCUS'|'BREAK'>('FOCUS');
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker(new URL('./timer-worker.ts', import.meta.url));
    workerRef.current.postMessage({ type:'INIT', focusMs:25*60*1000, breakMs:5*60*1000 });
    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'TICK') setRemaining(e.data.remainingMs);
      if (e.data.type === 'COMPLETE') setMode(e.data.mode === 'FOCUS' ? 'BREAK' : 'FOCUS');
    };
    return () => workerRef.current?.terminate();
  }, []);

  return {
    remainingMs,
    mode,
    start: () => workerRef.current?.postMessage({ type:'START', anchor: performance.now() }),
    pause: () => workerRef.current?.postMessage({ type:'PAUSE' }),
    resume: () => workerRef.current?.postMessage({ type:'RESUME', anchor: performance.now() }),
    skipTo: (m:'FOCUS'|'BREAK') => workerRef.current?.postMessage({ type:'SKIP', to: m })
  };
}
```

---

## 13) Rollout Plan (Beta)

1. **Internal dogfood** (flag Supabase ON, Zen stars ON) for the team.
2. **Closed beta 100 users**: measure TTFP, AI CTR, crash-free rate.
3. **Hard gates to GA**:

   * TTFP P95 < 10s across platforms
   * AI P95 latency < 1.8s (or cache hit > 35%)
   * Timer drift < 1s / session

---

## 14) Risks & Mitigations

* **Background execution on iOS**: guard with notifications & user expectations; persist anchors; resume accurately.
* **AI hallucinations**: constrain prompts + 1-sentence rule; show as suggestions only; never auto-apply changes.
* **Local data loss**: periodic JSON snapshot export (manual “Export backup” button) in Settings (hidden route).

---

## 15) Pro-Ready Extension Points (not shipped in MVP)

* Replace LocalRepository with **VectorMemoryRepository** (Pinecone/Chroma) guarded by E2E encryption (ZK pattern).
* **Predictive planning daemon** (Edge cron) that writes suggested plan; client surfaces as optional “Plan day” banner.
* **Biometric adapter**: one interface, multiple providers (Apple Health, Google Fit) → “AdaptiveIntervalStrategy”.

---

### That’s the full spec.

If you want, I can also spin up:

* a **skeletal repo** with this structure,
* a **GitHub PR template** (checklist + acceptance criteria), and
* a **Cypress test** that measures TTFP automatically on deploy previews.
