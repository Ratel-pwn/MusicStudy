import type { Lesson } from '../schema';

export const rhythmQuarterPulseLesson: Lesson = {
  id: 'rhythm-quarter-pulse',
  worldId: 'foundation-rhythm-island',
  title: '四分音符脉搏',
  order: 4,
  xp: 70,
  prerequisiteIds: ['keyboard-white-notes'],
  steps: [
    { id: 'quarter-pulse-listen', type: 'listen', prompt: '听四拍循环的稳定脉搏，心里连续数“一、二、三、四”。', skillIds: ['pulse', 'rhythm'], config: { bpm: 84, beats: 8 }, feedback: { countDrifted: '计数与脉搏分开了，请让每个数字正好落在一次点击上。' } },
    { id: 'quarter-pulse-see', type: 'explain', prompt: '观察每拍一个四分音符：四枚等距格子刚好填满一小节。', skillIds: ['pulse', 'rhythm', 'notation'], config: { meter: '4/4', beatUnit: 'quarter' }, feedback: { spacingUneven: '四分音符各占一拍，格子宽度应保持完全相等。' } },
    { id: 'quarter-pulse-follow', type: 'rhythmTap', prompt: '跟随节拍器连续拍八次，每一下都对准四分音符脉搏。', skillIds: ['pulse', 'rhythm'], config: { bpm: 84, pattern: [1, 1, 1, 1, 1, 1, 1, 1] }, feedback: { tapEarly: '拍击提前进入了下一拍，请等到点击出现时再落手。', tapLate: '拍击落在点击之后，请提前准备并对准下一次脉搏。' } },
    { id: 'quarter-pulse-choose', type: 'choice', prompt: '听两段节奏，选择哪一段始终保持每拍一下的稳定脉搏。', skillIds: ['pulse', 'rhythm'], config: { choices: ['稳定', '忽快忽慢'], trials: 3, audioOptions: { '稳定': ['C5', 'C5', 'C5', 'C5'], '忽快忽慢': ['C5', 'C5', 'G5', 'C5'] } }, feedback: { unstableSelected: '所选片段的拍击间距发生变化，请比较相邻拍之间的时间。' } },
    { id: 'quarter-pulse-build', type: 'rhythmBuild', prompt: '用四枚四分音符填满一个 4/4 小节，不留下空拍。', skillIds: ['rhythm', 'notation'], config: { meter: '4/4', units: ['quarter', 'quarter', 'quarter', 'quarter'] }, feedback: { barUnderfilled: '当前总时值不足四拍，请补足缺少的四分音符。', barOverfilled: '当前总时值超过四拍，请移除越过小节线的音符。' } },
    { id: 'quarter-pulse-transfer', type: 'studioTransfer', prompt: '把四分音符脉搏送入鼓轨，铺满作品的前两个小节。', skillIds: ['pulse', 'creation'], config: { targetTrack: 'drums', bars: 2 }, feedback: { emptyBeat: '鼓轨前两小节仍有空拍，请让八个脉搏连续覆盖。' } },
  ],
};
