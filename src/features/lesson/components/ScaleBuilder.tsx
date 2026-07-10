import type { NoteName } from '../../../domain/music/types';
import { NoteBuilder } from './NoteBuilder';

export function ScaleBuilder({ value, onChange }: { value: NoteName[]; onChange(value: NoteName[]): void }) {
  return <NoteBuilder ariaLabel="音阶构建器" maxNotes={8} onChange={onChange} value={value} />;
}
