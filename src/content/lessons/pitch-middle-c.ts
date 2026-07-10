import type { Lesson } from '../schema';

export const pitchMiddleCLesson: Lesson = {
  id: 'pitch-middle-c',
  worldId: 'foundation-listening-island',
  title: '找到中央 C',
  order: 2,
  xp: 60,
  prerequisiteIds: ['pitch-high-low'],
  steps: [
    { id: 'middle-c-listen', type: 'listen', prompt: '听中央 C 与两端的 C，记住中央 C 温和、居中的音区。', skillIds: ['pitch', 'keyboard'], config: { sequence: ['C2', 'C4', 'C6'] }, feedback: { octaveBlurred: '三个音同名但音区不同，请重听中间第二枚中央 C。' } },
    { id: 'middle-c-see', type: 'explain', prompt: '看两枚黑键一组的位置，中央 C 就在键盘中央附近这组黑键的左侧。', skillIds: ['keyboard', 'notation'], config: { landmark: 'twoBlackKeysLeft' }, feedback: { landmarkMissed: '请先找到相邻的两枚黑键，再看它们紧邻左侧的白键。' } },
    { id: 'middle-c-follow', type: 'keyboard', prompt: '跟随发光指引弹中央 C 三次，每次都让声音自然结束。', skillIds: ['keyboard', 'pitch'], config: { target: 'C4', repetitions: 3 }, feedback: { wrongOctave: '你弹到了另一个 C，请回到键盘中央附近的两黑键左侧。' } },
    { id: 'middle-c-choose', type: 'choice', prompt: '在三个不同音区的 C 中，听辨并选择中央 C。', skillIds: ['pitch', 'keyboard'], config: { choices: ['C3', 'C4', 'C5'], answer: 'C4' }, feedback: { selectedOuterC: '这个音是 C，但不在中央音区；请比较它与示范音的高度。' } },
    { id: 'middle-c-build', type: 'keyboard', prompt: '以中央 C 为中心，依次放入左边相邻白键、中央 C、右边相邻白键。', skillIds: ['keyboard', 'pitch'], config: { sequence: ['B3', 'C4', 'D4'] }, feedback: { centerMissing: '三音结构的中心必须是 C4，请把中央位置校准到中央 C。' } },
    { id: 'middle-c-transfer', type: 'studioTransfer', prompt: '把 B3–D4–C4 放进旋律轨，让 C4 成为短句的停靠点。', skillIds: ['pitch', 'creation'], config: { targetTrack: 'melody', sequence: ['B3', 'D4', 'C4'], cadenceNote: 'C4' }, feedback: { cadenceOffCenter: '短句结尾需要落在 C4，当前停靠点没有回到中央 C。' } },
  ],
};
