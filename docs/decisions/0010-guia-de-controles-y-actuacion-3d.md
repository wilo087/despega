# ADR 0010 — Guía de controles y actuación en EnvaPlast

- Estado: aceptado para implementación local por solicitud del operador.
- Fecha: 2026-11-12.

## Contexto

La revisión espacial identificó como prioridades el aprendizaje de los controles,
la identidad visual de los sectores y una actuación más clara de los personajes.
El operador pidió implementar esas mejoras. Son mejoras de presentación; no se
añaden respuestas superiores ni se modifican rúbricas del guion Industrial v1.

## Decisión

La guía es una práctica opcional y repetible: bienvenida, desplazamiento hasta un
marcador libre, interacción y tablet. Aparece después de elegir personaje y se
puede abrir desde Ayuda o desde la pausa. Sus comandos usan las Server Actions y
la concurrencia del intento. `factory.tutorial` es opcional para conservar los
intentos existentes; persiste el paso, origen, finalización y estado de pausa.

La guía mantiene detenidos los relojes y la producción del motor. La presentación
permite moverse y observar las máquinas durante la práctica. Una pausa explícita
o el ocultamiento de la pestaña suspende también la práctica. Finalizar u omitir
restaura la pausa anterior. No se generan créditos, afinidad, objetivos narrativos
ni eventos de decisión; el guardado utiliza el mismo `Put` condicional que otros
comandos de interfaz sin evento. No cambian tablas, índices ni servicios.

La ambientación usa el plano geométrico compartido y modelos propios de Blender:
mobiliario de sector, señalización, cinco variantes de máquinas y envases por
etapa. El mobiliario sólido se añade a navegación y a la auditoría de GLB.

Los personajes tienen articulaciones de codos, rodillas y tobillos y diez clips
con los mismos canales de pose. El exportador conserva canales constantes y
exporta el reposo sin extrapolación de clips: una animación no puede heredar
accidentalmente los brazos de una celebración anterior. Babylon mezcla pesos
durante las transiciones, acompasa Walk al desplazamiento y suspende personajes
lejanos. La preferencia de reducir movimiento elimina gestos decorativos y pulsos
sin quitar el desplazamiento necesario para jugar.

## Alternativas

- Añadir escenas evaluables al guion mezclaría destreza con controles y afinidad
  profesional, y exigiría otra versión de reglas. La práctica no es evaluable.
- Guardar la guía solo en el navegador perdería su avance al cambiar de equipo y
  separaría la pausa de la autoridad del servidor. Se usa el estado del intento.
- Animar todas las figuras con un mismo balanceo no comunica la actividad. Los
  clips compartidos conservan una dirección visual común, con gestos y utilería
  que distinguen los roles, sin incorporar paquetes comerciales.

## Consecuencias

Las comprobaciones deben cubrir reintentos, pausa previa, recarga, omisión y
ausencia de efectos de evaluación. La auditoría de arte comprueba canales de
pose completos, envolventes de los diez clips y separación del suelo. La revisión
en navegador y emulación no sustituye sesiones con estudiantes ni dispositivos
físicos; se entrega un protocolo para esas pruebas, sin presentarlas como hechas.
