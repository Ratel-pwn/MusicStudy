import type { CourseWorld, Lesson } from './schema';
import { chordCMajorLesson } from './lessons/chord-c-major';
import { creationEightBarsLesson } from './lessons/creation-eight-bars';
import { keyboardWhiteNotesLesson } from './lessons/keyboard-white-notes';
import { pitchHighLowLesson } from './lessons/pitch-high-low';
import { pitchMiddleCLesson } from './lessons/pitch-middle-c';
import { rhythmEighthSubdivisionLesson } from './lessons/rhythm-eighth-subdivision';
import { rhythmQuarterPulseLesson } from './lessons/rhythm-quarter-pulse';
import { scaleCMajorLesson } from './lessons/scale-c-major';

export const lessons: Lesson[] = [
  pitchHighLowLesson,
  pitchMiddleCLesson,
  keyboardWhiteNotesLesson,
  rhythmQuarterPulseLesson,
  rhythmEighthSubdivisionLesson,
  scaleCMajorLesson,
  chordCMajorLesson,
  creationEightBarsLesson,
];

const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));

export function getLesson(id: string): Lesson | undefined {
  return lessonById.get(id);
}

export const worlds: CourseWorld[] = [
  {
    id: 'foundation-listening-island',
    title: '听觉岛',
    route: 'foundation',
    order: 1,
    description: '从声音方向与中央 C 建立可靠的音高坐标。',
    nodes: [
      { id: 'node-pitch-high-low', title: '声音的高与低', availability: 'playable', lessonId: 'pitch-high-low', capabilityGoal: '能仅凭听觉判断两枚音的上行与下行方向。' },
      { id: 'node-pitch-middle-c', title: '找到中央 C', availability: 'playable', lessonId: 'pitch-middle-c', capabilityGoal: '能结合音区听感与黑键地标定位中央 C。' },
      { id: 'node-interval-shapes', title: '音程轮廓', availability: 'planned', capabilityGoal: '能听辨二度、三度与五度的距离，并复现相同音程方向。' },
    ],
  },
  {
    id: 'foundation-keyboard-island',
    title: '键盘岛',
    route: 'foundation',
    order: 2,
    description: '把黑键地标、白键音名与基础谱面连接起来。',
    nodes: [
      { id: 'node-keyboard-white-notes', title: '白键七音', availability: 'playable', lessonId: 'keyboard-white-notes', capabilityGoal: '能从任意黑键分组定位并弹出七个白键音名。' },
      { id: 'node-treble-staff', title: '高音谱表航标', availability: 'planned', capabilityGoal: '能把中央 C 到高音 G 的谱面位置准确映射到键盘。' },
    ],
  },
  {
    id: 'foundation-rhythm-island',
    title: '节奏岛',
    route: 'foundation',
    order: 3,
    description: '先稳住四分脉搏，再把每一拍均分为八分音符。',
    nodes: [
      { id: 'node-rhythm-quarter-pulse', title: '四分音符脉搏', availability: 'playable', lessonId: 'rhythm-quarter-pulse', capabilityGoal: '能在 4/4 拍中持续拍出等距的四分音符脉搏。' },
      { id: 'node-rhythm-eighth-subdivision', title: '八分音符细分', availability: 'playable', lessonId: 'rhythm-eighth-subdivision', capabilityGoal: '能把稳定的一拍均分成两枚等距的八分音符。' },
      { id: 'node-rests-syncopation', title: '休止与切分', availability: 'planned', capabilityGoal: '能在脉搏持续时准确处理休止，并识别弱拍重音形成的切分。' },
    ],
  },
  {
    id: 'foundation-harmony-island',
    title: '和声岛',
    route: 'foundation',
    order: 4,
    description: '用 C 大调音阶与主和弦建立调性和声基础。',
    nodes: [
      { id: 'node-scale-c-major', title: 'C 大调音阶', availability: 'playable', lessonId: 'scale-c-major', capabilityGoal: '能听辨、演奏并构造完整的 C 大调八个音级。' },
      { id: 'node-chord-c-major', title: 'C 大三和弦', availability: 'playable', lessonId: 'chord-c-major', capabilityGoal: '能从音阶一三五级构造并听辨 C 大三和弦。' },
      { id: 'node-primary-triads', title: '正三和弦', availability: 'planned', capabilityGoal: '能在大调中构造 I、IV、V 级三和弦并判断各自功能。' },
    ],
  },
  {
    id: 'pop-route',
    title: '流行航线',
    route: 'pop',
    order: 5,
    description: '把节拍、和弦循环与旋律钩子组织成流行段落。',
    nodes: [
      { id: 'node-pop-backbeat', title: '反拍律动', availability: 'planned', capabilityGoal: '能编排底鼓与军鼓的二四拍反拍，并保持八分律动稳定。' },
      { id: 'node-pop-four-chords', title: '四和弦循环', availability: 'planned', capabilityGoal: '能在 C 大调中连接常用四和弦循环并写出声部平滑的伴奏。' },
      { id: 'node-pop-hook', title: '旋律钩子', availability: 'planned', capabilityGoal: '能用重复、节奏变化和落点设计两小节可记忆旋律钩子。' },
    ],
  },
  {
    id: 'classical-route',
    title: '古典航线',
    route: 'classical',
    order: 6,
    description: '沿乐句、终止式与声部关系理解古典结构。',
    nodes: [
      { id: 'node-classical-phrase', title: '四小节乐句', availability: 'planned', capabilityGoal: '能识别动机发展与呼吸位置，并演奏完整四小节乐句。' },
      { id: 'node-classical-cadence', title: '正格终止', availability: 'planned', capabilityGoal: '能听辨属到主的和声趋向，并在乐句结尾构造正格终止。' },
      { id: 'node-classical-counterpoint', title: '双声部对话', availability: 'planned', capabilityGoal: '能让两个独立旋律保持节奏互补，并避免不受控的平行进行。' },
    ],
  },
  {
    id: 'creation-mountain',
    title: '创作山',
    route: 'creation',
    order: 7,
    description: '汇合听觉、节奏、旋律与和声，持续完成个人作品。',
    nodes: [
      { id: 'node-creation-eight-bars', title: '完成八小节作品', availability: 'playable', lessonId: 'creation-eight-bars', capabilityGoal: '能整合三条音轨完成有重复、变化与收束的八小节作品。' },
      { id: 'node-creation-sixteen-bars', title: '十六小节展开', availability: 'planned', capabilityGoal: '能把八小节材料扩展为包含对比段落的十六小节完整结构。' },
      { id: 'node-creation-arrangement', title: '配器与动态', availability: 'planned', capabilityGoal: '能通过音区、织体与力度安排塑造作品层次和高潮走向。' },
    ],
  },
];
