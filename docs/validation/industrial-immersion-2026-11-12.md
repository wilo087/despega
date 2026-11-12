# EnvaPlast — tutorial, ambientación y actuación

Fecha: 2026-11-12. Implementación local de las prioridades 1–3 del informe
`industrial-review-2026-11-12.md`. Sin commit, push ni publicación AWS.
Industrial mantiene la versión 1 de sus reglas; Software v2/v3 conserva sus
contratos, decisiones y resultados. Decisión técnica: ADR 0010.

## Cambios entregados

- Guía inicial opcional después de elegir personaje, disponible también desde
  Ayuda y la pausa: desplazamiento a un marcador transitable, interacción y
  apertura de tablet. Guarda el paso, la posición y la finalización. Se puede
  omitir o repetir; no concede puntaje, afinidad, habilidades ni objetivos.
- Relojes y producción detenidos durante la guía. Pausar u ocultar la pestaña
  suspende también sus controles; finalizar u omitir restaura la pausa previa.
  La tarea permanece montada y sus borradores no se envían durante la práctica.
- Instrucciones desplazables y acciones iniciales persistentes en móvil. Cada
  paso comienza al inicio de sus instrucciones. Las etiquetas de la tarea se
  ocultan durante la práctica para concentrar la atención en el marcador.
- Señales de seis sectores, pasillos y puertas transitables; casillero de
  protección, escritorio, planta, carro de herramientas, pallet, muestras y
  dispensador de agua. Los siete muebles nuevos tienen colisión compartida
  entre generación Blender, motor público y presentación.
- Cinco variantes de maquinaria y envases abiertos/cerrados según etapa,
  orientadas hacia el espacio de los operarios. Los ciclos visuales usan la
  duración real de cada clip y el ciclo público de la estación.
- Ocho figuras con diez clips: Idle, Walk, Talk, Listen, Work, Inspect, Point,
  Greet, React y Celebrate. Codos, rodillas y tobillos articulados, miradas,
  parpadeo, boca al hablar y utilería por rol. Las transiciones mezclan poses
  completas y los giros siguen el arco más corto. Walk sigue la velocidad real.
- Preferencia de movimiento reducido, suspensión de animaciones lejanas y
  calidad adaptable que puede recuperar resolución después de estabilizarse.

Los archivos editables están en `assets/3d/envaplast.blend`, `generate.py` y
`character_animation.py`; las exportaciones y retratos, en
`apps/web/public/game-assets/envaplast`. No se incorporaron dependencias nuevas.

## Comprobaciones automatizadas

| Comprobación | Resultado |
| --- | --- |
| `pnpm typecheck` | Pasa en todos los workspaces |
| `pnpm lint` | Pasa en web y admin |
| `pnpm test` | **121 pruebas, cero fallos**: simulador 82, datos 11, identidad 11, web 4, admin 1, infraestructura 12 |
| `pnpm build:web` / `pnpm build:admin` | Ambos pasan, sin la ruta temporal de revisión |
| `pnpm assets:build` | Arte regenerado con Blender 5.2.3 LTS |
| `pnpm assets:check` | 27 GLB, dos retratos, 77.668 triángulos en el conjunto, canales de pose compatibles entre clips |
| `pnpm assets:space-check` | **41 límites**, **16 orientaciones**, **80 combinaciones de figura/clip**, sin infracciones en los casos auditados |
| `pnpm audit:factory-client` | 19 comprobaciones de contenido privado pasan; cero referencias Babylon en trazas SSR |
| Ruta temporal `/factory-check` | Retirada; responde **404** |
| `pnpm local:setup` | Acceso renovado a cuenta DEV `779926948601`, `us-east-1`, tablas existentes |
| `git diff --check` | Pasa |

Las pruebas nuevas verifican progreso/repetición de la guía, pausa previa,
omisión, suspensión, pasos desactualizados, rechazo de decisiones durante la
práctica, ausencia de crédito y compatibilidad de intentos sin tutorial. Datos
prueba `Put` condicional, reintento idempotente y ausencia de evento de decisión.
La presentación prueba giros, mezcla normalizada, movimiento reducido y
suspensión de figuras lejanas. Se conservan las pruebas de caminos completos,
agotamiento de tiempo, distribuciones alternativas y regresión de Software.

La auditoría muestrea las claves y fases intermedias de los clips sobre vértices
GLB reales. Walk ocupa como máximo **0,599025** unidades horizontales; las poses
del protagonista caben en radio **0,65**. El gesto máximo del conjunto ocupa
**0,769756**, dentro del radio **0,85** reservado a personajes. Se corrigió la
pose Inspect que sobrepasaba el radio del protagonista; se mantuvieron los
pasillos y se volvieron a verificar rutas y envolventes. No se afirma ausencia
universal de intersecciones en cualquier borrador inválido de distribución.

Modelos y retratos suman **5.613.223 bytes** sin comprimir y **1.048.450 bytes**
con gzip. Los 199 archivos JavaScript cliente suman **1.656.350 bytes** gzip.
La suma comprimida de ambos conjuntos completos es 2.704.800 bytes: no representa
una medición de descarga inicial, pues incluye recursos diferidos y excluye
HTML/CSS y cabeceras. La red real y Amplify necesitan medición al publicar.

Resumen procesable: [checks.json](industrial-immersion-2026-11-12/checks.json).

## Revisión de interfaz

Se cargaron las 28 escenas en **1280 × 720** y **390 × 844**, con posición y
motor presentes, sin alertas visibles ni desbordamiento horizontal. Se revisó
además Línea 2 en **820 × 1180**. Los registros de escenas usan un transporte
temporal en memoria con el motor real; no representan 56 partidas completas ni
escrituras de decisiones de prueba en DynamoDB.

El tutorial se completó en escritorio y móvil emulado. Se recargó en el paso de
interacción y recuperó el mismo paso y posición; se comprobó tablet, cierre,
pausa, reanudación y omisión. En una tarea de jornada 3, el contador de tarea
permaneció en 0:39, el turno en 24:54 y las cajas conformes en 16 mientras se
practicaba, incluso después de pausar, reanudar y recargar. Tras omitirlo, el
reloj continuó. Las pruebas del motor verifican además que no se acumula
producción durante esa pausa.

La partida real volvió a cargar después de renovar SSO y recuperó la guía sin
avanzar la escena narrativa 1.1. El HUD conservó desempeño 50, clima 65 y pedido
de 9.000 cajas. Quedó abierta en localhost:3012. La consola conservaba el error
histórico de SSO anterior a la renovación; la carga final mostró la planta y
los controles. No se reinició el intento para la revisión.

- [Registro escritorio](industrial-immersion-2026-11-12/desktop.json) y
  [registro móvil](industrial-immersion-2026-11-12/mobile.json).
- [Partida disponible](industrial-immersion-2026-11-12/game-ready.png).
- [Fábrica y máquinas](industrial-immersion-2026-11-12/factory-desktop.png).
- [Tutorial móvil](industrial-immersion-2026-11-12/tutorial-mobile.png) y
  [relojes detenidos](industrial-immersion-2026-11-12/timed-tutorial.png).
- [Línea en tablet](industrial-immersion-2026-11-12/line-tablet.png).
- [Distribución](industrial-immersion-2026-11-12/scene-13-desktop.png) y
  [prueba piloto](industrial-immersion-2026-11-12/scene-16-desktop.png).

## Pendientes de validación externa

Las prioridades 4–5 necesitan participantes y equipos físicos: comprensión del
recorrido, fatiga de lectura, descubrimientos, Safari/iOS, audio, temperatura y
rendimiento sostenido. Se entrega el [protocolo de UAT y dispositivos](industrial-immersion-2026-11-12/uat-script.md)
con su matriz marcada **no ejecutada**. La emulación de tamaño y el FPS observado
en Chromium local no certifican las metas de 60 FPS en computadora y 30 en móvil.
No se desplegó en AWS ni se cambió infraestructura, permisos o tablas.
