import type { Lesson } from '../schema';

export const pitchHighLowLesson: Lesson = {
  id: 'pitch-high-low',
  worldId: 'foundation-listening-island',
  title: '声音的高与低',
  order: 1,
  xp: 50,
  prerequisiteIds: [],
  steps: [
    { id: 'high-low-listen', type: 'listen', prompt: '闭上眼听两组双音示范：一组向上，一组向下。把注意力放在第二枚音的移动方向。', skillIds: ['pitch'], config: { pairs: [['C4', 'G4'], ['C4', 'F3']] }, feedback: { replayNeeded: '两枚音的距离还不清楚，请重听并只追踪第二枚音的方向。' } },
    { id: 'high-low-see', type: 'explain', prompt: '观察竖直音高轨迹：位置越高代表振动更快、听感更高。', skillIds: ['pitch'], config: { visual: 'verticalPitchTrail' }, feedback: { directionConfused: '画面高度对应声音高低，请比较两个光点的竖直位置。' } },
    { id: 'high-low-follow', type: 'keyboard', prompt: '先弹左侧低音 C3，再弹右侧高音 C5，听见跨度的方向。', skillIds: ['pitch', 'keyboard'], config: { sequence: ['C3', 'C5'] }, feedback: { wrongOrder: '演奏顺序颠倒了，请从左侧 C3 开始，再移动到右侧 C5。' } },
    { id: 'high-low-choose', type: 'choice', prompt: '试听候选双音，选择第二枚音比第一枚音更高的一组。', skillIds: ['pitch'], config: { choices: ['更高', '更低'], answer: '更高', trials: 4, audioOptions: { '更高': ['C4', 'G4'], '更低': ['C4', 'F3'] } }, feedback: { reversedDirection: '你判断成了相反方向，请把第二枚音和第一枚音的高度直接比较。' } },
    { id: 'high-low-build', type: 'keyboard', prompt: '从中央 C 出发，选择一个更高音和一个更低音组成三音轮廓。', skillIds: ['pitch', 'keyboard'], config: { anchor: 'C4', requiredDirections: ['up', 'down'] }, feedback: { missingDirection: '三音轮廓需要同时出现上行和下行，请补上缺少的方向。' } },
    { id: 'high-low-transfer', type: 'studioTransfer', prompt: '把刚才的三音轮廓送进作品区，安排为开场的问答动机。', skillIds: ['pitch', 'creation'], config: { targetTrack: 'melody', placement: 'opening' }, feedback: { incompleteMotif: '作品区需要完整三音动机，请保留起点、高音和低音三个位置。' } },
  ],
};
