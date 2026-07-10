import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('opens unlocked lessons and lets pointer drags pan the sea chart', () => {
    const onSelectLesson = vi.fn();
    render(
      <MapPage
        courseWorlds={worlds}
        onSelectLesson={onSelectLesson}
        stars={{ 'pitch-high-low': 1 }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /中央 C/ }));
    expect(onSelectLesson).toHaveBeenCalledWith('pitch-middle-c');

    const viewport = screen.getByTestId('archipelago-viewport');
    const chart = screen.getByTestId('archipelago-chart');
    fireEvent.pointerDown(viewport, { clientX: 300, clientY: 240, pointerId: 1 });
    fireEvent.pointerMove(viewport, { clientX: 360, clientY: 280, pointerId: 1 });
    fireEvent.pointerUp(viewport, { pointerId: 1 });
    expect(chart).toHaveStyle({ transform: 'translate3d(60px, 40px, 0)' });
  });
});
