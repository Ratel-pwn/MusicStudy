import { Check, Flag, Lightbulb, MusicNotes, Waveform } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';

import { attemptRepository, reviewRepository } from '../../data/repositories';
import type { ReviewRecord } from '../../data/db';
import type { LessonStep, SkillId } from '../../content/schema';
import { lessons } from '../../content/worlds';
import { useAudio } from '../../audio/useAudio';
import type { TimedAudioEvent } from '../../audio/AudioEngine';
import { FeedbackSheet } from '../lesson/components/FeedbackSheet';
import { stepRenderers } from '../lesson/LessonPage';
import { createLessonSession, getHint, requestHint, submitAnswer, type FeedbackResult } from '../lesson/lessonEngine';
import type { PracticeItem } from './scheduler';
import './practice.css';

const skillNames: Record<SkillId, string> = {
  pitch: '音高',
  rhythm: '节奏',
  pulse: '脉搏',
  keyboard: '键盘',
  scale: '音阶',
  chord: '和弦',
  notation: '记谱',
  creation: '创作',
};

function dateLabel(iso: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));
}

function taskCopy(item: PracticeItem) {
  if (item.source === 'composition') {
    return {
      title: '作品修订',
      prompt: item.issue.message,
      reason: '来自最近作品的待解决片段',
    };
  }
  const title = skillNames[item.skillId] ?? item.skillId;
  return item.source === 'due'
    ? { title, prompt: `重新完成一轮${title}辨认`, reason: `复习已于 ${dateLabel(item.review.dueAt)} 到期` }
    : { title, prompt: `集中完成一轮${title}练习`, reason: `当前掌握度 ${item.mastery}%` };
}

export type PracticePageProps = {
  items: readonly PracticeItem[];
  now?: () => Date;
};

function practiceStep(item: PracticeItem): LessonStep {
  const skillId = item.source === 'composition' ? 'creation' : item.skillId;
  const authoredSteps = lessons.flatMap((lesson) => lesson.steps);
  const authored = authoredSteps.find((step) => step.type === 'choice' && step.skillIds.includes(skillId))
    ?? (skillId === 'notation'
      ? authoredSteps.find((step) => step.type === 'rhythmBuild' && step.skillIds.includes('notation') && Array.isArray(step.config.units))
      : undefined);
  if (authored) return authored;
  return {
    id: `practice-${skillId}`,
    type: 'choice',
    prompt: `选择符合${skillNames[skillId]}规则的答案。`,
    skillIds: [skillId],
    config: { choices: ['符合规则', '需要调整'], answer: '符合规则' },
    feedback: { practiceIncorrect: '重新比较两个选项与题目规则。' },
  };
}

export function PracticePage({ items, now = () => new Date() }: PracticePageProps) {
  const { engine, status, unlock } = useAudio();
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastReview, setLastReview] = useState<ReviewRecord>();
  const [saving, setSaving] = useState(false);
  const [answer, setAnswer] = useState<unknown>();
  const [feedback, setFeedback] = useState<FeedbackResult>();
  const active = items[activeIndex];
  const step = useMemo(() => active ? practiceStep(active) : undefined, [active]);
  const [session, setSession] = useState(() => step ? createLessonSession({ id: 'practice', worldId: 'practice', title: 'practice', order: 0, xp: 0, prerequisiteIds: [], steps: [step] }) : undefined);
  const completed = Math.min(activeIndex, items.length);

  useEffect(() => {
    setAnswer(undefined);
    setFeedback(undefined);
    setSession(step ? createLessonSession({ id: `practice:${step.id}`, worldId: 'practice', title: 'practice', order: 0, xp: 0, prerequisiteIds: [], steps: [step] }) : undefined);
  }, [step]);

  useEffect(() => () => engine.stop(), [engine]);

  const playSequence = async (midis: number[], interval?: number) => {
    if (status !== 'ready') await unlock();
    engine.playSequence(midis, interval);
  };

  const playTimed = async (events: readonly TimedAudioEvent[]) => {
    if (status !== 'ready') await unlock();
    engine.playTimed(events);
  };

  const complete = async (correct: boolean, hints: number) => {
    if (!active || saving) return;
    setSaving(true);
    const skillId = active.source === 'composition' ? 'creation' : active.skillId;
    try {
      const next = await reviewRepository.complete({
        skillId,
        result: { correct, hints },
        completedAt: now(),
        current: active.source === 'due' ? active.review : undefined,
        initialMastery: active.source === 'weak' ? active.mastery : undefined,
      });
      setLastReview(next);
      setActiveIndex((index) => index + 1);
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!active || !step || !session || answer === undefined || saving) return;
    const result = submitAnswer(session, answer);
    setSession(result.session);
    setFeedback(result.feedback);
    await attemptRepository.record({
      lessonId: `practice:${step.id}`,
      skillIds: step.skillIds,
      correct: result.feedback.correct,
      hints: session.hintsUsed,
      ...(result.feedback.errorCode ? { errorCode: result.feedback.errorCode } : {}),
    });
  };

  return (
    <main aria-label="今日练习" className="practice-page">
      <header className="practice-intro">
        <div>
          <p>{completed} / {items.length} 已完成</p>
          <h1>沿着今天的声音航道，逐项校准</h1>
        </div>
        <Waveform aria-hidden="true" weight="duotone" />
      </header>

      <div className="practice-layout">
        <nav aria-label="今日任务泳道" className="practice-lane">
          <div aria-hidden="true" className="lane-current" style={{ '--lane-progress': items.length === 0 ? 100 : (completed / items.length) * 100 } as React.CSSProperties} />
          {items.map((item, index) => {
            const copy = taskCopy(item);
            const status = index < activeIndex ? '完成' : index === activeIndex ? '正在练习' : '待练';
            return (
              <div aria-current={index === activeIndex ? 'step' : undefined} className={`lane-stop is-${status}`} key={item.id}>
                <span aria-hidden="true">{index < activeIndex ? <Check weight="bold" /> : index + 1}</span>
                <p>{copy.title}<small>{status}</small></p>
              </div>
            );
          })}
        </nav>

        <section aria-live="polite" className="practice-focus">
          {lastReview && (
            <p className="next-review"><Flag aria-hidden="true" weight="fill" />下次复习：{dateLabel(lastReview.dueAt)}</p>
          )}
          {active ? (() => {
            const copy = taskCopy(active);
            const Renderer = step ? stepRenderers[step.type] : undefined;
            return (
              <div className="focus-task">
                <MusicNotes aria-hidden="true" weight="duotone" />
                <p>{copy.reason}</p>
                <h2>{copy.title} · {copy.prompt}</h2>
                {step && Renderer && session && (
                  <>
                    <p>{step.prompt}</p>
                    <Renderer answer={answer} playMidi={() => undefined} playSequence={(midis, interval) => void playSequence(midis, interval)} playTimed={(events) => void playTimed(events)} setAnswer={setAnswer} step={step} />
                    {session.hintLevel > 0 && <p>提示 {session.hintLevel}：{getHint(session)}</p>}
                  </>
                )}
                <div className="practice-actions">
                  <button disabled={saving || answer === undefined} onClick={() => void submit()} type="button">提交答案</button>
                  <button disabled={saving || !session} onClick={() => session && setSession(requestHint(session))} type="button"><Lightbulb aria-hidden="true" />提示</button>
                </div>
              </div>
            );
          })() : (
            <div className="practice-finished">
              <Check aria-hidden="true" weight="bold" />
              <h2>今天的练习航道已走完</h2>
              <p>掌握度与复习日期已经保存。</p>
            </div>
          )}
        </section>
      </div>
      <FeedbackSheet
        correct={feedback?.correct ?? false}
        level={feedback?.level ?? 0}
        message={feedback?.message}
        onContinue={() => {
          setFeedback(undefined);
          void complete(true, session?.hintsUsed ?? 0);
        }}
        onDismiss={() => { setFeedback(undefined); setAnswer(undefined); }}
        open={feedback !== undefined}
      />
    </main>
  );
}
