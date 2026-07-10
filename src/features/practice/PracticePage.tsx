import { Check, Flag, Lightbulb, MusicNotes, Waveform } from '@phosphor-icons/react';
import { useState } from 'react';

import { reviewRepository } from '../../data/repositories';
import type { ReviewRecord } from '../../data/db';
import type { SkillId } from '../../content/schema';
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

export function PracticePage({ items, now = () => new Date() }: PracticePageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastReview, setLastReview] = useState<ReviewRecord>();
  const [saving, setSaving] = useState(false);
  const active = items[activeIndex];
  const completed = Math.min(activeIndex, items.length);

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
            return (
              <div className="focus-task">
                <MusicNotes aria-hidden="true" weight="duotone" />
                <p>{copy.reason}</p>
                <h2>{copy.title} · {copy.prompt}</h2>
                <div className="practice-actions">
                  <button disabled={saving} onClick={() => void complete(true, 0)} type="button">独立完成</button>
                  <button disabled={saving} onClick={() => void complete(true, 1)} type="button"><Lightbulb aria-hidden="true" />借助提示完成</button>
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
    </main>
  );
}
