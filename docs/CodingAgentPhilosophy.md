# Dao — Coding Agent Philosophy

Guidelines for human and AI coding agents building Dao. Use this alongside `docs/PRD.md`, `docs/TechSpec.md`, and feature-specific design briefs. The goal: ship changes that preserve user flow and reduce friction while keeping the product minimalist, calm, and genuinely helpful.

## 1) First Principles

- Flow over features: Only add what clearly preserves or improves deep focus.
- Friction reduction: Remove clicks, fields, and decisions wherever safe.
- Calm defaults: Quiet, reversible actions; avoid interruptions and surprises.
- Minimalist capture-first: Make it effortless to jot tasks/notes; polish later.
- Contextual AI, separate from core creation: Don’t clutter primary writing/doing surfaces.
- Progressive disclosure: Start simple; reveal power when intent is clear.
- User control: Always allow accept/undo; never auto-rewrite without consent.
- Consistency: One mental model across Todo/Kanban/Focus/Docs.
- Keyboard-first: Everything important has shortcuts and predictable focus order.
- Performance budgets: Sub-100ms interactions; stream results when slower.
- Privacy-respectful analytics: Record signals, never private content.

## 2) Psychology of Knowledge Work & Flow

- Flow = balanced challenge and skill on meaningful work; distractions break it.
- Minimize mechanical friction (clicks, typing, formatting) and cognitive friction (ambiguity, unclear state, decision overload).
- Preserve uninterrupted chains: batch decisions, defer configuration, autosave.

## 3) Human-Centered Design

- People and activity centered: Observe real workflows before designing solutions.
- Problem > solution: Explicitly state the core job-to-be-done of every change.
- Iterate quickly: Prototype, dogfood, measure, and refine in short loops.
- Desirable–Feasible–Viable: Ship only what sits at the intersection.

## 4) AI Integration Playbook

- Design for success and discovery: Clear entry points, visible affordances, example prompts, and safe defaults.
- Appropriate autonomy: AI suggests; users decide. Start assistive, not agentic.
- Separate AI flow: Dedicated panels/commands; don’t fight core creation UIs.
- Schema-first: Use structured outputs (JSON schemas) to reduce hallucination.
- Personalization with consent: Adapt from behavior over time; expose toggles.
- Guardrails and validation: Sanitize, validate, and label AI outputs clearly.
- Streaming by default: Show partial results quickly; let users confirm/apply.
- Graceful failure: Friendly errors, actionable next steps, manual fallback.
- Closed-loop learning: Log outcomes to improve prompts, schemas, and UX.

## 5) Minimalism Inspired by Flomo

- Meaning emerges from continuous recording: Optimize for frequent, tiny captures.
- One thing well: Prioritize capture and execution; reduce formatting complexity.
- Start blank, stay light: No heavy templates or required metadata to begin.
- Quantity over polish: Make it feel okay to be rough; polish when it matters.

## 6) Implementation Guardrails (This Repo)

Product and UX

- Quick capture everywhere: Single-kbd shortcut opens capture; Enter commits; Esc cancels.
- Progressive disclosure: Advanced fields appear on demand; defaults are sensible.
- Context switching: Preserve draft state; gentle nudges, not modals.
- Error handling: Inline, human copy; offer retry or manual path.

AI surfaces

- Keep AI panes and commands distinct from core editors; avoid inline auto-edits.
- Use Vercel AI SDK streaming and typed schemas for planner, dump → todos, suggestions.
- Always show diffs/previews before applying AI changes to user data.

Next.js and code architecture

- Server Components by default; Client Components only for interaction/streaming.
- Keep API routes cohesive: `app/api/ai/*` for AI, `app/api/tasks/*` for CRUD.
- Avoid global state unless shared; prefer per-surface local state.
- Small components with single responsibility; no mega-components.

Performance and accessibility

- Interaction budgets: <100ms instant; 100–600ms show skeleton; >600ms stream.
- Keyboard-first flows; tab order consistent; ARIA roles/labels; focus traps only when needed.
- No layout shift during streaming; reserve space or use skeletons.

Observability and data

- Track key events with `useProductAnalytics()`: plan_requested, plan_accepted, quick_add, complete, delete, ai_suggest_shown/used.
- Log AI request/response metadata (latency, tokens, model, success) without PII.
- Use Prisma migrations carefully; additive changes favored; keep seed idempotent.

Copy and tone

- Calm, direct, non-judgmental. Suggest, don’t preach. Write for speed readers.

## 7) Context Switching Support

- Fast jumpers: Cmd/Ctrl+K switcher; mnemonic shortcuts for Todo/Kanban/Focus.
- Preserve working memory: Don’t lose partially written text when switching.
- Gentle reentry: Subtle “Continue where you left off?” breadcrumb only when helpful.

## 8) Definition of Done (PR Checklist)

- Reduces user friction in a concrete way (describe before/after in PR).
- Maintains minimalism: avoids new required fields, pop-ups, or mode switches.
- Provides keyboard path for main actions; focus order and escape routes work.
- Meets performance budgets; streams or skeletons added where needed.
- Clearly separates AI UI from core creation surfaces; preview/diff before apply.
- Uses structured AI outputs with validation and safe fallbacks.
- Error states and empty states have helpful, human copy.
- Telemetry added for key user intents; AI calls log non-PII metadata.
- Unit or integration tests for core logic; manual test notes for UX flows.
- Accessible: ARIA/labels/contrast checked; screen-reader basics verified.
- Scope contained; no unrelated refactors or dead code left behind.
- Documentation updated (this file or feature docs) if behavior is novel.

## 9) Research & Iteration Loop

- Dogfood daily: Use the feature on real work; note rough edges immediately.
- Observe and measure: Look at event logs and qualitative feedback together.
- Tune prompts/schemas/UX weekly; remove unused/low-signal features quickly.

## 10) Anti-Patterns to Avoid

- Feature sprawl and settings bloat; power should be discovered, not dumped.
- AI that interrupts or overwrites without consent; hidden automation.
- Blocking modals for capture; slow spinners without streaming or skeletons.
- Over-formatting tasks/notes; required metadata before content.
- Notifications as primary guidance; prefer inline, contextual helpers.

---

This philosophy exists to keep Dao invisible at its best—letting people think, write, and do their best work with less friction and more momentum.
