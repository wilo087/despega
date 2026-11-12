# Arte original de EnvaPlast

Los modelos, animaciones y retratos fueron creados para esta implementación. No
contienen modelos, texturas, voces ni animaciones descargadas de terceros.

- `envaplast.blend`: fuente editable, personajes, equipo, materiales y diez clips NLA por figura.
- `generate.py`: generación y exportación reproducibles con Blender 5.2 LTS.
- `character_animation.py`: poses completas, articulaciones y actuación por rol.
- `../../apps/web/public/game-assets/envaplast`: 27 GLB, dos retratos y manifiesto.

Desde la raíz: `pnpm assets:build`, `pnpm assets:check` y `pnpm assets:space-check`.

La geometría de sectores y mobiliario viene de `packages/simulator/src/factory/geometry.json`.
Las máquinas tienen variantes de alimentación, llenado, sellado, etiquetado y
empaque; la presentación rota el frente hacia el área de operarios. Los clips
comparten canales, conservan claves constantes y no extrapolan poses a reposo.

El generador lee la paleta de marca del paquete `brand`. Agrupa geometría estática
por padre y material para reducir llamadas de dibujo sin alterar los pivotes
animados. El archivo editable conserva esos grupos y materiales. No modifica las
preferencias de Blender guardadas en el equipo.
