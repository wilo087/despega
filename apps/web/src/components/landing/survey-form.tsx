'use client';
import { useActionState, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  LoaderCircle,
} from 'lucide-react';
import Link from 'next/link';
import {
  AUDIENCES,
  CITIES,
  NEEDS,
  PARTICIPATION,
  PRICE_RANGES,
  PROFESSIONS,
  WILLINGNESS,
} from '@despega/data/survey';
import {
  submitSurveyAction,
  type SurveyFormState,
} from '@/app/encuesta/actions';
const STEPS = [
  'Sobre ti',
  'Tus intereses',
  'La experiencia',
  'Tu autorización',
];
export function SurveyForm({
  submissionId,
  attribution,
}: {
  submissionId: string;
  attribution: { source?: string; medium?: string; campaign?: string };
}) {
  const [state, action, pending] = useActionState(
    submitSurveyAction,
    {} as SurveyFormState,
  );
  const [step, setStep] = useState(0);
  const [audience, setAudience] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [professions, setProfessions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const form = useRef<HTMLFormElement>(null);
  const minor = audience === 'student' && age === 'minor';
  function move(next: number) {
    if (next > step) {
      const controls = form.current?.querySelectorAll<
        HTMLInputElement | HTMLSelectElement
      >(`[data-step="${step}"] input, [data-step="${step}"] select`);
      for (const control of controls ?? [])
        if (!control.checkValidity()) {
          control.reportValidity();
          return;
        }
      if (step === 1 && !professions.length) {
        setError('Elige al menos una profesión.');
        return;
      }
    }
    setError('');
    setStep(next);
    document
      .getElementById('survey-heading')
      ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  if (state.success)
    return (
      <div
        className="card grid justify-items-start gap-5 p-7 sm:p-10"
        role="status"
      >
        <CheckCircle2 className="size-12 text-brand-strong" aria-hidden />
        <p className="eyebrow">Respuesta guardada</p>
        <h3 className="text-3xl font-bold">
          ¡Gracias por despegar con nosotros!
        </h3>
        <p className="text-ink-soft">
          Tu respuesta nos ayudará a construir una experiencia que tenga sentido
          para estudiantes, familias y orientadores.
        </p>
        <p className="text-sm text-muted">
          El equipo de DESPEGA podrá consultar tu encuesta. Recibir novedades
          depende de la autorización opcional que hayas marcado.
        </p>
        <Link href="/experiencia" className="btn btn-primary">
          Conocer las experiencias <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  return (
    <form ref={form} action={action} noValidate className="card p-5 sm:p-8">
      <input type="hidden" name="submissionId" value={submissionId} />
      {Object.entries(attribution).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value ?? ''} />
      ))}
      <div className="absolute -left-[10000px]" aria-hidden="true">
        <label>
          Deja este campo vacío
          <input name="website" autoComplete="off" tabIndex={-1} />
        </label>
      </div>
      <ol
        className="mb-8 grid grid-cols-4 gap-2"
        aria-label="Pasos de la encuesta"
      >
        {STEPS.map((title, i) => (
          <li
            key={title}
            aria-current={i === step ? 'step' : undefined}
            className={`border-t-2 pt-3 text-xs ${i <= step ? 'border-brand text-ink' : 'border-line text-muted'}`}
          >
            <span className="mb-1 block font-bold">
              {i < step ? (
                <Check className="size-4" aria-label="Completado" />
              ) : (
                `0${i + 1}`
              )}
            </span>
            <span>{title}</span>
          </li>
        ))}
      </ol>
      <p className="eyebrow">Paso {step + 1} de 4</p>
      <h3
        id="survey-heading"
        className="mb-7 mt-2 scroll-mt-24 text-2xl font-bold"
      >
        {STEPS[step]}
      </h3>
      <section data-step="0" hidden={step !== 0} className="space-y-7">
        <Choices
          name="audience"
          title="1. Para empezar, ¿quién eres?"
          values={AUDIENCES}
          onChange={setAudience}
          required
        />
        {audience === 'student' && (
          <Choices
            name="studentAge"
            title="¿Tienes 18 años o más?"
            values={{
              adult: 'Sí, tengo 18 años o más.',
              minor: 'No, tengo menos de 18 años.',
            }}
            onChange={setAge}
            required
          />
        )}
        {minor && (
          <div className="rounded-xl border border-line bg-brand-soft p-4 text-sm text-ink">
            Completa esta encuesta junto a tu madre, padre o tutor. Al final
            registraremos su autorización y correo. No te suscribiremos a
            comunicaciones promocionales.
          </div>
        )}
        <fieldset>
          <legend className="mb-4 font-semibold">
            2. ¿Cómo te llamas y dónde podemos escribirte?{' '}
            <span aria-label="obligatorio">*</span>
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="fullName"
              label="Nombre"
              autoComplete="name"
              maxLength={100}
              required
            />
            <TextField
              name="email"
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
            />
          </div>
        </fieldset>
        <Choices
          name="city"
          title="3. ¿Desde dónde nos acompañas?"
          help="Cuéntanos en qué ciudad vives o dónde está tu colegio."
          values={CITIES}
          onChange={setCity}
          required
        />
        {city === 'other' && (
          <TextField
            name="otherCity"
            label="¿Cuál ciudad?"
            maxLength={100}
            required
          />
        )}
      </section>
      <section data-step="1" hidden={step !== 1} className="space-y-7">
        <Choices
          name="need"
          title="4. Cuando piensas en elegir una profesión, ¿qué te gustaría conocer o resolver?"
          values={NEEDS}
          required
        />
        <Choices
          name="professions"
          title="5. Si pudieras explorar una o varias profesiones, ¿cuáles te llamarían la atención?"
          help="¡Puedes elegir todas las que quieras!"
          values={PROFESSIONS}
          multiple
          onToggle={(key, checked) =>
            setProfessions((current) =>
              checked ? [...current, key] : current.filter((p) => p !== key),
            )
          }
        />
        {professions.includes('other') && (
          <TextField
            name="otherProfession"
            label="¿Cuál otra profesión?"
            maxLength={120}
            required
          />
        )}
      </section>
      <section data-step="2" hidden={step !== 2} className="space-y-7">
        <Choices
          name="participation"
          title="6. En DESPEGA queremos crear experiencias virtuales para conocer mejor cómo se trabaja en distintas profesiones. ¿Te gustaría ser parte?"
          values={PARTICIPATION}
          required
        />
        {audience && audience !== 'student' && (
          <>
            <Choices
              name="willingness"
              title="7. Si DESPEGA ofreciera esta experiencia, ¿cuál opción se acercaría más a tu decisión?"
              values={WILLINGNESS}
              required
            />
            <Choices
              name="priceRange"
              title="8. Pensando en una experiencia individual, ¿qué precio te parecería razonable?"
              help="Los rangos son parte de la investigación; no son precios de venta."
              values={PRICE_RANGES}
              required
            />
          </>
        )}
      </section>
      <section data-step="3" hidden={step !== 3} className="space-y-6">
        <p className="text-ink-soft">
          Usaremos tus respuestas para entender intereses y mejorar DESPEGA.
          Esta encuesta no crea una cuenta ni realiza un cobro.
        </p>
        {minor && (
          <fieldset className="space-y-4 rounded-xl border border-line bg-brand-soft p-4">
            <legend className="px-1 font-bold">
              Autorización de madre, padre o tutor
            </legend>
            <TextField
              name="guardianName"
              label="Nombre del adulto responsable"
              maxLength={100}
              required
            />
            <TextField
              name="guardianEmail"
              label="Correo del adulto responsable"
              type="email"
              maxLength={254}
              required
            />
            <label className="flex items-start gap-3 text-sm">
              <ConsentInput name="guardianConsent" required />
              <span>
                Declaro que soy madre, padre o tutor, estoy completando esta
                encuesta junto al estudiante y autorizo el tratamiento de sus
                respuestas y datos para esta investigación. *
              </span>
            </label>
          </fieldset>
        )}
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <ConsentInput name="privacyConsent" required />
          <span>
            He leído el{' '}
            <Link
              href="/privacidad"
              target="_blank"
              className="font-semibold text-accent underline"
            >
              aviso de privacidad
            </Link>{' '}
            y autorizo el tratamiento de mis datos para atender mi solicitud. *
          </span>
        </label>
        {!minor && (
          <label className="flex items-start gap-3 text-sm leading-relaxed">
            <ConsentInput name="marketingConsent" />
            <span>
              Quiero recibir novedades de DESPEGA y comunicaciones sobre futuras
              experiencias. Es opcional.
            </span>
          </label>
        )}
        <p className="text-xs text-muted">
          Puedes participar sin autorizar novedades. No enviaremos mensajes
          automáticos desde este formulario.
        </p>
      </section>
      {(error || state.error) && (
        <div
          role="alert"
          className="mt-6 rounded-xl bg-bad-soft p-4 text-sm text-bad-strong"
        >
          <p>{error || state.error}</p>
          {state.fields && (
            <ul className="mt-2 list-inside list-disc">
              {Object.entries(state.fields).map(([key, message]) => (
                <li key={key}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <span className="text-xs text-muted">* Campos obligatorios</span>
        <div className="flex gap-2">
          {step > 0 && (
            <button
              type="button"
              className="btn btn-ghost"
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                move(step - 1);
              }}
            >
              <ArrowLeft className="size-4" aria-hidden />
              Atrás
            </button>
          )}
          {step < 3 ? (
            <button
              key="continue"
              type="button"
              className="btn btn-primary"
              onClick={(event) => {
                event.preventDefault();
                move(step + 1);
              }}
            >
              Continuar
              <ArrowRight className="size-4" aria-hidden />
            </button>
          ) : (
            <button
              key="submit"
              type="submit"
              className="btn btn-primary"
              disabled={pending}
            >
              {pending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : (
                <Check className="size-4" aria-hidden />
              )}
              {pending ? 'Guardando…' : 'Enviar mis respuestas'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
function TextField({
  name,
  label,
  ...props
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  maxLength?: number;
  required?: boolean;
}) {
  const [value, setValue] = useState('');
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="field-input"
        {...props}
      />
    </label>
  );
}
function Choices({
  name,
  title,
  help,
  values,
  multiple,
  required,
  onChange,
  onToggle,
}: {
  name: string;
  title: string;
  help?: string;
  values: Record<string, string>;
  multiple?: boolean;
  required?: boolean;
  onChange?: (key: string) => void;
  onToggle?: (key: string, checked: boolean) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <fieldset>
      <legend className="font-semibold leading-relaxed">
        {title}{' '}
        {(required || multiple) && <span aria-label="obligatorio">*</span>}
      </legend>
      {help && <p className="mt-1 text-sm text-muted">{help}</p>}
      <div className={`mt-3 grid gap-2 ${multiple ? 'sm:grid-cols-2' : ''}`}>
        {Object.entries(values).map(([key, label]) => (
          <label
            key={key}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3.5 text-sm leading-relaxed transition-colors hover:bg-mist has-checked:border-accent has-checked:bg-accent-soft"
          >
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name={name}
              value={key}
              checked={selected.includes(key)}
              required={!multiple && required}
              className="mt-1 size-4 shrink-0 accent-accent"
              onChange={(e) => {
                const checked = e.target.checked;
                setSelected((current) =>
                  multiple
                    ? checked
                      ? [...current, key]
                      : current.filter((v) => v !== key)
                    : [key],
                );
                onChange?.(key);
                onToggle?.(key, checked);
              }}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ConsentInput({
  name,
  required,
}: {
  name: string;
  required?: boolean;
}) {
  const [checked, setChecked] = useState(false);
  return (
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={(e) => setChecked(e.target.checked)}
      required={required}
      className="mt-1 size-4 accent-accent"
    />
  );
}
