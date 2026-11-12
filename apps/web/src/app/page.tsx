import { randomUUID } from 'node:crypto';
import {
  ArrowDown,
  ArrowRight,
  Compass,
  GraduationCap,
  HeartHandshake,
  School,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { SurveyForm } from '@/components/landing/survey-form';
import { BrandLink } from '@/components/site/brand';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Antes de elegir una profesión, explórala',
  description:
    'Ayúdanos a construir DESPEGA. Una propuesta para estudiantes, familias y orientadores que quieren explorar el mundo de las profesiones.',
};
export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (key: string) =>
    typeof params[key] === 'string' ? params[key].slice(0, 80) : undefined;
  return (
    <>
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
          <BrandLink height={30} />
          <nav
            className="flex items-center gap-5 text-sm font-semibold"
            aria-label="Principal"
          >
            <a className="hidden text-ink-soft sm:block" href="#propuesta">
              La propuesta
            </a>
            <Link href="/experiencia" className="hidden text-ink-soft sm:block">
              Experiencias
            </Link>
            <a href="#encuesta" className="btn btn-primary btn-sm">
              Quiero ser parte <ArrowRight className="size-4" aria-hidden />
            </a>
          </nav>
        </div>
      </header>
      <main>
        <section className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.18fr_1fr] lg:items-center lg:gap-16">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <Sparkles className="size-4" aria-hidden />
              Tu futuro empieza explorando
            </p>
            <h1 className="mt-6 max-w-3xl text-[clamp(3rem,6.2vw,6.3rem)] font-bold leading-[.99] tracking-tight">
              Antes de elegir una profesión,{' '}
              <span className="text-brand-strong">explórala.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft">
              Descubre cómo es el mundo laboral de una profesión a través de
              experiencias que te permitan explorar, experimentar y conocer
              mejor lo que implica ejercerla antes de decidir tu futuro.
            </p>
            <a href="#encuesta" className="btn btn-primary btn-lg mt-8">
              ¡Vamos a despegar juntos!{' '}
              <ArrowDown className="size-5" aria-hidden />
            </a>
            <p className="mt-4 text-sm text-muted">
              Comparte tu perspectiva en aproximadamente 2 minutos.
            </p>
          </div>
          <div className="relative rounded-[2rem] bg-night px-6 py-9 text-white sm:px-10 sm:py-12">
            <span className="chip bg-white/10 text-white/80">
              Un mundo por descubrir
            </span>
            <div className="mb-9 mt-9 flex items-end justify-between">
              <h2 className="max-w-[10ch] text-4xl font-semibold leading-tight sm:text-5xl">
                Hay más de un camino para ti.
              </h2>
              <Compass
                className="size-16 shrink-0 text-brand sm:size-24"
                strokeWidth={1}
                aria-hidden
              />
            </div>
            <div className="grid gap-0">
              {[
                [
                  '01',
                  'Explora',
                  'Acércate al trabajo detrás de una profesión.',
                ],
                [
                  '02',
                  'Experimenta',
                  'Imagina situaciones, herramientas y decisiones.',
                ],
                [
                  '03',
                  'Descubre',
                  'Encuentra nuevas preguntas sobre tu futuro.',
                ],
              ].map(([n, t, d]) => (
                <div
                  className="flex gap-5 border-t border-white/15 py-5"
                  key={n}
                >
                  <span className="pt-1 text-xs font-semibold text-brand">
                    {n}
                  </span>
                  <div>
                    <p className="text-xl font-bold">{t}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/65">
                      {d}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-white/50">
              Estamos construyendo esta propuesta contigo. Tus respuestas nos
              ayudan a darle forma.
            </p>
          </div>
        </section>
        <section
          id="propuesta"
          className="scroll-mt-8 border-y border-line bg-surface"
        >
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.8fr_1.2fr]">
            <p className="eyebrow">De una idea a una experiencia</p>
            <div>
              <h2 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
                Conocer el nombre de una carrera no es lo mismo que conocer la
                profesión.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-ink-soft">
                Elegir qué estudiar implica imaginar un futuro que todavía no se
                conoce del todo. Las materias, las opiniones de otras personas y
                las expectativas salariales pueden influir en la decisión, pero
                no siempre permiten visualizar cómo será el trabajo en la
                práctica.
              </p>
              <p className="mt-5 text-lg font-semibold leading-relaxed">
                En DESPEGA queremos explorar una pregunta: ¿y si pudieras
                conocer mejor una profesión antes de comprometerte con ella?
              </p>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="eyebrow">Diferentes perspectivas, una misma decisión</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold sm:text-4xl">
            Una propuesta para estudiantes, familias y orientadores.
          </h2>
          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            {[
              {
                icon: GraduationCap,
                t: 'Para estudiantes',
                d: 'Explora tus intereses y descubre nuevas perspectivas sobre las profesiones que te llaman la atención.',
              },
              {
                icon: HeartHandshake,
                t: 'Para madres y padres',
                d: 'Acompaña la decisión de tu hijo con más información y oportunidades para explorar.',
              },
              {
                icon: School,
                t: 'Para orientadores y colegios',
                d: 'Conoce una herramienta complementaria para enriquecer las conversaciones sobre el futuro profesional de los estudiantes.',
              },
            ].map((item) => (
              <article className="border-t border-line pt-6" key={item.t}>
                <item.icon
                  className="size-8 text-accent"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <h3 className="mt-5 text-xl font-bold">{item.t}</h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{item.d}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          id="encuesta"
          className="scroll-mt-6 border-t border-line bg-mist"
        >
          <div className="mx-auto grid max-w-7xl items-start gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.72fr_1.28fr]">
            <div className="lg:sticky lg:top-8">
              <p className="eyebrow">Tu opinión cuenta</p>
              <h2 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
                ¡Vamos a<br />
                despegar juntos!
              </h2>
              <p className="mt-6 leading-relaxed text-ink-soft">
                Queremos conocer tus ideas, lo que te preocupa y qué te gustaría
                descubrir sobre el mundo de las profesiones.
              </p>
              <p className="mt-4 leading-relaxed text-ink-soft">
                Tus respuestas nos ayudarán a construir una experiencia que
                tenga sentido para quienes están explorando su futuro,
                acompañando esa decisión o ayudando a otros a encontrar su
                camino.
              </p>
              <div className="mt-7 border-l-2 border-brand pl-4 text-sm leading-relaxed text-muted">
                Aproximadamente 2 minutos.
                <br />
                Sin crear una cuenta. Sin realizar un pago.
              </div>
            </div>
            <SurveyForm
              submissionId={randomUUID()}
              attribution={{
                source: value('utm_source'),
                medium: value('utm_medium'),
                campaign: value('utm_campaign'),
              }}
            />
          </div>
        </section>
      </main>
      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm sm:px-8 md:flex-row md:items-center md:justify-between">
          <BrandLink height={24} />
          <p className="text-muted">DESPEGA · Decide tu futuro.</p>
          <div className="flex flex-wrap gap-5 text-ink-soft">
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/experiencia">Conocer las experiencias</Link>
            <Link href="/ingresar">Ingresar</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
