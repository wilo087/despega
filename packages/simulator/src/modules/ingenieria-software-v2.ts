import type { Scene } from '../types.ts';

/** Reglas originales de 1.3, conservadas para intentos de guion v2. */
export const reportsV2: Scene = {
  id: '1.3',
  title: 'Los reportes',
  clock: '9:10 a. m.',
  screen: 'inbox',
  participants: ['marisol'],
  hud: { complaints: true },
  lines: [
    {
      speaker: 'marisol',
      mood: 'serious',
      text: 'Te reenvié 4 reportes de soporte. Agrúpalos según la conexión de cada usuario: puede que ahí esté la pista.',
    },
  ],
  interaction: {
    kind: 'classification',
    prompt: 'Arrastra o toca cada reporte y ubícalo en su categoría antes de que se acabe el tiempo.',
    timeLimitSeconds: 45,
    categories: [
      { id: 'lenta', label: 'Conexión lenta', emoji: '🐢' },
      { id: 'rapida', label: 'Conexión rápida', emoji: '⚡' },
    ],
    items: [
      {
        id: 'wifi-publico',
        from: 'Valentina R.',
        title: 'Wifi público de un café',
        body: '«Toqué “Confirmar pedido” y se quedó pensando… nunca confirmó.»',
        correctCategoryId: 'lenta',
      },
      {
        id: 'fibra',
        from: 'Sofía M.',
        title: 'Fibra óptica en casa',
        body: '«A mí me funcionó sin problemas. Pedido confirmado al instante.»',
        correctCategoryId: 'rapida',
      },
      {
        id: 'datos-debiles',
        from: 'Mateo G.',
        title: 'Datos móviles débiles',
        body: '«Tenía una rayita de señal. Me salió un error después de tocar el botón.»',
        correctCategoryId: 'lenta',
      },
      {
        id: 'mala-senal',
        from: 'Daniel P.',
        title: 'Zona con mala señal',
        body: '«Le di dos veces al botón y no pasó nada.»',
        correctCategoryId: 'lenta',
      },
    ],
    tiers: [
      {
        minCorrect: 3,
        outcome: {
          id: 'patron-claro',
          label: '3 o más reportes bien clasificados',
          performance: 5,
          affinity: { analytical: 6, detail: 2 },
          flags: { s1Clue: 'clear' },
          reactions: [
            { speaker: 'marisol', mood: 'happy', text: '¡Ahí está el patrón! Los que fallan tienen conexión lenta. Los de buena señal, no.' },
          ],
        },
      },
      {
        minCorrect: 1,
        outcome: {
          id: 'patron-parcial',
          label: '1–2 reportes bien clasificados',
          performance: 1,
          affinity: { detail: 2 },
          flags: { s1Clue: 'partial' },
          reactions: [
            { speaker: 'marisol', mood: 'neutral', text: 'Algo tiene que ver con la conexión, pero todavía no está del todo claro.' },
          ],
        },
      },
      {
        minCorrect: 0,
        outcome: {
          id: 'sin-patron',
          label: 'Ningún reporte bien clasificado a tiempo',
          performance: -2,
          flags: { s1Clue: 'none' },
          reactions: [
            { speaker: 'marisol', mood: 'concerned', text: 'Con esto no aparece ningún patrón. Seguimos sin pista; toca avanzar igual.' },
          ],
        },
      },
    ],
  },
};
