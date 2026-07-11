# Anonymous Listening Choices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace answer-revealing audio choice controls with shuffled anonymous listening candidates shared by lessons and practice.

**Architecture:** Add a pure candidate-order module that maps authored choices to stable A/B/C labels without changing stored answer values. `ChoiceStep` selects between an anonymous audio presentation and the existing semantic text presentation based on `audioOptions`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library, Playwright

## Global Constraints

- Visible and accessible audio candidate labels must not contain the authored answer value.
- Candidate ordering must be deterministic for the same step and varied across authored steps.
- Audio playback must continue to support note sequences and timed rhythm events.
- Non-audio choice behavior and scoring must remain unchanged.

---

### Task 1: Candidate Model and Content Contract

**Files:**
- Create: `src/features/lesson/audioChoice.ts`
- Create: `src/features/lesson/audioChoice.test.ts`
- Modify: `src/content/lessons/*.ts`
- Modify: `src/features/lesson/lessonContentContract.test.tsx`

**Interfaces:**
- Produces: `getAudioChoiceCandidates(step): Array<{ label: string; choice: unknown }>`
- Consumes: `step.id`, `step.config.choices`, and `step.config.audioOptions`

- [ ] **Step 1: Write failing tests**

Assert stable candidate order, varied correct positions, explicit answers for all authored audio choices, and anonymous A/B/C labels that contain no authored answer text.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run src/features/lesson/audioChoice.test.ts src/features/lesson/lessonContentContract.test.tsx --maxWorkers=4`

Expected: FAIL because the candidate model and anonymous controls do not exist.

- [ ] **Step 3: Implement the pure mapping and explicit content answers**

Hash `${step.id}:${String(choice)}` with a deterministic 32-bit hash, sort by score with authored index as tie-breaker, then assign labels A/B/C. Add explicit `answer` values to all authored audio choice configs and align the high-low, white-note, and eighth-subdivision prompts with candidate selection.

- [ ] **Step 4: Verify GREEN**

Run the same Vitest command and expect all tests to pass.

### Task 2: Anonymous Listening UI

**Files:**
- Modify: `src/features/lesson/LessonPage.tsx`
- Modify: `src/features/practice/PracticePage.test.tsx`

**Interfaces:**
- Consumes: `getAudioChoiceCandidates(step)`
- Produces: buttons named `试听并选择候选 A`, `试听并选择候选 B`, and `试听并选择候选 C`

- [ ] **Step 1: Write failing renderer and practice tests**

Render the central-C choice, assert that C3/C4/C5 are absent from button names, click the candidate mapped to C4, and assert the correct audio and stored answer. Run the same behavior through `PracticePage`.

- [ ] **Step 2: Implement the listening deck**

Render one `aria-pressed` button per candidate using an auto-fit dense grid. On click, call the existing preview scheduler and `setAnswer(candidate.choice)`. Keep current semantic buttons for steps without audio.

- [ ] **Step 3: Run focused tests**

Run: `npx vitest run src/features/lesson/audioChoice.test.ts src/features/lesson/lessonContentContract.test.tsx src/features/practice/PracticePage.test.tsx --maxWorkers=4`

Expected: all focused tests pass.

### Task 3: Browser and Release Verification

**Files:**
- Modify: `tests/e2e/helpers.ts`
- Modify: `tests/e2e/practice.spec.ts`

**Interfaces:**
- Consumes: the pure candidate model and authored lesson content.
- Produces: browser proof that first lesson and six-item practice complete without visible answer labels.

- [ ] **Step 1: Update browser helpers**

Resolve the correct anonymous label from the authored step in lesson helpers. In practice, match the visible authored prompt to its step, then select the mapped correct candidate.

- [ ] **Step 2: Run full verification**

Run: `npm run lint:copy`

Run: `npx vitest run --dir src --maxWorkers=4`

Run: `npm run build`

Run: `npm run test:e2e -- --workers=4`

Expected: copy check, unit tests, build, and all applicable browser tests pass.

