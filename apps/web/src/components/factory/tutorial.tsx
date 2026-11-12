"use client";
import {
  Check,
  Compass,
  Footprints,
  Hand,
  Backpack,
  ArrowRight,
} from "lucide-react";
import type { PublicFactoryWorld, FactoryCommand } from "@despega/simulator";
const steps = [
  { id: "move", label: "Muévete", Icon: Footprints },
  { id: "interact", label: "Interactúa", Icon: Hand },
  { id: "tablet", label: "Usa tu tablet", Icon: Backpack },
] as const;
export function FactoryTutorialCard({
  tutorial,
  disabled,
  nearby,
  onCommand,
  onTravel,
  onInteract,
  onOpenTablet,
}: {
  tutorial: NonNullable<PublicFactoryWorld["tutorial"]>;
  disabled: boolean;
  nearby: boolean;
  onCommand: (c: FactoryCommand) => void;
  onTravel: () => void;
  onInteract: () => void;
  onOpenTablet: () => void;
}) {
  const current =
    tutorial.step === "welcome"
      ? -1
      : tutorial.step === "ready"
        ? 3
        : steps.findIndex((s) => s.id === tutorial.step);
  return (
    <aside
      className="factory-panel factory-tutorial"
      aria-label="Guía de controles"
    >
      <div className="factory-panel-heading">
        <span>
          <small>BIENVENIDA A LA PLANTA</small>
          <strong>
            <Compass size={20} /> Conoce EnvaPlast
          </strong>
        </span>
      </div>
      <div className="factory-tutorial-body" key={tutorial.step}>
        <p className="factory-tutorial-badge">
          Sin puntaje · Relojes de la tarea detenidos
        </p>
        <ol className="factory-tutorial-steps" aria-label="Pasos de la guía">
          {steps.map(({ id, label, Icon }, i) => (
            <li
              key={id}
              aria-current={i === current ? "step" : undefined}
              className={i < current ? "done" : i === current ? "active" : ""}
            >
              {i < current ? <Check size={16} /> : <Icon size={16} />}
              <span>{label}</span>
            </li>
          ))}
        </ol>
        {tutorial.step === "welcome" && (
          <>
            <h2>Primero, prueba los controles.</h2>
            <p>
              Harás una práctica corta dentro de la planta. Después podrás
              concentrarte en el pedido y en tu equipo.
            </p>
            <div className="factory-control-guide">
              <p>
                <kbd>W A S D</kbd> o <kbd>↑ ← ↓ →</kbd> para caminar.
              </p>
              <p>
                También puedes tocar el suelo o usar el joystick en una pantalla
                táctil.
              </p>
              <p>
                <kbd>E</kbd> o <strong>Interactuar</strong> para actuar cerca de
                un objeto.
              </p>
            </div>
          </>
        )}
        {tutorial.step === "move" && (
          <>
            <h2>Llega al círculo de práctica.</h2>
            <p>
              Busca el marcador verde que aparece cerca de ti. Camina hasta él;
              la ruta evita muebles, personas y máquinas.
            </p>
            <button
              className="btn btn-accent w-full"
              disabled={disabled}
              onClick={onTravel}
            >
              <Footprints size={16} /> Mostrar ruta al marcador
            </button>
            <p className="factory-help">
              La guía continuará cuando llegues. Puedes moverte a tu ritmo.
            </p>
          </>
        )}
        {tutorial.step === "interact" && (
          <>
            <h2>Prueba una interacción.</h2>
            <p>
              Al estar cerca del marcador, pulsa <kbd>E</kbd> sobre el mundo o
              usa el botón de acción. El mismo control te servirá para hablar,
              observar e inspeccionar.
            </p>
            <button
              className="btn btn-primary w-full"
              disabled={disabled || !nearby}
              onClick={onInteract}
            >
              <Hand size={16} /> Interactuar con el marcador
            </button>
            {!nearby && (
              <button
                className="btn btn-quiet w-full"
                disabled={disabled}
                onClick={onTravel}
              >
                Volver al marcador
              </button>
            )}
          </>
        )}
        {tutorial.step === "tablet" && (
          <>
            <h2>Tu equipo y tus herramientas, a mano.</h2>
            <p>
              Abre la tablet. Allí encontrarás las tareas, los lugares de la
              planta, las comunicaciones, Excel y un cronómetro de práctica.
            </p>
            <button
              className="btn btn-primary w-full"
              disabled={disabled}
              onClick={onOpenTablet}
            >
              <Backpack size={16} /> Abrir la tablet de práctica
            </button>
          </>
        )}
        {tutorial.step === "ready" && (
          <>
            <div className="factory-tutorial-success">
              <Check size={26} />
            </div>
            <h2>Ya sabes cómo explorar.</h2>
            <p>
              Acércate a tu equipo, observa antes de decidir y consulta la
              tablet cuando lo necesites. Podrás repetir esta guía desde el
              botón de ayuda.
            </p>
            <button
              className="btn btn-primary w-full"
              disabled={disabled}
              onClick={() => onCommand({ op: "tutorial", action: "finish" })}
            >
              Terminar la guía <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>
      {tutorial.step !== "ready" && (
        <div className="factory-tutorial-actions">
          {tutorial.step === "welcome" && (
            <button
              className="btn btn-primary w-full"
              disabled={disabled}
              onClick={() =>
                onCommand({
                  op: "tutorial",
                  action: "advance",
                  expectedStep: "welcome",
                })
              }
            >
              Empezar el recorrido <ArrowRight size={16} />
            </button>
          )}
          <button
            className="btn btn-quiet w-full"
            disabled={disabled}
            onClick={() => onCommand({ op: "tutorial", action: "skip" })}
          >
            Omitir tutorial
          </button>
        </div>
      )}
    </aside>
  );
}
