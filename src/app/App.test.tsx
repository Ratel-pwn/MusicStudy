import { render, screen } from '@testing-library/react';
import { App } from './App';

it('renders the MusicStudy application landmark', () => {
  render(<App />);
  expect(screen.getByRole('main', { name: '拾音岛学习空间' })).toBeInTheDocument();
});
