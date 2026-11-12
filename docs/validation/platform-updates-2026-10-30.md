# Validación de las actualizaciones de plataforma

Fecha: 2026-10-30. Rama: `develop`. Cambios locales sin commit ni publicación.
Fuente y alcance: `docs/requirements/2026-10-30-actualizaciones-plataforma.md`.

## Resultado funcional

| Cambio | Resultado local |
| --- | --- |
| Textos y título de experiencia | Landing, ingreso, inicio, catálogo, guion, resúmenes y tablero actualizados; no quedan referencias a «semana» en las apps ni en el contenido ejecutable. |
| Catálogo | 19 carreras: una jugable y 18 próximas. Se agregan cinco, se divide Psicología y se elimina Enfermería. El indicador de landing usa el tamaño real del catálogo. |
| Personajes | La tarjeta del equipo muestra rol y biografía del módulo, con adaptación móvil. |
| 1.3 | Cuatro comentarios sin categorías, reloj de evaluación ni puntaje. Avanza a 1.4 con 15 s, sin revelar la pista. |
| Continuidad | Intentos v2 resuelven reglas y máximos v2; nuevos intentos usan v3. El motor rechaza mezclar versiones. No se reinicia ni transforma progreso. |
| Correo 1.5 | «Arma tu respuesta», sin contador permanente. Selección de dos bloques y envío verificados; una sola frase mantiene deshabilitado Enviar y explica el rango. |
| Glosario | Definiciones por hover/foco, cierre con Escape y lista desplegable para móvil. Las palabras dentro de opciones no impiden elegirlas. |
| Sonido | Sin sonido por defecto. Tras Activar, AudioContext corre y genera cuatro osciladores por tono; Silenciar suspende el contexto. Se limpian intervalos al salir y se suspende en pestañas ocultas. |
| Zona horaria | Prueba de borde de fecha: `2026-10-30T02:30Z` se muestra como 29 de octubre, 10:30 p. m. en Santo Domingo, aun con proceso en UTC. |
| Responsividad | Se corrigieron desbordamientos del botón de avance largo y de la cabecera pública detectados a 390 px. |

## Comprobaciones automatizadas

- `pnpm typecheck`: pasa en todos los workspaces.
- `pnpm lint`: pasa en ambas apps.
- `pnpm test`: 79 pruebas pasan: 46 motor, 11 identidad, 9 datos, 12 infraestructura y 1 formato de fechas.
- El motor incluye 600 partidas aleatorias reproducibles de v3 y 600 de v2, respuestas
  exhaustivas de los mini-juegos, protección de respuestas en la escena pública y
  continuidad por versión. `validateModule` devuelve cero errores.
- Los caminos de mayor y menor desempeño v3 completan las 19 escenas con 86/34 puntos;
  v2 conserva 91/32. Ninguna decisión ni tiempo agotado bloquea el módulo.
- `pnpm build:web` y `pnpm build:admin`: pasan (código de salida 0). La ruta temporal
  de revisión no aparece entre las rutas compiladas.
- Se inspeccionan los JS públicos del build web para comprobar que no contienen
  claves y resultados privados del guion: `correctCategoryId`, `correo-profesional`,
  `diagnostico-correcto`, `patron-claro` ni la pareja `sol-desactivar`.

## Navegador

Chromium mediante Playwright, con viewports 1440 × 1000 y 390 × 844. Revisión de
capturas de llamada, comentarios, correo y tooltip, tarjeta de equipo y landing.
Sin errores `pageerror` y sin desbordamiento horizontal en las pantallas revisadas.

La prueba usa una ruta temporal local con las pantallas reales, escenas públicas y
personajes sintéticos. Se comprueban las respuestas que emiten los controles; el
recorrido completo y los puntajes se verifican por separado en el motor. La ruta
se retiró antes del build: no se entrega un acceso alternativo al simulador ni se
importa el guion privado en un cliente de producción.

Evidencia temporal: `/tmp/despega-improvements-ui/` (capturas y `results.json`).
El código de revisión también es temporal; no es una suite E2E permanente del repositorio.

## Límites de esta validación

- El build del admin intentó leer el panel y registró una sesión AWS SSO vencida;
  completó la compilación con salida 0. No se interpreta como validación de acceso a DEV.
- No se hicieron escrituras en DynamoDB, altas de usuarios, migraciones ni operaciones
  de infraestructura. No se volvió a validar Cognito ni el flujo autenticado en AWS.
- El tono se comprobó mediante estado del contexto y creación de osciladores; queda
  la escucha y validación en dispositivos físicos. WebKit no estaba instalado en el
  runtime de Playwright y no se certifica Safari con esta revisión.
- No se ejecutó `infra:synth` por no cambiar esquema, permisos, variables ni CDK;
  las 12 pruebas existentes de infraestructura sí forman parte de `pnpm test`.
- La zona horaria de Santo Domingo es la suposición operativa registrada en requisitos.
- No se añadieron guiones para las carreras próximas. La nota sobre otro juego se
  excluyó por indicación expresa del operador.
