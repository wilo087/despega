import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLink } from '@/components/site/brand';
export const metadata: Metadata = { title: 'Privacidad de la encuesta' };
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
      <BrandLink />
      <h1 className="mt-10 text-4xl font-bold">
        Privacidad de la encuesta DESPEGA
      </h1>
      <p className="mt-3 text-sm text-muted">
        Versión del 12 de noviembre de 2026
      </p>
      <div className="mt-8 space-y-7 leading-relaxed text-ink-soft">
        <section>
          <h2 className="mb-2 text-xl font-bold text-ink">
            Para qué usamos tus respuestas
          </h2>
          <p>
            El equipo de DESPEGA usa esta encuesta para investigar intereses
            sobre profesiones, evaluar posibles experiencias y atender tu
            solicitud de información o participación. No es una compra ni un
            diagnóstico vocacional.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-bold text-ink">Qué guardamos</h2>
          <p>
            Nombre, correo, perfil de participante, ciudad, preferencias
            profesionales y respuestas sobre participación. A familias y
            orientadores también les preguntamos su disposición de pago y rango
            de precio. Registramos fecha, versión de la encuesta y las
            autorizaciones otorgadas. Si llegas desde una campaña, podemos
            registrar su fuente, medio y nombre.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-bold text-ink">
            Participación de menores
          </h2>
          <p>
            Si tienes menos de 18 años debes completar la encuesta junto a tu
            madre, padre o tutor. Registramos el nombre y correo del adulto y su
            declaración de autorización. La autorización se declara en el
            formulario; este proceso no verifica su identidad. No suscribimos a
            menores a comunicaciones promocionales.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-bold text-ink">
            Acceso y comunicaciones
          </h2>
          <p>
            Las respuestas son consultadas por el equipo de administración de
            DESPEGA en una sección privada. Se alojan en la infraestructura AWS
            de la plataforma. La autorización para novedades se solicita por
            separado, es opcional y no condiciona participar. El formulario no
            envía correos automáticamente.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-bold text-ink">Tus opciones</h2>
          <p>
            Puedes solicitar acceso, corrección, eliminación o retiro de la
            autorización de novedades desde el correo registrado. El canal de
            coordinación técnica es{' '}
            <a
              href="mailto:info@qrioso.do"
              className="font-semibold text-accent underline"
            >
              info@qrioso.do
            </a>
            . El equipo coordinará tu solicitud con DESPEGA. Las respuestas se
            conservan durante la investigación y el seguimiento autorizado; la
            retención se revisará al cerrar la campaña.
          </p>
        </section>
      </div>
      <Link href="/#encuesta" className="btn btn-primary mt-10">
        Volver a la encuesta
      </Link>
    </main>
  );
}
