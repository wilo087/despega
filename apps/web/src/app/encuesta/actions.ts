'use server';
import { submitSurvey } from '@despega/data';
import { dataConfig } from '@/lib/data';
import { surveyAnswers, surveySchema } from '@/lib/survey-validation';
export type SurveyFormState = {
  success?: boolean;
  error?: string;
  fields?: Record<string, string>;
};
/** Acción expresamente pública: no crea cuentas ni permite leer contactos. */
export async function submitSurveyAction(
  _previous: SurveyFormState,
  form: FormData,
): Promise<SurveyFormState> {
  const optional = (name: string) => form.get(name) || undefined;
  const parsed = surveySchema.safeParse({
    submissionId: form.get('submissionId'),
    audience: form.get('audience'),
    fullName: form.get('fullName'),
    email: form.get('email'),
    city: form.get('city'),
    otherCity: optional('otherCity'),
    need: form.get('need'),
    professions: form.getAll('professions'),
    otherProfession: optional('otherProfession'),
    participation: form.get('participation'),
    willingness: optional('willingness'),
    priceRange: optional('priceRange'),
    studentAge: optional('studentAge'),
    guardianName: optional('guardianName'),
    guardianEmail: optional('guardianEmail'),
    guardianConsent: form.get('guardianConsent') === 'on',
    privacyConsent: form.get('privacyConsent') === 'on',
    marketingConsent: form.get('marketingConsent') === 'on',
    website: form.get('website') ?? '',
    source: optional('source'),
    medium: optional('medium'),
    campaign: optional('campaign'),
  });
  if (!parsed.success)
    return {
      error: 'Revisa tus respuestas antes de enviar.',
      fields: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path.join('.'), i.message]),
      ),
    };
  try {
    await submitSurvey(
      dataConfig(),
      surveyAnswers(parsed.data),
      parsed.data.submissionId,
      new Date().toISOString(),
    );
    return { success: true };
  } catch {
    // Nunca se registran el formulario, el correo ni el objeto de error del SDK.
    return {
      error:
        'No pudimos guardar tus respuestas. Conservamos el formulario: inténtalo de nuevo en un momento.',
    };
  }
}
