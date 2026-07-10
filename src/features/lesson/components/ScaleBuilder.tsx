import type { NoteName } from '../../../domain/music/types';
import { NoteBuilder } from './NoteBuilder';

export function ScaleBuilder({ value, availableNotes, onChange }: { value: NoteName[]; availableNotes?: NoteName[]; onChange(value: NoteName[]): void }) {
  return <NoteBuilder ariaLabel="音阶构建器" availableNotes={availableNotes} maxNotes={8} onChange={onChange} value={value} />;
}
