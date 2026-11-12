'use client';
import { useActionState } from 'react';
import { Button, TextArea } from '@heroui/react';
import { LEAD_STATUSES, type SurveyLead } from '@despega/data/survey';
import { updateLeadAction } from '@/app/(panel)/crm/[leadId]/actions';
export function CrmFollowUp({ lead }: { lead: SurveyLead }) {
  const [state, action, pending] = useActionState(updateLeadAction, {});
  return (
    <form key={lead.version} action={action} className="grid gap-4">
      <input type="hidden" name="id" value={lead.id} />
      <input type="hidden" name="version" value={lead.version} />
      <label className="grid gap-2 text-sm font-semibold">
        Estado
        <select
          name="status"
          defaultValue={lead.status}
          className="rounded-xl border border-line bg-background p-3"
        >
          {Object.entries(LEAD_STATUSES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Nota interna
        <TextArea
          name="notes"
          defaultValue={lead.notes}
          maxLength={2000}
          rows={5}
          placeholder="Registra el seguimiento acordado; evita información sensible."
        />
      </label>
      <p className="text-xs text-muted-ink">
        Guardar una nota no envía mensajes ni cambia las autorizaciones del
        contacto.
      </p>
      {state.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
      {state.saved && (
        <p className="text-sm text-brand-strong" role="status">
          Seguimiento guardado.
        </p>
      )}
      <Button type="submit" isDisabled={pending} variant="primary">
        {pending ? 'Guardando…' : 'Guardar seguimiento'}
      </Button>
    </form>
  );
}
