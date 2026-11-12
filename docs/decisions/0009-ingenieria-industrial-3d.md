# ADR 0009 Ingeniería Industrial en un mundo 3D

- Estado: aceptado para implementación local por solicitud explícita del operador.
- Fecha: 2026-11-11.

## Contexto y decisiones del usuario

El Word del cliente propone EnvaPlast como sustituto 2D del enfoque inicial. El
operador pidió una experiencia 3D completa, incluidos los recursos artísticos,
y eligió agregar Industrial conservando Software; estilo cuidado, cámara
isométrica, computadora y móvil, audio ambiental sin voces, y ajustes documentados
para resolver vacíos del guion. La implementación no autoriza publicar en AWS.

## Decisión técnica

- Babylon.js 9.35.0 y cargador glTF de la misma versión, verificados con `npm view`
  el 2026-11-11, versiones exactas y sin actualización del resto del stack.
- Blender 5.2.3 LTS instalado: modelos originales, clips NLA, archivo `.blend`,
  generador reproducible y GLB por zona y objeto. Sin paquetes comerciales.
- Presentación `factory` y estado opcional `factory` dentro del estado existente.
  Software v2/v3 mantiene sus reglas, estructura original de afinidad y máximos.
- Proyección pública explícita del mundo; las rúbricas, causas y consecuencias
  futuras no se copian al cliente. Las propiedades físicas observables sí forman
  parte del mundo y de las tareas.
- Acciones autenticadas de Next.js y transacciones existentes para decisiones.
  Puntos de recuperación cada diez segundos y borradores de tareas guardados.
  Sin API Gateway, Lambdas de dominio, tablas ni índices nuevos.
- NUM es opcional en el vector para conservar registros anteriores. En Industrial,
  EST es firmado y se dibuja separado; no se introduce en un radar unipolar ni se
  compara con la estructura histórica de Software.

## Alternativas consideradas

Un ejecutable Unity/Unreal separado incrementaría la entrega y la integración de
sesiones. Reemplazar el piloto borraría una experiencia que el operador decidió
conservar. Renderizar el mundo con componentes de menú no permitiría explorar ni
mostrar cambios físicos. La solución mantiene el motor TypeScript y añade una
presentación de navegador independiente.

## Consecuencias

El paquete gráfico se carga al entrar al reproductor Industrial. Hay que validar
CSP, recursos y tamaño SSR con un build de producción. El arte y las pruebas del
motor no sustituyen UAT pedagógica ni pruebas en dispositivos físicos. Las reglas
que completan el documento están enumeradas en `industrial-3d.md`.

## Revisión espacial del 2026-11-12

Se conserva la decisión de navegación determinista con colisiones sencillas.
`geometry.json` comparte las dimensiones y muebles entre el generador Blender y
la navegación pública. Las huellas de máquinas y personajes se contrastan con
sus GLB reales; los operarios se ubican junto a la distribución vigente.

Se descarta mantener rectángulos independientes en el renderer y el generador:
la revisión encontró discrepancias entre paredes visibles, mobiliario y zonas
transitables. Una simulación física general añadiría costo sin resolver mejor
las interacciones educativas actuales. Estas correcciones de presentación no
cambian rúbricas, puntajes, estado persistido ni versiones de los guiones.
