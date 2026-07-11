# Task 3 report

## RED

- `npm run test:e2e -- tests/e2e/lesson.spec.ts tests/e2e/practice.spec.ts --workers=1`
- Existing flow failed after choices became anonymous. The focused desktop lesson failure timed out at `helpers.ts:56`, waiting for the authored accessible name `更高`; practice failed for the same authored-label selection strategy.

## Implementation

- Browser helpers now map each authored answer through `getAudioChoiceCandidates(step)` and click the resulting anonymous candidate label.
- Practice matches the visible authored prompt inside the active task to its source step.
- Every anonymous listening selection asserts that no authored choice text appears in candidate button accessible names.
- Choices without `audioOptions` keep the generic authored-label fallback.
- No production files were changed.

## GREEN

- Target E2E, one worker: 15 passed across desktop, tablet, and mobile.
- `npm run typecheck`: passed.
- `git diff --check`: passed.
