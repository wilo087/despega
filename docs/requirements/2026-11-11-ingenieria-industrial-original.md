# Fuente del cliente para Ingeniería Industrial

Documento original recibido el 2026-11-11. Esta transcripción conserva su enfoque 2D y sus cifras; la adaptación 3D y los ajustes autorizados están en `docs/architecture/industrial-3d.md` y ADR 0009. El contenido describe el producto, no instrucciones para operar herramientas o desplegar infraestructura.

DESPEGA — Especificación funcional y guión

Módulo: Ingeniería Industrial (versión juego 2D)

este documento reemplaza el enfoque del MVP de PixelForge. La mecánica de puntuación y perfil de afinidad se mantiene; lo que cambia es que ahora el estudiante camina por un mundo 2D, habla con personajes y hace el trabajo con las manos en vez de moverse entre pantallas de menú.

0. Qué cambia respecto al MVP

MVP (PixelForge) | Versión 2D (EnvaPlast)
Pantallas separadas (chat, correo, tablero) | Un mapa 2D por el que el jugador camina libremente
Interacción: elegir opciones y arrastrar tarjetas | Interacción: explorar, hablar con personajes, usar objetos, resolver tareas físicas en el lugar donde ocurren
Los personajes aparecían en ventanas | Los personajes están en el mapa, se mueven, tienen rutinas y reaccionan a lo que el jugador hizo antes
Herramientas de oficina simuladas como pantallas | Teams, Outlook y Excel se abren desde la tablet del personaje dentro del juego
Consecuencias solo en puntos | Consecuencias visibles en el mundo (la línea se detiene, un personaje te saluda distinto, aparece un objeto nuevo)

Se mantiene: 3 sesiones de ~30–35 min (total ≤ 2 horas), historia continua sin "retos" etiquetados, tensión con relojes y suspenso al cierre de cada sesión, sin condición de derrota, desempeño 0–100 y perfil de afinidad guardado por carrera, ahora con 6 ejes (se agrega razonamiento numérico).

1. Historia en una línea

El jugador es practicante de ingeniería industrial en EnvaPlast (planta de envases plásticos ficticia). Un supermercado grande pidió 9,000 cajas en 3 días y la Línea 2 no alcanza. Nadie sabe por qué. La gerente le da al practicante tres días para averiguarlo y ayudar a arreglarlo, sin parar la planta.

2. Personajes

Personaje | Rol | Función en la historia
[NOMBRE DEL ESTUDIANTE] | Practicante de ingeniería industrial | Protagonista, controlado por el jugador. Al empezar elige entre dos personajes ya diseñados (una chica y un chico) y escribe su nombre, que se inserta en los diálogos. Los textos del guión evitan palabras que dependan del género; donde no se pueda, se usan dos variantes según el personaje elegido.
Ing. Altagracia Rosario | Gerente de Operaciones | Mentora. Asigna el problema, da retroalimentación, representa el criterio técnico.
Don Wilfredo | Supervisor de línea, 25 años en la planta | Conoce la línea mejor que nadie pero resiste los cambios. Es el reto de liderazgo y persuasión. Puede volverse el mayor aliado o el mayor obstáculo.
Yuleisy | Operadora de la estación de sellado | Joven, observadora, sabe por qué falla el sellado pero no se atreve a decirlo delante de su supervisor.
Kevin | Encargado de almacén | Dueño de información que el jugador solo encuentra si explora (hay una máquina guardada en bodega).
Lic. Marcos Peña | Gerente Comercial | Representa la presión del cliente. Aparece por Teams y Outlook, nunca en la planta.
Cliente (supermercado) | Solo mencionado | Genera la presión de fondo. No requiere diseño.

3. El mundo del juego

Vista: 2D desde arriba (top-down), un solo mapa de la planta que se desbloquea por zonas. Movimiento con flechas/WASD en computadora y joystick virtual o toque-para-mover en celular.

Zonas del mapa:

Entrada y caseta de seguridad — inicio de cada sesión.

Oficina de Operaciones — Altagracia, reuniones, Teams.

Línea 2 — 5 estaciones en fila: Alimentación → Llenado → Sellado → Etiquetado → Empaque. Es el corazón del juego.

Bodega — Kevin, y la máquina selladora guardada (descubrimiento opcional pero clave).

Zona de calidad — mesa de inspección.

Comedor — conversaciones opcionales con operarios (pistas y clima del equipo).

HUD siempre visible: barra de desempeño (0–100), reloj del turno, contador de cajas pendientes (sube mientras el jugador tarda en resolver), botón de tablet.

La tablet (abre con un botón) contiene: Teams (mensajes), Outlook (correos), Excel (hoja de cálculo simple), Cronómetro, Lista de tareas. Es la forma de usar herramientas de oficina sin sacar al jugador del mundo.

4. Tipos de interacción que debe soportar

Exploración libre con zonas de interacción (cerca de un personaje u objeto aparece un ícono de acción).

Diálogo con opciones, con o sin tiempo límite visible (15–25 s). Si el tiempo termina, el juego avanza con una consecuencia predefinida; nunca se bloquea.

Búsqueda de peligros — puntos interactivos escondidos en el mapa que el jugador debe encontrar tocándolos.

Cronometrar — el jugador observa el ciclo animado de una estación y presiona inicio/fin con un cronómetro; se compara con el tiempo real con una tolerancia.

Hoja de cálculo simple — arrastrar datos a celdas y ver cómo se genera un gráfico de barras; ordenar datos.

Armar causas — arrastrar tarjetas de causas a categorías de un diagrama (espina de pescado).

Editor de distribución (layout) — cuadrícula donde se arrastran máquinas con reglas (pasillos libres, salida de emergencia despejada, orden del flujo). El sistema valida y muestra el tiempo resultante.

Asignación de personal — arrastrar trabajadores a estaciones; cada trabajador tiene fortalezas visibles.

Construcción de mensaje — armar correos/chats combinando bloques de frase.

Panel de indicadores en vivo — barras que se mueven en tiempo real según las decisiones acumuladas.

5. Sistema de puntuación

Desempeño: número de 0 a 100, empieza en 50. Sube y baja con cada tarea.

Perfil de afinidad — 6 ejes (se mantienen iguales en todas las carreras para poder compararlas):

Clave | Eje | Tipo
NUM | Razonamiento numérico (calcular, presupuestar, leer tablas y gráficos) | Un sentido (0 a máximo)
RES | Resolución de problemas (buscar causas, diagnosticar, diseñar soluciones) | Un sentido
COM | Comunicación y liderazgo | Un sentido
DET | Atención al detalle | Un sentido
PRE | Tolerancia a la presión | Un sentido
EST | Estructurado ↔ Creativo | Bipolar: −11 a +11, empieza en 0 (positivo = estructurado, negativo = creativo)

Cómo se mide el eje EST (importante): en 4 momentos del módulo el jugador elige entre un camino "siguiendo el procedimiento establecido" y un camino "con su propio criterio". Ambas opciones son válidas y ninguna resta desempeño. Están marcados con 🔷 en el guión: la opción estructurada suma al eje, la creativa resta. Se muestra como posición entre dos polos, no como barra que se llena.

Normalización para TI: los ejes de un solo sentido se normalizan a 0–100 dividiendo entre el máximo posible sumando los mejores valores de cada eje en todo el guión.

Comparación entre carreras: cada módulo debe ofrecer una cantidad parecida de oportunidades para cada eje; si no, la comparación sale sesgada (por ejemplo, un módulo casi sin cálculos saldría "bajo en numérico" solo por falta de oportunidades). Al escribir cada carrera nueva, revisar que ningún eje quede con muy pocos puntos posibles.

Cómo se presenta: los ejes son una herramienta de diseño del juego, no una prueba vocacional validada. En pantalla se presentan como "con qué te sentiste cómodo en esta experiencia", no como diagnóstico ni recomendación cerrada de carrera.

Dos lecturas adicionales que se muestran al final (pedido del equipo): cada tarea se etiqueta como [Blanda], [Técnica] o [Herramienta] y el sistema guarda el porcentaje de acierto de cada categoría. La pantalla final muestra tres barras: Habilidades blandas, Parte técnica de la carrera y Manejo de herramientas (Excel, Outlook, Teams).

Datos por carrera (obligatorio desde ya): desempeño, perfil de 6 ejes y las 3 lecturas se guardan asociados a la carrera "Ingeniería Industrial", independientes de Software y de cualquier otro módulo.

Variables de estado que persisten entre sesiones (alimentan consecuencias, no se muestran como puntos):

Variable | Qué guarda
confianza_wilfredo | −3 a +3, cómo lo trató el jugador
confianza_yuleisy | −3 a +3
bodega_vista | si encontró la máquina guardada
peligros_omitidos | cuántos de los 5 peligros no encontró
solucion_elegida | máquina en paralelo / método mejorado / horas extra
presupuesto_usado | monto gastado de $5,000
clima_equipo | 0–100, sube con buen trato, baja con horas extra o conflictos

6. Sesión 1 — "La línea que no rinde" (~32 min)

Escena 1.0 — Elegir personaje (1 min, solo la primera vez)

[PANTALLA: selección de personaje] [INTERACCIÓN: elegir entre dos personajes y escribir el nombre]

El jugador elige entre dos personajes (una chica y un chico) y escribe su nombre. No afecta puntos. El nombre se usa en diálogos, correos y mensajes de la tablet.

Escena 1.1 — Llegada (2 min)

[ZONA: Entrada] [INTERACCIÓN: ninguna, solo caminar hacia la oficina]

6:45 a.m. El jugador llega a la caseta. Suena una notificación en su tablet: Altagracia: "El pedido de 9,000 cajas sale el jueves. La Línea 2 va atrasada y nadie sabe por qué. Te espero en mi oficina." En el HUD aparece el contador Cajas pendientes: 9,000, que empieza a subir lentamente. La presión es del ambiente, no de un reloj de juego.

Escena 1.2 — Reunión con Altagracia

[ZONA: Oficina] [INTERACCIÓN: diálogo con opciones, sin tiempo] [Blanda]

Altagracia explica el problema en 4 líneas y pregunta cómo va a empezar.

A) "Dame los datos de producción de la semana antes de ir a la planta" → +2 RES, +1 DET

B) "Voy directo a la línea a ver qué pasa" → +2 PRE, −1 RES

C) "¿Quién conoce mejor esa línea?" → +2 COM, +1 RES; Altagracia menciona a Don Wilfredo y a Yuleisy

Escena 1.3 — Seguridad antes de entrar

[ZONA: Entrada de planta] [INTERACCIÓN: búsqueda de peligros, 60 s con reloj visible] [Técnica] 🔷

Antes de pasar, el jugador debe elegir sus 3 elementos de protección de una repisa (casco, lentes, tapones, guantes, bata). Luego tiene 60 s para recorrer el pasillo de acceso y tocar los peligros escondidos: charco de agua, banda transportadora sin guarda, caja bloqueando la salida de emergencia, operario sin guantes, extensión eléctrica en el piso.

Cada peligro encontrado: +2 DET (máximo 10)

Protección correcta (casco, lentes, guantes): +1 DET por pieza

Se guarda peligros_omitidos (afecta la Sesión 3, sin penalizar puntos ahora)

🔷 Elección de método: seguir el checklist oficial de visita (aparece en la tablet) → +2 EST; o recorrer según lo que llame la atención → −2 EST. Ambos permiten encontrar peligros.

Escena 1.4 — Recorrido de la línea (exploración libre, ~6 min)

[ZONA: Línea 2, bodega, comedor] [INTERACCIÓN: exploración + conversaciones] [Blanda]

El jugador camina libremente. Puede hablar con quien quiera, en el orden que quiera:

Don Wilfredo (primera impresión, con respuesta rápida): "Buenos días, Don Wilfredo, usted lleva años aquí, ¿me puede acompañar?" → confianza_wilfredo +1, +2 COM. "Vengo a revisar por qué no están cumpliendo" → confianza_wilfredo −2, −1 COM.

Yuleisy en la estación de sellado: solo habla con franqueza si el jugador pregunta con respeto y sin Don Wilfredo cerca. Revela que "el sellado se pega o queda flojo cuando la máquina se calienta" (pista para la Sesión 2). confianza_yuleisy +1.

Kevin en bodega: si el jugador pregunta qué equipo hay guardado, revela una segunda máquina selladora sin uso. bodega_vista = verdadero, +3 RES.

Comedor: conversaciones opcionales que dan pistas y suben clima_equipo.

Sin tiempo límite, pero el contador de cajas pendientes sigue subiendo.

Escena 1.5 — Cronometrar las estaciones

[ZONA: Línea 2] [INTERACCIÓN: cronómetro, reloj de 3 min] [Técnica + Herramienta]

El jugador se para frente a cada estación y cronometra 3 ciclos observando la animación del trabajador. Tiempos reales por caja:

Estación | Tiempo real
Alimentación | 8.0 s
Llenado | 8.5 s
Sellado | 14.0 s
Etiquetado | 7.5 s
Empaque | 8.2 s

Tolerancia: ±1 s por estación.

4 o 5 estaciones dentro de tolerancia → +6 NUM, +3 DET

2–3 estaciones → +3 NUM

0–1 estaciones → +1 NUM, −2 desempeño, y los datos que aparecen en Excel salen marcados como "estimados"

Escena 1.6 — Ver los datos

[ZONA: cualquier lugar, desde la tablet] [INTERACCIÓN: hoja de cálculo + decisión con tiempo de 20 s] [Herramienta + Técnica]

El jugador arrastra los 5 tiempos a la hoja de cálculo y aparece un gráfico de barras. Altagracia llama por Teams: "¿Dónde está el problema? Necesito una respuesta ya." 20 s para elegir:

Sellado (correcta) → +4 NUM, +4 RES, +4 desempeño, el contador de cajas pendientes baja la velocidad

Llenado → −3 desempeño

"Los operarios son lentos" → −3 desempeño, clima_equipo −10, confianza_wilfredo −1

Tiempo agotado → Altagracia lo dice por ti, −3 desempeño, +1 PRE

Escena 1.7 — Correo al Gerente Comercial

[ZONA: tablet] [INTERACCIÓN: construcción de mensaje] [Herramienta + Blanda]

Llega un correo de Marcos: "¿Cuándo van a poder cumplir? El cliente está preguntando." El jugador arma su respuesta combinando 2–3 bloques de un banco de 5 (3 profesionales, 2 poco profesionales).

Solo bloques profesionales → +6 COM; Marcos responde tranquilo

Mezcla → +1 COM

Bloques poco profesionales → −4 desempeño; Marcos escala a Altagracia

Escena 1.8 — Cliffhanger

[ZONA: Línea 2] [INTERACCIÓN: ninguna]

4:30 p.m. Se escucha un golpe. La estación de sellado se detiene y suena la alarma. Don Wilfredo sale de la oficina y dice: "Esto no es la primera vez. Y no es culpa de la máquina." Corte a negro.

Escena 1.9 — Resumen de sesión: puntaje de desempeño, perfil de afinidad animado y las 3 barras de categoría (blandas, técnicas, herramientas).

7. Sesión 2 — "Cambiar sin romper la planta" (~33 min)

Escena 2.1 — La acusación

[ZONA: Línea 2] [INTERACCIÓN: diálogo con opciones] [Blanda]

La máquina estaba mal calibrada, pero Don Wilfredo culpa a Yuleisy delante de todos. El jugador debe intervenir.

A) "Veamos primero el registro de la máquina antes de culpar a alguien" → +3 RES, +2 COM, confianza_yuleisy +1

B) "Don Wilfredo tiene razón, hay que ser más cuidadosos" → +1 PRE, confianza_yuleisy −2, clima_equipo −10

C) Pide hablar con cada uno por separado → +4 COM, confianza_wilfredo +1, confianza_yuleisy +1

Escena 2.2 — Buscar la causa

[ZONA: Oficina] [INTERACCIÓN: armar causas, 90 s] [Técnica]

El jugador arrastra 8 tarjetas de causas hacia 4 categorías (Máquina, Método, Material, Personas). Hay 2 tarjetas distractoras que no pertenecen a ninguna.

7–8 bien ubicadas → +5 RES, +2 DET

4–6 → +2 RES

Menos de 4 → −2 desempeño

Escena 2.3 — Dónde están los defectos

[ZONA: Zona de calidad] [INTERACCIÓN: hoja de cálculo] [Herramienta + Técnica]

El jugador ordena los defectos de mayor a menor en Excel y el gráfico muestra cuáles causan la mayor parte del problema.

Defecto | Cantidad (de 100)
Sello defectuoso | 41
Etiqueta torcida | 27
Llenado incompleto | 15
Caja dañada | 12
Otros | 5

Debe identificar que los dos primeros suman el 68%.

Correcto → +5 NUM, +3 DET

Incorrecto → −2 desempeño

Escena 2.4 — Diseñar la solución 🔷

[ZONA: Oficina → editor de distribución] [INTERACCIÓN: elección + editor en cuadrícula] [Técnica]

Primero el jugador elige el enfoque:

Camino con método estándar: reorganizar la línea con la plantilla de la planta (orden de flujo, pasillos y orden y limpieza) → +3 EST

Camino con diseño propio: usar la máquina de la bodega como segunda selladora en paralelo, con una distribución diseñada por el jugador → −3 EST; solo disponible si bodega_vista = verdadero. Si no la vio, esta opción se reemplaza por "solicitar compra" que llega en 2 días y consume $2,000 del presupuesto.

Luego construye la distribución en la cuadrícula. Reglas: pasillo libre de 1 m, salida de emergencia despejada, el flujo no se cruza. El sistema calcula el nuevo tiempo del sellado:

Máquina en paralelo: 14 s → 7 s (cumple la meta de 9.6 s por caja)

Solo método mejorado: 14 s → 11 s (queda corto)

Distribución inválida → no se puede continuar hasta corregirla, −2 desempeño

Distribución válida → +6 RES, +4 DET

Escena 2.5 — Presupuesto 🔷

[ZONA: tablet] [INTERACCIÓN: selección con límite de dinero] [Herramienta + Técnica]

Hay $5,000. Opciones:

Acción | Costo
Capacitar operarios en sellado | $1,500
Mantenimiento preventivo | $2,000
Mover e instalar la máquina | $2,500
Horas extra | $3,000

Antes de elegir: ¿qué criterio sigue? 🔷

Seguir el orden de prioridad que dejó Altagracia → +3 EST

Priorizar según su propio análisis del mayor impacto → −3 EST

Combinaciones que superan $5,000 no se pueden confirmar. Elegir horas extra baja clima_equipo −15 pero sube las cajas producidas en la Sesión 3.

Combinación que ataca la causa del sello (mantenimiento o capacitación incluida) → +4 NUM

Escena 2.6 — Convencer a Don Wilfredo

[ZONA: Línea 2] [INTERACCIÓN: diálogo con medidor de confianza, 25 s por intercambio] [Blanda]

Don Wilfredo no quiere mover nada: "Así hemos trabajado 25 años." El medidor sube o baja con lo que dice el jugador.

Reconocer su experiencia y pedirle su opinión ("Usted conoce esta línea mejor que nadie, ¿qué cambiaría?") → +4 COM, confianza_wilfredo +2; además revela un dato extra que facilita la prueba piloto

Explicar con datos del gráfico → +2 NUM, +2 COM, confianza_wilfredo +1

Imponer ("Es orden de la gerencia") → +1 PRE, −2 COM, confianza_wilfredo −2

Si confianza_wilfredo ≥ 2 al terminar → se marca aliado_wilfredo

Escena 2.7 — Prueba piloto

[ZONA: Línea 2] [INTERACCIÓN: tiempo acelerado + inspección] [Técnica + Blanda]

Se corre la nueva configuración en tiempo acelerado durante 2 minutos reales. El jugador toma una muestra de 10 cajas en la zona de calidad y toca las defectuosas.

Todas identificadas → +4 DET

Falla alguna → +1 DET, y el reporte de defectos de la prueba sale con error que se arrastra a la Sesión 3

Escena 2.8 — Cliffhanger

[ZONA: tablet]

Marcos escribe por Teams: "El cliente adelantó el despacho. Necesitamos todo mañana a las 2 p.m." Aparece en el HUD un contador de cuenta regresiva. Corte.

8. Sesión 3 — "Turno de entrega" (~33 min)

Escena 3.1 — Apertura

[ZONA: Línea 2] [INTERACCIÓN: ninguna]

El HUD muestra la barra Cajas producidas / 9,000 y un reloj de turno comprimido (8 h reales = 25 min de juego). Este contador permanece visible toda la sesión. La velocidad de la barra depende de la solución elegida en la Sesión 2.

Escena 3.2 — Falla de la selladora

[ZONA: Línea 2] [INTERACCIÓN: decisión con tiempo de 20 s] [Técnica + Blanda]

Suena la alarma del sellado.

Parar 10 minutos para el mantenimiento preventivo → +3 DET, la barra de cajas se detiene unos segundos

Seguir produciendo y vigilar → +3 PRE, sube el porcentaje de defectos

Pedir apoyo al área de mantenimiento por Teams → +3 COM, llega en 5 minutos

Si hizo mantenimiento preventivo en el presupuesto: la falla es menor y solo hay una opción disponible.

Escena 3.3 — Falta personal 🔷

[ZONA: Línea 2] [INTERACCIÓN: asignación de personal, 45 s] [Técnica + Blanda]

Yuleisy no llegó (si confianza_yuleisy es alto, llama y avisa; si es bajo, simplemente no aparece). El jugador reasigna trabajadores a estaciones. Cada uno muestra sus fortalezas (rapidez, precisión, experiencia en sellado).

Antes de arrastrar 🔷: ¿sigue el protocolo de contingencia (impreso, aparece en la tablet) → +3 EST, o improvisa con lo que observó → −3 EST?

Asignación que no deja ninguna estación sin cubrir y pone al más experto en sellado → +5 RES

Con aliado_wilfredo: Don Wilfredo cubre voluntariamente la estación faltante

Estación descubierta → −3 desempeño

Escena 3.4 — Llamada de Marcos

[ZONA: tablet] [INTERACCIÓN: construcción de mensaje bajo reloj de 40 s] [Herramienta + Blanda]

Marcos pide una confirmación de cuántas cajas salen. El jugador arma la respuesta con bloques (cifra honesta, riesgo, plan, hora de actualización).

Honesto, con cifra y plan → +5 COM, +2 PRE

Promete sin respaldo → +1 PRE, −3 COM, la barra de cajas sufre un golpe narrativo más adelante

No responde a tiempo → −3 desempeño

Escena 3.5 — Incidente de seguridad (condicional)

[ZONA: Línea 2] [INTERACCIÓN: decisión con tiempo de 15 s] [Técnica + Blanda]

Solo aparece si peligros_omitidos ≥ 3: un operario resbala en el charco que el jugador no encontró en la Sesión 1. Debe elegir cómo actuar (detener la línea y atender, delegar y seguir, o llamar a seguridad).

Detener y atender el caso → +3 COM, −2 desempeño por el paro

Llamar a seguridad mientras sigue la línea → +2 COM

Seguir sin atender → −6 desempeño, clima_equipo −20

Si peligros_omitidos < 3 esta escena no ocurre y no se menciona.

Escena 3.6 — Resultado del despacho

[ZONA: Oficina] [INTERACCIÓN: ninguna, panel de indicadores en vivo]

El panel muestra, con barras que se mueven en tiempo real: cajas entregadas vs. meta, porcentaje de defectos, cero accidentes (o no), clima del equipo. El resultado depende del acumulado de las 3 sesiones, no solo de la última decisión:

Condición | Resultado visible
Desempeño ≥ 70 y aliado_wilfredo | Entrega completa, equipo celebrando
Desempeño 45–69 | Entrega parcial, el resto sale al día siguiente
Desempeño < 45 | Entrega tarde, el cliente reclama, el equipo está tenso — el juego no termina

Escena 3.7 — Cierre con Altagracia

[ZONA: Oficina] [INTERACCIÓN: diálogo con 3 opciones, ninguna incorrecta]

Altagracia pregunta: "¿Qué aprendiste de esta semana?"

"Medir antes de opinar evita culpar a la gente equivocada" → refuerza RES

"Sin el equipo, el mejor análisis no cambia nada" → refuerza COM

"Hay que decidir con la información que se tiene cuando el cliente espera" → refuerza PRE

Escena 3.8 — Pantalla final: "Tu semana en EnvaPlast"

[INTERACCIÓN: ninguna]

Desempeño total

Perfil de afinidad de 6 ejes animado (el EST como posición entre dos polos)

Tres barras: Habilidades blandas / Parte técnica / Manejo de herramientas

Mensaje de Altagracia que cambia según el resultado, siempre honesto

Escena 3.9 — Línea de tiempo de carrera

[INTERACCIÓN: avanzar tocando cada etapa]

Altagracia: "Lo que viviste esta semana es el punto de partida, no el destino." Línea de tiempo narrada:

Año 1 — Practicante / Analista junior: recoger datos, cronometrar, apoyar mejoras (lo que acaba de vivir)

Año 2–4 — Analista de procesos / Ingeniero de mejora continua: diseña y lidera sus propios proyectos de mejora

Año 5–8 — Jefe de planta / Gerente de operaciones (el camino de Altagracia): responsable de la producción completa

Bifurcación:

Calidad y mejora continua: especialista en reducir defectos y desperdicio

Cadena de suministro y logística: coordina compras, inventarios y distribución

Gerencia general o emprendimiento: dirige una empresa o crea la propia

Nota de diseño opcional: resaltar la rama que más coincide con el perfil acumulado (ej. alto DET y RES → calidad; alto NUM → cadena de suministro; alto COM → gerencia). No es una predicción, solo una pista.
