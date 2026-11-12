'use server';
import { DataError, updateSurveyLead } from '@despega/data';
import { LEAD_STATUSES } from '@despega/data/survey';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dataConfig } from '@/lib/data';
import { requireCrmAdmin } from '@/lib/crm';
const schema = z.object({
  id: z.string().max(100),
  status: z.enum(
    Object.keys(LEAD_STATUSES) as [
      keyof typeof LEAD_STATUSES,
      ...(keyof typeof LEAD_STATUSES)[],
    ],
  ),
  notes: z.string().trim().max(2000),
  version: z.coerce.number().int().nonnegative(),
});
export async function updateLeadAction(
  _previous: { error?: string; saved?: boolean },
  form: FormData,
): Promise<{ error?: string; saved?: boolean }> {
  const staff = await requireCrmAdmin();
  const parsed = schema.safeParse(
    Object.fromEntries(
      ['id', 'status', 'notes', 'version'].map((k) => [k, form.get(k)]),
    ),
  );
  if (!parsed.success)
    return { error: 'Revisa el estado y la nota (máximo 2,000 caracteres).' };
  try {
    await updateSurveyLead(dataConfig(), parsed.data.id, {
      ...parsed.data,
      actor: staff.subject,
      now: new Date().toISOString(),
    });
  } catch (error) {
    return {
      error:
        error instanceof DataError
          ? error.message
          : 'No pudimos guardar el seguimiento. Inténtalo de nuevo.',
    };
  }
  revalidatePath('/crm');
  revalidatePath(`/crm/${encodeURIComponent(parsed.data.id)}`);
  return { saved: true };
}
