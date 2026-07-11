# Lesson Restart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe restart control that resets the active lesson run while preserving long-term learning history.

**Architecture:** Keep the behavior inside `LessonPage`, where session, answer, feedback, audio, and local snapshot ownership already meet. Add a run identifier to remount step renderers and a small accessible confirmation dialog for destructive intent.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library, Playwright

## Global Constraints

- Keep historical progress, XP, stars, mastery, and attempts intact.
- Reset only the current lesson run and its localStorage snapshot.
- Stop active audio before returning to step one.
- Preserve keyboard accessibility and reduced-motion behavior.

---

### Task 1: Restart State Transition

**Files:**
- Modify: `src/features/lesson/LessonPage.tsx`
- Modify: `src/features/lesson/LessonPage.test.tsx`

**Interfaces:**
- Consumes: `createLessonSession(lesson)`, `engine.stop()`, and the existing lesson storage key.
- Produces: `restartLesson()` and a renderer key containing an incrementing run identifier.

- [ ] **Step 1: Write failing tests**

Assert that cancel preserves step two. Assert that confirm returns to step one, stops audio, replaces the stored session with `stepIndex: 0`, closes feedback, and clears a selected keyboard answer even when restarting on the same step.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run src/features/lesson/LessonPage.test.tsx --maxWorkers=4`

Expected: FAIL because the “重新开始” action does not exist.

- [ ] **Step 3: Implement the restart control**

Add `restartOpen` and `runId` state. Render a header button and accessible confirmation dialog. On confirm, call `engine.stop()`, remove the old snapshot, set a fresh session, clear answer and feedback, increment `runId`, and close the dialog. Use `${step.id}:${runId}` as the renderer key.

- [ ] **Step 4: Verify GREEN**

Run: `npx vitest run src/features/lesson/LessonPage.test.tsx --maxWorkers=4`

Expected: all lesson page tests pass.

### Task 2: Browser Flow and Release Verification

**Files:**
- Modify: `tests/e2e/lesson.spec.ts`

**Interfaces:**
- Consumes: the visible restart dialog and existing first-lesson helpers.
- Produces: desktop, tablet, and mobile proof of cancel, confirm, reset, and subsequent lesson completion.

- [ ] **Step 1: Add the browser flow**

Advance the first lesson to step two, cancel a restart and verify `2 / 6`, confirm a restart and verify `1 / 6`, then complete the lesson through the existing helper flow.

- [ ] **Step 2: Run complete verification**

Run: `npm run lint:copy`

Run: `npx vitest run --dir src --maxWorkers=4`

Run: `npm run build`

Run: `npm run test:e2e -- --workers=4`

Expected: copy check, unit tests, build, and all applicable browser tests pass.

