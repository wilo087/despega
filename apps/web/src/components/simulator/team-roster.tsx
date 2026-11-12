import type { CharacterDefinition } from '@despega/simulator';
import { CharacterAvatar } from '@/components/characters/character-avatar';
import { GlossaryText } from './glossary';

export function TeamRoster({ company, characters }: { company: string; characters: Readonly<Record<string, CharacterDefinition>> }) {
  return (
    <section className="card p-5" aria-labelledby="equipo">
      <h2 id="equipo" className="text-sm font-semibold text-ink">Tu equipo en {company}</h2>
      <ul className="mt-2 divide-y divide-line">
        {Object.values(characters).map((character) => (
          <li key={character.id} className="flex items-start gap-3 py-3 last:pb-0">
            <CharacterAvatar characterId={character.id} mood="happy" size={44} decorative />
            <div className="min-w-0">
              <p className="font-semibold text-ink">{character.name}</p>
              <p className="text-sm text-muted"><GlossaryText text={character.role} /></p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft"><GlossaryText text={character.bio} /></p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
