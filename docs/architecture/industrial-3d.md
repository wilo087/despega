# Ingeniería Industrial en EnvaPlast

Implementación local del plan autorizado el 2026-11-11. Fuente del cliente:
`docs/requirements/2026-11-11-ingenieria-industrial-original.md`. El original es 2D;
el operador pidió 3D y aprobó completar contenido y ajustar inconsistencias.

## Componentes y recorrido

`packages/simulator/src/modules/ingenieria-industrial.ts` declara las tres sesiones,
28 escenas, personajes, herramientas, diálogos, causas y rúbricas. El motor de
fábrica interpreta sus objetivos y conserva descubrimientos en cualquier orden
durante el recorrido libre. Las escenas 1.9 y 2.9 cierran jornadas; 3.9 cierra la
experiencia. La escena 3.5 se omite si se encontraron al menos tres peligros.

El estado principal sigue siendo `SimulationState`, con `factory` opcional. La
proyección `PublicScene.factory` contiene solo la tarea disponible, geometría y
resultados observables. El paquete público `@despega/simulator/factory-world`
contiene navegación, nombres y posiciones, sin importar el registro de módulos.

El reproductor carga Babylon.js únicamente en cliente. La cámara isométrica sigue
al avatar; el clic/toque calcula una ruta de media unidad, las flechas/WASD permiten
movimiento directo y E interactúa con un objeto cercano. En móvil hay joystick, controles
direccionales y toque para desplazarse. Las listas de lugares ofrecen otra forma
de elegir destinos. Diálogos, tablet y herramientas son HTML accesible. Arrastre
usa los componentes existentes de dnd-kit y conserva selección y controles alternos.

Los avatares importados miran hacia +Z en Babylon.js. El giro horizontal usa
`atan2(dx, dz)` sobre la dirección de desplazamiento, compartida por teclado,
joystick y rutas de clic/toque, sin añadir un giro de 180°.
Las teclas y el joystick se convierten desde la orientación de pantalla a la
cámara isométrica; la animación y el giro utilizan el desplazamiento efectivo
después de resolver las colisiones.

### Espacio, rutas y presentación

`packages/simulator/src/factory/geometry.json` es la fuente común de dimensiones
de zonas, apertura de entrada, mobiliario y límites transitables. El generador
Blender la consume directamente; el motor público `factoryNavigation` añade las
máquinas de la distribución vigente, equipo almacenado, segunda selladora,
peligros y personas. Los operarios y personajes se ubican en espacios libres.
Son reglas geométricas observables, sin claves de evaluación ni puntajes.

El avatar usa un radio conservador de 0,65 unidades que contiene sus poses de
desplazamiento, escucha, inspección y reacción. Los personajes reservan 0,85
unidades para sus gestos y utilería. `assets:space-check` carga los GLB reales con
Babylon NullEngine y verifica límites, orientaciones y los diez clips de cada figura.
La navegación por cuadrícula busca un punto de interacción accesible, y el
movimiento continuo comprueba los ejes por separado para deslizarse junto a los
obstáculos. Una posición guardada que haya quedado ocupada se recupera cerca,
en suelo transitable. El registro del módulo Ray habilita el picking por clic/toque.

Los solapamientos del borrador de distribución se señalan en rojo; son una ayuda
geométrica. La validación definitiva de pasillos, orden, presupuesto y recompensas
continúa en el servidor. Las pruebas cubren la distribución base y alternativas,
no certifican toda combinación imaginable de un borrador inválido.

La cámara desplaza su proyección para conservar al avatar fuera de HUD y paneles.
Las zonas se clonan con geometría compartida para conservar metadatos de paredes
y permitir materiales de ocultación propios; máquinas y personajes reutilizan
instancias. El generador separa paredes y muebles al agrupar geometría. Las
etiquetas evitan otras etiquetas y las áreas ocupadas por controles HTML.

El panel mantiene montada la actividad al plegarse: no reinicia selecciones,
mediciones ni el cronómetro. Los borradores se comparan con el último envío,
se agrupan durante 1,2 segundos y esperan mientras los controles estén
deshabilitados o la partida pausada. Este comportamiento también evita un envío
inicial por la repetición de efectos de React Strict Mode en desarrollo.

## Contratos y persistencia

### Guía de controles

La guía se ofrece después del avatar, antes de investigar el pedido, y se puede
repetir desde Ayuda. El comando `tutorial` acepta `start`, `advance`, `finish` y
`skip`; un avance incluye el paso esperado para detectar respuestas obsoletas.
El servidor conserva su progreso opcional en `factory.tutorial`, detiene tiempo
activo y producción y restaura la pausa anterior al finalizar u omitir. No
cambia de escena ni da puntos, afinidad o créditos. Una guía pausada requiere
reanudar antes de seguir; los intentos anteriores sin este campo siguen siendo
válidos. La posición se conserva en los puntos de recuperación y al avanzar.

El marcador de práctica se coloca cerca del origen, en una posición transitable
con ruta disponible. No es un peligro ni un descubrimiento del guion. Caminar
hasta el círculo habilita la práctica de interacción; E, el botón táctil y la
acción accesible del panel usan el mismo alcance. La tablet completa la tercera
práctica. El panel normal permanece montado y deshabilitado durante la guía.

`SceneResponse` añade `kind: factory` con comandos `interact`, `submit`, `checkpoint`,
`pause`, `resume`, `settings`, `draft` y `tutorial`. Zod limita identificadores, colecciones y
números finitos. El motor valida el objetivo, opciones, categorías y restricciones.
Nunca se aceptan puntajes, clima ni cantidades producidas calculadas por el cliente.

El estado conserva avatar, nombre, posición, objetivos, visitas, peligros,
mediciones, borrador, distribución, presupuesto, categorías y producción. El
perfil y los eventos continúan asociados a estudiante, carrera, intento y versión.
No cambia ninguna clave ni GSI. El backoffice puede filtrar Software o Industrial.

Las decisiones y el progreso se escriben en la transacción existente. El UUID
`commandId` recuerda el último comando confirmado: un reintento inmediatamente
posterior devuelve el estado sin puntuar ni escribir otra vez. Un reintento más
antiguo o una segunda pestaña con versión anterior genera conflicto y recarga.
No se promete un historial ilimitado de recibos de idempotencia. Al recuperar el
estado se reconstruye la escena desde la posición confirmada. Cada jornada libera
su canvas y restaura el acceso de la siguiente antes de activar los relojes.

Los puntos de recuperación no añaden entradas al registro de decisiones. El tiempo
activo se acota por la diferencia de fechas del servidor y un máximo de veinte
segundos por comando. El servidor recibe el instante por parámetro; el motor no
lee el reloj del sistema. Pausar conserva los relojes; el tiempo ampliado es un
ajuste persistido y no cambia la valoración de las respuestas. El reloj cliente conserva el tiempo de una petición normal en curso; una latencia
de red no hace retroceder el cronómetro. No hay juego offline:
una falla de red conserva la petición pendiente para reintentar con el mismo UUID.

## Ajustes y supuestos respecto al Word

- Cronometrar: cinco minutos en lugar de tres, tres ciclos por estación, promedio
  con tolerancia ±1 s. Los ciclos animados conservan 8 / 8,5 / 14 / 7,5 / 8,2 s.
- Excel 1.6: el reloj de diagnóstico empieza tras completar las cinco filas; ordenar
  los datos no consume el tiempo reservado para responder a Altagracia.
- Causas: seis causas y dos distractores; `Descartar` cuenta como destino válido.
- Distribución: cinco estaciones únicas, límites de Línea 2, separación de tres
  unidades entre centros de máquinas de dos unidades, orden de flujo creciente y
  espacio para la segunda selladora. Una penalización de −2 como máximo; corregir
  permite continuar y la solución guiada no obtiene recompensa. EST se suma una vez.
- Presupuesto: $5.000; compra no descubierta $2.000 más instalación $2.500. La
  compra tarda y no aporta capacidad al pedido de este módulo. La máquina hallada
  solo aporta capacidad si se eligió paralelo y se financió su instalación.
- Desempeño inicial 50; los éxitos evaluables sin delta explícito otorgan +4.
  Se conservan las penalizaciones y el +4 de diagnóstico del documento.
- No se preselecciona una preferencia de método; un tiempo agotado sin elección
  no inventa puntos hacia ningún polo.
- EST: ±2 en seguridad y ±3 en distribución, presupuesto y contingencia. Las
  preferencias no modifican desempeño. Se mantiene el signo entre −11 y +11.
- Categorías: crédito 0–1 por actividad evaluada, sumado una vez a cada etiqueta.
  Los resúmenes muestran crédito / oportunidades; preferencias y transiciones no
  cuentan. Las tareas de dos categorías contribuyen a ambas.
- Afinidad positiva: máximos declarados NUM 21, RES 31, COM 32, DET 32 y PRE 13.
  Se normaliza contra el guion completo; los resúmenes tempranos son progreso,
  no una evaluación cerrada. Las barras son exploratorias, no psicométricas.
- Las cajas pendientes son `max(0, 9000 - cajas buenas)`, no un pedido creciente.
- La producción es un modelo educativo agregado. Las primeras dos jornadas se
  liquidan al cerrar la sesión usando su configuración validada; no se simula
  una planta industrial segundo a segundo durante la exploración inicial.
- Capacidad por cuello de botella: sellado 14 s inicialmente, método 11 s o
  paralelo 7 s; el resto de estaciones también limita. Capacitación reduce los
  ciclos de llenado/empaque un 10%; la alimentación de 8 s sigue siendo límite.
- Jornadas base de ocho horas; horas extra añade cuatro a la segunda jornada.
  Rechazos iniciales 3%; capacitación o mantenimiento reduce a 1%; seguir con
  la alarma aumenta a 9%. Los paros descuentan tiempo productivo.
- En la tercera sesión, 25 minutos activos representan ocho horas. Al confirmar
  el despacho se cierran las horas restantes con las decisiones ya tomadas,
  evitando obligar a esperar después de resolver las tareas.
- La cantidad entregada depende de cajas buenas y plazo. Desempeño y alianzas
  modifican la lectura narrativa. Se cubre el caso de pedido completo sin aliado.
- Textos de reflexión usan «experiencia», siguiendo la decisión de octubre.

## Arte y reproducción

Ejecutar desde la raíz:

```sh
blender --background --python assets/3d/generate.py
```

Produce `assets/3d/envaplast.blend`, retratos PNG de los avatares y 27 GLB en
`apps/web/public/game-assets/envaplast`, con manifiesto de tamaños. Los personajes
incluyen diez clips: Idle, Walk, Talk, Listen, Work, Point, Inspect, Greet, React
y Celebrate. `character_animation.py` genera poses completas para articulaciones
y rostro. Se conservan los canales constantes para mezclas correctas y los clips
no se extrapolan sobre el reposo del modelo.
La paleta de marca se lee del paquete de identidad; los materiales de piel,
cartón y maquinaria son materiales del mundo. La banda y las cajas muestran el
ciclo de cada estación. Las zonas se cargan por proximidad y se liberan al salir del reproductor. La
geometría estática se agrupa por material, las copias reutilizan instancias y el
reproductor reduce la resolución de render según el FPS observado. Las zonas
transitables se habilitan con el avance de objetivos.

Cada estación tiene una variante propia de máquina. La rotación común orienta
sus controles hacia la cámara y los operarios se ubican en ese frente, sin
intersecciones. Alimentación y llenado transportan envases abiertos; sellado y
etiquetado, envases tapados; empaque, cajas. La duración animada de las máquinas
se obtiene del clip real y se ajusta al ciclo público de la estación.

El plano incluye armario de protección, escritorio auxiliar, planta, carro de
herramientas, palé, carro de muestras y dispensador de agua, además de las piezas
anteriores. Las placas de sectores y las marcas de piso son geometría original.
Todos los accesos tienen apertura física, conservando las restricciones de zonas
del progreso. Los objetos sólidos se verifican contra sus huellas transitables.

`FactoryAnimator` mezcla poses completas al cambiar de actividad, reparte fases
para evitar sincronía del equipo y ajusta la velocidad de Walk al desplazamiento.
Los personajes saludan al acercarse, miran hacia la conversación y alternan
escucha, explicación, inspección y trabajo según el contexto. Las figuras lejanas
suspenden sus clips. La calidad de render puede recuperar resolución después de
mantener un FPS estable; respeta siempre el nivel base del dispositivo.

Audio original sintetizado con Web Audio: ambiente, pasos, notificación y alarma.
Se habilita mediante gesto explícito, se puede silenciar y se suspende al pausar.
No hay grabaciones, voces ni conexiones a servicios de audio.

## Validación y límites

Ver `docs/validation/industrial-3d-2026-11-12.md`. La duración anunciada es una meta
editorial, no una medición de estudiantes. Las pruebas con Chromium emulado no
certifican rendimiento en un teléfono o tablet físico. No se ha publicado en AWS.
La revisión posterior de espacio, interacción y las 28 escenas se registra en
`docs/validation/industrial-review-2026-11-12.md`.
