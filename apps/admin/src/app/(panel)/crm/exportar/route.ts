import { listSurveyLeads } from '@despega/data';
import { surveyCsv, type SurveyLead } from '@despega/data/survey';
import { dataConfig } from '@/lib/data';
import { crmPeriod, matchesCrmFilters, requireCrmAdmin } from '@/lib/crm';
export async function GET(request: Request) {
  await requireCrmAdmin();
  const params = Object.fromEntries(
    new URL(request.url).searchParams.entries(),
  );
  let period;
  try {
    period = crmPeriod(params);
  } catch {
    return new Response('Período inválido.', { status: 400 });
  }
  const items: SurveyLead[] = [];
  let cursor: string | undefined;
  let read = 0;
  try {
    do {
      const page = await listSurveyLeads(dataConfig(), {
        ...period,
        limit: 200,
        cursor,
      });
      read += page.items.length;
      items.push(...page.items.filter((l) => matchesCrmFilters(l, params)));
      cursor = page.nextCursor;
      if (cursor && read >= 10000)
        return new Response(
          'El período supera 10,000 respuestas. Reduce las fechas para exportarlo completo.',
          { status: 413 },
        );
    } while (cursor);
    return new Response(surveyCsv(items), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="despega-encuesta-${period.from}-${period.to}.csv"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return new Response('No pudimos exportar las respuestas.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
