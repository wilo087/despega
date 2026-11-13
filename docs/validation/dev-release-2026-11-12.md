# Despliegue y validación DEV — 2026-11-12

## Autorización y versión

Solicitud explícita del usuario: «Publica los cambios en ambiente qrioso-dev».
Cuenta verificada con STS: `779926948601`; perfil `qrioso-dev`, región `us-east-1`.
Código desplegado desde `develop`:
`a36d608a902ea45809223a82f4c078abf0134e18` (`Adding new game`). Al iniciar, el
checkout estaba limpio y coincidía con `origin/develop`.

| Superficie | App Amplify | Rama / job | Estado | URL |
| --- | --- | --- | --- | --- |
| Web | `dwc3j5j9ebtdk` | `develop` / `6` | `SUCCEED` | https://despega.qrioso.do |
| Admin | `d20sgf4s7cvg7l` | `develop` / `6` | `SUCCEED` | https://despega.admin.qrioso.do |

Ambas apps ya habían completado el despliegue automático del commit al revisar
Amplify. Se verificó esa versión y se completó el despliegue de infraestructura
necesario para el seguimiento CRM. No se modificó código de aplicación en esta tarea.

## Infraestructura

- Dominios de ambas apps validados por `validate-amplify-domains.ts dev`.
- Variables efectivas: `STAGE=dev`, `AUTH_PROVIDER=cognito`, región `us-east-1`,
  tablas `despega_dev_core` / `despega_dev_simulation`, sin endpoint emulado.
- `pnpm --filter @despega/infra test`: 12 pruebas pasan, incluida la restricción
  de UpdateItem del admin a `SURVEY#landing-v1` mediante `dynamodb:LeadingKeys`.
- Diff previo: permiso CRM y tres diferencias de texto no ASCII en Cognito;
  sin reemplazo de tablas ni pools.
- Despliegue ejecutado con perfil y stage explícitos:

```sh
pnpm --filter @despega/infra exec cdk deploy Despega-dev \
  --context stage=dev --profile qrioso-dev --require-approval never
```

`Despega-dev` terminó en `UPDATE_COMPLETE` (última actualización:
`2026-11-12T20:52:53.175Z`). El diff posterior no muestra diferencias funcionales;
CDK todavía omite tres diferencias de texto que clasifica como caracteres no ASCII
posiblemente alterados. No se afirma igualdad estricta de esos textos.

## Comprobaciones funcionales en AWS

Chrome mediante Playwright contra los dominios HTTPS publicados, con Cognito real
y datos exclusivamente sintéticos:

1. Encuesta pública de tutor guardada y visible en CRM.
2. Encuesta de menor completada junto a tutor; autorización y correo guardados,
   sin preguntas comerciales ni opción de marketing para el menor.
3. KPI incrementados en dos respuestas y una respuesta comercial; selección
   múltiple comprobada con sus denominadores.
4. Primer ingreso de staff con contraseña temporal y cambio obligatorio mediante
   `NEW_PASSWORD_REQUIRED` desde el formulario publicado.
5. Consulta y ficha CRM; nota/estado guardados con el rol SSR de Amplify, lo que
   comprueba el permiso IAM desplegado.
6. CSV autenticado HTTP 200 con las respuestas sintéticas.
7. Rol `despega/counselor`: CRM y CSV devuelven 404, sin exponer contactos.
8. Ingreso de estudiante con Cognito y hubs de Software e Industrial HTTP 200.
9. Manifest y modelos Industrial HTTP 200, tamaños coincidentes con el manifest.
10. Arranque de la primera jornada Industrial: selección inicial, entrada a
    EnvaPlast, personaje, planta y tutorial visibles. Sin errores JavaScript o de
    consola en las comprobaciones completadas.

Los ajustes de automatización fueron seleccionar el botón «Entrar» y esperar la
hidratación del cliente antes de pulsar el inicio de Industrial. No requirieron
correcciones del producto.

## Limpieza y límites

Las cuentas de validación se crearon sin notificaciones (`MessageAction=SUPPRESS`)
y con contraseñas generadas en memoria. Se retiraron todos los usuarios Cognito,
perfiles, progresos/eventos, respuestas, recibos y aportes a contadores creados por
estas pruebas; sin fixtures propios restantes ni errores de limpieza. No se
retiraron cuentas sintéticas históricas ajenas a esta validación. Sin `Scan`, sin
correos, sin campañas y sin cambios en producción.

Esta prueba confirma los flujos enumerados, no una partida completa de las 28
escenas en AWS. Sigue pendiente UAT pedagógica y en dispositivos físicos,
incluidos Safari/iOS. No se probaron envío/confirmación de correo, recuperación,
refresh ni revocación de Cognito. No se creó una cuenta permanente de staff.
Antes de iniciar una campaña con datos reales quedan revisar aviso definitivo,
responsable, retención y canal de privacidad (ADR 0011).
