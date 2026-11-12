# Revisión de espacio, 3D y jugabilidad de EnvaPlast

Fecha: 2026-11-12. Revisión solicitada durante la prueba local del juego.
Cambios locales, sin commit, push ni publicación AWS. Software v2/v3 y las
rúbricas de Industrial conservan sus reglas.

## Problemas encontrados y corregidos

| Problema observado en código o navegador | Corrección |
| --- | --- |
| El avatar miraba en sentido contrario al movimiento. | Se retira el giro adicional de 180°; gira según el desplazamiento efectivo. |
| Teclado y joystick seguían ejes del mundo, difíciles de interpretar con la cámara isométrica. | Movimiento relativo a la pantalla y reposo al quedar bloqueado. |
| Las colisiones ignoraban las posiciones editadas y el mobiliario. | Navegación que usa la distribución vigente, máquinas, muebles, personas, peligros y segunda selladora. |
| Altagracia estaba dentro del escritorio; un personaje del comedor, dentro de una mesa; la selladora almacenada, dentro del inventario. | Posiciones separadas y búsqueda determinista de espacio libre para personajes y operarios. |
| Línea 2 tenía dimensiones distintas en el generador y la navegación; la entrada podía quedar cerrada al bloquear otras zonas. | Dimensiones comunes en `geometry.json` y apertura real en la pared de entrada. |
| Los destinos usaban siempre un desplazamiento fijo, que podía terminar en un obstáculo. | Búsqueda de un punto de interacción accesible, con ruta visible y aproximación por pasillos. |
| El picking de Babylon advertía que faltaba registrar Ray. | Importación explícita del módulo; desplazamiento por clic verificado en navegador. |
| Los operarios no acompañaban correctamente la distribución; asignar a Wilfredo podía duplicarlo. | Posiciones junto a las máquinas vigentes y una sola representación del supervisor asignado. |
| Paredes y paneles podían ocultar la acción; etiquetas se superponían. | Proyección de cámara ajustada al área libre, paredes con material de ocultación y etiquetas que evitan controles y otras etiquetas. |
| Cajas parcialmente hundidas en los rodillos. | Altura de apoyo corregida sobre el transportador. |
| La pantalla táctil carecía de acción cercana clara. | Botón de interacción con disponibilidad según proximidad, joystick fuera del panel y HUD más compacto. |
| Abrir herramientas podía dejar entrar movimiento por teclado. | Entrada bloqueada durante tablet, formularios, carga, pausa y acciones pendientes. |
| Plegar el panel desmontaba la actividad y podía perder la selección o la medición en curso. | La actividad permanece montada y conserva su estado. La cabecera permanece accesible al desplazar el panel. |
| Un borrador pendiente podía enviarse durante la pausa; Strict Mode podía iniciar un envío sin cambios. | Comparación con el último borrador enviado y espera mientras los controles estén deshabilitados. Recuperación de la partida pausada comprobada. |
| Un borrador guardado de distribución no reaparecía en el mundo al recuperar la actividad. | La previsualización también utiliza la distribución del borrador confirmado. |

Los borradores de distribución pueden contener superposiciones mientras se
editan: ahora muestran áreas rojas y un aviso. La validación de pasillos, orden
y recompensas sigue en el servidor. No se aplican ni se premian como soluciones
confirmadas por mostrar una previsualización.

## Validación automatizada

- `pnpm typecheck` y `pnpm lint`: pasan en el monorepo.
- `pnpm test`: **110 pruebas, cero fallos**; 76 del simulador, 11 de identidad,
  10 de datos, 1 del backoffice y 12 de infraestructura/empaquetado.
- Nueve pruebas espaciales nuevas: separación de objetos, maquinaria reubicada,
  operarios, ausencia de Yuleisy, supervisor asignado una sola vez, zonas cerradas,
  recuperación, orientación de controles, posiciones no finitas y superposiciones.
- Se comprueban **100 distribuciones alternativas** y rutas a todas las
  interacciones de las configuraciones auditadas. Los segmentos de ruta se
  muestrean entre celdas para detectar cruces con obstáculos.
- `pnpm assets:check`: 20 GLB, dos retratos y fuente Blender editable; 44.456
  triángulos en el conjunto de recursos y **2.764.801 bytes** sin comprimir,
  incluidos los retratos.
- `pnpm assets:space-check`: carga los GLB reales con Babylon NullEngine;
  **34 comprobaciones de límites** y **16 orientaciones** de Alma/Leo.
  Se muestrea Walk en 65 posiciones del ciclo y en sus claves de animación:
  extensión horizontal máxima de 0,641842 unidades, dentro del radio de 0,65.
  También se exige conservar metadatos de ocultación de paredes en las zonas.
- `pnpm build:web` y `pnpm build:admin`: pasan. La ruta temporal de revisión se
  retiró antes de los builds y responde **404**.
- `pnpm audit:factory-client`: 19 verificaciones de contenido privado pasan;
  cero referencias de Babylon en trazas SSR. Los 199 archivos JavaScript cliente
  suman 1.652.459 bytes con gzip. Esta suma no mide por sí sola la descarga inicial.
- `git diff --check`: pasa.

Resumen verificable: [checks.json](industrial-review-2026-11-12/checks.json).
La auditoría geométrica se puede repetir con `pnpm assets:space-check`.

## Revisión en navegador

Se cargaron las **28 escenas** en 1280 × 720 y 390 × 844, verificando el
identificador de cada escena, posición finita, ausencia de errores visibles y
ausencia de desbordamiento horizontal del documento y del panel.
Las escenas se revisaron mediante un transporte temporal en memoria, sin
escribir decisiones de prueba en DynamoDB. Esta revisión de presentación no se
presenta como 56 partidas completas: las rutas y consecuencias de las tres
jornadas se cubren además con las pruebas del motor.

Interacciones comprobadas: ruta e interacción con Altagracia rodeando el
escritorio; clic en el suelo con cambio efectivo de posición; selección de
Sellado y repetición de una medición conservadas al plegar/abrir el panel;
cronómetro que conserva el control de registro; tablet con posición invariable
al mantener W; y editor con dos máquinas superpuestas que activa el aviso y
las áreas rojas. La partida existente quedó en la escena 1.1, abierta y pausada.

- [Registro de escritorio](industrial-review-2026-11-12/desktop.json).
- [Registro móvil](industrial-review-2026-11-12/mobile.json).
- [Juego local corregido](industrial-review-2026-11-12/game-final-desktop.png).
- [Línea y equipo](industrial-review-2026-11-12/scene-4-desktop.png).
- [Editor de distribución](industrial-review-2026-11-12/scene-13-desktop.png).
- [Aviso de superposición](industrial-review-2026-11-12/layout-overlap-desktop.png).
- [Cronometraje móvil](industrial-review-2026-11-12/scene-5-mobile.png).
- [Personal y HUD móvil](industrial-review-2026-11-12/scene-21-mobile.png).
- [Resultados](industrial-review-2026-11-12/scene-26-desktop.png).

## Oportunidades siguientes

Actualización: las prioridades **1–3 se implementaron y validaron localmente**.
Ver [tutorial, ambientación y actuación](industrial-immersion-2026-11-12.md).
Los puntos 4–5 conservan su estado pendiente, con protocolo preparado.

1. **Orientación inicial:** un recorrido breve con objetivos de movimiento e
   interacción ayudaría a estudiantes sin experiencia en juegos isométricos.
2. **Escenografía:** añadir señalización de sectores, detalles de mantenimiento,
   envases y herramientas ampliaría la identidad de cada estación. Cada pieza
   sólida nueva debe incorporarse al plano y a la auditoría de colisiones.
3. **Actuación:** transiciones más elaboradas entre conversación, inspección y
   trabajo, gestos propios y miradas mejorarían la lectura de los personajes.
4. **Usabilidad con estudiantes:** observar orientación, descubrimientos
   opcionales, fatiga de lectura y comprensión de las consecuencias antes de
   aumentar contenido o duración.
5. **Dispositivos físicos:** medir FPS y temperatura y probar joystick, Safari/iOS
   y tamaños de tablet reales. La vista de 390 × 844 es emulación de tamaño;
   no sustituye una prueba física ni certifica 30/60 FPS.

No se afirma ausencia universal de intersecciones en todo borrador posible.
La separación se comprobó en las configuraciones auditadas y mediante los límites
de los modelos reales. Componentes de una misma máquina, cajas apoyadas en bandas,
marcadores de objetivo y sombras de contacto son composiciones deliberadas.
