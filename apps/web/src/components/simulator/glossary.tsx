'use client';

import type { GlossaryEntry } from '@despega/simulator';
import { createContext, useContext, useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const GlossaryContext = createContext<readonly GlossaryEntry[]>([]);

export function GlossaryProvider({ entries, children }: { entries: readonly GlossaryEntry[]; children: ReactNode }) {
  return <GlossaryContext.Provider value={entries}>{children}</GlossaryContext.Provider>;
}

/** Las definiciones son contenido del módulo y nunca contienen claves del juego. */
export function GlossaryText({ text, interactive = true }: { text: string; interactive?: boolean }) {
  const entries = useContext(GlossaryContext);
  const terms = entries.flatMap((entry) => [entry.term, ...(entry.aliases ?? [])].map((term) => ({ term, meaning: entry.meaning })))
    .sort((a, b) => b.term.length - a.term.length);
  if (terms.length === 0) return text;
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(`(?<![\\p{L}\\p{N}])(${terms.map(({ term }) => escape(term)).join('|')})(?![\\p{L}\\p{N}])`, 'giu');
  const parts: ReactNode[] = [];
  let offset = 0;
  for (const match of text.matchAll(expression)) {
    const word = match[0];
    const entry = terms.find(({ term }) => term.toLocaleLowerCase('es') === word.toLocaleLowerCase('es'))!;
    parts.push(text.slice(offset, match.index));
    parts.push(<GlossaryTerm key={match.index} word={word} meaning={entry.meaning} interactive={interactive} />);
    offset = match.index + word.length;
  }
  parts.push(text.slice(offset));
  return <>{parts}</>;
}

function GlossaryTerm({ word, meaning, interactive }: { word: string; meaning: string; interactive: boolean }) {
  const id = useId();
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const open = position !== null;
  useEffect(() => {
    if (!open) return;
    const dismiss = () => setPosition(null);
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    document.addEventListener('pointerdown', dismiss);
    return () => {
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
      document.removeEventListener('pointerdown', dismiss);
    };
  }, [open]);
  function show(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const width = Math.min(288, window.innerWidth - 24);
    setPosition({ left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)), top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 140)) });
  }
  return (
    <>
      <abbr
        tabIndex={interactive ? 0 : undefined}
        aria-label={`${word}: ${meaning}`}
        aria-describedby={position ? id : undefined}
        className="cursor-help decoration-dotted underline underline-offset-4 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-accent"
        onMouseEnter={(event) => show(event.currentTarget)}
        onMouseLeave={() => setPosition(null)}
        onFocus={(event) => show(event.currentTarget)}
        onBlur={() => setPosition(null)}
        onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); setPosition(null); } }}
        onClick={interactive ? (event) => { event.stopPropagation(); show(event.currentTarget); } : undefined}
      >
        {word}
      </abbr>
      {position && createPortal(
        <span id={id} role="tooltip" className="pointer-events-none fixed z-50 w-72 max-w-[calc(100vw-1.5rem)] rounded-xl bg-night px-4 py-3 text-left text-sm font-normal leading-relaxed text-white shadow-pop" style={position}>
          <strong className="mb-1 block">{word}</strong>{meaning}
        </span>,
        document.body,
      )}
    </>
  );
}

/** Alternativa persistente para consultar términos con teclado o pantalla táctil. */
export function GlossaryGuide() {
  const entries = useContext(GlossaryContext);
  if (entries.length === 0) return null;
  return (
    <details className="mt-6 border-t border-line pt-4 text-sm">
      <summary className="cursor-pointer font-semibold text-ink-soft">Glosario de la experiencia</summary>
      <dl className="mt-3 grid gap-3">
        {entries.map((entry) => <div key={entry.term}><dt className="font-bold text-ink">{entry.term}</dt><dd className="mt-0.5 leading-relaxed text-muted">{entry.meaning}</dd></div>)}
      </dl>
    </details>
  );
}
