import assert from 'node:assert/strict';
import { it } from 'node:test';
import { surveyAnswers, surveySchema } from './survey-validation.ts';
const response = {
  submissionId: 'b45678cd-1234-4123-8123-1234567890ab',
  audience: 'guardian',
  fullName: 'Alex',
  email: 'alex@example.com',
  city: 'santiago',
  need: 'explore',
  professions: ['technology'],
  participation: 'yes',
  willingness: 'pay',
  priceRange: 'depends',
  guardianConsent: false,
  privacyConsent: true,
  marketingConsent: false,
  website: '',
};
it('exige preguntas comerciales solo a padres y orientadores', () => {
  assert.equal(
    surveySchema.safeParse({ ...response, willingness: undefined }).success,
    false,
  );
  const student = surveySchema.parse({
    ...response,
    audience: 'student',
    studentAge: 'adult',
    willingness: undefined,
    priceRange: undefined,
  });
  assert.equal(surveyAnswers(student).priceRange, undefined);
});
it('menores necesitan nombre, correo y autorización del tutor, y no autorizan marketing', () => {
  const minor = {
    ...response,
    audience: 'student',
    studentAge: 'minor',
    guardianConsent: false,
  };
  assert.equal(surveySchema.safeParse(minor).success, false);
  const valid = surveySchema.parse({
    ...minor,
    guardianName: 'Tutor Prueba',
    guardianEmail: 'tutor@example.com',
    guardianConsent: true,
    marketingConsent: true,
  });
  const answers = surveyAnswers(valid);
  assert.equal(answers.marketingConsent, false);
  assert.equal(answers.guardianEmail, 'tutor@example.com');
  assert.equal(answers.priceRange, undefined);
});
it('valida otras respuestas, consentimiento, honeypot y quita campos de ramas ocultas', () => {
  for (const patch of [
    { city: 'other' },
    { professions: ['other'] },
    { professions: [] },
    { privacyConsent: false },
    { website: 'spam' },
    { email: 'invalido' },
  ])
    assert.equal(
      surveySchema.safeParse({ ...response, ...patch }).success,
      false,
    );
  const value = surveyAnswers(
    surveySchema.parse({
      ...response,
      guardianName: 'residuo',
      studentAge: 'minor',
      otherCity: 'residuo',
      otherProfession: 'residuo',
    }),
  );
  assert.equal(value.guardianName, undefined);
  assert.equal(value.studentAge, undefined);
  assert.equal(value.otherCity, undefined);
  assert.equal(value.otherProfession, undefined);
});
