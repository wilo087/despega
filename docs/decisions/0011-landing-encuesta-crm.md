# ADR 0011 Landing de investigación y CRM interno

- Estado: aceptado para implementación local por solicitud del 2026-11-12.
- Fuente: `docs/requirements/2026-11-12-landing-encuesta.md`.

## Decisiones confirmadas por el usuario

Crear el landing y su encuesta, conservar las respuestas en el admin para obtener
KPI, y agregar alcance y precios a la propuesta comercial. Los menores responden
junto al tutor, registrando su autorización y correo (confirmación en esta tarea).
No se solicita desplegar, enviar mensajes ni integrar un CRM externo.

## Decisión técnica

- La nueva portada `/` sigue el documento; la presentación del simulador permanece
  en `/experiencia`. `/encuesta` lleva a la sección del formulario y `/privacidad`
  contiene su aviso operativo, que debe aprobar el cliente antes de publicación.
- CRM propio en `/crm`, exclusivo de `despega/admin`; orientación no recibe estos
  contactos. Cada página, exportación y acción vuelve a autorizar en servidor.
- Server Action pública y validada con Zod: no requiere cuenta del simulador. Es
  una excepción expresa al flujo autenticado porque la encuesta busca visitantes.
  La acción permite solo crear respuestas; nunca consultar otras personas.
- `core` conserva respuestas, recibos idempotentes y contadores diarios. Se
  consultan particiones primarias dedicadas; no hay Scan, GSI o tabla nueva.
- Una transacción crea respuesta y recibo y suma métricas; un reintento del mismo
  formulario no duplica conteos. Recargar la página abre un formulario diferente:
  los KPI cuentan respuestas completas, no correos o contactos únicos.
- Los días son de Santo Domingo; los instantes se guardan en UTC. Métricas de pago
  excluyen estudiantes. Profesiones permiten selección múltiple y no deben sumar 100%.
- El seguimiento usa versión optimista. El permiso IAM nuevo es UpdateItem solo
  para la partición CRM; no habilita cambios administrativos en perfiles.
- CSV privado con el período/filtros vigentes y protección contra fórmulas. Máximo
  10,000 respuestas recorridas; si se supera, se exige reducir fechas y no se
  entrega silenciosamente un archivo incompleto.

## Privacidad y supuestos registrados

Las preguntas de precio son obligatorias para familiares y orientadores; no se
muestran ni almacenan para estudiantes. La referencia del documento «Desde ... y»
se presenta como «Entre RD$4,000 y RD$5,999», sin cambiar sus cifras.
Se pregunta solo si el estudiante tiene menos de 18 años; no se pide cumpleaños.
El consentimiento del tutor es conjunto y declarado, sin verificación de identidad,
parentesco o correo. Se conservan fecha y versión del aviso; novedades son aparte,
opcionales y siempre desactivadas para menores. No hay envío de correos o campañas.
Se registra únicamente fuente/medio/campaña, sin URL completa ni IP. La retención,
el responsable del tratamiento y el canal definitivo deben revisarse con DESPEGA
antes de abrir la campaña; el canal técnico de coordinación inicial es Qrioso.

## Alternativas y consecuencias

Un CRM externo requiere una cuenta, contrato, integración y permisos que el usuario
no ha seleccionado. Guardar solo en el navegador no satisface la persistencia ni
los KPI. Un GSI nuevo añade despliegue y costo sin mejorar las consultas iniciales.
El CRM interno reutiliza identidad, tablas y operación; no equivale a una suite de
marketing, embudos de ventas, automatizaciones o editor de encuestas. No mide
visitas ni conversión visitante → respuesta; tampoco valida disposiciones de pago
como ventas reales. Las métricas del período son globales y los filtros de perfil,
ciudad y estado afectan la lista y la exportación.
