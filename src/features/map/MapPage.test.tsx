import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import gsap from 'gsap';
import { vi } from 'vitest';

import { worlds } from '../../content/worlds';
import { MapPage } from './MapPage';

describe('MapPage', () => {
  it('exposes the archipelago and moves keyboard focus in lesson order', async () => {
    const user = userEvent.setup();
    render(
      <MapPage
        courseWorlds={worlds}
        reviewLessonIds={['pitch-high-low']}
        stars={{ 'pitch-high-low': 1 }}
      />,
    );

    expect(screen.getByRole('navigation', { name: '音乐群岛学习地图' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /中央 C/ })).toHaveAttribute('aria-describedby');
    expect(screen.getByRole('button', { name: /声音的高与低/ })).toHaveAttribute('aria-current', 'step');
    expect(screen.getAllByText('复习雾区')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /音程轮廓/ })).toBeDisabled();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: /中央 C/ })).toHaveFocus();
  });

  it('preserves a full pointer click sequence on unlocked lessons', () => {
    const onSelectLesson = vi.fn();
    render(
      <MapPage
        courseWorlds={worlds}
        onSelectLesson={onSelectLesson}
        stars={{ 'pitch-high-low': 1 }}
      />,
    );

    const viewport = screen.getByTestId('archipelago-viewport');
    const setPointerCapture = vi.fn();
    Object.defineProperty(viewport, 'setPointerCapture', { configurable: true, value: setPointerCapture });
    const lesson = screen.getByRole('button', { name: /中央 C/ });

    fireEvent.pointerDown(lesson, { clientX: 300, clientY: 240, pointerId: 1 });
    fireEvent.pointerUp(lesson, { clientX: 300, clientY: 240, pointerId: 1 });
    fireEvent.click(lesson);

    expect(onSelectLesson).toHaveBeenCalledWith('pitch-middle-c');
    expect(setPointerCapture).not.toHaveBeenCalled();
  });

  it('only captures and pans after an empty-sea drag crosses the threshold', () => {
    render(<MapPage courseWorlds={worlds} stars={{ 'pitch-high-low': 1 }} />);

    const viewport = screen.getByTestId('archipelago-viewport');
    const chart = screen.getByTestId('archipelago-chart');
    const setPointerCapture = vi.fn();
    const releasePointerCapture = vi.fn();
    Object.defineProperties(viewport, {
      setPointerCapture: { configurable: true, value: setPointerCapture },
      releasePointerCapture: { configurable: true, value: releasePointerCapture },
    });

    fireEvent.pointerDown(viewport, { clientX: 300, clientY: 240, pointerId: 1 });
    fireEvent.pointerMove(viewport, { clientX: 303, clientY: 240, pointerId: 1 });
    expect(viewport).not.toHaveClass('is-dragging');
    expect(setPointerCapture).not.toHaveBeenCalled();
    fireEvent.pointerUp(viewport, { pointerId: 1 });
    expect(releasePointerCapture).not.toHaveBeenCalled();

    fireEvent.pointerDown(viewport, { clientX: 300, clientY: 240, pointerId: 2 });
    fireEvent.pointerMove(viewport, { clientX: 360, clientY: 280, pointerId: 2 });
    expect(viewport).toHaveClass('is-dragging');
    expect(setPointerCapture).toHaveBeenCalledWith(2);
    expect(chart).toHaveStyle({ transform: 'translate3d(60px, 40px, 0) scale(var(--map-scale))' });
    fireEvent.pointerUp(viewport, { pointerId: 2 });
    expect(viewport).not.toHaveClass('is-dragging');
    expect(releasePointerCapture).toHaveBeenCalledWith(2);
  });

  it('scopes GSAP selectors to each rendered map root', () => {
    const toArray = vi.spyOn(gsap.utils, 'toArray');
    const { container } = render(
      <>
        <MapPage courseWorlds={worlds} stars={{}} />
        <MapPage courseWorlds={worlds} stars={{}} />
      </>,
    );
    const roots = [...container.querySelectorAll<HTMLElement>('.archipelago-page')];
    const islandCalls = toArray.mock.calls.filter(([selector]) => selector === '.map-island');

    expect(roots).toHaveLength(2);
    expect(islandCalls.map(([, scope]) => scope)).toEqual(expect.arrayContaining(roots));
    toArray.mockRestore();
  });
});
