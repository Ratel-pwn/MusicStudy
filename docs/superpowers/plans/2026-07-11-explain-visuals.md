# Explain Visuals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a meaningful, responsive music-theory diagram for every authored observation step and verify the complete first lesson.

**Architecture:** Add a focused `ExplainVisual` component that maps existing `LessonStep.config` shapes to eight small semantic renderers. Keep lesson progression in `LessonPage`; `ExplainStep` composes the visual and its acknowledgement action.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library, Playwright

## Global Constraints

- Preserve the current warm editorial lesson aesthetic and existing navigation.
- Do not add dependencies or remote image assets.
- Respect `prefers-reduced-motion` and expose a readable accessible name for every visual.
- Keep interactive answer steps and lesson scoring behavior unchanged.

---

### Task 1: Theory Visual Renderer

**Files:**
- Create: `src/features/lesson/components/ExplainVisual.tsx`
- Create: `src/features/lesson/components/ExplainVisual.test.tsx`

**Interfaces:**
- Consumes: `LessonStep` from `src/content/schema.ts`
- Produces: `ExplainVisual({ step }: { step: LessonStep }): JSX.Element`

- [ ] **Step 1: Write the failing authored-content test**

Render every authored `explain` step and assert that `getByRole('img', { name: /.+/ })` exists, then assert the pitch diagram contains `低音` and `高音`.

- [ ] **Step 2: Run the test to verify RED**

Run: `npx vitest run src/features/lesson/components/ExplainVisual.test.tsx --maxWorkers=4`

Expected: FAIL because `ExplainVisual.tsx` does not exist.

- [ ] **Step 3: Implement the eight semantic diagrams**

Create configuration guards for `visual`, `landmark`, `labels`, `meter`, `countSyllables`, `semitonePairs`, `degrees`, and `sections`. Return a full-width `figure` with `role="img"`, an exact `aria-label`, and a CSS/SVG diagram for each guard. Return a generic staff-and-note diagram for an unknown configuration.

- [ ] **Step 4: Run the component test to verify GREEN**

Run: `npx vitest run src/features/lesson/components/ExplainVisual.test.tsx --maxWorkers=4`

Expected: all tests pass.

### Task 2: Lesson Integration

**Files:**
- Modify: `src/features/lesson/LessonPage.tsx`
- Modify: `src/features/lesson/LessonPage.test.tsx`

**Interfaces:**
- Consumes: `ExplainVisual`
- Produces: an observation step containing a visible diagram followed by the `我看清了` button

- [ ] **Step 1: Write the failing lesson regression test**

Enter the real `pitch-high-low` observation step and assert that the page exposes an image named `音高由低向高移动的竖直轨迹` before acknowledgement.

- [ ] **Step 2: Run the lesson test to verify RED**

Run: `npx vitest run src/features/lesson/LessonPage.test.tsx --maxWorkers=4`

Expected: FAIL because `ExplainStep` currently renders only the button.

- [ ] **Step 3: Wire the diagram into `ExplainStep`**

Import `ExplainVisual`, accept `step` in `ExplainStep`, and render `<ExplainVisual step={step} />` above the acknowledgement button with a responsive vertical gap.

- [ ] **Step 4: Run lesson and content contract tests**

Run: `npx vitest run src/features/lesson/LessonPage.test.tsx src/features/lesson/lessonContentContract.test.tsx --maxWorkers=4`

Expected: all tests pass.

### Task 3: Complete First-Lesson Verification

**Files:**
- Modify: `tests/e2e/lesson.spec.ts`
- Modify: `tests/e2e/visual-qa.spec.ts`

**Interfaces:**
- Consumes: the accessible names exposed by `ExplainVisual`
- Produces: browser-level proof that the diagram is visible and the six-step first lesson completes

- [ ] **Step 1: Extend browser assertions**

After the first guided listening step, assert that `getByRole('img', { name: '音高由低向高移动的竖直轨迹' })` is visible. Continue through keyboard, choice, build, studio transfer, completion score, exit, and saved stars.

- [ ] **Step 2: Run full verification**

Run: `npm run lint:copy`

Run: `npx vitest run src --maxWorkers=4`

Run: `npm run build`

Run: `npm run test:e2e -- --workers=4`

Expected: copy check passes, all unit tests pass, build exits 0, and all applicable desktop/tablet/mobile E2E tests pass.

- [ ] **Step 3: Commit and push**

```powershell
git add docs/superpowers/specs/2026-07-11-explain-visuals-design.md docs/superpowers/plans/2026-07-11-explain-visuals.md src/features/lesson/components/ExplainVisual.tsx src/features/lesson/components/ExplainVisual.test.tsx src/features/lesson/LessonPage.tsx src/features/lesson/LessonPage.test.tsx tests/e2e/lesson.spec.ts tests/e2e/visual-qa.spec.ts
git commit -m "feat: add lesson concept visuals"
git push origin main
```

