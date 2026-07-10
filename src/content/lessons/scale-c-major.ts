import type { Lesson, ScaleBuildConfig } from '../schema';

export const scaleCMajorLesson: Lesson = {
  id: 'scale-c-major',
  worldId: 'foundation-harmony-island',
  title: 'C 大调音阶',
  order: 6,
  xp: 90,
  prerequisiteIds: ['rhythm-eighth-subdivision'],
  steps: [
    { id: 'c-scale-listen', type: 'listen', prompt: '听 C 大调从中央 C 上行到高八度 C，感受最后回到稳定终点。', skillIds: ['scale', 'pitch'], config: { notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'] }, feedback: { tonicUnclear: '终点的高音 C 与起点同名，请重听它带来的完整收束感。' } },
    { id: 'c-scale-see', type: 'explain', prompt: '观察 C 大调只使用白键，半音距离出现在 E–F 与 B–C 之间。', skillIds: ['scale', 'keyboard', 'notation'], config: { semitonePairs: [['E', 'F'], ['B', 'C']] }, feedback: { semitonePairWrong: '白键半音只在 E–F 和 B–C，请用黑键缺口确认这两处。' } },
    { id: 'c-scale-follow', type: 'keyboard', prompt: '跟随光点从 C4 逐级弹到 C5，每个音只弹一次并保持上行。', skillIds: ['scale', 'keyboard'], config: { sequence: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'] }, feedback: { skippedDegree: '音阶必须逐级前进，请回到上一音并补上跳过的白键。', directionChanged: '这一步保持连续上行，请把下行音改为右侧相邻白键。' } },
    { id: 'c-scale-choose', type: 'choice', prompt: '比较两组音列，选择完整使用 C 到 C 八枚白键的一组。', skillIds: ['scale', 'pitch'], config: { choices: ['逐级白键', '含升号跳进'], answer: '逐级白键' }, feedback: { alteredScale: '所选音列含有升号或跳级，不符合 C 大调的八枚连续白键。' } },
    { id: 'c-scale-build', type: 'scaleBuild', prompt: '从 C 出发按顺序放置八个音级，构造完整 C 大调音阶。', skillIds: ['scale', 'keyboard'], config: { root: 'C', kind: 'major' } satisfies ScaleBuildConfig, feedback: { wrongDegree: '当前位置的音级不属于连续白键顺序，请检查前后相邻音。', missingOctave: '音阶需要以高八度 C 结束，请补上第八个音级。' } },
    { id: 'c-scale-transfer', type: 'studioTransfer', prompt: '从 C 大调音阶挑选 C、E、G、A，写入旋律轨组成一小节。', skillIds: ['scale', 'creation'], config: { palette: ['C4', 'E4', 'G4', 'A4'], targetTrack: 'melody' }, feedback: { outsideScale: '旋律中出现了 C 大调之外的音，请从指定四音素材中重新选择。' } },
  ],
};
