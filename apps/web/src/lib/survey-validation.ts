import { z } from 'zod';
import {
  AUDIENCES,
  CITIES,
  NEEDS,
  PARTICIPATION,
  PRICE_RANGES,
  PROFESSIONS,
  WILLINGNESS,
  type SurveyAnswers,
} from '@despega/data/survey';
const choice = <T extends Record<string, string>>(values: T) =>
  z.enum(Object.keys(values) as [keyof T & string, ...(keyof T & string)[]]);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);
export const surveySchema = z
  .object({
    submissionId: z.uuidv4(),
    audience: choice(AUDIENCES),
    fullName: z.string().trim().min(2, 'Escribe tu nombre.').max(100),
    email: z
      .string()
      .trim()
      .max(254)
      .pipe(z.email('Revisa tu correo.'))
      .transform((v) => v.trim().toLowerCase()),
    city: choice(CITIES),
    otherCity: optionalText(100),
    need: choice(NEEDS),
    professions: z
      .array(choice(PROFESSIONS))
      .min(1, 'Elige al menos una profesión.')
      .max(10)
      .transform((v) => [...new Set(v)]),
    otherProfession: optionalText(120),
    participation: choice(PARTICIPATION),
    willingness: choice(WILLINGNESS).optional(),
    priceRange: choice(PRICE_RANGES).optional(),
    studentAge: z.enum(['adult', 'minor']).optional(),
    guardianName: optionalText(100),
    guardianEmail: optionalText(254),
    guardianConsent: z.boolean(),
    privacyConsent: z.literal(
      true,
      'Necesitamos tu autorización para recibir la encuesta.',
    ),
    marketingConsent: z.boolean(),
    website: z.string().max(0),
    source: optionalText(80),
    medium: optionalText(80),
    campaign: optionalText(80),
  })
  .superRefine((data, context) => {
    const issue = (path: string, message: string) =>
      context.addIssue({ code: 'custom', path: [path], message });
    if (data.city === 'other' && !data.otherCity)
      issue('otherCity', 'Escribe tu ciudad.');
    if (data.professions.includes('other') && !data.otherProfession)
      issue('otherProfession', 'Escribe la otra profesión.');
    if (data.audience !== 'student') {
      if (!data.willingness)
        issue('willingness', 'Selecciona tu disposición de participación.');
      if (!data.priceRange)
        issue('priceRange', 'Selecciona una opción de precio.');
    } else {
      if (!data.studentAge)
        issue('studentAge', 'Indica si tienes 18 años o más.');
      if (data.studentAge === 'minor') {
        if (!data.guardianName || data.guardianName.length < 2)
          issue('guardianName', 'El tutor debe escribir su nombre.');
        if (
          !data.guardianEmail ||
          !z.email().safeParse(data.guardianEmail).success
        )
          issue('guardianEmail', 'El tutor debe escribir un correo válido.');
        if (!data.guardianConsent)
          issue(
            'guardianConsent',
            'Completa la encuesta junto a tu tutor y registra su autorización.',
          );
      }
    }
  });
export function surveyAnswers(
  data: z.infer<typeof surveySchema>,
): SurveyAnswers {
  const answers = {
    audience: data.audience,
    fullName: data.fullName,
    email: data.email,
    city: data.city,
    need: data.need,
    professions: data.professions,
    participation: data.participation,
    source: data.source,
    medium: data.medium,
    campaign: data.campaign,
  };
  const student = data.audience === 'student';
  const minor = student && data.studentAge === 'minor';
  return {
    ...answers,
    otherCity: data.city === 'other' ? data.otherCity : undefined,
    otherProfession: data.professions.includes('other')
      ? data.otherProfession
      : undefined,
    willingness: !student ? data.willingness : undefined,
    priceRange: !student ? data.priceRange : undefined,
    studentAge: student ? data.studentAge : undefined,
    guardianName: minor ? data.guardianName : undefined,
    guardianEmail: minor ? data.guardianEmail?.toLowerCase() : undefined,
    guardianConsent: minor ? data.guardianConsent : undefined,
    // El contacto promocional de menores no forma parte de esta encuesta.
    marketingConsent: minor ? false : data.marketingConsent,
  };
}
