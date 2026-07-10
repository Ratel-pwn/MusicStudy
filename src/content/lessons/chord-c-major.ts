import type { ChordBuildConfig, Lesson } from '../schema';

export const chordCMajorLesson: Lesson = {
  id: 'chord-c-major',
  worldId: 'foundation-harmony-island',
  title: 'C 大三和弦',
  order: 7,
  xp: 100,
  prerequisiteIds: ['scale-c-major'],
  steps: [
    { id: 'c-chord-listen', type: 'listen', prompt: '听 C、E、G 先后出现再同时响起，感受三音汇成明亮稳定的和声。', skillIds: ['chord', 'pitch'], config: { arpeggio: ['C4', 'E4', 'G4'], block: ['C4', 'E4', 'G4'] }, feedback: { voicesUnclear: '请先分辨依次出现的 C、E、G，再听它们同时叠合。' } },
    { id: 'c-chord-see', type: 'explain', prompt: '观察从 C 大调隔一个音取一个音，第一、三、五级组成 C–E–G。', skillIds: ['chord', 'scale', 'notation'], config: { degrees: [1, 3, 5] }, feedback: { adjacentSelection: '三和弦按隔音取法构成，请在两个和弦音之间留出一个音级。' } },
    { id: 'c-chord-follow', type: 'keyboard', prompt: '依次弹 C4、E4、G4，再把三枚键同时按下并保持两拍。', skillIds: ['chord', 'keyboard'], config: { notes: ['C4', 'E4', 'G4'], holdBeats: 2 }, feedback: { incompleteVoicing: '同时演奏时缺少一个和弦音，请确认 C、E、G 三键都被按下。' } },
    { id: 'c-chord-choose', type: 'choice', prompt: '听 C–E–G 与 C–F–G，选择具有 C 大三和弦稳定感的一组。', skillIds: ['chord', 'pitch'], config: { choices: ['C–E–G', 'C–F–G'], answer: 'C–E–G' }, feedback: { suspendedSound: 'C–F–G 中的 F 产生悬挂感，C 大三和弦的中间音应为 E。' } },
    { id: 'c-chord-build', type: 'chordBuild', prompt: '以 C 为根音，加入三音 E 与五音 G，构造 C 大三和弦。', skillIds: ['chord', 'scale'], config: { root: 'C', quality: 'major' } satisfies ChordBuildConfig, feedback: { wrongThird: '中间音决定和弦色彩，C 大三和弦需要 E 而不是相邻音。', wrongFifth: '最高音应是根音上方的五音 G，请按 C 大调音级重新计数。' } },
    { id: 'c-chord-transfer', type: 'studioTransfer', prompt: '把 C 大三和弦放进和弦轨第一小节，为旋律建立稳定起点。', skillIds: ['chord', 'creation'], config: { targetTrack: 'chords', bar: 1, notes: ['C3', 'E3', 'G3'] }, feedback: { chordOutsideBar: '和弦需要从第一小节第一拍开始，请把整体移回作品起点。' } },
  ],
};
