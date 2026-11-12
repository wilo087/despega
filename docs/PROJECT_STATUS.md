# Estado del proyecto

Última actualización: 2026-11-12.

## Fase

**Landing, encuesta y CRM implementados localmente, sin publicar.** La portada
sigue la fuente del 2026-11-12 y conserva el acceso a experiencias en `/experiencia`.
La encuesta condicional guarda contactos y autorizaciones; `/crm` restringe
seguimiento, CSV y KPI a administración. Consentimiento conjunto con tutor
confirmado por el usuario, sin verificación de identidad. Validación final y
límites registrados en `docs/validation/landing-crm-2026-11-12.md` y ADR 0011.
La propuesta incorpora US$6,500 adicionales (total US$61,000); publicar requiere
solicitud explícita y aprobar aviso/retención. No hay correos automáticos.

**Ingeniería Industrial 3D implementada localmente, sin publicar.** EnvaPlast agrega
un segundo módulo con tres sesiones, mapa navegable, personajes y recursos 3D
originales, tareas, seis dimensiones de afinidad, categorías de habilidades y
producción agregada. Software v2/v3 conserva sus reglas y resultados. Ver
`docs/architecture/industrial-3d.md`, ADR 0009 y la evidencia de validación del
2026-11-12. La meta de duración y el rendimiento en dispositivos físicos requieren
UAT; la validación local no implica despliegue ni escritura de datos de prueba AWS.

Revisión local del 2026-11-12: orientación, colisiones de máquinas reubicadas,
mobiliario y personas, acceso de entrada, rutas, cámara, controles táctiles y
conservación de borradores al plegar o pausar. Se revisaron las 28 escenas en
escritorio y móvil emulado; ver `docs/validation/industrial-review-2026-11-12.md`.

Las prioridades 1–3 de ese informe están implementadas: guía inicial opcional con
avance persistido y relojes detenidos; señalización y utilería de sectores; cinco
máquinas diferenciadas y diez animaciones por personaje con transiciones suaves.
Validación actual: 121 pruebas, ambos builds, 27 GLB auditados y 28 escenas en
escritorio/móvil emulado. Ver `docs/validation/industrial-immersion-2026-11-12.md`
y ADR 0010. Las pruebas con estudiantes y dispositivos físicos siguen pendientes.

**Mejoras de plataforma y guion v3 implementados localmente, sin publicar.**
En la actualización de octubre, el catálogo pasó a 19 carreras (entonces una jugable), el texto usa «experiencia», se
muestran biografías del equipo, sonido opcional de llamada y glosario. La escena
1.3 permite investigar comentarios antes del diagnóstico; no puntúa la lectura.
Los intentos v2 se conservan con sus reglas y máximos. El backoffice presenta
fechas de Santo Domingo. Ver requisitos de octubre, ADR 0008 y la validación local.

**Infraestructura y apps DEV desplegadas; localhost usa DynamoDB de DEV.** El módulo
piloto (Ingeniería de Software) se juega de principio a fin. `Despega-dev` está
desplegado en `qrioso-dev` (`779926948601`, `us-east-1`), con tablas, dos pools de
Cognito y roles SSR. Los jobs `4` de web y admin terminaron `SUCCEED` con el commit
`9cbd877`, que corrige el tamaño del artefacto sin aumentar capacidad.
Por solicitud del operador, las apps locales ahora usan las tablas DEV mediante
SSO, conservando la identidad local por correo. El contenedor Docker fue retirado
y su volumen se conserva sin migración. Falta validar los flujos Cognito en AWS.

## Hecho y verificado

| Área | Estado | Evidencia |
| --- | --- | --- |
| Tutorial, ambientación y actuación de Industrial | Implementados localmente, sin publicar | 121 pruebas; 41 límites GLB, 16 orientaciones y 80 combinaciones de personaje/clip; 28 escenas en dos tamaños y revisión de tablet. `docs/validation/industrial-immersion-2026-11-12.md` |
| Revisión espacial y de jugabilidad de Industrial | Corregida localmente, sin publicar | 110 pruebas; 100 distribuciones alternativas; auditoría de 34 límites GLB y 16 orientaciones; 28 escenas en 1280 × 720 y 390 × 844. `docs/validation/industrial-review-2026-11-12.md` |
| Industrial 3D (EnvaPlast, tres jornadas, 28 escenas y arte original) | Implementado localmente, sin publicar | 101 pruebas totales, 1.800 partidas reproducibles, typecheck/lint, ambos builds, synth DEV/PRD y auditorías; revisión Chromium a 1440/390 px. `docs/validation/industrial-3d-2026-11-12.md` |
| Mejoras de octubre (texto, catálogo, personajes, guion v3, sonido, glosario y fechas) | Implementadas localmente, sin publicar | 79 pruebas, typecheck, lint y ambos builds; revisión Chromium a 1440/390 px con fixtures. Detalle en `docs/validation/platform-updates-2026-10-30.md` |
| Monorepo pnpm (web, admin, simulator, data, auth, brand, infra) | Listo | `pnpm typecheck`, `pnpm lint` en verde |
| Motor del simulador + guión completo (3 sesiones, 19 escenas; guion vigente v3 y compatibilidad de reglas v2) | Listo | 46 pruebas: caminos v3 de 86/34 pts, v2 de 91/32 pts; ramificación y memoria, respuestas exhaustivas y 600 partidas aleatorias por versión |
| Web: landing, registro/ingreso, `/inicio`, hub, reproductor y resultados | Listo | E2E histórico de v2 (2026-09-28): módulo completo en escritorio y móvil (390 px), sin errores de consola. Mini-juegos verificados con toques (de cualquier duración), arrastre con mouse y con el dedo, y solo teclado |
| Relojes reales (v3: 15, 20, 60 s; v2 conserva también 45 s) | Listo | Motor: tiempos agotados y peor camino v3. E2E histórico de v2: cuatro relojes vencidos. |
| Backoffice HeroUI: panel, estudiantes, detalle con decisiones, reinicio, visor del guión | Listo | E2E con roles de administración y orientación |
| Capa de datos DynamoDB (transacciones, concurrencia optimista, sin Scan) | Listo | 9 pruebas de datos; lecturas reales `GetItem` desde ambas configuraciones locales contra las dos tablas DEV, sin escrituras de prueba |
| Identidad local (web y admin) | Listo | E2E |
| Identidad Cognito (registro, confirmación, ingreso, recuperación, contraseña nueva de staff, refresh, revocación) | Implementada, **sin probar contra un pool real** | Pruebas unitarias de sesión y errores |
| CDK: tablas, dos pools, roles SSR mínimos, config de Apps Amplify, validación IAM | Desplegado en `qrioso-dev` | `Despega-dev CREATE_COMPLETE`; 12 pruebas de infra/empaquetado, `synth:dev` y `synth:prd` pasan; `diff:dev` sin diferencias; variables efectivas y roles de ambas ramas verificados |
| Flujo de deploy igual al del proyecto de referencia | Listo | `validate-amplify-domains.ts` idéntico; `cdk.json` con cuenta, perfil, rama y App IDs por stage |
| Builds de producción de web y admin | V2 publicada en DEV; mejoras de octubre solo locales | Jobs históricos `4` `SUCCEED`, commit `9cbd877`. Ambos builds locales actuales pasan; el admin registra SSO vencido al intentar leer el panel. Flujos autenticados en AWS pendientes. |
| Web de estudiantes como app: shell a pantalla completa, sistema visual unificado (radios, botones, campos con ícono), reproductor en paneles | Listo | Módulo completo jugado en 1440 px y 390 px (19 escenas, todos los mini-juegos, reloj vencido) sin errores de consola; formularios en modo Cognito con pool ficticio; `typecheck`, `lint` y `build:web` |
| Backoffice como app: shell a pantalla completa, escala de radios de la web sobre HeroUI, acceso con campos con ícono, listas en móvil | Listo | Capturas en 1440 px y 390 px de acceso, panel, estudiantes, ficha, módulos y guion; menú de cuenta, reinicio (cancelado) y rol de orientación; `typecheck`, `lint`, pruebas y `build:admin` |
| Identidad visual desde el logo (`@despega/brand`: logo vectorial, paleta, íconos de app y de carrera) en web y admin | Listo | Contraste WCAG AA de cada par texto/fondo en uso; capturas de landing (escritorio y 390 px), ingreso, `/inicio`, hub, reproductor y backoffice; `favicon.ico`, `icon.svg` y `apple-icon.png` servidos en ambas apps |

## Pendiente / bloqueos

0. **Publicar y validar las mejoras de octubre en DEV** cuando el operador solicite
   el despliegue. Los cambios locales no se han publicado. La revisión de interfaz
   usa Chromium con fixtures a 1440 y 390 px, sin datos ni escrituras AWS; quedan
   la validación autenticada en DEV y la escucha en dispositivos físicos.
1. **Validación funcional en AWS**: jobs `4` publicados; verificar las URLs y los
   flujos autenticados. Crear el primer usuario del staff cuando se indique su correo.
   El cambio de conexión local a DEV y su documentación todavía no están en Git remoto.
2. **Cuentas AWS**: `dev` = `qrioso-dev` (`779926948601`). Falta `prd` y la cuenta
   principal de DESPEGA; registrar sus IDs en `infra/cdk.json`.
3. **Retirar `Despega-dev` de la cuenta de Zendo** (`746914061512`): se desplegó ahí el
   2026-09-26 antes de elegir `qrioso-dev`. Solo tablas vacías y dos pools sin usuarios;
   `cdk destroy` pendiente de autorización.
4. **Dominios de `prd`** en `.env.production` (hoy `*.despega.example`).
5. **Validar Cognito** en `dev` (registro, confirmación, recuperación, primer ingreso
   de staff) y configurar SES para correos.
6. **Validación del cliente** de los supuestos de puntaje y de las preguntas abiertas
   (`docs/architecture/functional-analysis.md`).
7. **Repositorio Git remoto**: `qrioso-software/despega`, conectado a las Apps de
   Amplify de `dev` sobre `develop`.
8. **Cuenta sintética de prueba en DEV**: «Alex Prueba UI»
   (`revision.simulador@example.com`, acceso local), creada para verificar el
   reproductor; tiene tres intentos (dos completos). No hay borrado desde la app:
   retirarla a mano de `despega_dev_core`/`despega_dev_simulation` si molesta.

## Siguiente paso recomendado

Revisar las mejoras locales de octubre y, con una solicitud de despliegue, validar
el guion v3 y los flujos reales de Cognito en DEV. Para trabajar
en localhost: `aws sso login --profile qrioso-dev` y `pnpm dev`; las escrituras van a
la base compartida de DEV. El cambio local no implica otro deploy ni migración de datos.
