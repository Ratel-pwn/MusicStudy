import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';

import { worlds, getLesson, lessons } from '../content/worlds';
import { attemptRepository, compositionRepository, reviewRepository } from '../data/repositories';
import type { AttemptRecord, ReviewRecord } from '../data/db';
import type { Composition } from '../domain/music/types';
import { evaluateComposition } from '../domain/music/composition';
import { HomePage } from '../features/home/HomePage';
import { LessonPage } from '../features/lesson/LessonPage';
import { MapPage } from '../features/map/MapPage';
import { unlockedLessonIds } from '../features/map/progression';
import { PracticePage } from '../features/practice/PracticePage';
import { buildDailyPracticeFromAttempts, type PracticeItem } from '../features/practice/scheduler';
import { ProfilePage } from '../features/profile/ProfilePage';
import { StudioPage } from '../features/studio/StudioPage';
import { useProgressStore } from '../stores/useProgressStore';
import { LoadingState } from '../shared/LoadingState';
import { AppShell } from './AppShell';

type HomeStorage = Pick<Storage, 'length' | 'key' | 'getItem'>;

type HomeRouteStateInput = {
  progress: ReturnType<typeof useProgressStore.getState>['progress'];
  recentComposition?: Composition;
  storage?: HomeStorage;
};

export type HomeRouteState = {
  returning: boolean;
  currentLessonId?: string;
  currentLessonTitle?: string;
  foundationComplete: boolean;
};

function unfinishedLessonId(storage?: HomeStorage): string | undefined {
  try {
    const source = storage ?? globalThis.localStorage;
    if (!source) return undefined;
    const candidateKeys = new Set<string>();
    for (let index = 0; index < source.length; index += 1) {
      const key = source.key(index);
      if (key?.startsWith('musicstudy:lesson:')) candidateKeys.add(key);
    }
    lessons.forEach((lesson) => candidateKeys.add(`musicstudy:lesson:${lesson.id}`));
    for (const key of candidateKeys) {
      const raw = source.getItem(key);
      if (!raw) continue;
      try {
        const session = JSON.parse(raw) as { lessonId?: string; stepIndex?: number };
        const lessonId = session.lessonId ?? key.slice('musicstudy:lesson:'.length);
        const lesson = getLesson(lessonId);
        if (lesson && typeof session.stepIndex === 'number' && session.stepIndex < lesson.steps.length) return lessonId;
      } catch {
        // Ignore damaged drafts; LessonPage applies the same safe fallback.
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function deriveHomeRouteState({ progress, recentComposition, storage }: HomeRouteStateInput): HomeRouteState {
  const draftLessonId = unfinishedLessonId(storage);
  const foundationComplete = lessons.every((lesson) => (progress.stars[lesson.id] ?? 0) > 0);
  const unlocked = unlockedLessonIds(worlds, progress.stars);
  const currentLesson = draftLessonId
    ? getLesson(draftLessonId)
    : foundationComplete
      ? undefined
      : lessons.find((lesson) => unlocked.includes(lesson.id) && !progress.stars[lesson.id]) ?? lessons[0];
  const hasProgress = progress.xp > 0 || Object.values(progress.stars).some((stars) => stars > 0);
  return {
    returning: hasProgress || Boolean(recentComposition) || Boolean(draftLessonId),
    currentLessonId: currentLesson?.id,
    currentLessonTitle: currentLesson?.title,
    foundationComplete,
  };
}

function useAsyncValue<T>(load: () => Promise<T>, initial: T) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    let active = true;
    void load().then(
      (next) => {
        if (!active) return;
        setError(undefined);
        setValue(next);
      },
      (reason) => { if (active) setError(reason); },
    );
    return () => { active = false; };
  }, [load]);
  if (error) throw error;
  return value;
}

function HomeRoute() {
  const progress = useProgressStore((state) => state.progress);
  const loadRecent = useMemo(() => () => compositionRepository.recent(), []);
  const recentComposition = useAsyncValue<Composition | undefined | null>(loadRecent, null);
  if (recentComposition === null) {
    return <LoadingState label="正在读取学习航迹" />;
  }
  const state = deriveHomeRouteState({ progress, recentComposition });
  return (
    <HomePage
      currentLessonId={state.currentLessonId}
      currentLessonTitle={state.currentLessonTitle}
      foundationComplete={state.foundationComplete}
      recentComposition={recentComposition}
      returning={state.returning}
    />
  );
}

function MapRoute() {
  const navigate = useNavigate();
  const stars = useProgressStore((state) => state.progress.stars);
  return <MapPage courseWorlds={worlds} onSelectLesson={(lessonId) => navigate(`/lesson/${lessonId}`)} stars={stars} />;
}

function LessonRoute() {
  const navigate = useNavigate();
  const { lessonId = '' } = useParams();
  const lesson = getLesson(lessonId);
  return lesson ? <LessonPage lesson={lesson} onExit={() => navigate('/map')} /> : <Navigate replace to="/map" />;
}

function PracticeRoute() {
  const loadItems = useMemo(() => async (): Promise<PracticeItem[]> => {
    const [dueReviews, attempts, recent] = await Promise.all([
      reviewRepository.due(),
      attemptRepository.recent(),
      compositionRepository.recent(),
    ]);
    return buildDailyPracticeFromAttempts({
      attempts,
      dueReviews,
      compositionIssues: recent ? evaluateComposition(recent) : [],
    });
  }, []);
  return <PracticePage items={useAsyncValue(loadItems, [])} />;
}

function StudioRoute() {
  const { compositionId = 'studio-draft' } = useParams();
  return <StudioPage compositionId={compositionId} />;
}

function ProgressRoute() {
  const loadData = useMemo(() => async (): Promise<{ attempts: AttemptRecord[]; reviews: ReviewRecord[] }> => {
    const [attempts, reviews] = await Promise.all([attemptRepository.recent(), reviewRepository.all()]);
    return { attempts, reviews };
  }, []);
  const data = useAsyncValue(loadData, { attempts: [], reviews: [] });
  return <ProfilePage attempts={data.attempts} reviews={data.reviews} />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomeRoute />} />
        <Route path="map" element={<MapRoute />} />
        <Route path="lesson/:lessonId" element={<LessonRoute />} />
        <Route path="practice" element={<PracticeRoute />} />
        <Route path="studio/:compositionId" element={<StudioRoute />} />
        <Route path="progress" element={<ProgressRoute />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>
    </Routes>
  );
}
