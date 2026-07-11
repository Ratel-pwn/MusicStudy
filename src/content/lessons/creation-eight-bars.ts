import type { Lesson } from '../schema';

export const creationEightBarsLesson: Lesson = {
  id: 'creation-eight-bars',
  worldId: 'creation-mountain',
  title: '完成八小节作品',
  order: 8,
  xp: 140,
  prerequisiteIds: ['chord-c-major'],
  steps: [
    { id: 'eight-bars-listen', type: 'listen', prompt: '听一首八小节示范，辨认前四小节提出材料、后四小节回应变化。', skillIds: ['creation', 'rhythm', 'chord'], config: { bars: 8, form: ['A', 'A-prime'] }, feedback: { formUnclear: '请比较第一与第五小节，后半段沿用了材料并改变了结尾。' } },
    { id: 'eight-bars-see', type: 'explain', prompt: '观察八格作品结构：1–4 小节建立动机，5–8 小节重复并收束。', skillIds: ['creation', 'notation'], config: { sections: [{ start: 1, end: 4 }, { start: 5, end: 8 }] }, feedback: { sectionBoundaryWrong: '第二乐段从第五小节开始，请以四小节为一组划分结构。' } },
    { id: 'eight-bars-follow', type: 'rhythmTap', prompt: '跟随八小节脉搏拍击，每到第一与第五小节重拍一次标记段落。', skillIds: ['pulse', 'creation'], config: { bars: 8, accents: [1, 5] }, feedback: { phraseAccentMissed: '段落重拍应落在第一与第五小节开头，请继续数满每组四小节。' } },
    { id: 'eight-bars-choose', type: 'choice', prompt: '比较两个结尾，选择在第八小节回到 C 音与 C 和弦的收束方案。', skillIds: ['creation', 'chord', 'pitch'], config: { choices: ['回到 C', '停在 D'], answer: '回到 C', audioOptions: { '回到 C': ['G4', 'E4', 'C4'], '停在 D': ['G4', 'E4', 'D4'] } }, feedback: { unresolvedEnding: '停在 D 保留了向前张力，八小节成品需要回到 C 获得收束。' } },
    { id: 'eight-bars-build', type: 'rhythmBuild', prompt: '搭建八小节骨架：复制前四小节到后半段，并在第八小节改写结尾。', skillIds: ['creation', 'rhythm'], config: { bars: 8, copyRange: [1, 4], variationBar: 8 }, feedback: { wrongLength: '作品骨架必须正好八小节，请补齐或移除超出范围的小节。', noVariation: '第八小节需要与第四小节形成变化，请改写节奏或结束音。' } },
    { id: 'eight-bars-transfer', type: 'studioTransfer', prompt: '整合鼓、C 大三和弦与白键旋律，完成可播放的八小节首作。', skillIds: ['creation', 'rhythm', 'chord', 'scale'], config: { requiredTracks: ['drums', 'chords', 'melody'], bars: 8, ending: 'C' }, feedback: { missingTrack: '成品缺少鼓、和弦或旋律轨之一，请补齐三层音乐职责。', unresolvedFinalBar: '第八小节没有回到 C，请让旋律或和弦提供明确终点。' } },
  ],
};
