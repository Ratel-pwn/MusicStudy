import type { NoteName, ScaleKind, TriadQuality } from '../domain/music/types';

export type SkillId =
  | 'pitch'
  | 'keyboard'
  | 'notation'
  | 'pulse'
  | 'rhythm'
  | 'scale'
  | 'chord'
  | 'creation';

export type LessonStepType =
  | 'listen'
  | 'explain'
  | 'keyboard'
  | 'choice'
  | 'rhythmTap'
  | 'rhythmBuild'
  | 'scaleBuild'
  | 'chordBuild'
  | 'studioTransfer';

export type LessonStep = {
  id: string;
  type: LessonStepType;
  prompt: string;
  skillIds: SkillId[];
  config: Record<string, unknown>;
  feedback: Record<string, string>;
};

export type Lesson = {
  id: string;
  worldId: string;
  title: string;
  order: number;
  xp: number;
  prerequisiteIds: string[];
  steps: LessonStep[];
};

export type LessonAvailability = 'playable' | 'planned';
export type CourseRoute = 'foundation' | 'pop' | 'classical' | 'creation';

export type CourseNode = {
  id: string;
  title: string;
  availability: LessonAvailability;
  capabilityGoal: string;
  lessonId?: string;
};

export type CourseWorld = {
  id: string;
  title: string;
  route: CourseRoute;
  order: number;
  description: string;
  nodes: CourseNode[];
};

export type NoteSequenceConfig = { notes: NoteName[]; octave?: number };
export type ScaleBuildConfig = { root: NoteName; kind: ScaleKind };
export type ChordBuildConfig = { root: NoteName; quality: TriadQuality };
