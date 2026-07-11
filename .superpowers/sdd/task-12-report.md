# Task 12 Report

## Status

COMPLETE — Playwright 关键旅程、可靠的 Windows runner、README、音频测试 spy 与实测 UI 修复均已实现；桌面、1024×768 平板和移动端完整 gate 全绿。

## RED / GREEN

- RED 1: `npm run test:e2e` 在缺少配置时错误收集 `src/**/*.test.*`，出现 CSS parse、`describe is not defined` 和 `No tests found`，exit 1。
- RED 2: Chromium 缺失，`browserType.launch` 指向不存在的 `chromium_headless_shell-1228`。
- GREEN: 提升权限运行 `npx playwright install chromium`，Chrome 与 Headless Shell v1228 下载完成，exit 0。
- RED 3: onboarding 首轮使用 brief 简称匹配课程，地图真实 accessible name 为“声音的高与低，已解锁”。
- GREEN (UI actions): DEBUG 日志确认中央 C 点击、声音状态、engine spy、地图导航、课程节点和横向滚动断言全部 succeeded；BrowserContext 与 Browser 均成功关闭。
- RED 4: 原生 Web Audio 初始化令 runner 留住进程。为明确的浏览器测试 spy 先添加单测，初次得到 spy 0 次而预期 1 次。
- GREEN: `npx vitest run src/audio/AudioEngine.test.ts` — 14/14 passed，exit 0；测试注入不创建 Tone 节点，默认生产路径不变。
- RED 5: Playwright 自管 `webServer` 在 Windows 上完成 `browser.close` 后无法可靠回收 Vite 进程树。
- GREEN: `scripts/run-e2e.mjs` 直接用 Node 启动 Vite 与 Playwright CLI，轮询 HTTP ready，并在 `finally` 中终止且等待 Vite；onboarding desktop 首次自然 exit 0。
- RED 6: 移动课程反馈按钮被 z60 的课程底栏遮挡；长键盘的 C3/C5 在视口外；创作台测试没有通过移动轨道切换器操作。
- GREEN: 反馈层提升至 z70；钢琴键盘改为可横向滚动且按键不收缩；studio 旅程按真实移动控件逐轨编辑和恢复。
- GREEN: 最终 `npm run test:e2e` — 12/12 passed（desktop 6 + mobile 6），exit 0，runner 自然退出。
- REVIEW RED: 完成页使用 `scoreLesson` 自有阈值显示 3 星，而 repository 按规则 A 持久化 2 星；unit 与 E2E 均先稳定复现。
- REVIEW GREEN: `scoreLesson` 统一调用 `calculateStars`；100 分、零提示、无变式在完成页与地图均为 2 星，规则 A 的高质量变式 3 星单测保留。
- REVIEW GREEN: 新增 `tablet` Chromium 项目（1024×768）与 visual QA，自动拦截 `pageerror`/`console.error`，验证首页标题行数、页面横滚、地图/课程/Studio 操作和 reduced motion。
- REVIEW GREEN: practice E2E 从 IndexedDB 读取具体 review，验证基线为 0、mastery 为 12、dueAt 在未来、页面日期一致，并在 reload 后逐字段恢复。
- REVIEW GREEN: Node engines 与 README 同步为 `^20.19.0 || >=22.12.0`，package-lock 根包元数据同步。

## Implemented files

- `playwright.config.ts`
- `tests/e2e/helpers.ts`
- `tests/e2e/onboarding.spec.ts`
- `tests/e2e/lesson.spec.ts`
- `tests/e2e/practice.spec.ts`
- `tests/e2e/studio.spec.ts`
- `tests/e2e/accessibility.spec.ts`
- `README.md`
- `src/audio/AudioEngine.ts`
- `src/audio/AudioEngine.test.ts`
- `src/features/lesson/LessonPage.tsx`
- `src/features/lesson/components/FeedbackSheet.tsx`
- `src/features/lesson/components/PianoKeyboard.tsx`
- `src/features/lesson/lessonContentContract.test.tsx`
- `scripts/run-e2e.mjs`
- `package.json`

## Coverage represented in specs

- First visit: middle C UI response + engine spy + map entry
- High/low lesson completion and 3-star persistence
- Three wrong answers, levelled feedback, generated variant, then correct completion
- Six daily-practice items and persisted next review date
- Four-track editing, autosave, reload and restoration
- Keyboard activation, reduced motion and horizontal-overflow checks
- Desktop 1440×1000、tablet 1024×768 和 mobile 390×844 projects

## Verification

- `npx playwright install chromium`: exit 0 (two optional trailing network reset messages did not prevent both Chromium artifacts being installed)
- `npm run lint:copy`: passed, exit 0
- `npm run typecheck`: passed, exit 0
- `npm test`: 32 files / 185 tests passed, exit 0
- `npm run build`: passed, exit 0 (Vite reports the existing >500 kB chunk advisory)
- `npm run test:e2e`: 19 passed（desktop 6 + tablet 7 + mobile 6），exit 0
- `git diff --check`: passed, exit 0

## Self-review

- Tests use roles/accessibility names and observable UI state rather than CSS implementation details.
- Audio uses an explicit global test spy; normal runtime still calls Tone.js.
- IndexedDB checks use browser-visible persistence and refresh rather than repository mocks.
- No failed command is represented as a pass.

## Known non-blocking output

- npm prints an existing `sass_binary_site` deprecation warning.
- Vitest workers print an existing `--localstorage-file` warning.
- Vite reports a production chunk larger than 500 kB; build still exits 0.
