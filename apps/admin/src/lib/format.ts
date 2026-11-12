export const DISPLAY_TIME_ZONE = 'America/Santo_Domingo';
const dateTime = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short', timeZone: DISPLAY_TIME_ZONE });
const date = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeZone: DISPLAY_TIME_ZONE });

export function formatDateTime(value: string | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateTime.format(parsed);
}

export function formatDate(value: string | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : date.format(parsed);
}

export function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1_000);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min ${seconds % 60} s`;
}

export function percent(part: number, total: number): string {
  return total > 0 ? `${Math.round((part / total) * 100)} %` : '—';
}
