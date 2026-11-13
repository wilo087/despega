# Validación del landing y CRM — 2026-11-12

Este informe registra la implementación y validación local previas. La publicación
posterior autorizada y las pruebas contra Amplify/Cognito reales se documentan en
[Despliegue DEV del 2026-11-12](dev-release-2026-11-12.md).

## Alcance y autorización

Solicitud: implementar landing/encuesta desde el DOCX del cliente, guardar
respuestas en el admin como CRM y agregar una diapositiva con precios. El usuario
confirmó respuesta conjunta con tutor para menores, con autorización y correo.
Fuentes y decisiones: requisitos del 2026-11-12 y ADR 0011.

## Comprobaciones realizadas

- `pnpm typecheck`: todos los paquetes, apps e infra pasan.
- `pnpm lint`: ambas apps pasan; el lint de admin se repitió tras los ajustes de
  ficha y confirmación de guardado, sin avisos.
- `pnpm test`: motor, autenticación, datos, web, admin e infra pasan. Nueve pruebas
  nuevas cubren ramas/consentimientos, saneamiento, transacción, idempotencia,
  fechas locales, paginación completa de KPI, concurrencia y CSV seguro.
- `pnpm build:web` y `pnpm build:admin`: pasan. Admin se volvió a compilar tras
  resolver la decodificación del ID en la ficha y conservar la confirmación del
  seguimiento al revalidar la página.
- `pnpm infra:synth:dev` y `pnpm infra:synth:prd`: pasan. Se añade una comprobación
  de que UpdateItem administrativo queda acotado a la partición CRM.

## Navegador y persistencia real

Chrome con Playwright en computadora local; no sustituye prueba física con
estudiantes. Se revisó landing a 375×812, 768×1024, 1366×768 y 1920×1080, sin
ancho sobrante ni errores de JavaScript. Se comprobó el CRM a escritorio y 375 px.

Se ingresaron dos respuestas **sintéticas** en DynamoDB DEV de `qrioso-dev`
(cuenta verificada `779926948601`, región `us-east-1`): un tutor y un estudiante
menor con tutor ficticio. No se crearon identidades reales ni se enviaron correos.

- Flujo completo de cuatro pasos y guardado confirmado para ambos perfiles.
- El menor no recibe preguntas de pago ni opción promocional. Se conserva la
  autorización conjunta con el correo del tutor; no se verifica identidad.
- Las fichas muestran respuestas, fuentes y consentimientos. Guardar estado/nota
  actualiza la versión y presenta confirmación; el dato se leyó de AWS.
- KPI de dos encuestas: dos interesados en pruebas y una respuesta comercial.
  Las profesiones múltiples contabilizan sus selecciones; el pago usa solo la
  respuesta del tutor. Son datos de prueba, no resultados de mercado.
- CSV autenticado devuelve HTTP 200 e incluye ambas respuestas completas.
- Usuario sin sesión es enviado al login. Orientación recibe HTTP 404 en CRM y
  exportación, sin contactos. La navegación solo ofrece CRM a administración.
- Reenvío real con el mismo UUID de formulario: no agrega respuestas ni métricas.
- Los dos registros, sus recibos y sus contadores de prueba se retiraron con
  operaciones condicionadas; la consulta posterior no encuentra fixtures y las
  métricas regresan al estado anterior. No se borraron perfiles ni simulaciones.

Durante QA se corrigió una transición que podía transformar el botón Continuar
al de envío dentro del mismo clic. Los botones tienen claves distintas y se
cancela el evento de navegación; los campos controlados conservan respuestas ante
un fallo. La comprobación de registro real se hizo con esta corrección aplicada.

El servidor previo de admin en :3001 no respondía (EPIPE en su registro); se usó
un servidor temporal del build en :3201 sin intervenir ese proceso. Se retira el
servidor propio al terminar QA. La web se revisó en el servidor existente :3012.

## Propuesta comercial

`/Users/wdelacruz/www/qrioso/qrioso-web/src/app/proposals/despega/index.html`
y su PDF fueron actualizados a **19 diapositivas/páginas**:

| Componente adicional | USD antes de impuestos |
| --- | ---: |
| Landing y encuesta | 2,300 |
| CRM y seguimiento | 2,700 |
| KPI e implementación | 1,500 |
| Ampliación | 6,500 |
| Proyecto completo con ampliación | 61,000 |

Se actualizaron desglose, hitos (24,400 / 18,300 / 12,200 / 6,100), plazo (23–25
semanas), escenario anual (71,200 con Operación) y expansión de catálogo (137,500
con 17 módulos narrativos). Los planes de soporte mantienen sus precios y horas.
Se revisaron todas las diapositivas en 375, 768, 1366, 1920 y 2560 px, navegación,
reanudación, assets y sumas. Las diapositivas densas permiten scroll en laptop.
PDF letter horizontal de 19 páginas, renderizado e inspeccionado completo.

## Evidencia visual

Las capturas de CRM contienen exclusivamente los registros sintéticos ya retirados.

- `screenshots/landing-desktop-2026-11-12.webp`
- `screenshots/landing-mobile-2026-11-12.webp`
- `screenshots/crm-survey-desktop-2026-11-12.webp`
- `screenshots/crm-survey-detail-2026-11-12.webp`
- `screenshots/crm-survey-mobile-2026-11-12.webp`

## Límites y pendiente de publicación

Sin commit, push, deploy, bootstrap ni cambios de tablas/índices. Las escrituras
anteriores fueron pruebas compartidas de DEV, no publicación. Falta aprobar el
aviso definitivo (responsable, retención y canal), ejecutar un despliegue autorizado
para el permiso IAM de seguimiento en Amplify y validar la campaña con usuarios.
Los flujos de Cognito no se validaron en esta tarea: el acceso de staff probado fue
local, limitado a loopback. No hay campañas automáticas ni CRM externo.
