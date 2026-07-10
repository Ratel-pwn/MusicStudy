# Task 11 Report — Accessibility, Recovery, and Responsive Behavior

## Status

Complete. The application now has render, audio, and composition-save recovery paths; shared loading and reduced-motion behavior; keyboard regression coverage; 44 × 44 px interaction targets; and responsive rules at 480 / 768 / 1024 / 1280 px.

## TDD RED → GREEN evidence

### Recovery components

- RED: `npm test -- src/shared/ErrorBoundary.test.tsx`
  - Failed because `ErrorBoundary` and `AudioRecoveryBanner` did not exist.
- GREEN: the same suite passed 3 tests after minimal implementations.
  - Custom fallback is rendered after a child render error.
  - Default recovery UI exposes “返回地图”, “恢复最近步骤”, and “导出临时作品”.
  - Failed audio exposes “重新启用声音” while unrelated controls remain enabled.

### Autosave snapshot and reduced motion

- RED: `npm test -- src/shared/recoveryHooks.test.tsx`
  - Failed because `useAutosaveRecovery` and `useReducedMotion` did not exist.
- GREEN: the same suite passed 2 tests.
  - The latest composition is serialized to an in-memory, formatted JSON snapshot before persistence.
  - A rejected save is caught and exposed without losing the downloadable snapshot.
  - Reduced-motion preference is read initially and updated from the media-query change event.

### Integrated recovery

- RED: audio provider tests expected the new non-blocking retry banner, and Studio tests expected a save-failure alert plus JSON download; both failed against the previous UI.
- GREEN: AudioProvider uses `AudioRecoveryBanner`; Studio uses `useAutosaveRecovery` and offers download/retry after persistence failure.
- RED: Studio playback still started after audio recovery failed.
- GREEN: Studio checks the engine status after unlock; playback remains stopped while editing remains available.

### Interaction and motion regression evidence

- Piano keys: Arrow navigation plus Enter and Space activation.
- Rhythm grid: Arrow navigation plus Enter and Space placement.
- Lesson: Tab order reaches exit first and then the primary piano interaction.
- Map: Arrow-key node navigation remains covered; accessible names communicate locked/unlocked/current/star state.
- PianoRoll: Arrow-key beat/pitch movement remains covered.
- Reduced motion: Map creates no GSAP tweens when the user requests reduced motion. No ScrollTrigger/pin is registered anywhere in the current application.
- Color states: interactive state is also exposed through text/ARIA; active drum cells additionally show a check shape.

## Responsive and touch rules

- Breakpoints are explicitly defined at 1280, 1024, 768, and 480 px.
- The document and pages suppress horizontal page overflow; the Studio timeline owns horizontal scrolling.
- Studio switches to one visible track at 768 px and below.
- Mobile map retains `touch-action: none` pointer dragging.
- Mobile navigation accounts for `safe-area-inset-bottom`.
- Interactive controls use a minimum 44 × 44 px target; the 32-beat Studio grid expands inside its independently scrolling timeline.

## Verification

Fresh final run:

```text
npm test
Test Files  32 passed (32)
Tests       179 passed (179)

npm run typecheck
PASS

npm run lint:copy
Copy check passed.
```

`git diff --check` passed. npm emitted only the existing `sass_binary_site` and local-storage-file warnings; there were no test, typecheck, or copy-lint errors.

## Files

Created:

- `src/shared/ErrorBoundary.tsx`
- `src/shared/ErrorBoundary.test.tsx`
- `src/shared/AudioRecoveryBanner.tsx`
- `src/shared/LoadingState.tsx`
- `src/shared/useReducedMotion.ts`
- `src/shared/useAutosaveRecovery.ts`
- `src/shared/recoveryHooks.test.tsx`

Modified:

- `src/app/App.tsx`
- `src/app/routes.tsx`
- `src/audio/AudioProvider.tsx`
- `src/audio/AudioEngine.test.ts`
- `src/design/globals.css`
- `src/features/home/HomePage.tsx`
- `src/features/map/MapPage.tsx`, `MapPage.test.tsx`, `map.css`
- `src/features/lesson/LessonPage.test.tsx`
- `src/features/lesson/components/PianoKeyboard.test.tsx`
- `src/features/lesson/components/RhythmGrid.test.tsx`
- `src/features/studio/StudioPage.tsx`, `StudioPage.test.tsx`, `studio.css`

## Self-review

- Recovery is scoped: an audio failure changes only sound behavior; a storage failure keeps editing state and provides a local JSON escape hatch; a render failure offers contextual navigation/recovery actions.
- Shared hooks remove repeated media-query checks and catch async save rejection, avoiding unhandled persistence failures.
- The responsive work preserves the existing visual system and text; it does not add new product features.
- Dense Studio controls satisfy the 44 px target by expanding the timeline rather than the page, preserving the no-horizontal-page-scroll contract.
- No unrelated repository or domain changes were made.

## Issues

None blocking. Automated DOM tests verify semantic and interaction behavior; no browser screenshot matrix was requested or added.

## Review follow-up — 2026-07-11

All Important/Minor review findings were addressed with new RED → GREEN coverage:

- Repository rejection: RED stayed permanently on “正在读取学习航迹” and emitted an unhandled rejection. GREEN stores the loader error and throws it during render, so App ErrorBoundary shows the recovery page; the default “返回地图” action is a real `/map` link.
- Snapshot export: RED exposed a dead default export button with no in-memory snapshot. GREEN adds `hasLatestRecoverySnapshot()` and hides the action with an explicit “当前没有可导出的临时作品。” message; a real seeded snapshot test verifies Blob download, while custom callbacks remain covered.
- Transport targets: RED found the local 2.55rem rule overriding the 44px contract. GREEN sets and DOM-verifies 2.75rem minimum width and height on every TransportBar button/select.
- PianoRoll: RED showed the compact visual note was also the button hit area. GREEN separates a transparent 2.75rem `.piano-note-hit` button from its 1.05rem `.piano-note-pill`, preserving compact visuals and a 44 × 44 px interaction target.

Fresh required verification:

```text
npm test -- src/app src/shared src/features/studio
Test Files  7 passed (7)
Tests       54 passed (54)

npm run typecheck
PASS

npm run lint:copy
Copy check passed.
```
