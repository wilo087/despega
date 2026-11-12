/**
 * Catálogo actualizado con las observaciones del cliente de octubre de 2026.
 * Software e Industrial tienen módulos jugables; las demás carreras siguen próximas.
 */
export type CareerStatus = 'available' | 'coming-soon';

export type Career = {
  readonly id: string;
  readonly name: string;
  readonly area: string;
  readonly description: string;
  readonly emoji: string;
  readonly status: CareerStatus;
  /** Título del módulo jugable, cuando existe. */
  readonly moduleTitle?: string;
};

export const CAREERS: readonly Career[] = [
  {
    id: 'ingenieria-software',
    name: 'Ingeniería de Software',
    area: 'Tecnología',
    description: 'Tu experiencia como Practicante Junior en PixelForge: bugs en vivo, clientes esperando y un lanzamiento que no puede fallar.',
    emoji: '💻',
    status: 'available',
    moduleTitle: 'Tu experiencia como Practicante Junior en la empresa PixelForge',
  },
  { id: 'medicina', name: 'Medicina', area: 'Salud', description: 'Guardias, diagnósticos y decisiones que no esperan.', emoji: '🩺', status: 'coming-soon' },
  { id: 'marketing', name: 'Marketing', area: 'Negocios', description: 'Campañas, datos y audiencias que cambian de opinión en horas.', emoji: '📣', status: 'coming-soon' },
  { id: 'derecho', name: 'Derecho', area: 'Sociales', description: 'Casos, argumentos y clientes que confían en tu criterio.', emoji: '⚖️', status: 'coming-soon' },
  { id: 'arquitectura', name: 'Arquitectura', area: 'Diseño', description: 'Planos, obras y espacios pensados para las personas.', emoji: '📐', status: 'coming-soon' },
  { id: 'psicologia-clinica', name: 'Psicología Clínica', area: 'Salud', description: 'Escuchar, comprender y acompañar procesos de salud mental.', emoji: '🧠', status: 'coming-soon' },
  { id: 'psicologia-industrial', name: 'Psicología Industrial', area: 'Negocios', description: 'Comprender a las personas y mejorar su experiencia dentro de las organizaciones.', emoji: '👥', status: 'coming-soon' },
  { id: 'administracion', name: 'Administración de Empresas', area: 'Negocios', description: 'Equipos, presupuestos y decisiones que mueven una empresa.', emoji: '📊', status: 'coming-soon' },
  { id: 'diseno-grafico', name: 'Diseño Gráfico', area: 'Diseño', description: 'Ideas que se convierten en marcas, piezas y experiencias.', emoji: '🎨', status: 'coming-soon' },
  { id: 'ingenieria-civil', name: 'Ingeniería Civil', area: 'Ingeniería', description: 'Puentes, carreteras y obras que tienen que resistir.', emoji: '🏗️', status: 'coming-soon' },
  { id: 'finanzas', name: 'Contabilidad y Finanzas', area: 'Negocios', description: 'Números que cuentan la historia real de una organización.', emoji: '💹', status: 'coming-soon' },
  { id: 'comunicacion', name: 'Comunicación y Periodismo', area: 'Sociales', description: 'Historias, fuentes y cierres de edición contra el reloj.', emoji: '🎙️', status: 'coming-soon' },
  { id: 'ingenieria-mecanica', name: 'Ingeniería Mecánica', area: 'Ingeniería', description: 'Diseñar, probar y mejorar máquinas y sistemas en movimiento.', emoji: '⚙️', status: 'coming-soon' },
  { id: 'publicidad', name: 'Publicidad', area: 'Comunicación', description: 'Convertir ideas en mensajes y campañas que conectan con las personas.', emoji: '📢', status: 'coming-soon' },
  { id: 'odontologia', name: 'Odontología', area: 'Salud', description: 'Evaluar, prevenir y resolver problemas de salud bucal.', emoji: '🦷', status: 'coming-soon' },
  { id: 'hoteleria-turismo', name: 'Hotelería y Turismo', area: 'Servicios', description: 'Coordinar equipos y crear experiencias para quienes visitan un destino.', emoji: '🏨', status: 'coming-soon' },
  { id: 'economia', name: 'Economía', area: 'Negocios', description: 'Analizar cómo se distribuyen los recursos y qué cambia con cada decisión.', emoji: '📈', status: 'coming-soon' },
  { id: 'ingenieria-industrial', name: 'Ingeniería Industrial', area: 'Ingeniería', description: 'Explora EnvaPlast en 3D: mide, diseña y ayuda al equipo a cumplir un pedido de 9.000 cajas.', emoji: '🏭', status: 'available', moduleTitle: 'Tu experiencia en la planta EnvaPlast' },
  { id: 'educacion', name: 'Educación', area: 'Sociales', description: 'Aulas, planes y estudiantes que aprenden contigo.', emoji: '📚', status: 'coming-soon' },
];

export function findCareer(careerId: string): Career | undefined {
  return CAREERS.find((career) => career.id === careerId);
}
