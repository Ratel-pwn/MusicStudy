# 拾音岛 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个本地优先、可完整游玩的音乐学习原型，用户可以完成八个课程节点、针对性复习，并在四轨创作台保存和回放 8 小节作品。

**Architecture:** React 单页应用按地图、课程、练习、创作和能力五个 feature 拆分。纯函数音乐领域层负责判题，Tone.js 音频层负责声音，Dexie repository 负责本地数据，Zustand 负责短生命周期交互状态。课程 JSON 通过统一步骤状态机驱动多种音乐组件。

**Tech Stack:** React、TypeScript、Vite、React Router、Zustand、Dexie、Tone.js、GSAP、Tailwind CSS、Phosphor Icons、Vitest、Testing Library、Playwright。

## Global Constraints

- 面向 16–35 岁零基础学习者，中文为首版界面语言。
- 主视觉采用“音符群岛”，深海蓝、暖黄、珊瑚红、薄荷绿为核心色。
- 实现阶段同时使用 `frontend-design` 与 `gpt-taste`。
- 写任何 React/UI 代码前，先按 `gpt-taste` 输出并保存 `<design_plan>`，完成确定性布局选择、AIDA 检查、标题宽度、网格密度和按钮对比度检查。
- 禁止先否定再转折的模板句式。
- 禁止重复使用“标签 + 标题 + 描述”三段式版面。
- 禁止通用 SaaS 侧栏、指标卡和同构卡片矩阵。
- 地图、谱面、琴键、节奏格、和弦垫和时间轴承担核心信息表达。
- 首版数据保存在 IndexedDB，不接入账号、云端 API、社区或 AI 教师。
- 每个理论节点至少包含一道听觉题和一道构造题。
- 音频失败时保留视觉练习路径。
- 支持键盘、触控、减少动效和 44×44 像素触控目标。
- 所有新增领域行为先写失败测试，再写最小实现。
- 每个任务结束后运行本任务测试和 `npm run typecheck`。

---

## File Map

```text
package.json                              命令与依赖
vite.config.ts                            Vite、Vitest 和路径别名
playwright.config.ts                      端到端测试配置
src/main.tsx                              应用入口
src/app/App.tsx                           Router 与全局 Provider
src/app/AppShell.tsx                      全局导航、音频解锁和错误边界
src/app/routes.tsx                        页面路由
src/design/design-plan.md                 gpt-taste 预检结果
src/design/tokens.css                     品牌令牌、字体和动效变量
src/design/globals.css                    全局基础样式
src/domain/music/types.ts                 音乐与作品公共类型
src/domain/music/pitch.ts                 音高、音名和音程纯函数
src/domain/music/scales.ts                音阶生成和验证
src/domain/music/chords.ts                和弦生成和验证
src/domain/music/rhythm.ts                时值、小节和量化规则
src/domain/music/composition.ts           作品约束检查
src/audio/AudioEngine.ts                  Tone.js 生命周期与调度
src/audio/AudioProvider.tsx               React 音频上下文
src/data/db.ts                            Dexie schema
src/data/repositories.ts                  进度、练习与作品仓储接口
src/content/schema.ts                     课程 JSON 类型与校验
src/content/worlds.ts                     地图和八节点内容
src/features/lesson/lessonEngine.ts        六步课程状态机
src/features/lesson/LessonPage.tsx         统一课程播放器
src/features/lesson/components/            琴键、节奏格、和弦构建器、反馈
src/features/map/MapPage.tsx               群岛地图
src/features/map/progression.ts            星级、XP 与解锁规则
src/features/practice/scheduler.ts          间隔复习调度
src/features/practice/PracticePage.tsx      今日练习
src/features/studio/studioStore.ts          创作会话状态
src/features/studio/StudioPage.tsx          四轨创作台
src/features/profile/ProfilePage.tsx        能力轨道和学习进度
src/features/home/HomePage.tsx              首次听音与继续学习
src/stores/useProgressStore.ts              进度状态和 repository 协调
src/shared/ErrorBoundary.tsx                应用错误恢复
src/shared/LoadingState.tsx                 音色与数据加载状态
src/test/                                  测试初始化和工厂
tests/e2e/                                 关键用户旅程
```

---

### Task 1: Project Foundation and Visual Preflight

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/design/design-plan.md`
- Create: `src/design/tokens.css`
- Create: `src/design/globals.css`
- Create: `src/test/setup.ts`

**Interfaces:**
- Consumes: 已确认设计规格。
- Produces: `@/*` 路径别名、Vitest 浏览器环境、全局设计令牌、可渲染的应用入口。

- [ ] **Step 1: 记录 `gpt-taste` 确定性预检**

Run:

```powershell
@'
prompt = "拾音岛零基础音乐学习平台"
seed = len(prompt)
print(seed)
'@ | python -
```

Expected: 输出稳定整数。将该值写入 `src/design/design-plan.md`，内容必须包含：

```markdown
<design_plan>
Python RNG Execution
seed=<实际整数>
hero=Artistic Asymmetry
font=Cabinet Grotesk + Noto Serif SC + Noto Sans SC
components=Horizontal Accordions, Inline Typography Images, Infinite Marquee
motion=Card Stacking, Scrubbing Text Reveals

AIDA Check
入口展示页包含 Navigation、Attention、Interest、Desire、Action。应用内部页面使用各自的音乐空间结构。

Hero Math Verification
H1 使用 max-width: 72rem 和 clamp(3rem, 6vw, 6.5rem)，桌面端最多三行。无悬浮印章和标签堆叠。

Bento Density Verification
入口展示区采用 12 列、2 行；模块布局 7x2、5x1、5x1，共 24 个单元格，零空位并启用 grid-auto-flow:dense。

Label Sweep & Button Check
无廉价编号标签。浅色按钮使用 #102A43 文本，深色按钮使用 #FFF4D6 文本，对比度达到 WCAG AA。
</design_plan>
```

- [ ] **Step 2: 创建依赖和命令**

`package.json` scripts 必须包含：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint:copy": "node scripts/check-copy.mjs"
  }
}
```

Dependencies: `react`, `react-dom`, `react-router-dom`, `zustand`, `dexie`, `tone`, `gsap`, `@gsap/react`, `@phosphor-icons/react`. Dev dependencies: `typescript`, `vite`, `@vitejs/plugin-react`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@playwright/test`, `tailwindcss`, `@tailwindcss/vite`。

- [ ] **Step 3: 安装依赖并验证入口测试失败**

Create `src/app/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { App } from './App';

it('renders the MusicStudy application landmark', () => {
  render(<App />);
  expect(screen.getByRole('main', { name: '拾音岛学习空间' })).toBeInTheDocument();
});
```

Run: `npm install && npm test -- src/app/App.test.tsx`  
Expected: FAIL，原因是 `App` 尚未实现。

- [ ] **Step 4: 实现最小应用入口与令牌**

`src/app/App.tsx`:

```tsx
export function App() {
  return <main aria-label="拾音岛学习空间" />;
}
```

`src/design/tokens.css` 定义：

```css
:root {
  --sea-950: #0b2236;
  --sea-900: #102a43;
  --sand-100: #f6ecd7;
  --sun-400: #e7c55f;
  --coral-500: #ef765d;
  --mint-500: #4eaa94;
  --lavender-500: #7f88bd;
  --focus: #ffd86b;
  --radius-island: 42% 58% 54% 46% / 55% 44% 56% 45%;
  --beat-fast: 150ms;
  --beat-normal: 300ms;
}
```

- [ ] **Step 5: 运行测试和类型检查**

Run: `npm test -- src/app/App.test.tsx`  
Expected: PASS。

Run: `npm run typecheck`  
Expected: exit 0。

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig*.json index.html src
git commit -m "chore: scaffold MusicStudy application"
```

---

### Task 2: Music Domain Rules

**Files:**
- Create: `src/domain/music/types.ts`
- Create: `src/domain/music/pitch.ts`
- Create: `src/domain/music/scales.ts`
- Create: `src/domain/music/chords.ts`
- Create: `src/domain/music/rhythm.ts`
- Create: `src/domain/music/composition.ts`
- Test: `src/domain/music/*.test.ts`

**Interfaces:**
- Consumes: TypeScript 工程。
- Produces: `parseNote()`, `intervalSemitones()`, `buildScale()`, `buildTriad()`, `measureBeats()`, `evaluateComposition()`。

- [ ] **Step 1: 定义公共类型和失败测试**

`types.ts` exports:

```ts
export type NoteName = 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F' | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A' | 'A#' | 'Bb' | 'B';
export type Pitch = { note: NoteName; octave: number; midi: number };
export type ScaleKind = 'major' | 'naturalMinor';
export type TriadQuality = 'major' | 'minor' | 'diminished';
export type NoteEvent = { id: string; midi: number; startBeat: number; durationBeats: number; velocity: number };
export type TrackKind = 'drums' | 'bass' | 'chords' | 'melody';
export type Composition = { id: string; title: string; bpm: number; key: 'C-major' | 'A-minor'; bars: 8; tracks: Record<TrackKind, NoteEvent[]> };
export type CompositionIssue = { code: string; track?: TrackKind; beat?: number; message: string };
```

Tests must assert:

```ts
expect(parseNote('C4').midi).toBe(60);
expect(intervalSemitones('C4', 'Eb4')).toBe(3);
expect(buildScale('C', 'major')).toEqual(['C','D','E','F','G','A','B']);
expect(buildTriad('B', 'diminished')).toEqual(['B','D','F']);
expect(measureBeats([{ value: 'quarter', count: 4 }])).toBe(4);
```

- [ ] **Step 2: 运行领域测试并确认失败**

Run: `npm test -- src/domain/music`  
Expected: FAIL，缺少对应函数。

- [ ] **Step 3: 实现音高、音阶、和弦和节奏纯函数**

Implementation contracts:

```ts
export function parseNote(value: string): Pitch;
export function intervalSemitones(from: string, to: string): number;
export function buildScale(root: NoteName, kind: ScaleKind): NoteName[];
export function buildTriad(root: NoteName, quality: TriadQuality): NoteName[];
export function measureBeats(items: Array<{ value: 'whole'|'half'|'quarter'|'eighth'; count: number }>): number;
export function quantizeBeat(beat: number, subdivision: 0.25 | 0.5 | 1): number;
```

使用 pitch-class 数组和 interval pattern，保持函数无副作用。

- [ ] **Step 4: 先写作品规则失败测试，再实现检查器**

Test cases:

```ts
expect(evaluateComposition(emptyComposition)).toEqual(expect.arrayContaining([
  expect.objectContaining({ code: 'missing-drums' }),
  expect.objectContaining({ code: 'missing-bass' }),
  expect.objectContaining({ code: 'missing-chords' }),
  expect.objectContaining({ code: 'missing-melody' })
]));
expect(evaluateComposition(validComposition)).toHaveLength(0);
```

`evaluateComposition()` 检查轨道存在、事件边界、速度范围 70–128、旋律音域不超过 19 个半音、强拍和弦音比例与末尾终止音。

- [ ] **Step 5: 运行测试和类型检查**

Run: `npm test -- src/domain/music && npm run typecheck`  
Expected: 全部 PASS。

- [ ] **Step 6: Commit**

```bash
git add src/domain/music
git commit -m "feat: add tested music theory domain"
```

---

### Task 3: Local Persistence and Progress Store

**Files:**
- Create: `src/data/db.ts`
- Create: `src/data/repositories.ts`
- Create: `src/data/repositories.test.ts`
- Create: `src/stores/useProgressStore.ts`
- Create: `src/stores/useProgressStore.test.ts`

**Interfaces:**
- Consumes: `Composition`。
- Produces: `progressRepository`, `attemptRepository`, `compositionRepository`, `useProgressStore`。

- [ ] **Step 1: 写 repository 失败测试**

```ts
const saved = await compositionRepository.save(composition);
expect(saved.id).toBe(composition.id);
expect(await compositionRepository.get(composition.id)).toEqual(composition);

await progressRepository.completeLesson({ lessonId: 'pitch-01', score: 90, hints: 0 });
expect((await progressRepository.get()).stars['pitch-01']).toBe(3);
```

Use `fake-indexeddb` in Vitest setup.

- [ ] **Step 2: 运行并确认失败**

Run: `npm test -- src/data`  
Expected: FAIL，repository 未定义。

- [ ] **Step 3: 定义 Dexie schema**

Tables:

```ts
type ProgressRecord = { id: 'local'; xp: number; streak: number; lastStudyDate?: string; stars: Record<string, 0|1|2|3>; unlockedLessonIds: string[] };
type AttemptRecord = { id: string; lessonId: string; skillIds: string[]; correct: boolean; hints: number; errorCode?: string; createdAt: string };
type ReviewRecord = { skillId: string; mastery: number; intervalDays: 1|3|7|14; dueAt: string; consecutiveCorrect: number };
type CompositionRecord = Composition & { createdAt: string; updatedAt: string; revision: number };
```

Dexie version 1 stores: `progress`, `attempts`, `reviews`, `compositions`, `settings`。

- [ ] **Step 4: 实现 repository 和 Zustand 协调层**

`useProgressStore` exposes:

```ts
type ProgressState = {
  hydrated: boolean;
  progress: ProgressRecord;
  hydrate(): Promise<void>;
  completeLesson(input: { lessonId: string; score: number; hints: number }): Promise<void>;
  recordAttempt(input: Omit<AttemptRecord, 'id'|'createdAt'>): Promise<void>;
};
```

Store 只协调仓储和 UI；星级计算位于 `progression.ts`。

- [ ] **Step 5: 验证迁移和刷新恢复**

Run: `npm test -- src/data src/stores && npm run typecheck`  
Expected: PASS，测试覆盖保存、读取、覆盖更新和空库默认值。

- [ ] **Step 6: Commit**

```bash
git add src/data src/stores src/test/setup.ts package.json package-lock.json
git commit -m "feat: persist local progress and compositions"
```

---

### Task 4: Audio Engine

**Files:**
- Create: `src/audio/AudioEngine.ts`
- Create: `src/audio/AudioEngine.test.ts`
- Create: `src/audio/AudioProvider.tsx`
- Create: `src/audio/useAudio.ts`

**Interfaces:**
- Consumes: MIDI note numbers and `NoteEvent`。
- Produces: `AudioEngine.unlock()`, `playMidi()`, `previewChord()`, `startMetronome()`, `playComposition()`, `stop()`。

- [ ] **Step 1: 写调度失败测试**

Mock Tone and assert:

```ts
await engine.unlock();
engine.playMidi(60, 0.5);
expect(synth.triggerAttackRelease).toHaveBeenCalledWith('C4', 0.5, expect.anything(), expect.anything());

engine.stop();
expect(transport.stop).toHaveBeenCalled();
expect(transport.cancel).toHaveBeenCalled();
```

- [ ] **Step 2: 运行并确认失败**

Run: `npm test -- src/audio/AudioEngine.test.ts`  
Expected: FAIL，AudioEngine 未实现。

- [ ] **Step 3: 实现音频生命周期**

```ts
export type AudioStatus = 'locked' | 'unlocking' | 'ready' | 'failed';

export interface MusicAudioEngine {
  status: AudioStatus;
  unlock(): Promise<AudioStatus>;
  playMidi(midi: number, durationBeats?: number, velocity?: number): void;
  previewChord(midis: number[]): void;
  startMetronome(bpm: number): void;
  playComposition(composition: Composition): void;
  stop(): void;
  dispose(): void;
}
```

Tone.Transport 统一调度。基础 Synth 作为采样失败回退。页面隐藏时调用 `stop()`。

- [ ] **Step 4: 实现 Provider 降级状态**

`AudioProvider` 提供：

```ts
type AudioContextValue = {
  engine: MusicAudioEngine;
  status: AudioStatus;
  unlock(): Promise<void>;
  retry(): Promise<void>;
};
```

失败时仍渲染 children，界面显示“声音暂不可用，重试”动作。

- [ ] **Step 5: 测试和类型检查**

Run: `npm test -- src/audio && npm run typecheck`  
Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add src/audio
git commit -m "feat: add resilient Tone audio engine"
```

---

### Task 5: Course Schema and Eight Playable Lessons

**Files:**
- Create: `src/content/schema.ts`
- Create: `src/content/schema.test.ts`
- Create: `src/content/worlds.ts`
- Create: `src/content/worlds.test.ts`
- Create: `src/content/lessons/*.ts`

**Interfaces:**
- Consumes: `NoteName`, `ScaleKind`, `TriadQuality`。
- Produces: `CourseWorld[]`, `Lesson[]`, `getLesson(id)`。

- [ ] **Step 1: 定义课程类型和失败测试**

```ts
export type SkillId = 'pitch'|'keyboard'|'notation'|'pulse'|'rhythm'|'scale'|'chord'|'creation';
export type LessonStepType = 'listen'|'explain'|'keyboard'|'choice'|'rhythmTap'|'rhythmBuild'|'scaleBuild'|'chordBuild'|'studioTransfer';
export type LessonStep = { id: string; type: LessonStepType; prompt: string; skillIds: SkillId[]; config: Record<string, unknown>; feedback: Record<string, string> };
export type Lesson = { id: string; worldId: string; title: string; order: number; xp: number; prerequisiteIds: string[]; steps: LessonStep[] };
```

Test every lesson:

```ts
expect(lesson.steps.some(step => ['listen','choice','rhythmTap'].includes(step.type))).toBe(true);
expect(lesson.steps.some(step => ['keyboard','rhythmBuild','scaleBuild','chordBuild','studioTransfer'].includes(step.type))).toBe(true);
expect(new Set(lesson.steps.map(step => step.id)).size).toBe(lesson.steps.length);
```

- [ ] **Step 2: 运行并确认失败**

Run: `npm test -- src/content`  
Expected: FAIL，课程内容缺失。

- [ ] **Step 3: 写入八个课程节点**

Create exact lesson ids:

```ts
['pitch-high-low','pitch-middle-c','keyboard-white-notes','rhythm-quarter-pulse','rhythm-eighth-subdivision','scale-c-major','chord-c-major','creation-eight-bars']
```

每课 6–9 步，依次覆盖先听、再看、跟做、辨别、构造、作品迁移。每个错误代码必须拥有具体原因文本。

- [ ] **Step 4: 定义长期地图轮廓**

`worlds.ts` 包含共同基础四岛、流行航线、古典航线和创作山。未开放课程使用 `availability: 'planned'`，并给出能力目标，禁止空白锁图标。

- [ ] **Step 5: 测试内容完整性**

Run: `npm test -- src/content && npm run typecheck`  
Expected: PASS，8 个 playable lesson，所有前置 id 有效，图结构无环。

- [ ] **Step 6: Commit**

```bash
git add src/content
git commit -m "feat: add playable foundation curriculum"
```

---

### Task 6: Lesson Engine and Interactive Music Components

**Files:**
- Create: `src/features/lesson/lessonEngine.ts`
- Create: `src/features/lesson/lessonEngine.test.ts`
- Create: `src/features/lesson/LessonPage.tsx`
- Create: `src/features/lesson/LessonPage.test.tsx`
- Create: `src/features/lesson/components/PianoKeyboard.tsx`
- Create: `src/features/lesson/components/RhythmGrid.tsx`
- Create: `src/features/lesson/components/ScaleBuilder.tsx`
- Create: `src/features/lesson/components/ChordBuilder.tsx`
- Create: `src/features/lesson/components/FeedbackSheet.tsx`
- Create: `src/features/lesson/components/*.test.tsx`

**Interfaces:**
- Consumes: `Lesson`, music domain functions, `useAudio`, `useProgressStore`。
- Produces: `createLessonSession()`, `submitAnswer()`, `requestHint()`, accessible interactive components。

- [ ] **Step 1: 写课程状态机失败测试**

```ts
const session = createLessonSession(lesson);
expect(session.stepIndex).toBe(0);
expect(submitAnswer(session, wrongAnswer).feedback.level).toBe(1);
expect(requestHint(requestHint(session)).hintLevel).toBe(2);
expect(submitAnswer(session, correctAnswer).stepIndex).toBe(1);
```

第三次错误后 assert `requiresVariant === true`。

- [ ] **Step 2: 运行并确认失败**

Run: `npm test -- src/features/lesson/lessonEngine.test.ts`  
Expected: FAIL。

- [ ] **Step 3: 实现纯状态机**

```ts
export type LessonSession = {
  lessonId: string;
  stepIndex: number;
  correctCount: number;
  attempts: number;
  hintLevel: 0|1|2|3;
  requiresVariant: boolean;
  answers: Array<{ stepId: string; correct: boolean; errorCode?: string }>;
};

export function createLessonSession(lesson: Lesson): LessonSession;
export function submitAnswer(session: LessonSession, answer: unknown): { session: LessonSession; feedback: FeedbackResult };
export function requestHint(session: LessonSession): LessonSession;
export function scoreLesson(session: LessonSession): { score: number; stars: 1|2|3 };
```

- [ ] **Step 4: 为每个音乐组件写交互测试**

Required assertions:

```tsx
await user.click(screen.getByRole('button', { name: 'C4' }));
expect(onPlay).toHaveBeenCalledWith(60);
expect(onChange).toHaveBeenCalledWith([60]);

await user.keyboard('{ArrowRight}{Enter}');
expect(onPlay).toHaveBeenCalled();
```

节奏格测试拖拽和键盘放置，和弦构建器测试音名与半音数反馈。

- [ ] **Step 5: 实现统一课程播放器**

课程页布局：顶部退出和进度；中央渲染当前音乐对象；底部播放、提示、提交和继续。组件通过 `step.type` 注册表映射，禁止在页面内堆叠大型条件分支。

```ts
const stepRenderers: Record<LessonStepType, React.ComponentType<StepProps>> = { ... };
```

- [ ] **Step 6: 测试课程完成和持久化**

Run: `npm test -- src/features/lesson && npm run typecheck`  
Expected: PASS，完成课后调用 `completeLesson()`，退出再进入可恢复步骤。

- [ ] **Step 7: Commit**

```bash
git add src/features/lesson
git commit -m "feat: add interactive lesson engine"
```

---

### Task 7: Archipelago Map and Progression

**Files:**
- Create: `src/features/map/progression.ts`
- Create: `src/features/map/progression.test.ts`
- Create: `src/features/map/MapPage.tsx`
- Create: `src/features/map/MapPage.test.tsx`
- Create: `src/features/map/map.css`

**Interfaces:**
- Consumes: `CourseWorld[]`, progress state。
- Produces: `calculateStars()`, `unlockedLessonIds()`, interactive map route。

- [ ] **Step 1: 写解锁和星级失败测试**

```ts
expect(calculateStars({ score: 70, hints: 3, completedVariant: false })).toBe(1);
expect(calculateStars({ score: 85, hints: 1, completedVariant: false })).toBe(2);
expect(calculateStars({ score: 90, hints: 0, completedVariant: true })).toBe(3);
expect(unlockedLessonIds(worlds, { 'pitch-high-low': 1 })).toContain('pitch-middle-c');
```

- [ ] **Step 2: 运行失败测试并实现规则**

Run: `npm test -- src/features/map/progression.test.ts`  
Expected: FAIL。

Implement pure functions, then rerun; Expected: PASS。

- [ ] **Step 3: 写地图可访问性测试**

```tsx
expect(screen.getByRole('navigation', { name: '音乐群岛学习地图' })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /中央 C/ })).toHaveAttribute('aria-describedby');
await user.keyboard('{ArrowDown}');
expect(screen.getByRole('button', { name: /中央 C/ })).toHaveFocus();
```

- [ ] **Step 4: 实现可拖动群岛地图**

使用 DOM 和 CSS 形状构建岛屿，课程节点沿自定义坐标布置。地图包含当前位置、航线、锁定能力目标、星级和复习雾区。GSAP 只用于初次进入、解锁路径和节点聚焦；减少动效时瞬时完成。

- [ ] **Step 5: 验证地图交互**

Run: `npm test -- src/features/map && npm run typecheck`  
Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add src/features/map
git commit -m "feat: add musical archipelago progression map"
```

---

### Task 8: Practice Scheduler and Skill Orbit

**Files:**
- Create: `src/features/practice/scheduler.ts`
- Create: `src/features/practice/scheduler.test.ts`
- Create: `src/features/practice/PracticePage.tsx`
- Create: `src/features/practice/PracticePage.test.tsx`
- Create: `src/features/profile/ProfilePage.tsx`
- Create: `src/features/profile/SkillOrbit.tsx`

**Interfaces:**
- Consumes: attempts, reviews, current composition issues。
- Produces: `scheduleReview()`, `buildDailyPractice()`, skill mastery display。

- [ ] **Step 1: 写间隔规则失败测试**

```ts
expect(scheduleReview(base, { correct: true, hints: 0 }).intervalDays).toBe(3);
expect(scheduleReview(day3, { correct: true, hints: 0 }).intervalDays).toBe(7);
expect(scheduleReview(day7, { correct: false, hints: 1 }).intervalDays).toBe(1);
```

- [ ] **Step 2: 写今日练习选择失败测试**

```ts
const plan = buildDailyPractice({ dueReviews, weakSkills, compositionIssues, limit: 6 });
expect(plan.filter(item => item.source === 'due')).toHaveLength(3);
expect(plan.filter(item => item.source === 'weak')).toHaveLength(2);
expect(plan.filter(item => item.source === 'composition')).toHaveLength(1);
```

- [ ] **Step 3: 实现调度器并验证**

Run: `npm test -- src/features/practice/scheduler.test.ts`  
Expected before implementation: FAIL；implementation 后 PASS。

- [ ] **Step 4: 实现任务泳道和技能轨道**

PracticePage 逐题展示，不使用题目卡片网格。SkillOrbit 使用位置、线型和文字共同表达六项技能；选择技能后显示到期日期、近期错误和推荐练习。

- [ ] **Step 5: 运行组件测试**

Run: `npm test -- src/features/practice src/features/profile && npm run typecheck`  
Expected: PASS，练习完成会更新 review 和 mastery。

- [ ] **Step 6: Commit**

```bash
git add src/features/practice src/features/profile
git commit -m "feat: add spaced practice and skill orbit"
```

---

### Task 9: Four-Track Eight-Bar Studio

**Files:**
- Create: `src/features/studio/studioStore.ts`
- Create: `src/features/studio/studioStore.test.ts`
- Create: `src/features/studio/StudioPage.tsx`
- Create: `src/features/studio/StudioPage.test.tsx`
- Create: `src/features/studio/components/TransportBar.tsx`
- Create: `src/features/studio/components/DrumSequencer.tsx`
- Create: `src/features/studio/components/PianoRoll.tsx`
- Create: `src/features/studio/components/ChordLane.tsx`
- Create: `src/features/studio/components/RuleInspector.tsx`
- Create: `src/features/studio/studio.css`

**Interfaces:**
- Consumes: `Composition`, audio engine, composition repository, `evaluateComposition()`。
- Produces: editable four-track composition with autosave and playback。

- [ ] **Step 1: 写 store 失败测试**

```ts
const store = createStudioStore(initialComposition);
store.getState().addNote('melody', { midi: 64, startBeat: 0, durationBeats: 1, velocity: 0.8 });
expect(store.getState().composition.tracks.melody).toHaveLength(1);
store.getState().moveNote('melody', noteId, { startBeat: 1, midi: 67 });
expect(store.getState().composition.tracks.melody[0]).toMatchObject({ startBeat: 1, midi: 67 });
```

- [ ] **Step 2: 实现可撤销的编辑动作**

Store exposes:

```ts
addNote(track: TrackKind, event: Omit<NoteEvent,'id'>): void;
moveNote(track: TrackKind, id: string, patch: Pick<NoteEvent,'midi'|'startBeat'>): void;
resizeNote(track: TrackKind, id: string, durationBeats: number): void;
removeNote(track: TrackKind, id: string): void;
setBpm(bpm: 70|90|110|128): void;
setKey(key: 'C-major'|'A-minor'): void;
undo(): void;
redo(): void;
```

所有 beat 量化到 0.25，事件保持在 0–32 beat。

- [ ] **Step 3: 为四种编辑器写交互测试**

Required coverage:

- 鼓机点击单元格创建和删除事件。
- PianoRoll 支持键盘移动音符。
- ChordLane 拖放 C、F、G、Am 和弦片段。
- TransportBar 控制播放、停止、速度和循环位置。
- RuleInspector 点击建议时聚焦对应轨道和 beat。

- [ ] **Step 4: 实现工作台布局**

桌面端以时间轴为中心，轨道头固定在左侧；移动端一次聚焦一条轨道。轨道颜色为鼓珊瑚、贝斯暖黄、和弦薄荷、旋律薰衣草。工具只在选择音符后出现。

- [ ] **Step 5: 接入播放和 500ms 防抖自动保存**

```ts
useEffect(() => {
  const timer = window.setTimeout(() => compositionRepository.save(composition), 500);
  return () => window.clearTimeout(timer);
}, [composition]);
```

刷新页面后恢复最近作品和选中轨道。

- [ ] **Step 6: 运行工作台测试**

Run: `npm test -- src/features/studio && npm run typecheck`  
Expected: PASS。

- [ ] **Step 7: Commit**

```bash
git add src/features/studio
git commit -m "feat: add four-track composition studio"
```

---

### Task 10: App Routes, Home Experience, and Cohesive Visual System

**Files:**
- Create: `src/app/routes.tsx`
- Create: `src/app/AppShell.tsx`
- Create: `src/app/AppShell.test.tsx`
- Create: `src/features/home/HomePage.tsx`
- Create: `src/features/home/HomePage.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/design/tokens.css`
- Modify: `src/design/globals.css`
- Create: `scripts/check-copy.mjs`

**Interfaces:**
- Consumes: all feature pages, AudioProvider, progress store。
- Produces: `/`, `/map`, `/lesson/:lessonId`, `/practice`, `/studio/:compositionId`, `/progress`。

- [ ] **Step 1: 写路由失败测试**

```tsx
render(<App />, { wrapper: MemoryRouterWithRoute('/map') });
expect(screen.getByRole('navigation', { name: '音乐群岛学习地图' })).toBeInTheDocument();

render(<App />, { wrapper: MemoryRouterWithRoute('/practice') });
expect(screen.getByRole('main', { name: '今日练习' })).toBeInTheDocument();
```

- [ ] **Step 2: 实现 AppShell 和路由**

导航随页面改变形态：地图使用海图边缘导航；课程使用紧凑退出和进度；创作台使用 Transport；其余页面使用浮动分段导航。禁止固定 SaaS 侧栏。

- [ ] **Step 3: 实现首次听音体验**

HomePage 首屏先呈现一排可播放琴键。用户点击中央 C 后显示声音波纹、短旋律回应和“沿着声音出发”按钮。返回用户看到继续当前课程和最近作品。

- [ ] **Step 4: 应用 `frontend-design` 与 `gpt-taste`**

- 使用设计预检确定的 Artistic Asymmetry 入口构图。
- 入口展示页按 AIDA 组织；应用页面维持音乐空间结构。
- GSAP 用于入口标题揭示、地图路径解锁和作品轨道叠入。
- 所有 GSAP context 在卸载时 `revert()`。
- `prefers-reduced-motion` 下跳过 scrub、pin 和长距离位移。
- 使用真实中文课程文案和音乐对象，禁止临时图片与虚构统计。

- [ ] **Step 5: 添加文案检查脚本**

`scripts/check-copy.mjs` 扫描 `src/**/*.{ts,tsx,json}`，遇到以下模式时 exit 1：

```js
const banned = [/\u4e0d\u662f.{0,40}\u800c\u662f/, /SECTION\s+\d+/i, /QUESTION\s+\d+/i, /Lorem ipsum/i];
```

Run: `npm run lint:copy`  
Expected: exit 0。

- [ ] **Step 6: 运行应用测试和构建**

Run: `npm test -- src/app src/features/home && npm run typecheck && npm run build`  
Expected: PASS，build exit 0。

- [ ] **Step 7: Commit**

```bash
git add src/app src/features/home src/design scripts package.json
git commit -m "feat: connect MusicStudy learning experience"
```

---

### Task 11: Accessibility, Recovery, and Responsive Behavior

**Files:**
- Create: `src/shared/ErrorBoundary.tsx`
- Create: `src/shared/ErrorBoundary.test.tsx`
- Create: `src/shared/AudioRecoveryBanner.tsx`
- Create: `src/shared/LoadingState.tsx`
- Create: `src/shared/useReducedMotion.ts`
- Create: `src/shared/useAutosaveRecovery.ts`
- Modify: interactive feature components and styles

**Interfaces:**
- Consumes: audio status, repository errors, composition snapshot。
- Produces: graceful recovery and keyboard/touch parity。

- [ ] **Step 1: 写错误恢复失败测试**

```tsx
render(<ErrorBoundary fallback={<button>恢复学习</button>}><ThrowingChild /></ErrorBoundary>);
expect(screen.getByRole('button', { name: '恢复学习' })).toBeInTheDocument();

render(<AudioRecoveryBanner status="failed" onRetry={retry} />);
await user.click(screen.getByRole('button', { name: '重新启用声音' }));
expect(retry).toHaveBeenCalled();
```

- [ ] **Step 2: 实现恢复组件**

ErrorBoundary 提供返回地图、恢复最近步骤、导出临时作品三种上下文动作。音频失败仅关闭声音相关动作。存储失败时将最新作品序列化到内存并提供下载。

- [ ] **Step 3: 添加键盘和减少动效测试**

Required assertions:

- Tab 顺序覆盖主要动作。
- Enter/Space 可触发琴键和节奏格。
- 箭头键可移动地图节点和 PianoRoll 事件。
- reduced motion 时不注册 ScrollTrigger pin。
- 颜色状态同时拥有文字或形状标记。

- [ ] **Step 4: 完成响应式布局**

Breakpoints: 480、768、1024、1280。移动端地图保持可拖动；课程主互动占满宽度；创作台使用单轨聚焦；底部动作区处理安全区。禁止出现横向页面滚动条，时间轴自身允许横向滚动。

- [ ] **Step 5: 运行测试和检查**

Run: `npm test && npm run typecheck && npm run lint:copy`  
Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add src/shared src/features src/design
git commit -m "feat: add accessible recovery paths"
```

---

### Task 12: End-to-End Verification and Project Documentation

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/onboarding.spec.ts`
- Create: `tests/e2e/lesson.spec.ts`
- Create: `tests/e2e/practice.spec.ts`
- Create: `tests/e2e/studio.spec.ts`
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `README.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: running application。
- Produces: repeatable verification suite and user-facing setup documentation。

- [ ] **Step 1: 配置 Playwright**

```ts
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }
  ]
});
```

- [ ] **Step 2: 写五条关键旅程**

Tests must cover:

```ts
test('新用户点击中央 C 并进入地图', async ({ page }) => { /* click C4, assert audio-ready visual, enter map */ });
test('完成课程并获得星级', async ({ page }) => { /* complete pitch-high-low */ });
test('错误提示后完成变式题', async ({ page }) => { /* wrong x3, variant, correct */ });
test('今日练习更新复习日期', async ({ page }) => { /* finish six items */ });
test('保存并恢复 8 小节作品', async ({ page }) => { /* edit four tracks, reload, assert notes */ });
```

音频断言使用界面播放状态和 engine spy，避免比较实际声波。

- [ ] **Step 3: 编写 README**

README 包含产品目标、当前 MVP、启动命令、测试命令、模块图、课程内容扩展方式、IndexedDB 数据说明、路线图链接和已知首版边界。

- [ ] **Step 4: 执行完整验证**

Run:

```powershell
npm run lint:copy
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
git diff --check
```

Expected: 所有命令 exit 0；桌面和移动端关键旅程 PASS。

- [ ] **Step 5: 人工浏览器验收**

在 1440×1000、1024×768、390×844 三种视口验证：

- 首屏标题不超过三行。
- 没有页面级横向滚动。
- 地图节点、课程动作和轨道控制可见且可操作。
- 文案无禁用句式和模板化三段式重复。
- 动效关闭后流程完整。
- 控制台无未处理异常。

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts tests README.md package.json package-lock.json
git commit -m "test: verify MusicStudy MVP journeys"
```

---

## Final Verification Gate

Run from repository root:

```powershell
git status --short
npm run lint:copy
npm run typecheck
npm test
npm run build
npm run test:e2e
git diff --check
```

Expected:

- 工作区只包含计划内变更或完全干净。
- 文案检查、类型检查、单元测试、组件测试、生产构建和端到端测试全部通过。
- 八个课程节点、今日练习和四轨创作台构成完整可玩闭环。
- IndexedDB 在刷新后恢复进度与作品。
- 键盘、触控与减少动效路径可用。
- 完成 `superpowers:verification-before-completion` 后再声明首版完成。
