import { ArrowRight, CalendarBlank, WarningCircle } from '@phosphor-icons/react';
import { useState, type CSSProperties } from 'react';

import type { SkillId } from '../../content/schema';
import './skill-orbit.css';

export type SkillOrbitItem = {
  id: SkillId;
  label: string;
  mastery: number;
  dueAt: string;
  recentErrors: readonly string[];
  recommendedPractice: string;
};

function dateLabel(iso: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(new Date(iso));
}

function stateFor(mastery: number) {
  if (mastery >= 70) return { label: '稳固', line: 'solid' } as const;
  if (mastery >= 50) return { label: '成长中', line: 'solid' } as const;
  return { label: '需加固', line: 'dashed' } as const;
}

export function SkillOrbit({ skills }: { skills: readonly SkillOrbitItem[] }) {
  const [selectedId, setSelectedId] = useState(skills[0]?.id);
  const selected = skills.find((skill) => skill.id === selectedId) ?? skills[0];

  return (
    <section aria-label="六项能力轨道" className="skill-orbit-shell">
      <div className="skill-orbit" role="group" aria-label="选择一项能力">
        <div aria-hidden="true" className="orbit-core"><strong>{skills.length}</strong><span>项能力<br />共同运转</span></div>
        {skills.map((skill, index) => {
          const state = stateFor(skill.mastery);
          return (
            <button
              aria-pressed={skill.id === selected?.id}
              aria-label={`${skill.label}，掌握度 ${skill.mastery}%，${state.label}`}
              className="orbit-node"
              data-line-style={state.line}
              data-orbit-position={index}
              key={skill.id}
              onClick={() => setSelectedId(skill.id)}
              style={{ '--orbit-index': index } as CSSProperties}
              type="button"
            >
              <span>{skill.label}</span>
              <strong>{skill.mastery}%</strong>
              <small>{state.label}</small>
            </button>
          );
        })}
      </div>

      {selected && (
        <article aria-live="polite" className="orbit-detail">
          <h2>{selected.label}<span>{selected.mastery}%</span></h2>
          <dl>
            <div><dt><CalendarBlank aria-hidden="true" />到期日期</dt><dd>{dateLabel(selected.dueAt)}</dd></div>
            <div><dt><WarningCircle aria-hidden="true" />近期错误</dt><dd>{selected.recentErrors.length ? selected.recentErrors.join('、') : '近期没有重复错误'}</dd></div>
          </dl>
          <p>推荐练习 <ArrowRight aria-hidden="true" /> <strong>{selected.recommendedPractice}</strong></p>
        </article>
      )}
    </section>
  );
}
