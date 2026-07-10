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
import { AppShell } from './AppShell';

function useAsyncValue<T>(load: () => Promise<T>, initial: T) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    let active = true;
    void load().then((next) => { if (active) setValue(next); });
    return () => { active = false; };
  }, [load]);
  return value;
}

function HomeRoute() {
  const progress = useProgressStore((state) => state.progress);
  const returning = progress.xp > 0 || Object.keys(progress.stars).length > 0;
  const unlocked = unlockedLessonIds(worlds, progress.stars);
  const currentLesson = lessons.find((lesson) => unlocked.includes(lesson.id) && !progress.stars[lesson.id]) ?? lessons[0];
  const loadRecent = useMemo(() => () => compositionRepository.recent(), []);
  const recentComposition = useAsyncValue<Composition | undefined>(loadRecent, undefined);
  return (
    <HomePage
      currentLessonId={currentLesson.id}
      currentLessonTitle={currentLesson.title}
      recentComposition={recentComposition}
      returning={returning}
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
