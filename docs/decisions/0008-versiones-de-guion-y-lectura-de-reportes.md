# ADR 0008: lectura de comentarios y versiones del guion

- Estado: aceptado
- Fecha: 2026-10-30

## Contexto

El cliente pide que la escena 1.3 muestre primero los comentarios de los clientes,
sin clasificarlos como conexión lenta o rápida. El operador delega la recomendación
pedagógica. La clasificación original anticipaba la pista del diagnóstico y daba
puntos que ya forman parte de intentos guardados bajo `moduleVersion = 2`.

## Decisión

- En v3, la escena 1.3 es lectura de cuatro comentarios sin reloj de evaluación,
  categorías ni puntaje. En 1.4 el estudiante decide con los 15 segundos originales,
  sin recibir una pista de clasificación. Se mantienen 19 escenas y sus IDs.
- `Scene.reports` es contenido declarativo del motor y se proyecta explícitamente
  a `PublicScene`. La web y el visor del guion consumen ese mismo contenido.
- Conservar la definición original de 1.3 para v2. El registro resuelve
  `findModule(careerId, moduleVersion)`; sin versión devuelve la vigente.
- La capa de datos resuelve la versión persistida al reanudar y responder; las apps
  hacen lo mismo al mostrar escenas, resultados y afinidad. Los agregados normalizan
  cada registro con los máximos de su propia versión. El motor rechaza cruces de versión.
- Los textos y ayudas visuales comunes pueden actualizarse en ambas versiones;
  las reglas de evaluación y los máximos de v2 se conservan. No es una instantánea
  íntegra de la redacción histórica.
- Los nuevos intentos, incluido un reinicio administrativo explícito, usan v3.
  No se migra, reinicia ni reescribe progreso existente de forma automática.

## Alternativas

- Marcar comentarios relevantes: agrega otra evaluación que no pide el cliente y
  guía demasiado la observación antes del diagnóstico. Se deja fuera del piloto.
- Puntuar por abrir o leer tarjetas: mide navegación, sin demostrar comprensión.
- Reinterpretar todo progreso con v3: cambiaría el denominador de afinidad de quienes
  ya jugaron 1.3 y haría inconsistentes eventos y respuestas anteriores.
- Borrar o reiniciar intentos anteriores: perdería continuidad y requeriría una
  operación de datos ajena a esta mejora.

## Consecuencias

- Caminos v3: 86/34 puntos, al retirar los +5/−2 de clasificación. V2 conserva 91/32.
  La lectura no suma ni resta afinidad. No se cambian otros puntajes.
- El cliente aún debe validar la escala de desempeño y la duración de las sesiones,
  como ya figuraba en el análisis funcional.
- Las futuras revisiones que cambien reglas deben registrar la versión anterior
  antes de modificar la vigente y mantener su normalización. Una versión desconocida
  se rechaza; no se interpreta silenciosamente con la última.
- No cambian tablas, índices, permisos, variables ni infraestructura.
