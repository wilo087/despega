# Validación local de Ingeniería Industrial 3D

Fecha de cierre: 2026-11-12, America/Santo_Domingo. Implementación solicitada el
2026-11-11. No hay commit, push, publicación AWS, migración ni datos sintéticos
escritos en las tablas compartidas de DEV durante esta tarea.

## Comprobaciones

| Comprobación | Resultado |
| --- | --- |
| `pnpm typecheck` | Pasa en paquetes, web, admin e infra |
| `pnpm lint` | Pasa sin errores ni advertencias |
| `pnpm test` | 101 pruebas, cero fallos; incluye 1.800 partidas reproducibles |
| `pnpm build:web` | Build de producción completo, sin rutas de prueba |
| `pnpm build:admin` | Build de producción completo |
| `pnpm assets:check` | 20 GLB válidos, 2 retratos y fuente Blender editable |
| `pnpm audit:factory-client` | 19 comprobaciones de contenido privado, sin filtraciones; cero referencias Babylon en trazas SSR |
| `pnpm infra:synth:dev` | Pasa, sin desplegar |
| `pnpm infra:synth:prd` | Pasa con las advertencias conocidas de Apps Amplify PRD pendientes |
| `git diff --check` | Sin errores de espacios |

Los recuentos exactos están en [tests.json](industrial-3d-2026-11-12/tests.json),
[assets.json](industrial-3d-2026-11-12/assets.json) y
[client-audit.json](industrial-3d-2026-11-12/client-audit.json).

## Motor y datos

Se comprueban los caminos de entrega completa, parcial y tardía; cierre con y sin
aliado; los dos polos EST sin alterar desempeño; toda opción de diálogo declarada,
todas las combinaciones válidas de mensajes y cada tiempo agotado. Se cubren
presupuesto e instalación, distribución inválida penalizada una sola vez, salida
guiada sin premio, descubrimientos no repetibles, objetivos opcionales y escenario
condicional de seguridad.

El reloj del diagnóstico se habilita después de armar la hoja. La preferencia de
método no tiene un valor preseleccionado y un vencimiento no inventa una preferencia.
Se prueban pausa, borradores y tiempo ampliado; validación de rutas transitables y
que la proyección pública no copie rúbricas ni respuestas.

El servicio de datos se prueba con el cliente DynamoDB interceptado: guarda estado
y decisión mediante la transacción existente; repetir el último UUID no escribe
ni puntúa de nuevo; una versión obsoleta falla por conflicto. Este test nunca usa
la red ni valida por sí solo Cognito o IAM en AWS. Software conserva sus 600
partidas de v2 y 600 de v3, sus puntajes y máximos anteriores.

## Revisión de navegador

Chromium headless con WebGL por software, a 1440 × 1000 y 390 × 844. Se usó una
superficie temporal de prueba con transporte en memoria, sin credenciales ni
escrituras AWS; se eliminó antes del build. No forma parte de la aplicación final.

- Entrada, selección de avatar y desplazamiento por ruta hasta Operaciones.
- Hoja interactiva: ubicar cinco mediciones y compartir el diagnóstico.
- Causas: asignar las ocho tarjetas y avanzar con su consecuencia.
- Pareto: ordenar filas y guardar el 68%.
- Distribución: elegir método, validar la cuadrícula y aplicar la configuración.
- Presupuesto: financiar capacitación e instalación dentro de $5.000.
- Inspección: seleccionar la muestra y avanzar.
- Personal: asignar cada estación y confirmar la contingencia.
- Resumen: cinco dimensiones positivas, EST firmado, tres categorías y despacho.
- Tablet: apertura de Teams, Outlook, Excel, cronómetro y tareas; cronómetro de
  práctica observado en 1,25 s; tiempo ampliado confirmado.
- Joystick táctil: desplazamiento del mando de 22 px y liberación del control.
- Con un segundo de latencia artificial por petición, el cronómetro avanzó de
  0 a 13,01 s sin retroceder durante los puntos de recuperación.
- Al cerrar una jornada desaparece el canvas anterior; el siguiente turno restauró
  la posición de entrada (−13, 12), comprobada tras el siguiente guardado.
- Pausa: pantalla de pausa confirmada; no hubo errores de consola ni
  desbordamiento horizontal en los recorridos comprobados.

Capturas de la revisión (el texto final adopta formulaciones sin género para el
protagonista; no cambia la distribución mostrada):

- [Selección de avatar y mundo](industrial-3d-2026-11-12/avatar-desktop.png).
- [Editor de distribución](industrial-3d-2026-11-12/layout-desktop.png).
- [Resultados en escritorio](industrial-3d-2026-11-12/results-desktop.png).
- [Resultados en móvil](industrial-3d-2026-11-12/results-mobile.png).
- [Pausa en móvil](industrial-3d-2026-11-12/pause-mobile.png).

## Recursos y empaquetado

El conjunto completo de GLB y retratos pesa 2.663.421 bytes sin comprimir. Todos
los chunks cliente de producción juntos suman 1.645.402 bytes con gzip; esta suma
no mide la descarga inicial real, que carga solo los chunks y zonas necesarios.
El arte total más todo el JavaScript comprimido queda por debajo del presupuesto
inicial de 8 MB. El manifiesto y el control de assets son reproducibles.

Los veinte GLB contienen 42.944 triángulos en conjunto; las copias de operadores y
máquinas reutilizan instancias. Cada personaje conserva ocho clips de animación.
Se comprueban cabecera y longitud GLB, geometría, clips y fuente `.blend`.

La auditoría de producción no encuentra el registro privado de Industrial ni sus
consecuencias futuras en archivos JavaScript cliente. Babylon no aparece en las
trazas de dependencias de servidor. Esto comprueba la separación del paquete 3D;
el tamaño y la ejecución del artefacto final de Amplify se deben verificar en el
siguiente job autorizado, no se sustituyen por un build local.

Se arrancó el build con `next start`: ingreso, GLB, retrato y manifiesto respondieron
200 con los tipos MIME esperados; la ruta temporal respondió 404. La CSP de
producción se registra en [production-smoke.json](industrial-3d-2026-11-12/production-smoke.json).

## Límites de la validación

Las observaciones de FPS con SwiftShader fueron 35 FPS a 1440 × 1000 (render de
960 × 666) y 61 FPS a 390 × 844 (render de 260 × 562), después de ocho segundos por
vista. Son observaciones con calidad adaptable y gráficos por software, no una
certificación en hardware físico ni una prueba prolongada de temperatura o batería.

Quedan UAT con estudiantes para duración y comprensión, navegadores y dispositivos
físicos (incluido Safari/iOS), y un recorrido autenticado en DEV cuando se autorice
publicar. No se presenta el objetivo de 30–35 minutos ni el de 60/30 FPS en hardware
real como un resultado ya certificado. Las pruebas de reintento y concurrencia son
del servicio; no se simularon dos dispositivos reales ni cortes de red contra AWS.
