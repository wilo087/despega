'use client';

import { ArrowRight } from 'lucide-react';
import type { InteractionProps } from './types';

export function ContinueInteraction({
  interaction,
  locked,
  onSubmit,
  variant = 'primary',
}: InteractionProps<'none'> & { variant?: 'primary' | 'light' }) {
  return (
    <button
      type="button"
      className={`btn ${variant === 'light' ? 'btn-light' : 'btn-primary'} btn-lg max-w-full whitespace-normal py-3`}
      disabled={locked}
      onClick={() => onSubmit({ kind: 'continue' })}
    >
      <span>{interaction.continueLabel}</span> <ArrowRight className="size-4 shrink-0" aria-hidden />
    </button>
  );
}
