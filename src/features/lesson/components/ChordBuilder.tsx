import type { NoteName } from '../../../domain/music/types';
import { NoteBuilder } from './NoteBuilder';

export function ChordBuilder({ value, availableNotes, onChange }: { value: NoteName[]; availableNotes?: NoteName[]; onChange(value: NoteName[]): void }) {
  return <NoteBuilder ariaLabel="和弦构建器" availableNotes={availableNotes} maxNotes={3} onChange={onChange} value={value} />;
}
