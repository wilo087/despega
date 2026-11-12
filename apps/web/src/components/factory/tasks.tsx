"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { FactoryCommand, PublicFactoryWorld } from "@despega/simulator";
import {
  FACTORY_CAREER_STAGES,
  FACTORY_TARGETS,
  FACTORY_WORKERS,
  STATIONS,
  factoryLayoutConflicts,
} from "@despega/simulator/factory-world";
import {
  DragBoard,
  DraggableCard,
  DropZone,
} from "@/components/simulator/interactions/dnd";
import { FactoryResults } from "./results";
export function FactoryTaskPanel({
  world,
  sceneId,
  playerName,
  elapsed,
  disabled,
  onCommand,
  onTravel,
  onPreviewLayout,
}: {
  world: PublicFactoryWorld;
  sceneId: string;
  playerName: string;
  elapsed: number;
  disabled: boolean;
  onCommand: (c: FactoryCommand) => void;
  onTravel: (id: string) => void;
  onPreviewLayout?: (layout: import("@despega/simulator").Placement[]) => void;
}) {
  const task = world.task;
  const [choices, setChoices] = useState<string[]>(world.draft?.choices ?? []);
  const [method, setMethod] = useState<"structured" | "creative" | null>(
    world.draft?.method ?? null,
  );
  const [avatar, setAvatar] = useState<"alma" | "leo">(world.avatar);
  const [name, setName] = useState(playerName);
  const [assignments, setAssignments] = useState<Record<string, string>>(
    world.draft?.assignments ?? {},
  );
  const [value, setValue] = useState("");
  const [layout, setLayout] = useState(
    (world.draft?.layout ?? world.layout).map((p) => ({ ...p })),
  );
  const [measurements, setMeasurements] = useState<Record<string, number[]>>(
    world.draft?.measurements ?? world.measurements,
  );
  const [station, setStation] = useState("feed");
  const [running, setRunning] = useState(false);
  const [measurementStart, setMeasurementStart] = useState(0);
  const [stage, setStage] = useState(0);
  const [pickedCard, setPickedCard] = useState<string | null>(null);
  const commandRef = useRef(onCommand);
  useEffect(() => {
    commandRef.current = onCommand;
  }, [onCommand]);
  const draftSignature = JSON.stringify({
    choices,
    method,
    assignments,
    measurements,
    layout,
  });
  const lastDraftSignature = useRef(draftSignature);
  useEffect(() => {
    if (disabled || lastDraftSignature.current === draftSignature) return;
    const timer = setTimeout(() => {
      lastDraftSignature.current = draftSignature;
      commandRef.current({
        op: "draft",
        choices,
        ...(method ? { method } : {}),
        assignments,
        measurements,
        layout,
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [
    choices,
    assignments,
    measurements,
    layout,
    method,
    disabled,
    draftSignature,
  ]);
  const updateLayout = (next: typeof layout) => {
    const bounded = next.map((p) => ({
      ...p,
      x: Math.max(-6, Math.min(6, p.x)),
      z: Math.max(-10, Math.min(12, p.z)),
    }));
    setLayout(bounded);
    onPreviewLayout?.(bounded);
  };
  const toggle = (id: string) =>
    setChoices((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );
  const submit = (
    extra: Partial<Extract<FactoryCommand, { op: "submit" }>> = {},
  ) =>
    onCommand({
      op: "submit",
      choices,
      ...(method ? { method } : {}),
      assignments,
      layout,
      measurements,
      ...(value === "" ? {} : { value: Number(value) }),
      avatar,
      name,
      ...extra,
    });
  const button = (
    label = "Confirmar decisión",
    extra: Partial<Extract<FactoryCommand, { op: "submit" }>> = {},
  ) => (
    <button
      disabled={
        disabled ||
        (!!task.method && !method) ||
        (task.kind === "avatar" && !name.trim()) ||
        (task.kind === "walk" &&
          !world.visited.some((id) => id.startsWith(sceneId + ":"))) ||
        (["dialogue", "layout"].includes(task.kind) && choices.length !== 1)
      }
      className="btn btn-primary w-full"
      onClick={() => submit(extra)}
    >
      {label}
    </button>
  );
  const targetList = (ids: readonly string[]) => (
    <div className="factory-targets">
      {FACTORY_TARGETS.filter((t) => ids.includes(t.id)).map((t) => (
        <button
          key={t.id}
          className="factory-target"
          onClick={() => onTravel(t.id)}
        >
          <span>{t.label}</span>
          <span aria-hidden>↗</span>
        </button>
      ))}
    </div>
  );
  return (
    <fieldset
      className="factory-task-content"
      disabled={disabled}
      aria-label="Actividad actual"
    >
      {task.method && (
        <fieldset className="factory-method">
          <legend>¿Cómo lo abordarás?</legend>
          <label>
            <input
              type="radio"
              name="method"
              checked={method === "structured"}
              onChange={() => setMethod("structured")}
            />{" "}
            Seguir el procedimiento
          </label>
          <label>
            <input
              type="radio"
              name="method"
              checked={method === "creative"}
              onChange={() => setMethod("creative")}
            />{" "}
            Usar mi propio criterio
          </label>
          <small>Ambos caminos son válidos.</small>
        </fieldset>
      )}
      {task.kind === "avatar" && (
        <>
          <div className="factory-avatar-options">
            {(["alma", "leo"] as const).map((id) => (
              <button
                key={id}
                aria-pressed={avatar === id}
                className={avatar === id ? "selected" : ""}
                onClick={() => {
                  setAvatar(id);
                }}
              >
                <Image
                  src={`/game-assets/envaplast/portrait-${id}.png`}
                  alt=""
                  width={108}
                  height={135}
                  className="factory-avatar-image"
                  unoptimized
                  loading="eager"
                />
                <strong>{id === "alma" ? "Alma" : "Leo"}</strong>
                <small>Tu personaje</small>
              </button>
            ))}
          </div>
          <label className="factory-label">
            Tu nombre
            <input
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
            />
          </label>
          {button("Entrar a EnvaPlast")}
        </>
      )}
      {task.kind === "walk" && (
        <>
          {targetList(
            task.zone === "office" ? ["altagracia"] : ["wilfredo", "feed"],
          )}
          <p className="factory-help">
            Camina hasta el punto marcado. Con teclado, acércate y pulsa E.
            También puedes tocar un lugar de esta lista.
          </p>
          {button("Ya estoy aquí")}
        </>
      )}
      {(task.kind === "dialogue" || task.kind === "budget") && (
        <>
          <div className="factory-options">
            {task.choices?.map((c) => (
              <button
                key={c.id}
                disabled={disabled}
                className={choices.includes(c.id) ? "selected" : ""}
                aria-pressed={choices.includes(c.id)}
                onClick={() =>
                  task.kind === "budget" ? toggle(c.id) : setChoices([c.id])
                }
              >
                <span>{c.label}</span>
                {c.cost !== undefined && (
                  <strong>${c.cost.toLocaleString("es-DO")}</strong>
                )}
              </button>
            ))}
          </div>
          {task.kind === "budget" && (
            <p className="factory-budget">
              Disponibles: $5.000 · Selección: $
              {(
                (task.choices ?? [])
                  .filter((c) => choices.includes(c.id))
                  .reduce((a, c) => a + (c.cost ?? 0), 0) +
                (world.purchaseRequired ? 2000 : 0)
              ).toLocaleString("es-DO")}
            </p>
          )}
          {button()}
        </>
      )}
      {task.kind === "hazards" && (
        <>
          <div className="factory-options compact">
            {task.choices?.map((c) => (
              <button
                aria-pressed={choices.includes(c.id)}
                className={choices.includes(c.id) ? "selected" : ""}
                key={c.id}
                onClick={() => toggle(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="factory-help">
            Protección: {choices.length}/3 · Riesgos encontrados:{" "}
            {world.hazards.length}/5
          </p>
          {targetList(["puddle", "guard", "exit", "gloves", "cable"])}
          {button("Cerrar la revisión")}
        </>
      )}
      {task.kind === "explore" && (
        <>
          {targetList(["wilfredo", "yuleisy", "kevin", "spare", "canteen"])}
          <div className="factory-options">
            {task.choices?.map((c) => (
              <button
                key={c.id}
                aria-pressed={choices.includes(c.id)}
                className={choices.includes(c.id) ? "selected" : ""}
                onClick={() => setChoices([c.id])}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="factory-help">
            Hallazgos guardados:{" "}
            {world.visited.filter((id) => !id.includes(":")).length}. Explorar
            la bodega es opcional y puede abrir otra solución.
          </p>
          {button("Terminar mi recorrido")}
        </>
      )}
      {task.kind === "measure" && (
        <>
          <label className="factory-label">
            Estación
            <select
              value={station}
              disabled={running}
              onChange={(e) => setStation(e.target.value)}
            >
              {STATIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn btn-ghost w-full"
            onClick={() => onTravel(station)}
          >
            Acercarme a esta estación
          </button>
          <div className="factory-stopwatch">
            <span>CRONÓMETRO</span>
            <strong>
              {running
                ? Math.max(0, elapsed - measurementStart).toFixed(2) + " s"
                : (measurements[station]?.at(-1)?.toFixed(2) ?? "0.00") + " s"}
            </strong>
            <p>
              Observa el objeto que avanza por la banda. Al llegar al inicio,
              empieza; cuando se repita, detén.
            </p>
          </div>
          <button
            className="btn btn-accent w-full"
            disabled={
              disabled ||
              !world.visited.includes(`${sceneId}:${station}`) ||
              (measurements[station]?.length ?? 0) >= 3
            }
            onClick={() => {
              if (!running) {
                setMeasurementStart(elapsed);
                setRunning(true);
              } else {
                const time = Math.max(0, elapsed - measurementStart);
                setMeasurements((m) => ({
                  ...m,
                  [station]: [...(m[station] ?? []), Math.min(120, time)],
                }));
                setRunning(false);
              }
            }}
          >
            {running ? "Detener y registrar" : "Iniciar medición"}
          </button>
          <table className="factory-table">
            <thead>
              <tr>
                <th>Estación</th>
                <th>Ciclos</th>
                <th>Promedio</th>
              </tr>
            </thead>
            <tbody>
              {STATIONS.map((s) => {
                const times = measurements[s.id] ?? [];
                return (
                  <tr key={s.id}>
                    <td>{s.label}</td>
                    <td>{times.length}/3</td>
                    <td>
                      {times.length
                        ? (
                            times.reduce((a, b) => a + b, 0) / times.length
                          ).toFixed(1) + " s"
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button
            className="btn btn-quiet btn-sm"
            onClick={() => setMeasurements((m) => ({ ...m, [station]: [] }))}
          >
            Repetir esta estación
          </button>
          {button("Enviar las mediciones")}
        </>
      )}
      {task.kind === "spreadsheet" && sceneId === "1.6" && (
        <>
          <div className="factory-excel-label">EXCEL · Tiempos de ciclo</div>
          {world.measurementEstimated && (
            <p className="factory-help">
              Datos estimados: verifica los registros antes de comprometer una
              solución.
            </p>
          )}
          <DragBoard
            id="factory-sheet"
            onDragEnd={({ active, over }) => {
              if (over)
                setAssignments((old) => ({
                  ...old,
                  [String(over.id)]: String(active.id),
                }));
            }}
          >
            <p className="factory-help">
              Arrastra cada medición a su fila. También puedes seleccionar una
              tarjeta y tocar una celda.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {STATIONS.map((s) => {
                const times = world.measurements[s.id] ?? [];
                return (
                  <DraggableCard
                    key={s.id}
                    id={s.id}
                    label={`Medición de ${s.label}`}
                    selected={pickedCard === s.id}
                    onSelect={() => setPickedCard(s.id)}
                    className="factory-target"
                  >
                    {s.label}:{" "}
                    {times.length
                      ? (
                          times.reduce((a, b) => a + b, 0) / times.length
                        ).toFixed(1) + " s"
                      : "Estimada"}
                  </DraggableCard>
                );
              })}
            </div>
            <table className="factory-table">
              <thead>
                <tr>
                  <th>Estación</th>
                  <th>Promedio</th>
                  <th>Comparación</th>
                </tr>
              </thead>
              <tbody>
                {STATIONS.map((s) => {
                  const times =
                    world.measurements[assignments[s.id] ?? ""] ?? [];
                  const mean = times.length
                    ? times.reduce((a, b) => a + b, 0) / times.length
                    : 0;
                  return (
                    <tr key={s.id}>
                      <td>{s.label}</td>
                      <td>
                        <DropZone id={s.id}>
                          <button
                            aria-label={`Celda de ${s.label}`}
                            className="min-h-9 min-w-16"
                            onClick={() => {
                              if (pickedCard) {
                                setAssignments((old) => ({
                                  ...old,
                                  [s.id]: pickedCard,
                                }));
                                setPickedCard(null);
                              }
                            }}
                          >
                            {assignments[s.id]
                              ? mean
                                ? mean.toFixed(1) + " s"
                                : "Estimada"
                              : "Ubicar aquí"}
                          </button>
                        </DropZone>
                      </td>
                      <td>
                        <div
                          className="factory-data-bar"
                          style={{
                            width: `${Math.min(100, (mean / 16) * 100)}%`,
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </DragBoard>
          <div className="factory-options">
            {task.choices?.map((c) => (
              <button
                key={c.id}
                aria-pressed={choices.includes(c.id)}
                className={choices.includes(c.id) ? "selected" : ""}
                onClick={() => setChoices([c.id])}
              >
                {c.label}
              </button>
            ))}
          </div>
          {button("Compartir diagnóstico")}
        </>
      )}
      {task.kind === "spreadsheet" && sceneId === "2.3" && (
        <>
          <div className="factory-excel-label">
            EXCEL · Defectos por frecuencia
          </div>
          <p className="factory-help">
            Toca las filas en orden de mayor a menor. Puedes deshacer la última
            selección.
          </p>
          {task.cards
            ?.filter((c) => !choices.includes(c.id))
            .map((c) => (
              <button
                key={c.id}
                className="factory-target"
                onClick={() => setChoices((old) => [...old, c.id])}
              >
                {c.label}
                <span>+</span>
              </button>
            ))}
          <div
            className="factory-pareto"
            role="img"
            aria-label="Frecuencia de los defectos ordenados"
          >
            {choices.map((id) => {
              const card = task.cards?.find((c) => c.id === id);
              const count = Number(card?.label.split("·")[1] ?? 0);
              return (
                <div key={id} className="mb-2">
                  <span className="text-xs">{card?.label}</span>
                  <div
                    className="factory-data-bar"
                    style={{ width: `${count * 2}%` }}
                  />
                </div>
              );
            })}
          </div>
          <ol className="factory-ordered">
            {choices.map((id) => (
              <li key={id}>{task.cards?.find((c) => c.id === id)?.label}</li>
            ))}
          </ol>
          <button
            className="btn btn-quiet btn-sm"
            onClick={() => setChoices((old) => old.slice(0, -1))}
          >
            Deshacer
          </button>
          <label className="factory-label">
            Porcentaje de los dos primeros
            <input
              type="number"
              min={0}
              max={100}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          {button("Guardar el análisis")}
        </>
      )}
      {task.kind === "message" && (
        <>
          <div className="factory-excel-label">
            {sceneId === "1.7"
              ? "OUTLOOK · Correo a Marcos"
              : "TEAMS · Confirmación del despacho"}
          </div>
          <div className="factory-composed">
            {choices.length ? (
              choices.map((id) => (
                <p key={id}>{task.cards?.find((c) => c.id === id)?.label}</p>
              ))
            ) : (
              <p>Elige los bloques para construir tu respuesta.</p>
            )}
          </div>
          <div className="factory-options">
            {task.cards?.map((c) => (
              <button
                key={c.id}
                aria-pressed={choices.includes(c.id)}
                className={choices.includes(c.id) ? "selected" : ""}
                onClick={() => toggle(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          {button("Enviar mensaje")}
        </>
      )}
      {task.kind === "causes" && (
        <>
          <div className="factory-fishbone" aria-label="Diagrama de causas">
            Máquina · Método · Material · Personas → Sellado
          </div>
          <DragBoard
            id={`factory-causes-${sceneId}`}
            onDragEnd={({ active, over }) => {
              if (over)
                setAssignments((old) => ({
                  ...old,
                  [String(active.id)]: String(over.id),
                }));
            }}
          >
            <div className="grid gap-2">
              {task.cards?.map((card) => (
                <DraggableCard
                  key={card.id}
                  id={card.id}
                  label={card.label}
                  selected={pickedCard === card.id}
                  onSelect={() => setPickedCard(card.id)}
                  className="factory-target"
                >
                  {card.label}
                </DraggableCard>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {task.categories?.map((category) => (
                <DropZone
                  key={category.id}
                  id={category.id}
                  className="rounded-xl border border-line p-2"
                >
                  <button
                    className="w-full text-left text-xs"
                    onClick={() => {
                      if (pickedCard) {
                        setAssignments((old) => ({
                          ...old,
                          [pickedCard]: category.id,
                        }));
                        setPickedCard(null);
                      }
                    }}
                  >
                    {category.label}
                    <small className="mt-1 block">
                      {task.cards
                        ?.filter((c) => assignments[c.id] === category.id)
                        .map((c) => c.label)
                        .join(" · ") || "Ubicar aquí"}
                    </small>
                  </button>
                </DropZone>
              ))}
            </div>
          </DragBoard>
          {task.cards?.map((card) => (
            <label key={card.id} className="factory-label">
              {card.label}
              <select
                value={assignments[card.id] ?? ""}
                onChange={(e) =>
                  setAssignments((old) => ({
                    ...old,
                    [card.id]: e.target.value,
                  }))
                }
              >
                <option value="">Ubicar causa…</option>
                {task.categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {button("Revisar mi diagrama")}
        </>
      )}
      {task.kind === "layout" && (
        <>
          {factoryLayoutConflicts(
            layout,
            world.machineFound && world.budget.includes("install"),
          ).length > 0 && (
            <p className="factory-layout-warning" role="status">
              Hay máquinas que ocupan el mismo espacio. Las áreas rojas en la
              planta indican dónde debes separarlas.
            </p>
          )}
          <div className="factory-options">
            {task.choices?.map((c) => (
              <button
                aria-pressed={choices.includes(c.id)}
                className={choices.includes(c.id) ? "selected" : ""}
                key={c.id}
                onClick={() => setChoices([c.id])}
              >
                {c.label}
                {c.id === "parallel" && !world.machineFound && (
                  <small> · Compra: $2.000; llega después del plazo</small>
                )}
              </button>
            ))}
          </div>
          <DragBoard
            id="factory-layout"
            onDragEnd={({ active, delta }) =>
              updateLayout(
                layout.map((p) =>
                  p.id === String(active.id)
                    ? {
                        ...p,
                        x: Math.round(p.x + delta.x / 25),
                        z: Math.round(p.z + delta.y / 10),
                      }
                    : p,
                ),
              )
            }
          >
            <div
              className="factory-layout-grid"
              aria-label="Distribución de estaciones"
            >
              {layout.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    position: "absolute",
                    left: `${((p.x + 6) / 12) * 100}%`,
                    top: `${((p.z + 10) / 22) * 100}%`,
                  }}
                >
                  <DraggableCard
                    id={p.id}
                    label={`Mover ${STATIONS.find((s) => s.id === p.id)?.label}`}
                    selected={station === p.id}
                    onSelect={() => setStation(p.id)}
                  >
                    {i + 1}
                  </DraggableCard>
                </div>
              ))}
            </div>
          </DragBoard>
          <label className="factory-label">
            Mover estación
            <select
              value={station}
              onChange={(e) => setStation(e.target.value)}
            >
              {STATIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <div className="factory-nudge">
            {[
              [0, -1, "↑"],
              [-1, 0, "←"],
              [1, 0, "→"],
              [0, 1, "↓"],
            ].map(([dx, dz, label]) => (
              <button
                className="btn btn-ghost btn-icon"
                key={label}
                aria-label={`Mover ${label}`}
                onClick={() =>
                  updateLayout(
                    layout.map((p) =>
                      p.id === station
                        ? { ...p, x: p.x + Number(dx), z: p.z + Number(dz) }
                        : p,
                    ),
                  )
                }
              >
                {label}
              </button>
            ))}
          </div>
          {button("Validar la distribución")}
          <button
            className="btn btn-quiet w-full"
            onClick={() =>
              submit({
                guided: true,
                layout: world.layout.map((p) => ({ ...p })),
                choices: choices.length ? choices : ["method"],
              })
            }
          >
            Usar distribución guiada sin recompensa
          </button>
        </>
      )}
      {task.kind === "inspection" && (
        <>
          <p className="factory-help">
            Inspecciona los sellos y las caras del envase. La prueba sigue en
            marcha · {Math.floor(elapsed)} s.
          </p>
          <div className="factory-samples">
            {(task.samples ?? []).map((sample, i) => (
              <button
                key={i}
                aria-pressed={choices.includes(`sample-${i + 1}`)}
                className={
                  choices.includes(`sample-${i + 1}`) ? "selected" : ""
                }
                onClick={() => toggle(`sample-${i + 1}`)}
              >
                <span className="factory-sample" aria-hidden>
                  <i
                    style={{
                      transform: `rotate(${-sample.sealGap * 110}deg)`,
                      top: sample.sealGap > 0 ? "-2px" : "4px",
                    }}
                  />
                </span>
                <span>Caja {i + 1}</span>
              </button>
            ))}
          </div>
          {button("Guardar la muestra")}
        </>
      )}
      {task.kind === "staff" && (
        <>
          <DragBoard
            id="factory-crew"
            onDragEnd={({ active, over }) => {
              if (over) {
                const worker = String(active.id),
                  station = String(over.id);
                setAssignments((old) => ({
                  ...Object.fromEntries(
                    Object.entries(old).filter(([, id]) => id !== worker),
                  ),
                  [station]: worker,
                }));
              }
            }}
          >
            <div className="grid gap-2">
              {FACTORY_WORKERS.filter(
                (w) => w.id !== "wilfredo" || world.ally,
              ).map((w) => (
                <DraggableCard
                  id={w.id}
                  key={w.id}
                  label={w.label}
                  selected={pickedCard === w.id}
                  onSelect={() => setPickedCard(w.id)}
                  className="factory-target"
                >
                  {w.label}
                </DraggableCard>
              ))}
            </div>
            <div className="mt-3 grid gap-2">
              {STATIONS.map((s) => (
                <DropZone
                  id={s.id}
                  key={s.id}
                  className="rounded-xl border border-line p-2"
                >
                  <button
                    className="w-full text-left text-xs"
                    onClick={() => {
                      if (pickedCard) {
                        const worker = pickedCard;
                        setAssignments((old) => ({
                          ...Object.fromEntries(
                            Object.entries(old).filter(
                              ([, id]) => id !== worker,
                            ),
                          ),
                          [s.id]: worker,
                        }));
                        setPickedCard(null);
                      }
                    }}
                  >
                    {s.label}
                    <strong className="mt-1 block">
                      {FACTORY_WORKERS.find((w) => w.id === assignments[s.id])
                        ?.label ?? "Asignar aquí"}
                    </strong>
                  </button>
                </DropZone>
              ))}
            </div>
          </DragBoard>
          <p className="factory-help">
            También puedes asignar desde estas listas.
          </p>
          {STATIONS.map((s) => (
            <label key={s.id} className="factory-label">
              {s.label}
              <select
                aria-label={s.label}
                value={assignments[s.id] ?? ""}
                onChange={(e) =>
                  setAssignments((old) => ({ ...old, [s.id]: e.target.value }))
                }
              >
                <option value="">Sin asignar</option>
                {FACTORY_WORKERS.filter(
                  (p) => p.id !== "wilfredo" || world.ally,
                ).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {button("Aplicar la asignación")}
        </>
      )}
      {task.kind === "dashboard" && (
        <>
          <div className="factory-dispatch">
            <strong>{world.produced.toLocaleString("es-DO")}</strong>
            <span>cajas buenas acumuladas / 9.000</span>
          </div>
          <p>
            Incidentes de seguridad: {world.incidents} ·{" "}
            {world.reportEstimated
              ? "Reporte de prueba pendiente de verificar"
              : "Reporte de prueba registrado"}
          </p>
          <p>
            Defectos rechazados: {world.rejected.toLocaleString("es-DO")} ·
            Clima del equipo: {world.climate}/100
          </p>
          <p>
            La entrega se confirmará al cerrar las horas restantes del turno.
          </p>
          {button("Cerrar turno y confirmar despacho")}
        </>
      )}
      {task.kind === "summary" && (
        <>
          <FactoryResults world={world} />
          {world.shipment !== undefined && (
            <p className="factory-budget">
              Despacho confirmado: {world.shipment.toLocaleString("es-DO")} /
              9.000 cajas
            </p>
          )}
          {button(
            sceneId === "3.8"
              ? "Explorar mi siguiente etapa"
              : "Guardar y cerrar esta sesión",
          )}
        </>
      )}
      {task.kind === "timeline" && (
        <>
          <div className="factory-career-stage">
            <span>{FACTORY_CAREER_STAGES[stage]!.period}</span>
            <h3>{FACTORY_CAREER_STAGES[stage]!.title}</h3>
            <p>{FACTORY_CAREER_STAGES[stage]!.text}</p>
          </div>
          <div className="factory-stage-dots">
            {FACTORY_CAREER_STAGES.map((s, i) => (
              <button
                key={s.period}
                aria-label={s.period}
                aria-pressed={i === stage}
                onClick={() => setStage(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          {stage < 3 ? (
            <button
              className="btn btn-primary w-full"
              onClick={() => setStage((v) => v + 1)}
            >
              Siguiente etapa
            </button>
          ) : (
            button("Finalizar mi experiencia")
          )}
        </>
      )}
      {task.kind === "cutscene" && (
        <>
          <div className="factory-alarm" aria-hidden>
            !
          </div>
          <p className="factory-help">
            La próxima jornada recordará lo que decidiste hoy.
          </p>
          {button("Continuar")}
        </>
      )}
    </fieldset>
  );
}
