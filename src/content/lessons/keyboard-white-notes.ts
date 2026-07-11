import type { Lesson } from '../schema';

export const keyboardWhiteNotesLesson: Lesson = {
  id: 'keyboard-white-notes',
  worldId: 'foundation-keyboard-island',
  title: '白键七音',
  order: 3,
  xp: 70,
  prerequisiteIds: ['pitch-middle-c'],
  steps: [
    { id: 'white-notes-listen', type: 'listen', prompt: '听 C 到 B 的七枚白键依次上行，注意音名循环前的完整一轮。', skillIds: ['keyboard', 'pitch'], config: { notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'] }, feedback: { orderUnclear: '请重听相邻白键的连续上行，七枚音之间没有跳过白键。' } },
    { id: 'white-notes-see', type: 'explain', prompt: '从两黑键左侧标出 C，白键音名按 C D E F G A B 循环。', skillIds: ['keyboard', 'notation'], config: { labels: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] }, feedback: { cycleMisread: 'B 之后会回到下一个 C，请从两黑键左侧重新定位循环起点。' } },
    { id: 'white-notes-follow', type: 'keyboard', prompt: '跟着音名从 C4 逐级弹到 G4，每次只移动到相邻白键。', skillIds: ['keyboard'], config: { sequence: ['C4', 'D4', 'E4', 'F4', 'G4'] }, feedback: { skippedWhiteKey: '刚才跨过了一枚白键，请退回前一音并移动到紧邻白键。' } },
    { id: 'white-notes-choose', type: 'choice', prompt: '听到单音后，在 E、F、G 三个白键中选择对应音名。', skillIds: ['keyboard', 'pitch'], config: { choices: ['E', 'F', 'G'], trials: 4, audioOptions: { E: ['E4'], F: ['F4'], G: ['G4'] } }, feedback: { neighboringName: '你选了相邻音名，请用黑键分组重新确认这枚白键的位置。' } },
    { id: 'white-notes-build', type: 'keyboard', prompt: '按 C–E–D–F 的音名顺序搭出四音小句，并保持在中央音区。', skillIds: ['keyboard', 'pitch'], config: { sequence: ['C4', 'E4', 'D4', 'F4'] }, feedback: { noteNameMismatch: '四音顺序与 C–E–D–F 不一致，请逐枚核对音名再重排。' } },
    { id: 'white-notes-transfer', type: 'studioTransfer', prompt: '把 C–E–D–F 小句复制到第二小节，并把结尾改成 G。', skillIds: ['keyboard', 'creation'], config: { source: ['C4', 'E4', 'D4', 'F4'], ending: 'G4' }, feedback: { endingNotChanged: '第二小节需要形成变化，请把最后的 F4 替换为 G4。' } },
  ],
};
