import { useGSAP } from '@gsap/react';
import { Compass, LockKey, MapPin, Star, Waves } from '@phosphor-icons/react';
import gsap from 'gsap';
import {
  useMemo,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import type { CourseNode, CourseWorld } from '../../content/schema';
import { unlockedLessonIds, type LessonStars } from './progression';
import './map.css';

type MapPageProps = {
  courseWorlds: readonly CourseWorld[];
  stars: LessonStars;
  reviewLessonIds?: readonly string[];
  onSelectLesson?(lessonId: string): void;
};

type IslandLayout = { x: number; y: number; width: number; height: number; tilt: number };
type MapStyle = CSSProperties & Record<`--${string}`, string | number>;

const islandLayouts: IslandLayout[] = [
  { x: 150, y: 360, width: 300, height: 230, tilt: -4 },
  { x: 495, y: 145, width: 270, height: 220, tilt: 3 },
  { x: 830, y: 345, width: 310, height: 240, tilt: -2 },
  { x: 1165, y: 135, width: 270, height: 225, tilt: 5 },
  { x: 1210, y: 675, width: 255, height: 205, tilt: -5 },
  { x: 710, y: 730, width: 290, height: 220, tilt: 2 },
  { x: 220, y: 760, width: 300, height: 220, tilt: -2 },
];

const nodePositions = [
  { x: 24, y: 68 },
  { x: 52, y: 40 },
  { x: 76, y: 67 },
  { x: 58, y: 78 },
];

const routeSegments = [
  { x: 398, y: 418, width: 285, angle: -31 },
  { x: 708, y: 270, width: 286, angle: 31 },
  { x: 1085, y: 393, width: 240, angle: -36 },
  { x: 1322, y: 335, width: 373, angle: 88 },
  { x: 1228, y: 778, width: 270, angle: 173 },
  { x: 724, y: 833, width: 250, angle: 181 },
];

const DRAG_THRESHOLD = 4;

const orderedLessonNodes = (courseWorlds: readonly CourseWorld[]) => [...courseWorlds]
  .sort((a, b) => a.order - b.order)
  .flatMap((world) => world.nodes)
  .filter((node): node is CourseNode & { lessonId: string } => Boolean(node.lessonId));

export function MapPage({
  courseWorlds,
  stars,
  reviewLessonIds = [],
  onSelectLesson,
}: MapPageProps) {
  const rootRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const dragRef = useRef({ pointerId: -1, pending: false, dragging: false, x: 0, y: 0, originX: 0, originY: 0 });
  const focusTweenRef = useRef<gsap.core.Tween | undefined>(undefined);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const sortedWorlds = useMemo(
    () => [...courseWorlds].sort((a, b) => a.order - b.order),
    [courseWorlds],
  );
  const lessonNodes = useMemo(() => orderedLessonNodes(sortedWorlds), [sortedWorlds]);
  const unlocked = useMemo(() => new Set(unlockedLessonIds(sortedWorlds, stars)), [sortedWorlds, stars]);
  const reviewSet = useMemo(() => new Set(reviewLessonIds), [reviewLessonIds]);
  const currentLessonId = [...lessonNodes]
    .reverse()
    .find((node) => (stars[node.lessonId] ?? 0) > 0)?.lessonId ?? lessonNodes[0]?.lessonId;
  const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  useEffect(() => {
    navRef.current?.focus();
    return () => {
      focusTweenRef.current?.kill();
    };
  }, []);

  useGSAP(() => {
    const scope = rootRef.current;
    if (!scope) return;
    const islands = gsap.utils.toArray<HTMLElement>('.map-island', scope);
    const paths = gsap.utils.toArray<HTMLElement>('.sea-route.is-unlocked', scope);
    if (reduceMotion()) {
      if (islands.length > 0) gsap.set(islands, { opacity: 1, y: 0 });
      if (paths.length > 0) gsap.set(paths, { scaleX: 1 });
      return;
    }
    if (islands.length > 0) {
      gsap.fromTo(
        islands,
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, ease: 'power2.out' },
      );
    }
    if (paths.length > 0) {
      gsap.fromTo(
        paths,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.65, stagger: 0.06, ease: 'power2.inOut' },
      );
    }
  }, { scope: rootRef, dependencies: [unlocked.size] });

  const focusNode = (button: HTMLButtonElement) => {
    if (reduceMotion()) {
      gsap.set(button, { scale: 1 });
      return;
    }
    focusTweenRef.current?.kill();
    focusTweenRef.current = gsap.fromTo(
      button,
      { scale: 1 },
      { scale: 1.1, duration: 0.18, repeat: 1, yoyo: true, ease: 'power2.out' },
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const direction = ['ArrowDown', 'ArrowRight'].includes(event.key)
      ? 1
      : ['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 0;
    if (direction === 0 && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const activeIndex = lessonNodes.findIndex((node) => nodeRefs.current.get(node.lessonId) === document.activeElement);
    const currentIndex = Math.max(0, lessonNodes.findIndex((node) => node.lessonId === currentLessonId));
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? lessonNodes.length - 1
        : Math.min(lessonNodes.length - 1, Math.max(0, (activeIndex < 0 ? currentIndex : activeIndex) + direction));
    const nextButton = nodeRefs.current.get(lessonNodes[nextIndex]?.lessonId);
    nextButton?.focus();
    if (nextButton) queueMicrotask(() => nextButton.isConnected && nextButton.focus());
  };

  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const target = event.target as Element;
    if (target.closest('button, a, [role="button"], [role="link"]')) return;
    dragRef.current = {
      pointerId: event.pointerId,
      pending: true,
      dragging: false,
      x: event.clientX,
      y: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag.pending || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    if (!drag.dragging) {
      if (Math.hypot(deltaX, deltaY) <= DRAG_THRESHOLD) return;
      drag.dragging = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setIsDragging(true);
    }
    setOffset({
      x: drag.originX + deltaX,
      y: drag.originY + deltaY,
    });
  };

  const stopDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag.pending || drag.pointerId !== event.pointerId) return;
    if (drag.dragging) {
      try {
        const hasCapture = event.currentTarget.hasPointerCapture?.(event.pointerId) ?? true;
        if (hasCapture) event.currentTarget.releasePointerCapture?.(event.pointerId);
      } catch {
        // The browser may release capture before pointercancel reaches React.
      }
    }
    dragRef.current = { pointerId: -1, pending: false, dragging: false, x: 0, y: 0, originX: offset.x, originY: offset.y };
    setIsDragging(false);
  };

  return (
    <main className="archipelago-page" ref={rootRef}>
      <div className="map-heading">
        <p>沿着声音航标前进</p>
        <h1>音乐群岛</h1>
        <span>拖动海图探索，使用方向键逐课航行</span>
      </div>

      <aside className="map-legend" aria-label="地图图例">
        <span><MapPin aria-hidden="true" weight="fill" />当前位置</span>
        <span><Star aria-hidden="true" weight="fill" />已获星级</span>
        <span><Waves aria-hidden="true" />复习雾区</span>
      </aside>

      <nav
        aria-label="音乐群岛学习地图"
        className={`archipelago-viewport ${isDragging ? 'is-dragging' : ''}`}
        data-testid="archipelago-viewport"
        onKeyDown={handleKeyDown}
        onPointerCancel={stopDrag}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        ref={navRef}
        tabIndex={0}
      >
        <div
          className="archipelago-chart"
          data-testid="archipelago-chart"
          style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(var(--map-scale))` }}
        >
          <div className="chart-compass" aria-hidden="true"><Compass weight="duotone" /><i>N</i></div>
          {routeSegments.map((route, index) => {
            const destination = sortedWorlds[index + 1];
            const destinationLesson = destination?.nodes.find((node) => node.lessonId)?.lessonId;
            return (
              <div
                aria-hidden="true"
                className={`sea-route ${destinationLesson && unlocked.has(destinationLesson) ? 'is-unlocked' : ''}`}
                key={`${route.x}-${route.y}`}
                style={{ '--route-x': `${route.x}px`, '--route-y': `${route.y}px`, '--route-width': `${route.width}px`, '--route-angle': `${route.angle}deg` } as MapStyle}
              />
            );
          })}

          {sortedWorlds.map((world, worldIndex) => {
            const layout = islandLayouts[worldIndex % islandLayouts.length];
            return (
              <section
                className={`map-island route-${world.route}`}
                key={world.id}
                style={{
                  '--island-x': `${layout.x}px`,
                  '--island-y': `${layout.y}px`,
                  '--island-width': `${layout.width}px`,
                  '--island-height': `${layout.height}px`,
                  '--island-tilt': `${layout.tilt}deg`,
                } as MapStyle}
              >
                <div className="island-landmass" aria-hidden="true"><span /><span /><span /></div>
                <header className="island-name">
                  <h2>{world.title}</h2>
                  <p>{world.description}</p>
                </header>

                {world.nodes.map((node, nodeIndex) => {
                  const position = nodePositions[nodeIndex % nodePositions.length];
                  const lessonId = node.lessonId;
                  const planned = node.availability === 'planned' || !lessonId;
                  const isUnlocked = Boolean(lessonId && unlocked.has(lessonId));
                  const isCurrent = lessonId === currentLessonId;
                  const earnedStars = lessonId ? Math.max(0, Math.min(3, stars[lessonId] ?? 0)) : 0;
                  const descriptionId = `${node.id}-capability`;
                  const status = planned ? '规划中' : isUnlocked ? '已解锁' : '未解锁';
                  const accessibleName = `${node.title}，${status}${earnedStars ? `，${earnedStars} 星` : ''}`;
                  return (
                    <div
                      className={`course-stop ${planned ? 'is-planned' : isUnlocked ? 'is-unlocked' : 'is-locked'} ${isCurrent ? 'is-current' : ''}`}
                      key={node.id}
                      style={{ '--node-x': `${position.x}%`, '--node-y': `${position.y}%` } as MapStyle}
                    >
                      {lessonId && reviewSet.has(lessonId) && <span className="review-fog">复习雾区</span>}
                      <button
                        aria-current={isCurrent ? 'step' : undefined}
                        aria-describedby={descriptionId}
                        aria-disabled={!planned && !isUnlocked}
                        aria-label={accessibleName}
                        disabled={planned}
                        onClick={() => lessonId && isUnlocked && onSelectLesson?.(lessonId)}
                        onFocus={(event) => focusNode(event.currentTarget)}
                        ref={(button) => {
                          if (!lessonId) return;
                          if (button) nodeRefs.current.set(lessonId, button);
                          else nodeRefs.current.delete(lessonId);
                        }}
                        type="button"
                      >
                        {planned || !isUnlocked ? <LockKey aria-hidden="true" weight="fill" /> : <span className="node-beacon" />}
                        <strong>{node.title}</strong>
                        {earnedStars > 0 && (
                          <span className="node-stars" aria-hidden="true">
                            {Array.from({ length: earnedStars }, (_, index) => <Star key={index} weight="fill" />)}
                          </span>
                        )}
                      </button>
                      <p id={descriptionId}>{node.capabilityGoal}</p>
                      {isCurrent && <span className="current-marker"><MapPin aria-hidden="true" weight="fill" />当前位置</span>}
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
