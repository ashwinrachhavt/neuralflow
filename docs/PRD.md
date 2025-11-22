

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
