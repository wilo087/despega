# Protocolo de usabilidad y dispositivos — EnvaPlast

Estado: **preparado; no ejecutado con estudiantes ni dispositivos físicos**.
Fecha de preparación: 2026-11-12. No registrar nombres, correos, colegio,
credenciales ni grabaciones de estudiantes en esta hoja. Utilizar códigos de
prueba anónimos y el procedimiento de consentimiento del centro educativo.

## Recorrido de observación

Usar una cuenta de prueba del entorno acordado. En localhost el progreso se
guarda en DEV; no reiniciar intentos de estudiantes reales.

| Paso | Instrucción que se puede leer al participante | Qué observar |
| --- | --- | --- |
| Inicio | Elige tu personaje y prueba la guía de controles. | Si encuentra Empezar/Omitir y comprende que la guía no puntúa. |
| Movimiento | Llega al círculo verde con el control que prefieras. | Orientación con cámara, intentos contra obstáculos y necesidad de ayuda. |
| Interacción | Usa el marcador y abre la tablet. | Comprensión de cercanía, E/acción táctil y cierre de la tablet. |
| Recuperación | Pausa y vuelve a entrar a la guía. | Conservación del paso y comprensión de Reanudar. |
| Pedido | Encuentra a Altagracia y escucha el objetivo. | Lectura de sectores, ruta y diferencia entre moverse y decidir. |
| Exploración | Recorre la línea y busca información útil. | Atención a personas, descubrimientos opcionales y uso de la tablet. No revelar dónde está la solución. |
| Medición | Mide una estación y cambia de herramienta. | Lectura de la banda, inicio/registro, conservación del cronómetro al plegar el panel. |
| Distribución | Mueve una estación y corrige una superposición. | Comprensión del aviso rojo y de la validación de pasillos. |
| Consecuencia | Explica qué cambió después de tu decisión. | Si relaciona la reacción con producción, seguridad y colaboración. |
| Reflexión | Explica con tus palabras qué hiciste y qué te costó. | Fatiga de lectura, controles, términos nuevos y contexto de la carrera. |

Registrar intervenciones del observador por separado de acciones autónomas.
No calificar a la persona por su rapidez con un juego isométrico. El tiempo del
tutorial se puede medir como indicador de usabilidad, sin convertirlo en puntaje.

## Hoja por prueba

| Campo | Registro |
| --- | --- |
| Código de prueba | Pendiente |
| Fecha, entorno y versión/commit | Pendiente |
| Equipo, SO, navegador y método de entrada | Pendiente |
| Inicio / fin de guía y ayudas recibidas | No ejecutado |
| Orientación y primera interacción sin ayuda | No ejecutado |
| Escenas visitadas y errores observados | No ejecutado |
| Elementos difíciles de leer o tocar | No ejecutado |
| Descubrimientos opcionales encontrados sin indicación | No ejecutado |
| Explicación de una consecuencia con palabras propias | No ejecutado |
| Prioridad de mejora, evidencia y reproducción | Pendiente |

## Rendimiento en equipo físico

1. Registrar modelo del equipo, SO/navegador, resolución, orientación y conexión.
   No usar números de serie ni identificadores personales.
2. Jugar al menos cinco minutos, pasando por Línea 2, bodega y una conversación.
   Distinguir carga inicial, estado estable y ventanas/pestañas en segundo plano.
3. Con las herramientas de desarrollo del navegador, registrar el FPS mostrado en
   `canvas[data-frame-rate]`, `data-quality` y el tamaño real del canvas. Comparar
   dos momentos estables: después de cargar y tras varios minutos de uso.
4. Comprobar respuesta del joystick y del botón de interacción, gestos de
   desplazamiento del panel, teclado, pérdida de foco y vuelta de segundo plano.
5. En Safari/iOS, probar carga de GLB, audio tras gesto explícito, pausa, recarga,
   cierre de tablet, orientación y modo de reducir movimiento del sistema.
6. Observar degradación sostenida, calentamiento o consumo anormal. La meta es
   60 FPS en computadora y 30 FPS en el móvil de referencia; registrar resultados,
   no marcar la meta como cumplida por haberla incluido en este protocolo.

| Equipo físico | Escenas | FPS estable / calidad / tamaño canvas | Duración | Resultado |
| --- | --- | --- | --- | --- |
| Computadora de referencia | Pendiente | No ejecutado | Pendiente | Pendiente |
| Móvil de referencia | Pendiente | No ejecutado | Pendiente | Pendiente |
| Tablet / Safari iOS | Pendiente | No ejecutado | Pendiente | Pendiente |

La emulación de tamaños sirve para comprobar distribución y controles visibles;
no equivale a medir un teléfono o tablet ni sustituye estas observaciones.
