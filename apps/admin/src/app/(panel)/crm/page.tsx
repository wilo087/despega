import { getSurveyMetrics, listSurveyLeads } from '@despega/data';
import {
  AUDIENCES,
  CITIES,
  LEAD_STATUSES,
  PRICE_RANGES,
  PROFESSIONS,
  type SurveyMetrics,
} from '@despega/data/survey';
import { Card, Button } from '@heroui/react';
import { ClipboardList, Download, Heart, Wallet, Users } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CrmTable } from '@/components/crm-table';
import {
  DataUnavailable,
  EmptyState,
  PageHeader,
  SectionHeader,
  StatTile,
} from '@/components/ui';
import { dataConfig } from '@/lib/data';
import { crmPeriod, matchesCrmFilters, requireCrmAdmin } from '@/lib/crm';
export const metadata: Metadata = { title: 'CRM · Encuesta' };
export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireCrmAdmin();
  const params = await searchParams;
  let period;
  try {
    period = crmPeriod(params);
  } catch {
    return (
      <>
        <PageHeader title="CRM · Encuesta" />
        <p role="alert">
          Revisa el período: debe ser de hasta un año y con fechas en orden.
        </p>
        <Link href="/crm" className="text-accent underline">
          Restablecer filtros
        </Link>
      </>
    );
  }
  let result;
  try {
    const [list, metrics] = await Promise.all([
      listSurveyLeads(dataConfig(), {
        ...period,
        cursor: typeof params.cursor === 'string' ? params.cursor : undefined,
      }),
      getSurveyMetrics(dataConfig(), period.from, period.to),
    ]);
    result = { ...list, metrics };
  } catch {
    return (
      <>
        <PageHeader
          title="CRM · Encuesta"
          description="Contactos e investigación de DESPEGA."
        />
        <DataUnavailable what="las respuestas de la encuesta" />
      </>
    );
  }
  const { metrics, items, nextCursor } = result;
  const query = new URLSearchParams({
    ...period,
    ...Object.fromEntries(
      ['profile', 'city', 'status'].flatMap((k) =>
        typeof params[k] === 'string' ? [[k, params[k]]] : [],
      ),
    ),
  });
  const leads = items.filter((l) => matchesCrmFilters(l, params));
  const pct = (n: number, d: number) =>
    d ? `${Math.round((n / d) * 100)}%` : '—';
  return (
    <>
      <PageHeader
        title="CRM · Encuesta"
        description="Respuestas, intereses y seguimiento comercial. Acceso exclusivo de administración."
        actions={
          <Link
            href={`/crm/exportar?${query}`}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold"
          >
            <Download className="size-4" aria-hidden />
            Exportar CSV
          </Link>
        }
      />
      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4"
      >
        <label className="grid gap-1 text-xs font-semibold">
          Desde
          <input
            type="date"
            name="from"
            defaultValue={period.from}
            required
            className="rounded-xl border border-line bg-background p-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold">
          Hasta
          <input
            type="date"
            name="to"
            defaultValue={period.to}
            required
            className="rounded-xl border border-line bg-background p-2 text-sm"
          />
        </label>
        <Filter
          name="profile"
          label="Perfil"
          values={AUDIENCES}
          value={params.profile}
        />
        <Filter
          name="city"
          label="Ciudad"
          values={CITIES}
          value={params.city}
        />
        <Filter
          name="status"
          label="Estado"
          values={LEAD_STATUSES}
          value={params.status}
        />
        <Button type="submit" variant="secondary">
          Aplicar
        </Button>
        <Link href="/crm" className="p-2 text-sm text-accent">
          Limpiar
        </Link>
      </form>
      <p className="mb-4 text-xs text-muted-ink">
        KPI de todas las respuestas del período, días completos en Santo
        Domingo. Perfil, ciudad y estado filtran la lista y el CSV.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={ClipboardList}
          label="Encuestas recibidas"
          value={metrics.total ?? 0}
          hint="Respuestas completas, no visitas ni contactos únicos."
        />
        <StatTile
          icon={Heart}
          label="Quieren probar"
          value={pct(metrics.participation_yes ?? 0, metrics.total ?? 0)}
          hint={`${metrics.participation_yes ?? 0} de ${metrics.total ?? 0} respuestas.`}
          tone="brand"
        />
        <StatTile
          icon={Wallet}
          label="Considerarían pagar"
          value={pct(metrics.willingness_pay ?? 0, metrics.commercial ?? 0)}
          hint={`${metrics.willingness_pay ?? 0} de ${metrics.commercial ?? 0} familiares y orientadores.`}
        />
        <StatTile
          icon={Users}
          label="Novedades autorizadas"
          value={metrics.marketing ?? 0}
          hint="Consentimiento opcional; no se envían campañas."
          tone="sun"
        />
      </div>
      <div className="my-6 grid gap-4 xl:grid-cols-2">
        <Distribution
          title="Perfil de participantes"
          prefix="audience"
          choices={AUDIENCES}
          metrics={metrics}
          denominator={metrics.total ?? 0}
        />
        <Distribution
          title="Ciudad"
          prefix="city"
          choices={CITIES}
          metrics={metrics}
          denominator={metrics.total ?? 0}
        />
        <Distribution
          title="Profesiones de interés"
          prefix="profession"
          choices={PROFESSIONS}
          metrics={metrics}
          denominator={metrics.total ?? 0}
        />
        <Distribution
          title="Precio razonable"
          prefix="price"
          choices={PRICE_RANGES}
          metrics={metrics}
          denominator={metrics.commercial ?? 0}
        />
      </div>
      <SectionHeader
        title="Respuestas y seguimiento"
        description="Hasta 50 respuestas por página antes de aplicar filtros. Los KPI se calculan con todos los envíos del período, no solo esta página."
      />
      <div className="mt-4">
        {leads.length ? (
          <CrmTable leads={leads} />
        ) : (
          <Card>
            <Card.Content>
              <EmptyState
                icon={ClipboardList}
                title="Sin respuestas en esta página"
              >
                Prueba otros filtros o continúa a la siguiente página si está
                disponible.
              </EmptyState>
            </Card.Content>
          </Card>
        )}
      </div>
      <div className="mt-5 flex items-center justify-between text-sm">
        <p className="text-muted-ink">
          {leads.length} respuestas mostradas · Profesiones: selección múltiple;
          sus porcentajes pueden sumar más de 100%.
        </p>
        {nextCursor && (
          <Link
            className="ml-4 shrink-0 font-semibold text-accent"
            href={`/crm?${query}&cursor=${encodeURIComponent(nextCursor)}`}
          >
            Siguiente página →
          </Link>
        )}
      </div>
    </>
  );
}
function Filter({
  name,
  label,
  values,
  value,
}: {
  name: string;
  label: string;
  values: Record<string, string>;
  value: string | string[] | undefined;
}) {
  return (
    <label className="grid max-w-full gap-1 text-xs font-semibold">
      {label}
      <select
        name={name}
        defaultValue={typeof value === 'string' ? value : ''}
        className="max-w-60 rounded-xl border border-line bg-background p-2 text-sm"
      >
        <option value="">Todos</option>
        {Object.entries(values).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}
function Distribution({
  title,
  prefix,
  choices,
  metrics,
  denominator,
}: {
  title: string;
  prefix: string;
  choices: Record<string, string>;
  metrics: SurveyMetrics;
  denominator: number;
}) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <Card.Content>
        <ul className="grid gap-3">
          {Object.entries(choices).map(([k, v]) => {
            const count = metrics[`${prefix}_${k}`] ?? 0;
            return (
              <li key={k}>
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-muted-ink">{v}</span>
                  <span className="shrink-0 tabular-nums">
                    {count} ·{' '}
                    {denominator ? Math.round((count / denominator) * 100) : 0}%
                  </span>
                </div>
                <div
                  className="mt-1 h-1.5 rounded-full bg-surface-secondary"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${denominator ? Math.min(100, (count / denominator) * 100) : 0}%`,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted-ink">
          Base: {denominator} respuestas.
        </p>
      </Card.Content>
    </Card>
  );
}
