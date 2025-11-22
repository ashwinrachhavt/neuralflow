# Dao — Product Requirements Document (MVP)

Living PRD aligned to the current codebase. The goal is a calm, flow-first workspace that prioritizes frictionless capture, thoughtful planning, and focused execution with small, contextual AI assists.

## 0) Metadata

- Owner: Ashwin Rachha
- Status: Living (MVP scope)
- Surfaces: Todos, Kanban, Pomodoro, Calendar (basic), Gamification, AI (Plan, Brain Dump, Card micro‑actions), Debug UIs

---

## 1) Problem & principles

Knowledge workers are most productive in sustained flow. Friction (mechanical and cognitive) interrupts this state. Dao should:

- Reduce friction at every touchpoint (capture, plan, execute)
- Keep AI assistive, not interruptive; separate from core writing/doing
- Prefer progressive disclosure and keyboard‑first paths
- Stream or show skeletons to preserve a sense of momentum

See also: `docs/CodingAgentPhilosophy.md`.

---

## 2) Goals and non‑goals

### Goals

- Frictionless capture: quick add from Todos; sensible defaults
- Thoughtful planning: “Plan” streams typed tasks; user accepts
- Focus: simple Pomodoro with keyboard; auto‑move to In Progress
- Calm AI: task‑scoped classify/enrich/suggest that never hijack control
- Meaningful gamification: stones/shards on actual behavior; small celebrations

### Non‑goals (MVP)

- No auto‑scheduling across the full calendar (Motion‑style)
- No long, chatty agents; keep interactions short and clear
- No social/leaderboards

---

## 3) Users & scenarios

Primary persona: “Conscious Builder” (engineer/PM/founder) using the app as a daily cockpit for deep work, learning, and shipping.

Scenarios
1) Brain dump → todos: paste messy text → structured tasks → accept
2) Plan the day: free‑form prompt → streaming plan → create tasks
3) Execute with focus: pick a task → start Pomodoro → complete → celebrate
4) Gentle nudges: enrich a task, classify into a column, suggest a next action

---

## 4) Functional requirements

### 4.1 Todos (Minimal List)

- Quick add input with Enter/Click (POST `/api/tasks/quick`)
- Show AI‑planned tasks separately when present
- Mark done (PATCH `/api/tasks/[id]/done`) with optimistic UI
- Surface location/time if a calendar event is linked

Acceptance
- Add task in ≤1s; Enter submits; Esc clears
- “AI Planned” section appears only when relevant
- Marking done reflects immediately and persists

### 4.2 Kanban (Boards/[boardId])

- Columns and cards from Prisma models
- Moving cards updates `columnId`; filtered by user ownership

Acceptance
- 60fps drag in typical cases; move persists
- Keyboard focus and handles for accessibility

### 4.3 Plan (AI)

- Endpoint: `POST /api/ai/plan` streams typed schema
- Fields: title, description?, estimateMinutes, priority, kind (DEEP/SHALLOW)
- UI renders items incrementally; user can accept to create tasks

Acceptance
- Average TTFB < 800ms; first token streaming
- Model failures show copy with manual fallback

### 4.4 Brain Dump → Todos (AI)

- Endpoint: `POST /api/ai/todo-agent`
- Converts messy text to `{ tasks[] }` with priority/tags/estimates

Acceptance
- JSON extraction resilient to minor model drift
- Empty or noisy input yields empty tasks, not errors

### 4.5 Card micro‑actions (task‑scoped AI)

- Classify: column/priority/estimate suggestions; persist `aiState=CLASSIFIED`
- Enrich: description + subtasks; derive minutes/pomodoros; `aiState=ENRICHED`
- Suggest next action: next step + optional column move; `aiState=SUGGESTED`

Acceptance
- Persist only validated fields; keep diffs small
- Show actions as subtle affordances; never block editing

### 4.6 Pomodoro

- 25/5 with long breaks; keyboard: Space (start/stop), R (reset), S (skip), F/B (start focus/break)
- On start, attempt auto‑move to In Progress

Acceptance
- Timer runs off main thread work; no UI jank
- Keyboard interactions work while not focused in an input

### 4.7 Gamification

- Deterministic rules for shards/stones; celebration modal on awards
- Summary and gallery endpoints power a lightweight dashboard

Acceptance
- Awards map to real behaviors; no duplicate awards for same condition
- No PII in gamification logs

---

## 5) Non‑functional requirements

- Performance: sub‑100ms interactions; stream when slower; prefetch common routes
- Accessibility: labels/roles, visible focus, no critical content in hover‑only UI
- Privacy: only non‑PII analytics/events; redact model payloads if needed

---

## 6) Metrics

- Adoption: weekly active users (local dev proxy acceptable)
- Capture: quick‑add success rate; average time to first task
- Execution: tasks completed/day; deep vs shallow ratio (tags)
- AI value: plan accept rate; card‑action usage; model failure rate; latency (p50/p95)

---

## 7) Open questions & backlog

- Notion sync (projects/docs/tasks) and conflict strategy
- Calendar auto‑blocking and rescheduling rules
- Weekly performance agent (goals, insights, gentle commitments)
- Multi‑tenant permissions for shared boards/projects

---
