import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { FeedbackSheet } from './FeedbackSheet';

it('continues after positive feedback with a pointer', async () => {
  const user = userEvent.setup();
  const onContinue = vi.fn();
  render(<FeedbackSheet open correct level={0} onContinue={onContinue} />);

  await user.click(screen.getByRole('button', { name: '继续' }));
  expect(onContinue).toHaveBeenCalledOnce();
});

it('dismisses corrective feedback with Escape', async () => {
  const user = userEvent.setup();
  const onDismiss = vi.fn();
  render(
    <FeedbackSheet open correct={false} level={2} message="再听一次音高" onDismiss={onDismiss} />,
  );

  screen.getByRole('dialog').focus();
  await user.keyboard('{Escape}');
  expect(onDismiss).toHaveBeenCalledOnce();
});
