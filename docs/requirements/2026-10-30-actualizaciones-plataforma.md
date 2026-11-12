# Actualizaciones de plataforma de octubre de 2026

Fuente del cliente: `DESPEGA - Actualizaciones a plataforma.docx`, entregado en la
tarea del 2026-10-30. Complementa `docs/funtional.md`, que se conserva como documento
original. Esta normalización distingue peticiones del cliente de decisiones técnicas.

## Peticiones del cliente

- Texto de inicio: «Elige una carrera y vive la experiencia del entorno laboral real.
  Tu progreso se guarda después de cada escena».
- Título: «Tu experiencia como Practicante Junior en la empresa PixelForge».
- Agregar una breve descripción de lo que hace cada personaje en la tarjeta del equipo.
- Sustituir las referencias a «semana» por «experiencia».
- Agregar sonido, por ejemplo a la llamada inicial.
- Agregar Ingeniería Mecánica, Publicidad, Odontología, Hotelería y Turismo y Economía.
- Separar Psicología Industrial y Psicología Clínica; eliminar Enfermería.
- Sesión 1, escena 3: primero leer los comentarios de los clientes para analizar el
  problema, sin seleccionar conexión lenta o rápida.
- Escena 5: la captura tacha el contador «0/3 frases» y la indicación de combinar
  «2 o 3 frases del banco»; conserva «Arma tu respuesta» y el banco.
- Mostrar el significado de palabras al pasar el mouse.
- Actualizar la zona horaria (el documento no especifica cuál).

## Aclaraciones y decisiones en la tarea

- El operador pide recomendar el flujo de 1.3 según el objetivo de inmersión laboral.
  Se elige leer y comparar comentarios, y diagnosticar en 1.4; no se agrega una segunda
  selección de evidencias ni se anticipa la categoría correcta. La lectura no da puntos.
- La nota «Pendiente pasar lo del juego (si se logra)» se excluye expresamente por
  indicación del operador: lo verá más adelante.
- Zona horaria asumida: `America/Santo_Domingo`, coherente con la operación actual.
  Los instantes siguen guardados en UTC y las horas ficticias del guion no cambian.
- La lista pasa de 14 a 19 carreras: se conservan las otras carreras del catálogo,
  se suman cinco, se divide Psicología en dos y se retira Enfermería. Las 18 carreras
  sin guion siguen como «Próximamente»; no se inventa su contenido jugable.
- Sonido: tono sintetizado propio de llamada, opcional, activado por el estudiante,
  silenciable y detenido al salir de la pantalla o esconder la pestaña. No hay voces.
- Glosario: definiciones de vocabulario del módulo, sin pistas del diagnóstico;
  acceso por mouse, foco de teclado y consulta desplegable para pantallas táctiles.
- Se simplifica el texto de 1.5 y se oculta el contador, manteniendo la regla del
  documento original de seleccionar entre 2 y 3 bloques. No se cambia su evaluación.
- El cambio de 1.3 genera el guion v3. Los intentos v2 conservan sus reglas y máximos
  de afinidad; no se borran ni se convierten automáticamente. Ver ADR 0008.
