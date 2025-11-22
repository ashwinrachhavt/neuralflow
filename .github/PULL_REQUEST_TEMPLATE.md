## Overview

Describe the change in one or two sentences. Link to any relevant issues.

## Problem Statement

What job-to-be-done does this solve? What friction or confusion did users have before?

## User Impact & Flow

Briefly outline the primary user path (capture → plan → execute, etc.). Include screenshots or a short recording if UI changed.

## AI Surfaces (if applicable)

- Entry point(s): where is AI invoked?
- Schema(s): which structured outputs are used?
- Preview/Diff: how can users accept/reject changes?

## Definition of Done (checklist)

Refer to `docs/CodingAgentPhilosophy.md`. Check all that apply.

- [ ] Reduces concrete user friction (describe before/after in this PR)
- [ ] Maintains minimalism (no new required fields/pop-ups/mode switches)
- [ ] Keyboard path exists for main actions; focus order and escape work
- [ ] Meets performance budgets; streams or skeletons used where needed
- [ ] AI UI separated from core creation; preview/diff before apply
- [ ] Structured AI outputs validated; safe fallbacks on failure
- [ ] Helpful error and empty states with clear, human copy
- [ ] Telemetry for key intents; AI calls log non-PII metadata
- [ ] Tests for core logic or manual test notes for UX flows
- [ ] Accessibility basics (labels, roles, contrast) verified
- [ ] Scope contained; no unrelated refactors or dead code
- [ ] Docs updated if behavior or UX is novel

## Notes for Reviewers

Call out risk areas, trade-offs, or follow-ups you deferred to keep scope small.

