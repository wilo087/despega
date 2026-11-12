import { DataError, getSurveyLead } from '@despega/data';
import {
  AUDIENCES,
  CITIES,
  NEEDS,
  PARTICIPATION,
  PRICE_RANGES,
  PROFESSIONS,
  WILLINGNESS,
} from '@despega/data/survey';
import { Card } from '@heroui/react';
import { notFound } from 'next/navigation';
import { CrmFollowUp } from '@/components/crm-follow-up';
import { DataUnavailable, PageHeader } from '@/components/ui';
import { dataConfig } from '@/lib/data';
import { crmDate, requireCrmAdmin } from '@/lib/crm';
export default async function LeadPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  await requireCrmAdmin();
  const { leadId: rawId } = await params;
  let leadId: string;
  try { leadId = decodeURIComponent(rawId); } catch { notFound(); }
  let lead;
  try {
    lead = await getSurveyLead(dataConfig(), leadId);
  } catch (error) {
    if (error instanceof DataError && error.code === 'NOT_FOUND') notFound();
    return <DataUnavailable what="el contacto" />;
  }
  if (!lead) notFound();
  const facts = [
    ['Perfil', AUDIENCES[lead.audience]],
    ['Correo', lead.email],
    ['Ciudad', lead.city === 'other' ? lead.otherCity : CITIES[lead.city]],
    ['Qué quiere conocer', NEEDS[lead.need]],
    [
      'Profesiones',
      lead.professions
        .map((p) => (p === 'other' ? lead.otherProfession : PROFESSIONS[p]))
        .join(', '),
    ],
    ['Participación', PARTICIPATION[lead.participation]],
    [
      'Disposición de pago',
      lead.willingness
        ? WILLINGNESS[lead.willingness]
        : 'No aplica a estudiantes',
    ],
    [
      'Precio razonable',
      lead.priceRange
        ? PRICE_RANGES[lead.priceRange]
        : 'No aplica a estudiantes',
    ],
    ['Novedades', lead.marketingConsent ? 'Autorizadas' : 'No autorizadas'],
    [
      'Privacidad',
      `Versión ${lead.privacyVersion} · ${crmDate(lead.consentAt)}`,
    ],
    [
      'Origen de campaña',
      [lead.source, lead.medium, lead.campaign].filter(Boolean).join(' / ') ||
        'Sin campaña registrada',
    ],
  ];
  return (
    <>
      <PageHeader
        title={lead.fullName}
        description={`Respuesta recibida el ${crmDate(lead.createdAt)} · ${lead.surveyVersion}`}
      />
      <div className="grid items-start gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <Card.Header>
            <Card.Title>Respuestas y autorizaciones</Card.Title>
          </Card.Header>
          <Card.Content>
            <dl className="grid gap-4">
              {facts.map(([label, value]) => (
                <div className="border-b border-line pb-3" key={label}>
                  <dt className="text-xs font-semibold text-muted-ink">
                    {label}
                  </dt>
                  <dd className="mt-1 break-words text-sm text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            {lead.guardianConsentMethod && (
              <div className="mt-5 rounded-xl bg-brand-soft p-4 text-sm">
                <p className="font-bold">Autorización conjunta declarada</p>
                <p className="mt-2">Tutor: {lead.guardianName}</p>
                <p className="break-all">Correo: {lead.guardianEmail}</p>
                <p className="mt-2 text-xs text-muted-ink">
                  Registrada con la encuesta. No verifica identidad o
                  parentesco; no autoriza promociones al estudiante.
                </p>
              </div>
            )}
          </Card.Content>
        </Card>
        <Card>
          <Card.Header>
            <Card.Title>Seguimiento</Card.Title>
          </Card.Header>
          <Card.Content>
            <CrmFollowUp lead={lead} />
          </Card.Content>
        </Card>
      </div>
    </>
  );
}
