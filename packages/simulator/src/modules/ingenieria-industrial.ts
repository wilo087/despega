import type { CareerModule, Scene } from "../types.ts";
import type { FactoryTask } from "../factory/types.ts";
const choice = (id: string, label: string, cost?: number) => ({
  id,
  label,
  ...(cost === undefined ? {} : { cost }),
});
const scene = (id: string, title: string, task: FactoryTask): Scene => ({
  id,
  title,
  screen: "factory",
  factory: task,
  lines: [{ speaker: task.speaker, text: task.prompt }],
  interaction:
    task.kind === "summary"
      ? {
          kind: "summary",
          scope: id.startsWith("3") ? "module" : "session",
          heading: title,
        }
      : task.kind === "timeline"
        ? {
            kind: "timeline",
            stages: [],
            fork: {
              title: "Tu siguiente paso",
              narration: "Esta experiencia es un punto de partida.",
            },
            branches: [
              {
                id: "quality",
                path: "Calidad",
                title: "Calidad y mejora continua",
                narration: "Reducir defectos y desperdicio.",
                axes: ["detail", "analytical"],
              },
              {
                id: "supply",
                path: "Logística",
                title: "Cadena de suministro",
                narration: "Coordinar recursos, inventarios y distribución.",
                axes: ["numeric"],
              },
              {
                id: "management",
                path: "Gerencia",
                title: "Gerencia y emprendimiento",
                narration: "Dirigir equipos y proyectos.",
                axes: ["communication"],
              },
            ],
            alignmentNote: "Es una pista para explorar, no una predicción.",
          }
        : { kind: "none" },
});
const messageCards = [
  choice(
    "data",
    "El diagnóstico apunta al sellado; estamos verificando los datos.",
  ),
  choice("plan", "Tenemos un plan con responsables y una prueba piloto."),
  choice("update", "Te enviaré una actualización con cifras a las 2 p. m."),
  choice("promise", "Todo saldrá perfecto, te lo garantizo."),
  choice("blame", "La culpa es de los operarios; yo acabo de llegar."),
];
export const ingenieriaIndustrial: CareerModule = {
  id: "envaplast-industrial",
  careerId: "ingenieria-industrial",
  version: 1,
  presentation: "factory",
  title: "Ingeniería Industrial",
  tagline: "Tu experiencia en la planta EnvaPlast",
  company: "EnvaPlast",
  playerRole: "Practicante de ingeniería industrial",
  initialPerformance: 50,
  initialFlags: {
    confianza_wilfredo: 0,
    confianza_yuleisy: 0,
    bodega_vista: false,
    peligros_omitidos: 5,
    presupuesto_usado: 0,
    clima_equipo: 65,
    aliado_wilfredo: false,
    solucion_elegida: "method",
  },
  glossary: [
    {
      term: "Cuello de botella",
      meaning: "La etapa que limita la capacidad del proceso completo.",
    },
    {
      term: "Distribución",
      meaning: "Ubicación de máquinas, personas y recorridos en la planta.",
    },
    {
      term: "Pareto",
      meaning:
        "Ordenar las causas por frecuencia para identificar dónde concentrar el esfuerzo.",
    },
    {
      term: "Prueba piloto",
      meaning:
        "Ensayo pequeño de una mejora antes de aplicarla a toda la operación.",
    },
  ],
  characters: {
    altagracia: {
      id: "altagracia",
      name: "Ing. Altagracia Rosario",
      role: "Gerente de Operaciones",
      bio: "Te acompaña a medir, investigar y cuidar la operación.",
    },
    wilfredo: {
      id: "wilfredo",
      name: "Don Wilfredo",
      role: "Supervisor de línea",
      bio: "Conoce la planta desde hace 25 años. Quiere que su experiencia se escuche.",
    },
    yuleisy: {
      id: "yuleisy",
      name: "Yuleisy",
      role: "Operadora de sellado",
      bio: "Observa los detalles de la selladora y necesita confianza para compartirlos.",
    },
    kevin: {
      id: "kevin",
      name: "Kevin",
      role: "Encargado de almacén",
      bio: "Conoce el inventario de equipos y repuestos.",
    },
    marcos: {
      id: "marcos",
      name: "Lic. Marcos Peña",
      role: "Gerente Comercial",
      bio: "Coordina con el supermercado y necesita información confiable.",
    },
  },
  sessions: [
    {
      id: "industrial-1",
      number: 1,
      title: "La línea que no rinde",
      synopsis: "Explora, mide y encuentra dónde se acumula el trabajo.",
      estimatedMinutes: 32,
      scenes: [
        scene("1.0", "Tu personaje", {
          kind: "avatar",
          zone: "entrance",
          speaker: "system",
          prompt:
            "Comienza tu experiencia en EnvaPlast. Elige tu personaje y el nombre que usaremos en esta experiencia.",
        }),
        scene("1.1", "Un pedido urgente", {
          kind: "walk",
          zone: "office",
          speaker: "altagracia",
          prompt:
            "El pedido de 9.000 cajas sale en tres días. La Línea 2 va atrasada y todavía no sabemos por qué. Te espero en Operaciones.",
        }),
        scene("1.2", "Antes de opinar", {
          kind: "dialogue",
          zone: "office",
          speaker: "altagracia",
          skills: ["soft"],
          prompt:
            "Necesitamos entender el problema sin detener la planta. ¿Cómo vas a empezar?",
          choices: [
            choice(
              "data",
              "Dame los datos de producción antes de ir a la planta.",
            ),
            choice("rush", "Voy directo a la línea a ver qué pasa."),
            choice("people", "¿Quién conoce mejor esta línea?"),
          ],
        }),
        scene("1.3", "Seguridad antes de entrar", {
          kind: "hazards",
          zone: "entrance",
          speaker: "altagracia",
          skills: ["technical"],
          method: true,
          timeLimit: 60,
          prompt:
            "Elige tres elementos de protección y revisa el acceso. Hay cinco situaciones que requieren atención. Puedes usar el checklist o tu propio recorrido.",
          choices: [
            choice("helmet", "Casco"),
            choice("glasses", "Lentes"),
            choice("earplugs", "Tapones"),
            choice("gloves", "Guantes"),
            choice("coat", "Bata"),
          ],
        }),
        scene("1.4", "Escucha a quienes trabajan aquí", {
          kind: "explore",
          zone: "line",
          speaker: "wilfredo",
          skills: ["soft"],
          prompt:
            "Recorre la línea, conversa con el equipo y visita otras zonas. La tablet guarda tus hallazgos. Puedes terminar el recorrido cuando quieras.",
          choices: [
            choice(
              "respect",
              "Don Wilfredo, usted conoce la línea. ¿Me acompaña?",
            ),
            choice("accuse", "Vengo a revisar por qué no están cumpliendo."),
          ],
        }),
        scene("1.5", "Medir para comprender", {
          kind: "measure",
          zone: "line",
          speaker: "yuleisy",
          skills: ["technical", "tools"],
          timeLimit: 300,
          prompt:
            "Observa tres ciclos completos de cada estación. Usa el cronómetro, no adivines. Registraremos el promedio de tus tres mediciones.",
        }),
        scene("1.6", "Los datos de la línea", {
          kind: "spreadsheet",
          zone: "line",
          speaker: "altagracia",
          skills: ["tools", "technical"],
          timeLimit: 20,
          prompt:
            "Organiza los cinco tiempos en Excel. ¿Qué estación está limitando la producción?",
          choices: [
            choice("seal", "Sellado"),
            choice("fill", "Llenado"),
            choice("people", "Los operarios son lentos"),
          ],
        }),
        scene("1.7", "Responder al cliente", {
          kind: "message",
          zone: "office",
          speaker: "marcos",
          skills: ["tools", "soft"],
          prompt:
            "¿Cuándo van a poder cumplir? El cliente está preguntando. Prepara un correo con dos o tres bloques.",
          cards: messageCards,
        }),
        scene("1.8", "La máquina se detiene", {
          kind: "cutscene",
          zone: "line",
          speaker: "wilfredo",
          prompt:
            "Un golpe interrumpe la línea y la alarma enciende el pasillo. Esto no es la primera vez. Y no es culpa de la máquina.",
        }),
        scene("1.9", "Lo que descubriste", {
          kind: "summary",
          zone: "entrance",
          speaker: "altagracia",
          prompt:
            "Medir y escuchar ya cambió lo que sabemos. En la siguiente jornada investigaremos la causa y probaremos una mejora.",
        }),
      ],
    },
    {
      id: "industrial-2",
      number: 2,
      title: "Cambiar sin romper la planta",
      synopsis: "Diseña una solución que cuide recursos, seguridad y personas.",
      estimatedMinutes: 33,
      scenes: [
        scene("2.1", "Antes de culpar", {
          kind: "dialogue",
          zone: "line",
          speaker: "wilfredo",
          skills: ["soft"],
          prompt:
            "La selladora estaba mal calibrada. Don Wilfredo señala a Yuleisy delante del equipo: «Hay que prestar más atención». ¿Cómo intervienes?",
          choices: [
            choice(
              "record",
              "Veamos el registro de la máquina antes de culpar a alguien.",
            ),
            choice(
              "blame",
              "Don Wilfredo tiene razón; hay que tener más cuidado.",
            ),
            choice("private", "Prefiero hablar con cada persona por separado."),
          ],
        }),
        scene("2.2", "Encontrar las causas", {
          kind: "causes",
          zone: "office",
          speaker: "altagracia",
          skills: ["technical"],
          timeLimit: 90,
          prompt:
            "Ubica seis causas en el diagrama y descarta dos tarjetas que no explican el problema.",
          categories: [
            choice("machine", "Máquina"),
            choice("method", "Método"),
            choice("material", "Material"),
            choice("people", "Personas"),
            choice("discard", "Descartar"),
          ],
          cards: [
            choice("heat", "Temperatura de sellado inestable"),
            choice("sensor", "Sensor descalibrado"),
            choice("setup", "No hay ajuste documentado al cambiar turno"),
            choice("check", "No se verifica la primera caja"),
            choice("film", "Película plástica de espesor variable"),
            choice("training", "Falta práctica en calibración"),
            choice("logo", "El logo del supermercado es azul"),
            choice("lunch", "El comedor cambió el menú"),
          ],
          answers: {
            heat: "machine",
            sensor: "machine",
            setup: "method",
            check: "method",
            film: "material",
            training: "people",
            logo: "discard",
            lunch: "discard",
          },
        }),
        scene("2.3", "Dónde concentrar el esfuerzo", {
          kind: "spreadsheet",
          zone: "quality",
          speaker: "yuleisy",
          skills: ["tools", "technical"],
          prompt:
            "Ordena los defectos de mayor a menor. De 100 defectos, ¿qué porcentaje suman los dos más frecuentes?",
          cards: [
            choice("seal", "Sello defectuoso · 41"),
            choice("label", "Etiqueta torcida · 27"),
            choice("fill", "Llenado incompleto · 15"),
            choice("box", "Caja dañada · 12"),
            choice("other", "Otros · 5"),
          ],
        }),
        scene("2.4", "Diseña la distribución", {
          kind: "layout",
          zone: "line",
          speaker: "altagracia",
          skills: ["technical"],
          method: true,
          prompt:
            "Diseña el recorrido de las cinco estaciones. Conserva un metro de pasillo, la salida despejada y el orden del flujo. El equipo debe poder trabajar sin cruces.",
          choices: [
            choice("method", "Mejorar el método de la línea"),
            choice("parallel", "Instalar una segunda selladora"),
          ],
        }),
        scene("2.5", "Cada recurso cuenta", {
          kind: "budget",
          zone: "office",
          speaker: "altagracia",
          skills: ["tools", "technical"],
          method: true,
          prompt:
            "Dispones de $5.000. Incluye compra e instalación si tu solución las necesita. Decide qué acciones atacan la causa.",
          choices: [
            choice("training", "Capacitar al equipo", 1500),
            choice("maintenance", "Mantenimiento preventivo", 2000),
            choice("install", "Mover e instalar la máquina", 2500),
            choice("overtime", "Horas extra", 3000),
          ],
        }),
        scene("2.6", "Cambiar con el equipo", {
          kind: "dialogue",
          zone: "line",
          speaker: "wilfredo",
          skills: ["soft"],
          timeLimit: 25,
          prompt:
            "Así hemos trabajado 25 años. ¿Por qué mover las cosas ahora?",
          choices: [
            choice(
              "respect",
              "Usted conoce esta línea mejor que nadie. ¿Qué cambiaría?",
            ),
            choice(
              "data",
              "Miremos juntos los tiempos del gráfico y hagamos una prueba.",
            ),
            choice("impose", "Es orden de la gerencia. Hay que hacerlo."),
          ],
        }),
        scene("2.7", "Prueba piloto", {
          samples: Array.from({ length: 10 }, (_, i) => ({
            id: `sample-${i + 1}`,
            sealGap: [1, 4, 7].includes(i) ? 0.2 : 0,
          })),
          kind: "inspection",
          zone: "quality",
          speaker: "yuleisy",
          skills: ["technical", "soft"],
          timeLimit: 120,
          prompt:
            "Observa la nueva configuración durante la prueba. Inspecciona diez cajas y marca las que tengan defectos visibles. La muestra y el proceso son parte de tu evidencia.",
        }),
        scene("2.8", "El plazo cambió", {
          kind: "cutscene",
          zone: "office",
          speaker: "marcos",
          prompt:
            "El cliente adelantó el despacho. Necesitamos todo mañana a las 2 p. m. Confírmame las cifras y los riesgos; todavía podemos organizarnos.",
        }),
        scene("2.9", "Preparar el próximo turno", {
          kind: "summary",
          zone: "entrance",
          speaker: "altagracia",
          prompt:
            "La distribución, el presupuesto y la confianza ya están guardados. El próximo turno pondrá a prueba tu plan.",
        }),
      ],
    },
    {
      id: "industrial-3",
      number: 3,
      title: "Turno de entrega",
      synopsis: "Decide bajo presión sin perder de vista calidad y personas.",
      estimatedMinutes: 33,
      scenes: [
        scene("3.1", "Empieza el turno", {
          kind: "walk",
          zone: "line",
          speaker: "altagracia",
          prompt:
            "Tenemos ocho horas de operación, representadas en 25 minutos de tiempo activo. El contador reúne lo producido durante las tres jornadas. Revisa tu plan y acompaña al equipo.",
        }),
        scene("3.2", "La selladora pide atención", {
          kind: "dialogue",
          zone: "line",
          speaker: "yuleisy",
          skills: ["technical", "soft"],
          timeLimit: 20,
          prompt:
            "La alarma vuelve a sonar. El registro muestra una desviación en la temperatura. ¿Cómo respondes?",
          choices: [
            choice("stop", "Parar diez minutos para revisar y mantener."),
            choice("watch", "Seguir produciendo y vigilar el sellado."),
            choice("support", "Pedir apoyo a mantenimiento por Teams."),
          ],
        }),
        scene("3.3", "Reorganizar el equipo", {
          kind: "staff",
          zone: "line",
          speaker: "wilfredo",
          skills: ["technical", "soft"],
          method: true,
          timeLimit: 45,
          prompt:
            "Yuleisy no llegó. Reasigna al equipo sin dejar estaciones vacías. Lee las fortalezas de cada persona. Si cuentas con Don Wilfredo, puede cubrir una estación.",
        }),
        scene("3.4", "Una confirmación responsable", {
          kind: "message",
          zone: "office",
          speaker: "marcos",
          skills: ["tools", "soft"],
          timeLimit: 40,
          prompt:
            "Necesito una confirmación para el cliente. Incluye la cifra real de la tablet, el riesgo, el plan y la próxima actualización.",
          cards: [
            choice(
              "figure",
              "La cifra confirmada es la que figura en producción; el resto sigue en proceso.",
            ),
            choice(
              "risk",
              "Existe riesgo de no completar todo dentro del plazo.",
            ),
            choice(
              "plan",
              "Estamos priorizando calidad y ajustando la asignación del equipo.",
            ),
            choice("update", "Te actualizaré al cerrar este turno."),
            choice(
              "promise",
              "Prometo las 9.000 cajas, aunque todavía no tenga respaldo.",
            ),
          ],
        }),
        scene("3.5", "Una persona necesita ayuda", {
          kind: "dialogue",
          zone: "line",
          speaker: "wilfredo",
          skills: ["technical", "soft"],
          timeLimit: 15,
          prompt:
            "Un operario resbala cerca del acceso. La línea sigue trabajando. ¿Qué haces?",
          choices: [
            choice("stop", "Detener la línea y atender a la persona."),
            choice(
              "security",
              "Pedir a seguridad que atienda y coordinar la línea.",
            ),
            choice("ignore", "Seguir sin atender para no perder producción."),
          ],
        }),
        scene("3.6", "El despacho", {
          kind: "dashboard",
          zone: "office",
          speaker: "altagracia",
          prompt:
            "Cerramos el turno. Estas cifras provienen de tu configuración, los paros, los defectos y las decisiones de las tres jornadas. Revisa qué pudimos entregar y qué queda por resolver.",
        }),
        scene("3.7", "Lo que te llevas", {
          kind: "dialogue",
          zone: "office",
          speaker: "altagracia",
          prompt:
            "¿Qué aprendiste de esta experiencia? Las tres respuestas son válidas.",
          choices: [
            choice(
              "measure",
              "Medir antes de opinar evita culpar a la persona equivocada.",
            ),
            choice("team", "Sin el equipo, el mejor análisis no cambia nada."),
            choice(
              "pressure",
              "Hay que decidir con la información disponible cuando el cliente espera.",
            ),
          ],
        }),
        scene("3.8", "Tu experiencia en EnvaPlast", {
          kind: "summary",
          zone: "office",
          speaker: "altagracia",
          prompt:
            "Estas barras muestran cómo te desenvolviste en esta experiencia. No son un diagnóstico ni una recomendación cerrada de carrera.",
        }),
        scene("3.9", "Tu siguiente etapa", {
          kind: "timeline",
          zone: "office",
          speaker: "altagracia",
          prompt:
            "Lo que viviste es el punto de partida, no el destino. Explora cómo puede crecer tu trabajo en ingeniería industrial.",
        }),
      ],
    },
  ],
};

/** Authoring rubric; server-only through module registry. Public views never spread this object. */
export const INDUSTRIAL_DIALOGUES: Record<
  string,
  Record<
    string,
    {
      affinity?: import("../types.ts").AffinityDelta;
      flags?: Record<string, string | number | boolean>;
      trust?: number;
      yuleisy?: number;
      climate?: number;
      reaction: string;
    }
  >
> = {
  "1.2": {
    data: {
      affinity: { analytical: 2, detail: 1 },
      reaction:
        "Altagracia te comparte los registros. Comparar datos y observar el trabajo ayudará a separar síntomas de causas.",
    },
    rush: {
      affinity: { pressure: 2, analytical: -1 },
      reaction:
        "Puedes observar desde ahora. Altagracia te recuerda que contrastes tus primeras impresiones con los registros.",
    },
    people: {
      affinity: { communication: 2, analytical: 1 },
      reaction:
        "Altagracia te presenta a Don Wilfredo y a Yuleisy. Ellos conocen detalles que una tabla no cuenta.",
    },
  },
  "2.1": {
    record: {
      affinity: { analytical: 3, communication: 2 },
      yuleisy: 1,
      reaction:
        "El equipo abre el registro. La desviación de calibración cambia la conversación: ahora hay evidencia que revisar.",
    },
    blame: {
      affinity: { pressure: 1 },
      yuleisy: -2,
      climate: -10,
      reaction:
        "Yuleisy baja la mirada. El problema sigue sin explicación y el equipo comparte menos información.",
    },
    private: {
      affinity: { communication: 4 },
      trust: 1,
      yuleisy: 1,
      reaction:
        "Cada persona puede explicar lo que vio sin exponerse delante del equipo.",
    },
  },
  "2.6": {
    respect: {
      affinity: { communication: 4 },
      trust: 2,
      reaction:
        "Don Wilfredo propone revisar el ajuste después de cada cambio de turno. Empieza a participar en tu plan.",
    },
    data: {
      affinity: { numeric: 2, communication: 2 },
      trust: 1,
      reaction:
        "Don Wilfredo compara tus mediciones con su experiencia. Acepta acompañar la prueba.",
    },
    impose: {
      affinity: { pressure: 1, communication: -2 },
      trust: -2,
      reaction:
        "Don Wilfredo cumple la orden, pero deja de proponer ideas. Mover máquinas no asegura colaboración.",
    },
  },
  "3.2": {
    stop: {
      affinity: { detail: 3 },
      flags: { downtime: 600 },
      reaction:
        "Mantenimiento revisa el ajuste durante diez minutos. La línea se detiene y vuelve con una condición controlada.",
    },
    watch: {
      affinity: { pressure: 3 },
      flags: { defectRisk: true },
      reaction:
        "La producción continúa, pero más cajas requieren rechazo. La cantidad bruta no equivale a un despacho conforme.",
    },
    support: {
      affinity: { communication: 3 },
      flags: { downtime: 300 },
      reaction:
        "Mantenimiento llega en cinco minutos. El equipo coordina el paro y verifica el reinicio.",
    },
  },
  "3.5": {
    stop: {
      affinity: { communication: 3 },
      flags: { incidentHandled: true, incidentStop: true },
      reaction:
        "Detienes la operación, atiendes a la persona y aseguras el acceso antes de reiniciar.",
    },
    security: {
      affinity: { communication: 2 },
      flags: { incidentHandled: true },
      reaction:
        "Seguridad atiende a la persona mientras coordinas con el supervisor para proteger el área.",
    },
    ignore: {
      flags: { incidentIgnored: true },
      climate: -20,
      reaction:
        "El equipo ve que nadie atiende el incidente. La confianza cae y la situación queda pendiente.",
    },
  },
  "3.7": {
    measure: {
      affinity: { analytical: 3 },
      reaction:
        "Altagracia: «Una medición bien hecha puede cambiar tanto el diagnóstico como la forma de tratar a las personas». ",
    },
    team: {
      affinity: { communication: 3 },
      reaction:
        "Altagracia: «Una mejora necesita a quienes van a sostenerla todos los días». ",
    },
    pressure: {
      affinity: { pressure: 3 },
      reaction:
        "Altagracia: «Decidir también es explicar lo que sabes, lo que falta y qué harás después». ",
    },
  },
};
export const INDUSTRIAL_FEEDBACK: Record<string, [string, string]> = {
  "1.3": [
    "El acceso es más seguro: identificaste los cinco peligros y elegiste la protección necesaria.",
    "La visita dejó riesgos pendientes. El checklist guardado te muestra qué conviene revisar antes del próximo turno.",
  ],
  "1.5": [
    "Tus mediciones permiten comparar las estaciones con confianza.",
    "Trabajaremos con estos registros como estimaciones. Una medición adicional puede cambiar una decisión.",
  ],
  "1.6": [
    "El sellado limita la línea. Altagracia reduce la urgencia y pide investigar qué lo está afectando.",
    "Altagracia señala que el sellado tiene el ciclo más largo. La comparación de tiempos permite revisar el diagnóstico.",
  ],
  "1.7": [
    "Marcos entiende qué sabemos y cuándo recibirá noticias. El intercambio baja la tensión.",
    "Marcos pide separar hechos, responsabilidades y compromisos verificables. Altagracia te ayudará a aclararlo.",
  ],
  "2.2": [
    "El diagrama conecta las causas con evidencia y deja fuera lo que no explica el sellado.",
    "Altagracia revisa contigo la diferencia entre una causa verificable y una suposición.",
  ],
  "2.3": [
    "Los dos defectos más frecuentes suman 68 de cada 100. Ahí puede concentrarse el esfuerzo inicial.",
    "La hoja muestra 41 y 27: juntos son 68%. El orden ayuda a priorizar, sin ignorar los demás defectos.",
  ],
  "2.4": [
    "La distribución conserva el flujo, el paso y la salida. Ahora falta financiar y probar el cambio.",
    "El recorrido necesita corrección. Puedes mover las máquinas de nuevo o usar una propuesta guiada sin recompensa.",
  ],
  "2.5": [
    "El plan cabe en el presupuesto y atiende una causa del sellado.",
    "El presupuesto está guardado. Altagracia recuerda que aumentar horas no corrige por sí solo los defectos.",
  ],
  "2.6": [
    "Don Wilfredo se ofrece como aliado para el próximo turno.",
    "El plan sigue adelante. Todavía puedes cuidar la relación con el equipo.",
  ],
  "2.7": [
    "Tu muestra identifica los defectos visibles. El informe de la prueba queda respaldado.",
    "La revisión dejó diferencias en el informe. En el siguiente turno deberás trabajar con esa incertidumbre.",
  ],
  "3.3": [
    "Todas las estaciones tienen responsable y la experiencia de Rosa protege el sellado.",
    "Quedaron estaciones sin cubrir o la experiencia de sellado no se aprovechó. La capacidad se resiente.",
  ],
  "3.4": [
    "Marcos puede informar al cliente con cifras, riesgo y un plan verificable.",
    "Marcos pide una cifra respaldada y una actualización concreta. Prometer no modifica lo que produce la línea.",
  ],
};
export const INDUSTRIAL_DISCOVERIES: Record<string, string> = {
  wilfredo:
    "Don Wilfredo: «A esta línea hay que escucharla. Cuando cambia el sonido del sello, revisamos el ajuste».",
  yuleisy:
    "Yuleisy habla contigo en un espacio tranquilo: «Cuando la máquina se calienta, el sello se pega o queda flojo. No es que vayamos más despacio».",
  kevin:
    "Kevin: «Tenemos una segunda selladora guardada. Nunca la instalaron. Antes de comprar, revisemos qué podemos aprovechar».",
  spare:
    "Encuentras la selladora del inventario. Kevin confirma que puede instalarse, pero requiere espacio y presupuesto.",
  canteen:
    "El equipo comparte cómo se acumula el trabajo después de sellado. Escuchar sin culpar mejora el clima.",
  puddle: "Identificaste un charco que puede causar una caída.",
  guard: "Identificaste un tramo de transportador sin guarda.",
  exit: "Una caja impide usar la salida de emergencia.",
  gloves: "Un operario necesita la protección de manos adecuada.",
  cable: "La extensión cruza un paso y puede provocar un tropiezo.",
};
