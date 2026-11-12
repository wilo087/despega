import 'server-only';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import type { SurveyLead } from '@despega/data/survey';
import { requireStaff } from './auth';
export async function requireCrmAdmin() {
  const staff = await requireStaff();
  if (!staff.groups.includes('despega/admin')) notFound();
  return staff;
}
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      Number.isFinite(Date.parse(`${v}T00:00:00Z`)) &&
      new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v,
  );
export function crmPeriod(
  params: Record<string, string | string[] | undefined>,
) {
  const now = new Date();
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santo_Domingo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 29);
  const from = day.safeParse(params.from);
  const to = day.safeParse(params.to);
  const period = {
    from: from.success ? from.data : start.toISOString().slice(0, 10),
    to: to.success ? to.data : today,
  };
  if (period.from > period.to)
    throw new Error('La fecha inicial debe ser anterior a la final.');
  if (Date.parse(period.to) - Date.parse(period.from) > 366 * 86400000)
    throw new Error('Consulta un período de hasta un año.');
  return period;
}
export function matchesCrmFilters(
  lead: SurveyLead,
  params: Record<string, string | string[] | undefined>,
) {
  return (
    (!params.profile || lead.audience === params.profile) &&
    (!params.status || lead.status === params.status) &&
    (!params.city || lead.city === params.city)
  );
}
export const crmDate = (value: string) =>
  new Intl.DateTimeFormat('es-DO', {
    timeZone: 'America/Santo_Domingo',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
