/** Contrato público de la encuesta. Sin SDK, I/O ni información de otros contactos. */
export const SURVEY_VERSION = 'landing-v1';
export const PRIVACY_VERSION = '2026-11-12';
export const AUDIENCES = {
  student: 'Soy estudiante y estoy pensando en mi futuro profesional.',
  guardian: 'Soy mamá, papá o tutor y acompaño a un joven en esta decisión.',
  counselor: 'Soy orientador/a o colaboro en un colegio.',
} as const;
export const CITIES = {
  'santo-domingo': 'Santo Domingo',
  santiago: 'Santiago',
  other: 'Otra ciudad',
} as const;
export const NEEDS = {
  profession: 'Conocer cómo es realmente una profesión.',
  interests: 'Descubrir mis intereses y habilidades.',
  explore: 'Explorar distintas opciones antes de decidir.',
  guidance: 'Contar con más herramientas para acompañar esta decisión.',
} as const;
export const PROFESSIONS = {
  marketing: 'Marketing',
  medicine: 'Medicina',
  psychology: 'Psicología',
  law: 'Derecho',
  engineering: 'Ingeniería',
  architecture: 'Arquitectura',
  business: 'Administración y Negocios',
  finance: 'Finanzas y Contabilidad',
  technology: 'Tecnología',
  other: 'Otra profesión',
} as const;
export const PARTICIPATION = {
  yes: '¡Sí! Me gustaría participar en una prueba.',
  information: 'Me gustaría saber un poco más antes de decidir.',
  unsure: 'Todavía no estoy seguro/a.',
} as const;
export const WILLINGNESS = {
  pay: 'Consideraría pagar si la experiencia me parece útil.',
  information:
    'Me interesaría conocer el precio y qué incluye antes de decidir.',
  school: 'Preferiría que el colegio ofreciera esta experiencia.',
  no: 'Por ahora, no estaría interesado/a.',
} as const;
export const PRICE_RANGES = {
  '4000-5999': 'Entre RD$4,000 y RD$5,999.',
  '6000-7999': 'Entre RD$6,000 y RD$7,999.',
  '8000-9999': 'Entre RD$8,000 y RD$9,999.',
  '10000-plus': 'RD$10,000 o más.',
  depends: 'Dependería de la experiencia y de lo que incluya.',
} as const;
export const LEAD_STATUSES = {
  new: 'Nuevo',
  contacted: 'Contactado',
  interested: 'Interesado',
  closed: 'Cerrado',
} as const;
export type SurveyAudience = keyof typeof AUDIENCES;
export type LeadStatus = keyof typeof LEAD_STATUSES;
export type SurveyAnswers = {
  audience: SurveyAudience;
  fullName: string;
  email: string;
  city: keyof typeof CITIES;
  otherCity?: string;
  need: keyof typeof NEEDS;
  professions: (keyof typeof PROFESSIONS)[];
  otherProfession?: string;
  participation: keyof typeof PARTICIPATION;
  willingness?: keyof typeof WILLINGNESS;
  priceRange?: keyof typeof PRICE_RANGES;
  studentAge?: 'adult' | 'minor';
  guardianName?: string;
  guardianEmail?: string;
  guardianConsent?: boolean;
  marketingConsent: boolean;
  source?: string;
  medium?: string;
  campaign?: string;
};
export type SurveyLead = SurveyAnswers & {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  status: LeadStatus;
  notes: string;
  surveyVersion: string;
  privacyVersion: string;
  consentAt: string;
  guardianConsentMethod?: 'joint-declaration';
  updatedBy?: string;
};
export type SurveyMetrics = Record<string, number>;
export function metricKeys(answers: SurveyAnswers): string[] {
  return [
    'total',
    `audience_${answers.audience}`,
    `city_${answers.city}`,
    `need_${answers.need}`,
    `participation_${answers.participation}`,
    ...[...new Set(answers.professions)].map((p) => `profession_${p}`),
    ...(answers.audience !== 'student'
      ? [
          'commercial',
          `willingness_${answers.willingness}`,
          `price_${answers.priceRange}`,
        ]
      : []),
    ...(answers.marketingConsent ? ['marketing'] : []),
  ];
}
export function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))
    text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function surveyCsv(leads: readonly SurveyLead[]): string {
  const rows: unknown[][] = [
    [
      'Fecha',
      'Nombre',
      'Correo',
      'Perfil',
      'Ciudad',
      'Necesidad',
      'Profesiones',
      'Participación',
      'Disposición de pago',
      'Precio razonable',
      'Estado',
      'Novedades autorizadas',
      'Versión de privacidad',
    ],
  ];
  for (const l of leads)
    rows.push([
      l.createdAt,
      l.fullName,
      l.email,
      AUDIENCES[l.audience],
      l.city === 'other' ? l.otherCity : CITIES[l.city],
      NEEDS[l.need],
      l.professions
        .map((p) => (p === 'other' ? l.otherProfession : PROFESSIONS[p]))
        .join('; '),
      PARTICIPATION[l.participation],
      l.willingness ? WILLINGNESS[l.willingness] : '',
      l.priceRange ? PRICE_RANGES[l.priceRange] : '',
      LEAD_STATUSES[l.status],
      l.marketingConsent ? 'Sí' : 'No',
      l.privacyVersion,
    ]);
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}
