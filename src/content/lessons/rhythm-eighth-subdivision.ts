import type { Lesson } from '../schema';

export const rhythmEighthSubdivisionLesson: Lesson = {
  id: 'rhythm-eighth-subdivision',
  worldId: 'foundation-rhythm-island',
  title: '八分音符细分',
  order: 5,
  xp: 80,
  prerequisiteIds: ['rhythm-quarter-pulse'],
  steps: [
    { id: 'eighth-listen', type: 'listen', prompt: '听每拍被均分成两下的节奏，用“哒-哒”感受相同间距。', skillIds: ['pulse', 'rhythm'], config: { bpm: 76, subdivision: 2 }, feedback: { subdivisionUnclear: '两下需要平均占据一拍，请重听每拍中点出现的第二下。' } },
    { id: 'eighth-see', type: 'explain', prompt: '观察一枚四分音符可拆成两枚八分音符，拍点读“一”，中点读“和”。', skillIds: ['rhythm', 'notation'], config: { countSyllables: ['一', '和', '二', '和'] }, feedback: { midpointMisread: '“和”位于两次拍点正中间，不能与下一拍重合。' } },
    { id: 'eighth-follow', type: 'rhythmTap', prompt: '跟着“一和二和三和四和”拍击八下，同时保持大拍稳定。', skillIds: ['pulse', 'rhythm'], config: { bpm: 76, taps: 8 }, feedback: { unevenPair: '同一拍内的两下间距不均，请让“一”到“和”等于“和”到下一拍。' } },
    { id: 'eighth-choose', type: 'choice', prompt: '听两个片段，选出八分音符均匀细分且没有抢拍的一段。', skillIds: ['pulse', 'rhythm'], config: { choices: ['片段 A', '片段 B'], trials: 3, audioOptions: { '片段 A': ['C5', 'C5', 'C5', 'C5'], '片段 B': ['C5', 'G5', 'C5', 'G4'] } }, feedback: { rushedSubdivision: '所选片段的第二下靠得太近，请检查每拍两下是否等距。' } },
    { id: 'eighth-build', type: 'rhythmBuild', prompt: '搭出“四分、两个八分、四分、两个八分”的一小节节奏。', skillIds: ['rhythm', 'notation'], config: { units: ['quarter', 'eighth', 'eighth', 'quarter', 'eighth', 'eighth'] }, feedback: { pairSplit: '八分音符需要成对填满一拍，请把拆开的半拍重新配对。', durationMismatch: '当前节奏没有填满四拍，请核对每对八分音符合计一拍。' } },
    { id: 'eighth-transfer', type: 'studioTransfer', prompt: '把八分细分节奏送进鼓轨，在第二小节制造向前推进感。', skillIds: ['rhythm', 'creation'], config: { targetTrack: 'drums', bar: 2 }, feedback: { wrongBar: '节奏变化应放在第二小节，请保留第一小节的四分脉搏。' } },
  ],
};
