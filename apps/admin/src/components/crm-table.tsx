'use client';
import { Table, Chip } from '@heroui/react';
import Link from 'next/link';
import {
  AUDIENCES,
  CITIES,
  LEAD_STATUSES,
  PARTICIPATION,
  type SurveyLead,
} from '@despega/data/survey';
export function CrmTable({ leads }: { leads: SurveyLead[] }) {
  return (
    <>
      <ul className="divide-y divide-line rounded-2xl border border-line bg-surface md:hidden">
        {leads.map((l) => (
          <li className="p-4" key={l.id}>
            <Link
              href={`/crm/${encodeURIComponent(l.id)}`}
              className="font-semibold text-accent"
            >
              {l.fullName}
            </Link>
            <p className="mt-1 break-all text-sm text-muted-ink">{l.email}</p>
            <p className="mt-2 text-xs text-muted-ink">
              {AUDIENCES[l.audience]} · {LEAD_STATUSES[l.status]}
            </p>
          </li>
        ))}
      </ul>
      <Table className="max-md:hidden">
        <Table.ScrollContainer>
          <Table.Content aria-label="Respuestas de la encuesta">
            <Table.Header>
              <Table.Column isRowHeader>Contacto</Table.Column>
              <Table.Column>Perfil y ciudad</Table.Column>
              <Table.Column>Participación</Table.Column>
              <Table.Column>Seguimiento</Table.Column>
            </Table.Header>
            <Table.Body>
              {leads.map((l) => (
                <Table.Row key={l.id} id={l.id}>
                  <Table.Cell>
                    <Link
                      href={`/crm/${encodeURIComponent(l.id)}`}
                      className="font-semibold text-accent hover:underline"
                    >
                      {l.fullName}
                    </Link>
                    <p className="text-xs text-muted-ink">{l.email}</p>
                  </Table.Cell>
                  <Table.Cell>
                    <p className="max-w-56 text-sm">{AUDIENCES[l.audience]}</p>
                    <p className="text-xs text-muted-ink">
                      {l.city === 'other' ? l.otherCity : CITIES[l.city]}
                    </p>
                  </Table.Cell>
                  <Table.Cell>
                    <p className="max-w-56 text-sm">
                      {PARTICIPATION[l.participation]}
                    </p>
                  </Table.Cell>
                  <Table.Cell>
                    <Chip size="sm" variant="soft">
                      <Chip.Label>{LEAD_STATUSES[l.status]}</Chip.Label>
                    </Chip>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </>
  );
}
