import type { NoteName } from '../../../domain/music/types';
import { NoteBuilder } from './NoteBuilder';

export function ChordBuilder({ value, onChange }: { value: NoteName[]; onChange(value: NoteName[]): void }) {
  return <NoteBuilder ariaLabel="和弦构建器" maxNotes={3} onChange={onChange} value={value} />;
}
