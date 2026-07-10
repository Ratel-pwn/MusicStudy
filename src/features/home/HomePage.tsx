import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, Play, Waveform } from '@phosphor-icons/react';
import gsap from 'gsap';
import { Link } from 'react-router-dom';

import { useAudio } from '../../audio/useAudio';
import type { Composition } from '../../domain/music/types';
import { getLesson } from '../../content/worlds';
import { useReducedMotion } from '../../shared/useReducedMotion';

const keys = [
  { label: 'C', midi: 60 },
  { label: 'D', midi: 62 },
  { label: 'E', midi: 64 },
  { label: 'F', midi: 65 },
  { label: 'G', midi: 67 },
  { label: 'A', midi: 69 },
  { label: 'B', midi: 71 },
] as const;

type HomePageProps = {
  returning?: boolean;
  currentLessonId?: string;
  currentLessonTitle?: string;
  foundationComplete?: boolean;
  recentComposition?: Composition;
};

export function HomePage({
  returning = false,
  currentLessonId = 'pitch-high-low',
  currentLessonTitle = '听见高与低',
  foundationComplete = false,
  recentComposition,
}: HomePageProps) {
  const rootRef = useRef<HTMLElement>(null);
  const { engine, status, unlock } = useAudio();
  const [heardMiddleC, setHeardMiddleC] = useState(false);
  const melodyTimers = useRef<number[]>([]);
  const mounted = useRef(true);
  const reducedMotion = useReducedMotion();
  const lessonTitle = currentLessonTitle === '听见高与低'
    ? (getLesson(currentLessonId)?.title ?? currentLessonTitle)
    : currentLessonTitle;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const context = gsap.context(() => {
      if (reducedMotion) {
        gsap.set('.home-reveal', { opacity: 1, y: 0 });
        return;
      }
      gsap.fromTo('.home-reveal', { opacity: 0, y: 34 }, {
        opacity: 1,
        y: 0,
        duration: 0.72,
        stagger: 0.09,
        ease: 'power3.out',
      });
    }, root);
    return () => context.revert();
  }, [heardMiddleC, reducedMotion, returning]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      melodyTimers.current.forEach((timer) => window.clearTimeout(timer));
      melodyTimers.current = [];
    };
  }, []);

  const playKey = async (midi: number) => {
    if (status !== 'ready') await unlock();
    if (!mounted.current) return;
    engine.playMidi(midi, 1.2, 0.88);
    if (midi !== 60) return;
    melodyTimers.current.forEach((timer) => window.clearTimeout(timer));
    melodyTimers.current = [64, 67, 72].map((responseMidi, index) => window.setTimeout(() => {
      if (mounted.current) engine.playMidi(responseMidi, 0.8, 0.8);
    }, (index + 1) * 240));
    setHeardMiddleC(true);
  };

  if (returning) {
    return (
      <main aria-label="拾音岛学习空间" className="home-page home-page--returning" ref={rootRef}>
        <section className="returning-horizon home-reveal">
          <div>
            <p className="home-eyebrow">海图保留着上次的航迹</p>
            <h1>{foundationComplete ? '基础航线已完成' : '从熟悉的声音接着走'}</h1>
          </div>
          <div className="continuation-staves">
            {foundationComplete ? (
              <>
                <Link className="continuation-line" to="/practice"><strong>进入今日练习</strong><ArrowRight aria-hidden="true" /></Link>
                <Link className="continuation-line" to="/studio/studio-draft"><strong>打开八小节创作台</strong><ArrowRight aria-hidden="true" /></Link>
              </>
            ) : (
              <Link className="continuation-line" to={`/lesson/${currentLessonId}`}>
                <span>当前课程</span><strong>继续{lessonTitle}</strong><ArrowRight aria-hidden="true" />
              </Link>
            )}
            {recentComposition && (
              <Link className="continuation-line continuation-line--composition" to={`/studio/${recentComposition.id}`}>
                <span>{recentComposition.bpm} BPM · {recentComposition.bars} 小节</span>
                <strong>继续{recentComposition.title}</strong><ArrowRight aria-hidden="true" />
              </Link>
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main aria-label="拾音岛学习空间" className="home-page" ref={rootRef}>
      <section className="sound-gate">
        <div className="sound-gate-copy home-reveal">
          <p className="home-eyebrow">先听见，再认识</p>
          <h1>从一个音，走进整片音乐群岛</h1>
          <p>中央 C 是第一枚声音坐标。按下它，听听海面会怎样回答。</p>
        </div>

        <div className="piano-island home-reveal" aria-label="可播放的白键">
          <div className="piano-ripples" aria-hidden="true"><i /><i /><i /></div>
          <div className="home-keyboard">
            {keys.map((key) => (
              <button
                aria-label={key.midi === 60 ? '播放中央 C' : `播放 ${key.label}4`}
                className={key.midi === 60 ? 'is-middle-c' : undefined}
                key={key.midi}
                onClick={() => void playKey(key.midi)}
                type="button"
              >
                <span>{key.label}</span>
                {key.midi === 60 && <small>中央 C</small>}
              </button>
            ))}
          </div>
        </div>
      </section>

      {heardMiddleC && (
        <>
          <section aria-label="中央 C 的声音回应" className="melody-response home-reveal" role="status">
            <Waveform aria-hidden="true" weight="duotone" />
            <div><p>声音已经留下航标</p><strong>C · E · G · 高音 C</strong></div>
            <span className="melody-line" aria-hidden="true"><i /><i /><i /><i /></span>
          </section>

          <section className="home-paths home-reveal">
            <article className="home-paths-main">
              <p>先听高低，再在琴键上找到名字</p>
              <h2>每一次触碰，都能变成作品里的一个决定</h2>
            </article>
            <article><strong>听觉岛</strong><span>建立音高方向与中央 C 坐标</span></article>
            <article><strong>节奏岛</strong><span>让四分脉搏稳稳落在身体里</span></article>
          </section>

          <section className="home-action home-reveal">
            <div><Play aria-hidden="true" weight="fill" /><span>第一条航线已经亮起</span></div>
            <Link to="/map">沿着声音出发<ArrowRight aria-hidden="true" /></Link>
          </section>
        </>
      )}
    </main>
  );
}
