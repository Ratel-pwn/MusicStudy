import { cleanup, render, screen, within } from '@testing-library/react';
import { lessons } from '../../../content/worlds';
import type { LessonStep } from '../../../content/schema';
import { ExplainVisual } from './ExplainVisual';

const expectedVisualNames: Record<string, string> = {
  'high-low-see': '音高由低向高移动的竖直轨迹',
  'middle-c-see': '两枚黑键左侧的中央 C 位置',
  'white-notes-see': 'C 到 B 的白键音名循环',
  'quarter-pulse-see': '四枚四分音符填满四四拍小节',
  'eighth-see': '一和二和的均匀八分细分',
  'c-scale-see': 'C 大调与两组半音位置',
  'c-chord-see': 'C 大调第一第三第五级组成和弦',
  'eight-bars-see': '前四小节建立后四小节回应的八小节结构',
};

const explainSteps = lessons.flatMap((lesson) => lesson.steps).filter((step): step is LessonStep => step.type === 'explain');

it('renders a named theory visual for every authored observation step', () => {
  expect(explainSteps).toHaveLength(8);

  for (const step of explainSteps) {
    render(<ExplainVisual step={step} />);
    expect(screen.getByRole('img', { name: expectedVisualNames[step.id] }), step.id).toBeInTheDocument();
    cleanup();
  }
});

it('shows the low and high anchors in the vertical pitch trail', () => {
  const step = explainSteps.find((item) => item.id === 'high-low-see')!;
  render(<ExplainVisual step={step} />);

  expect(screen.getByText('低音')).toBeInTheDocument();
  expect(screen.getByText('高音')).toBeInTheDocument();
  expect(screen.getByText('振动较慢')).toBeInTheDocument();
  expect(screen.getByText('振动较快')).toBeInTheDocument();
});

it('falls back to a visible concept diagram for unknown explain configuration', () => {
  const step: LessonStep = { id: 'future-see', type: 'explain', prompt: '观察新概念', skillIds: ['notation'], config: {}, feedback: {} };
  render(<ExplainVisual step={step} />);

  expect(screen.getByRole('img', { name: '音乐概念示意图' })).toBeInTheDocument();
});

it('draws the complete two-plus-three black-key pattern around middle C', () => {
  const step = explainSteps.find((item) => item.id === 'middle-c-see')!;
  render(<ExplainVisual step={step} />);

  expect(screen.getAllByTestId('middle-c-black-key')).toHaveLength(5);
});

it('keeps bars one through four and five through eight inside their own phrase groups', () => {
  const step = explainSteps.find((item) => item.id === 'eight-bars-see')!;
  render(<ExplainVisual step={step} />);

  const groups = screen.getAllByTestId('eight-bar-section');
  expect(groups).toHaveLength(2);
  for (const bar of ['1', '2', '3', '4']) expect(within(groups[0]).getByText(bar)).toBeInTheDocument();
  for (const bar of ['5', '6', '7', '8']) expect(within(groups[1]).getByText(bar)).toBeInTheDocument();
});

it('uses the generic diagram when a recognized configuration is empty', () => {
  const step: LessonStep = { id: 'empty-scale-see', type: 'explain', prompt: '观察', skillIds: ['scale'], config: { semitonePairs: [] }, feedback: {} };
  render(<ExplainVisual step={step} />);

  expect(screen.getByRole('img', { name: '音乐概念示意图' })).toBeInTheDocument();
});

it('highlights only the adjacent E-F and final B-C semitone positions', () => {
  const step = explainSteps.find((item) => item.id === 'c-scale-see')!;
  render(<ExplainVisual step={step} />);

  expect(screen.getAllByTestId('semitone-key').map((key) => key.textContent?.replace('半音', ''))).toEqual(['E', 'F', 'B', 'C']);
});
