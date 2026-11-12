"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Backpack,
  BookOpen,
  Hand,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Factory,
  LoaderCircle,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import type {
  FactoryCommand,
  PublicFactoryWorld,
  PublicScene,
} from "@despega/simulator";
import {
  FACTORY_TARGETS,
  FACTORY_ZONES,
  STATIONS,
} from "@despega/simulator/factory-world";
import {
  beginSessionAction,
  reloadProgressAction,
  submitSceneAction,
} from "@/app/simulador/[careerId]/actions";
import type { ModuleView, ProgressView } from "@/lib/simulation-types";
import { FactoryTaskPanel } from "./tasks";
import { FactoryAudio } from "./audio";
import { FactoryTutorialCard } from "./tutorial";
import "./factory.css";
const Canvas = dynamic(() => import("./canvas"), { ssr: false });
export type FactoryTransport = {
  submit: typeof submitSceneAction;
  begin: typeof beginSessionAction;
  reload: typeof reloadProgressAction;
};
const serverTransport: FactoryTransport = {
  submit: submitSceneAction,
  begin: beginSessionAction,
  reload: reloadProgressAction,
};
export function FactoryPlayer({
  module,
  playerName,
  initialScene,
  initialProgress,
  transport = serverTransport,
}: {
  module: ModuleView;
  playerName: string;
  initialScene: PublicScene | null;
  initialProgress: ProgressView;
  transport?: FactoryTransport;
}) {
  const router = useRouter();
  const [scene, setScene] = useState(initialScene);
  const [progress, setProgress] = useState(initialProgress);
  const [world, setWorld] = useState<PublicFactoryWorld | null>(
    initialScene?.factory ?? null,
  );
  const [previewLayout, setPreviewLayout] = useState<
    import("@despega/simulator").Placement[] | null
  >(null);
  const [worldEpoch, setWorldEpoch] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reaction, setReaction] = useState("");
  const [audio, setAudio] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [tablet, setTablet] = useState(false);
  const [tabletApp, setTabletApp] = useState("Tareas");
  const [practiceStart, setPracticeStart] = useState<number | null>(null);
  const [practiceTime, setPracticeTime] = useState(0);
  const [focus, setFocus] = useState("");
  const [nearby, setNearby] = useState<{ id: string; label: string } | null>(
    null,
  );
  const [clock, setClock] = useState(initialScene?.factory?.taskElapsedMs ?? 0);
  const [navigationHint, setNavigationHint] = useState("");
  useEffect(() => {
    if (!navigationHint) return;
    const timer = setTimeout(() => setNavigationHint(""), 5000);
    return () => clearTimeout(timer);
  }, [navigationHint]);
  const [extended, setExtended] = useState(false);
  const sceneRef = useRef(scene),
    progressRef = useRef(progress),
    worldRef = useRef(world),
    busyRef = useRef(false),
    lastTick = useRef(0),
    position = useRef(initialScene?.factory?.position ?? { x: -13, z: 12 }),
    movement = useRef({ x: 0, z: 0 }),
    action = useRef<(() => void) | null>(null),
    sound = useRef<FactoryAudio | null>(null),
    lastStep = useRef(0),
    audioRef = useRef(false),
    networkPaused = useRef(false),
    retryRef = useRef<{
      id: string;
      command: FactoryCommand;
      elapsed: number;
    } | null>(null),
    sendRef = useRef<(command: FactoryCommand) => Promise<void>>(
      async () => {},
    );
  const apply = useCallback((s: PublicScene | null, p: ProgressView) => {
    if (sceneRef.current?.id !== s?.id) setPreviewLayout(null);
    if (sceneRef.current?.session.id !== s?.session.id) setReady(false);
    sceneRef.current = s;
    progressRef.current = p;
    setScene(s);
    setProgress(p);
    if (s?.factory) {
      setClock(s.factory.taskElapsedMs);
      setExtended(s.factory.extendedTime);
      worldRef.current = s.factory;
      setWorld(s.factory);
    }
    lastTick.current = performance.now();
  }, []);
  const recover = useCallback(async () => {
    setBusy(true);
    try {
      const result = await transport.reload({ careerId: module.careerId });
      if (result.ok) {
        apply(result.scene, result.progress);
        setWorldEpoch((epoch) => epoch + 1);
        setReady(false);
        setPreviewLayout(null);
        setError("");
        retryRef.current = null;
        networkPaused.current = false;
      } else setError(result.message);
    } catch {
      setError(
        "No se pudo recuperar el progreso. Revisa la conexión e inténtalo de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }, [transport, module.careerId, apply]);
  const send = useCallback(
    async (command: FactoryCommand) => {
      if (busyRef.current || !sceneRef.current) return;
      busyRef.current = true;
      setBusy(true);
      if (!["checkpoint", "draft", "settings"].includes(command.op))
        movement.current = { x: 0, z: 0 };
      const current = sceneRef.current,
        p = progressRef.current;
      const requestedAt = performance.now();
      const replaying = !!retryRef.current;
      const pending = retryRef.current ?? {
        id: crypto.randomUUID(),
        command,
        elapsed: Math.max(
          0,
          Math.min(20000, performance.now() - lastTick.current),
        ),
      };
      retryRef.current = pending;
      try {
        const result = await transport.submit({
          careerId: module.careerId,
          runId: p.runId,
          version: p.version,
          sceneId: current.id,
          elapsedMs: pending.elapsed,
          response: { kind: "factory", command: pending.command },
          commandId: pending.id,
        });
        if (result.ok) {
          retryRef.current = null;
          apply(result.scene, result.progress);
          networkPaused.current = false;
          if (
            !replaying &&
            result.scene?.id === current.id &&
            pending.command.op !== "pause" &&
            pending.command.op !== "resume" &&
            pending.command.op !== "tutorial"
          ) {
            lastTick.current = requestedAt;
            setClock(
              (result.scene?.factory?.taskElapsedMs ?? 0) +
                performance.now() -
                requestedAt,
            );
          }
          setError("");
          if (
            result.outcome.narration &&
            pending.command.op !== "checkpoint" &&
            pending.command.op !== "pause" &&
            pending.command.op !== "resume" &&
            pending.command.op !== "draft" &&
            pending.command.op !== "settings" &&
            pending.command.op !== "tutorial"
          ) {
            setReaction(result.outcome.narration);
            sound.current?.tone("notification");
          }
        } else {
          retryRef.current = null;
          setError(result.message);
          if (result.code === "CONFLICT" || result.code === "SCENE_MISMATCH")
            await recover();
          if (result.code === "UNAUTHENTICATED")
            router.push(
              `/ingresar?next=${encodeURIComponent(`/simulador/${module.careerId}/jugar`)}`,
            );
        }
      } catch {
        networkPaused.current = true;
        setError(
          "La conexión se interrumpió. La actividad está pausada; reintenta para confirmar tu última acción.",
        );
      } finally {
        busyRef.current = false;
        setBusy(false);
        if (
          document.hidden &&
          pending.command.op !== "pause" &&
          !retryRef.current
        )
          queueMicrotask(() => void sendRef.current({ op: "pause" }));
      }
    },
    [transport, module.careerId, apply, recover, router],
  );
  useEffect(() => {
    sendRef.current = send;
  }, [send]);
  useEffect(() => {
    if (!ready || !scene) return;
    const heartbeat = window.setInterval(() => {
      const w = worldRef.current;
      if (
        !document.hidden &&
        (!w?.paused || (w.tutorial?.active && !w.tutorial.suspended)) &&
        !retryRef.current
      )
        void sendRef.current({
          op: "checkpoint",
          position: position.current,
          elapsedMs: Math.min(20000, performance.now() - lastTick.current),
        });
    }, 10000);
    const display = window.setInterval(() => {
      const w = worldRef.current;
      setClock(
        (w?.taskElapsedMs ?? 0) +
          (w?.paused || document.hidden || networkPaused.current
            ? 0
            : Math.max(0, performance.now() - lastTick.current)),
      );
    }, 250);
    const visibility = () => {
      movement.current = { x: 0, z: 0 };
      if (document.hidden) {
        void sendRef.current({ op: "pause" });
        void sound.current?.pause();
      }
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearInterval(heartbeat);
      clearInterval(display);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [ready, scene]);
  useEffect(() => {
    if (audio && world?.paused) void sound.current?.pause();
    else if (audio) void sound.current?.enable();
  }, [audio, world?.paused]);
  useEffect(() => {
    if (audio && (scene?.id === "1.8" || scene?.id === "3.2"))
      sound.current?.tone("alarm");
  }, [scene?.id, audio]);
  useEffect(
    () => () => {
      void sound.current?.dispose();
    },
    [],
  );
  const onReady = useCallback(() => {
    setReady(true);
    lastTick.current = performance.now();
  }, []);
  const onError = useCallback((message: string) => setError(message), []);
  const onPosition = useCallback((p: { x: number; z: number }) => {
    const old = position.current;
    position.current = p;
    if (
      audioRef.current &&
      performance.now() - lastStep.current > 350 &&
      Math.hypot(p.x - old.x, p.z - old.z) > 0.002
    ) {
      sound.current?.tone("step");
      lastStep.current = performance.now();
    }
  }, []);
  const interact = useCallback((targetId: string) => {
    if (worldRef.current?.tutorial?.active) {
      if (
        targetId === "practice" &&
        worldRef.current.tutorial.step === "interact" &&
        !busyRef.current
      )
        void sendRef.current({
          op: "tutorial",
          action: "advance",
          expectedStep: "interact",
          position: position.current,
        });
      return;
    }
    if (!busyRef.current) void sendRef.current({ op: "interact", targetId });
  }, []);
  const practiceReached = useCallback(() => {
    if (
      worldRef.current?.tutorial?.active &&
      worldRef.current.tutorial.step === "move" &&
      !busyRef.current
    )
      void sendRef.current({
        op: "tutorial",
        action: "advance",
        expectedStep: "move",
        position: position.current,
      });
  }, []);
  const moveJoystick = (e: import("react").PointerEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    if (!el.hasPointerCapture(e.pointerId)) return;
    const rect = el.getBoundingClientRect(),
      dx = (e.clientX - rect.left - rect.width / 2) / 28,
      dz = (e.clientY - rect.top - rect.height / 2) / 28;
    const scale = Math.max(1, Math.hypot(dx, dz));
    movement.current = { x: dx / scale, z: dz / scale };
    el.style.setProperty("--stick-x", `${(dx / scale) * 22}px`);
    el.style.setProperty("--stick-z", `${(dz / scale) * 22}px`);
  };
  const stopJoystick = (e: import("react").PointerEvent<HTMLButtonElement>) => {
    movement.current = { x: 0, z: 0 };
    e.currentTarget.style.setProperty("--stick-x", "0px");
    e.currentTarget.style.setProperty("--stick-z", "0px");
  };
  const travel = (id: string) => {
    setFocus(`${id}:${Date.now()}`);
    setCollapsed(true);
  };
  const start = async () => {
    setBusy(true);
    try {
      const result = await transport.begin({
        careerId: module.careerId,
        sessionNumber:
          progress.sessions.find((s) => s.status === "available")?.number ?? 1,
      });
      if (result.ok) {
        apply(result.scene, result.progress);
        setError("");
      } else setError(result.message);
    } catch {
      setError("No se pudo abrir la sesión. Puedes reintentar.");
    } finally {
      setBusy(false);
    }
  };
  const zone = world
    ? FACTORY_ZONES.find((z) => z.id === world.task.zone)
    : null;
  const limit = world?.task.timeLimit ? world.task.timeLimit : 0;
  const remaining = Math.max(0, Math.ceil(limit - clock / 1000));
  const tutorial = world?.tutorial;
  const tutorialActive = !!tutorial?.active;
  const displayPaused = tutorialActive
    ? !!tutorial?.suspended
    : !!world?.paused;
  useEffect(() => {
    if (
      ready &&
      scene?.id === "1.1" &&
      world &&
      !world.paused &&
      !world.tutorial?.completed &&
      !world.tutorial?.active &&
      !error &&
      !busyRef.current
    )
      void sendRef.current({
        op: "tutorial",
        action: "start",
        position: position.current,
      });
  }, [ready, scene?.id, world, error]);
  useEffect(() => {
    if (
      tablet &&
      tutorialActive &&
      tutorial?.step === "tablet" &&
      !busyRef.current
    )
      void sendRef.current({
        op: "tutorial",
        action: "advance",
        expectedStep: "tablet",
      });
  }, [tablet, tutorialActive, tutorial?.step]);
  useEffect(() => {
    if (
      ready &&
      world?.task.timeLimit &&
      !world.paused &&
      !error &&
      remaining === 0 &&
      !busyRef.current &&
      scene
    ) {
      void sendRef.current({
        op: "submit",
        timedOut: true,
        method: "structured",
      });
    }
  }, [ready, world?.task.timeLimit, world?.paused, error, remaining, scene]);
  return (
    <main className="factory-game">
      {world && scene && (
        <Canvas
          key={worldEpoch}
          world={{
            ...world,
            layout:
              previewLayout ??
              (world.task.kind === "layout"
                ? world.draft?.layout
                : undefined) ??
              world.layout,
            paused: displayPaused || !!error || !scene,
          }}
          onReady={onReady}
          onError={onError}
          onPosition={onPosition}
          onInteract={interact}
          moveRef={movement}
          actionRef={action}
          controlsEnabled={
            ready &&
            !busy &&
            !error &&
            !tablet &&
            world.task.kind !== "avatar" &&
            (!tutorialActive || tutorial?.step !== "welcome")
          }
          onNearby={setNearby}
          onNavigationHint={setNavigationHint}
          onPracticeReached={practiceReached}
          focusTarget={focus}
        />
      )}
      <header className="factory-topbar">
        <Link
          href={`/simulador/${module.careerId}`}
          className="factory-back"
          aria-label="Volver a mi carrera"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="factory-wordmark">
          <Factory size={22} />
          <span>
            ENVA<span>PLAST</span>
            <small>DESPEGA · Ingeniería Industrial</small>
          </span>
        </div>
        <div className="factory-session-label">
          JORNADA{" "}
          {scene?.session.number ?? Math.min(3, progress.completedSessions + 1)}
          <span>{scene?.session.title ?? "Tu experiencia en la planta"}</span>
        </div>
        <div className="factory-header-actions">
          {scene && world?.task.kind !== "avatar" && (
            <button
              className="factory-icon"
              aria-label="Abrir guía de controles"
              disabled={busy || tutorialActive || !!error}
              onClick={() =>
                void send({
                  op: "tutorial",
                  action: "start",
                  position: position.current,
                })
              }
            >
              <CircleHelp size={19} />
            </button>
          )}
          <button
            aria-label={audio ? "Silenciar" : "Activar sonido"}
            className="factory-icon"
            onClick={async () => {
              const next = !audio;
              setAudio(next);
              audioRef.current = next;
              if (next) {
                sound.current ??= new FactoryAudio();
                await sound.current.enable();
              } else await sound.current?.pause();
            }}
          >
            {audio ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <button
            aria-label="Abrir tablet"
            className="factory-icon"
            onClick={() => setTablet((v) => !v)}
          >
            <Backpack size={19} />
          </button>
          {scene && (
            <button
              aria-label={displayPaused ? "Reanudar" : "Pausar"}
              className="factory-icon"
              disabled={busy}
              onClick={() =>
                void send({ op: displayPaused ? "resume" : "pause" })
              }
            >
              {displayPaused ? <Play size={19} /> : <Pause size={19} />}
            </button>
          )}
        </div>
      </header>
      {world && scene && (
        <div className="factory-hud">
          <div>
            <span>DESEMPEÑO</span>
            <strong>
              {progress.performance}
              <small>/100</small>
            </strong>
            <meter min={0} max={100} value={progress.performance} />
          </div>
          <div>
            <span>CAJAS PENDIENTES</span>
            <strong>{world.remaining.toLocaleString("es-DO")}</strong>
            <small>
              {world.produced.toLocaleString("es-DO")} conformes · meta 9.000
            </small>
          </div>
          <div>
            <span>CLIMA DEL EQUIPO</span>
            <strong>
              {world.climate}
              <small>/100</small>
            </strong>
            <small>
              {world.ally
                ? "Wilfredo es tu aliado"
                : "Escucha · observa · colabora"}
            </small>
          </div>
          {scene?.session.number === 3 && (
            <div>
              <span>TIEMPO DEL TURNO</span>
              <strong>
                {Math.floor(world.shiftSecondsRemaining / 60)}:
                {String(world.shiftSecondsRemaining % 60).padStart(2, "0")}
              </strong>
              <small>
                {world.shiftSecondsRemaining
                  ? "8 h de operación comprimidas"
                  : "Turno cerrado"}
              </small>
            </div>
          )}
          {limit > 0 && (
            <div
              className={remaining < 16 ? "urgent" : ""}
              role="timer"
              aria-label="Tiempo restante"
            >
              <span>TIEMPO DE LA TAREA</span>
              <strong>
                {Math.floor(remaining / 60)}:
                {String(remaining % 60).padStart(2, "0")}
              </strong>
              <small>El juego continúa al vencer</small>
            </div>
          )}
        </div>
      )}
      {!scene ? (
        <section className="factory-gate">
          <p className="factory-kicker">TU EXPERIENCIA EN ENVAPLAST</p>
          <h1>
            {progress.status === "completed"
              ? "Un turno que deja huella."
              : progress.completedSessions
                ? "Tu equipo vuelve a contar contigo."
                : "Una fábrica. Un pedido. Muchas decisiones."}
          </h1>
          <p>
            {progress.status === "completed"
              ? "Tu recorrido, tus decisiones y los resultados quedaron guardados por carrera."
              : (progress.sessions.find((s) => s.status === "available")
                  ?.synopsis ??
                "Recorre la planta, mide lo que ocurre y construye una solución con las personas que trabajan aquí.")}
          </p>
          <div className="factory-session-cards">
            {progress.sessions.map((s) => (
              <div key={s.number}>
                <span>0{s.number}</span>
                <strong>{s.title}</strong>
                <small>
                  {s.status === "completed"
                    ? "Completada"
                    : s.status === "locked"
                      ? "Se abre al terminar la anterior"
                      : "Disponible"}{" "}
                  · ~{s.estimatedMinutes} min
                </small>
              </div>
            ))}
          </div>
          {progress.status === "completed" ? (
            <Link
              className="btn btn-primary btn-lg"
              href={`/simulador/${module.careerId}`}
            >
              Ver mis resultados
            </Link>
          ) : (
            <button
              className="btn btn-primary btn-lg"
              disabled={busy}
              onClick={() => void start()}
            >
              {busy ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Play size={18} />
              )}{" "}
              Empezar la jornada {progress.completedSessions + 1}
            </button>
          )}
          <p className="factory-gate-note">
            Teclado y mouse o controles táctiles · El progreso se guarda en tu
            cuenta
          </p>
        </section>
      ) : (
        <>
          {!ready && (
            <div className="factory-loading">
              <LoaderCircle className="animate-spin" />
              <span>Preparando la planta y tu personaje…</span>
            </div>
          )}
          <aside
            hidden={tutorialActive}
            className={`factory-panel ${collapsed ? "collapsed" : ""}`}
          >
            <button
              className="factory-panel-heading"
              onClick={() => setCollapsed((v) => !v)}
              aria-expanded={!collapsed}
            >
              <span>
                <small>
                  {zone?.name ?? "EnvaPlast"} · {scene.id}
                </small>
                <strong>{scene.title}</strong>
              </span>
              {collapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            <div hidden={collapsed}>
              <div className="factory-speaker">
                <span>
                  {module.characters[world?.task.speaker ?? ""]?.name ??
                    "Tu experiencia"}
                </span>
                <p>{world?.task.prompt}</p>
              </div>
              {world && scene && (
                <FactoryTaskPanel
                  key={`${scene.id}:${worldEpoch}`}
                  world={world}
                  sceneId={scene.id}
                  playerName={playerName}
                  elapsed={clock / 1000}
                  disabled={
                    busy ||
                    !ready ||
                    !!error ||
                    !!world.paused ||
                    tutorialActive
                  }
                  onCommand={(c) => void send(c)}
                  onTravel={travel}
                  onPreviewLayout={setPreviewLayout}
                />
              )}
            </div>
          </aside>
          {tutorialActive && tutorial && (
            <FactoryTutorialCard
              tutorial={tutorial}
              disabled={busy || !ready || !!error || displayPaused}
              nearby={nearby?.id === "practice"}
              onCommand={(c) => void send(c)}
              onTravel={() => setFocus(`practice:${Date.now()}`)}
              onInteract={() => action.current?.()}
              onOpenTablet={() => {
                setTabletApp("Tareas");
                setTablet(true);
              }}
            />
          )}
          <div className="factory-world-caption">
            <span className="factory-live-dot" />{" "}
            {world?.lineRunning ? "PLANTA EN OPERACIÓN" : "LÍNEA EN PAUSA"}{" "}
            <span>
              {nearby
                ? `E · ${nearby.label}`
                : "WASD / flechas · Acércate a un objeto para interactuar"}
            </span>
          </div>
          <div
            className="factory-touch-pad"
            aria-label="Controles de movimiento"
          >
            <button
              className="factory-joystick"
              aria-label="Joystick de movimiento"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                moveJoystick(e);
              }}
              onPointerMove={moveJoystick}
              onPointerUp={stopJoystick}
              onPointerCancel={stopJoystick}
              onLostPointerCapture={stopJoystick}
            >
              <span aria-hidden />
            </button>
            <div className="factory-touch-directions">
              {[
                ["↑", 0, -1],
                ["←", -1, 0],
                ["↓", 0, 1],
                ["→", 1, 0],
              ].map(([label, x, z]) => (
                <button
                  key={label}
                  aria-label={`Caminar ${label}`}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    movement.current = { x: Number(x), z: Number(z) };
                  }}
                  onPointerUp={() => (movement.current = { x: 0, z: 0 })}
                  onPointerCancel={() => (movement.current = { x: 0, z: 0 })}
                  onLostPointerCapture={() =>
                    (movement.current = { x: 0, z: 0 })
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              className="factory-touch-action"
              aria-label={
                nearby
                  ? `Interactuar: ${nearby.label}`
                  : "Acércate para interactuar"
              }
              disabled={
                !nearby || busy || !ready || displayPaused || !!error || tablet
              }
              onClick={() => action.current?.()}
            >
              <Hand size={20} />
              <span>Interactuar</span>
            </button>
          </div>
        </>
      )}
      {navigationHint && (
        <p className="factory-navigation-hint" role="status">
          {navigationHint}
        </p>
      )}
      {reaction && (
        <section className="factory-reaction" role="status">
          <div>
            <span>LO QUE CAMBIÓ</span>
            <p>{reaction}</p>
          </div>
          <button
            className="btn btn-quiet btn-sm"
            onClick={() => {
              setReaction("");
              setCollapsed(false);
            }}
          >
            Entendido
          </button>
        </section>
      )}
      {displayPaused && scene && !error && (
        <div className="factory-pause">
          <Pause />
          <h2>Tu turno está en pausa</h2>
          <p>Los relojes están detenidos. Reanuda cuando quieras.</p>
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={() => void send({ op: "resume" })}
          >
            Reanudar
          </button>
          {!tutorialActive && world?.task.kind !== "avatar" && (
            <button
              className="btn btn-quiet"
              disabled={busy}
              onClick={() =>
                void send({
                  op: "tutorial",
                  action: "start",
                  position: position.current,
                })
              }
            >
              Practicar los controles
            </button>
          )}
        </div>
      )}
      {error && (
        <div className="factory-error" role="alert">
          <strong>No pudimos completar esta acción</strong>
          <p>{error}</p>
          <div>
            <button
              className="btn btn-primary btn-sm"
              disabled={busy}
              onClick={() =>
                retryRef.current
                  ? void send(retryRef.current.command)
                  : void recover()
              }
            >
              <RotateCcw size={15} /> Reintentar / recuperar
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (retryRef.current) void recover();
                else {
                  setError("");
                  lastTick.current = performance.now();
                }
              }}
            >
              Recuperar y revisar mi respuesta
            </button>
          </div>
        </div>
      )}
      {tablet && (
        <aside
          className="factory-tablet"
          role="dialog"
          aria-modal="true"
          aria-label="Tu tablet"
        >
          <div className="factory-panel-heading">
            <strong>
              <BookOpen size={18} /> Tu tablet
            </strong>
            <button
              className="btn btn-quiet btn-sm"
              onClick={() => setTablet(false)}
            >
              Cerrar
            </button>
          </div>
          <nav
            className="factory-tablet-apps"
            aria-label="Aplicaciones de la tablet"
          >
            {["Teams", "Outlook", "Excel", "Cronómetro", "Tareas"].map(
              (app) => (
                <button
                  key={app}
                  aria-pressed={tabletApp === app}
                  onClick={() => setTabletApp(app)}
                >
                  {app}
                </button>
              ),
            )}
          </nav>
          {(tabletApp === "Teams" || tabletApp === "Outlook") && (
            <section className="factory-tablet-app">
              <h3>{tabletApp} · Tu equipo</h3>
              <div className="factory-composed">
                <strong>
                  {module.characters[world?.task.speaker ?? ""]?.name ??
                    "EnvaPlast"}
                </strong>
                <p>
                  {world?.task.prompt ??
                    "Las comunicaciones aparecerán al empezar tu jornada."}
                </p>
              </div>
              {world?.reaction && (
                <p className="factory-help">
                  Última actualización: {world.reaction}
                </p>
              )}
              {world?.task.kind === "message" && (
                <button
                  className="btn btn-primary w-full"
                  onClick={() => {
                    setTablet(false);
                    setCollapsed(false);
                  }}
                >
                  Preparar mi respuesta
                </button>
              )}
            </section>
          )}
          {tabletApp === "Excel" && (
            <section className="factory-tablet-app">
              <h3>Excel · Registro de ciclos</h3>
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
                    const times =
                      world?.draft?.measurements?.[s.id] ??
                      world?.measurements[s.id] ??
                      [];
                    return (
                      <tr key={s.id}>
                        <td>{s.label}</td>
                        <td>{times.length}</td>
                        <td>
                          {times.length
                            ? (
                                times.reduce((a, b) => a + b, 0) / times.length
                              ).toFixed(1) + " s"
                            : "Sin medir"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {world?.task.kind === "spreadsheet" && (
                <button
                  className="btn btn-primary w-full"
                  onClick={() => {
                    setTablet(false);
                    setCollapsed(false);
                  }}
                >
                  Trabajar con los datos
                </button>
              )}
            </section>
          )}
          {tabletApp === "Cronómetro" && (
            <section className="factory-tablet-app">
              <h3>Cronómetro de práctica</h3>
              <div className="factory-stopwatch">
                <strong>
                  {(practiceStart === null
                    ? practiceTime
                    : Math.max(0, (clock - practiceStart) / 1000)
                  ).toFixed(2)}{" "}
                  s
                </strong>
                <p>El reloj se detiene cuando pausas la experiencia.</p>
              </div>
              <button
                className="btn btn-accent w-full"
                onClick={() => {
                  if (practiceStart === null) {
                    setPracticeTime(0);
                    setPracticeStart(clock);
                  } else {
                    setPracticeTime(
                      Math.max(0, (clock - practiceStart) / 1000),
                    );
                    setPracticeStart(null);
                  }
                }}
              >
                {practiceStart === null
                  ? "Iniciar cronómetro"
                  : "Detener cronómetro"}
              </button>
              {world?.task.kind === "measure" && (
                <button
                  className="btn btn-ghost w-full"
                  onClick={() => {
                    setTablet(false);
                    setCollapsed(false);
                  }}
                >
                  Registrar ciclos de las estaciones
                </button>
              )}
            </section>
          )}
          {tabletApp === "Tareas" && (
            <section className="factory-tablet-app">
              <h3>Tareas y hallazgos</h3>
              <p>
                {world?.objectives.length ?? 0} objetivos guardados ·
                Presupuesto: ${world?.spent.toLocaleString("es-DO") ?? 0} /
                $5.000
              </p>
              <p>
                <strong>{scene?.title ?? "Tu próxima jornada"}</strong>
              </p>
              <p>{world?.task.prompt}</p>
              {world?.machineFound && (
                <p>Kevin confirmó una selladora disponible en bodega.</p>
              )}
              <h3>Lugares de la planta</h3>
              {FACTORY_TARGETS.filter(
                (t) =>
                  [
                    "altagracia",
                    "wilfredo",
                    "kevin",
                    "quality",
                    "canteen",
                  ].includes(t.id) &&
                  (world?.openZones.includes(t.zone) ?? false),
              ).map((t) => (
                <button
                  className="factory-target"
                  key={t.id}
                  onClick={() => {
                    travel(t.id);
                    setTablet(false);
                  }}
                >
                  {t.label}
                  <span>↗</span>
                </button>
              ))}
            </section>
          )}
          <label className="factory-check">
            <input
              type="checkbox"
              checked={extended}
              onChange={(e) => {
                setExtended(e.target.checked);
                void send({ op: "settings", extendedTime: e.target.checked });
              }}
            />{" "}
            Duplicar el tiempo visible de las tareas
          </label>
          <p className="factory-help">
            Esta ayuda cambia el tiempo de decisión; no cambia la valoración de
            tus respuestas.
          </p>
          {module.glossary?.map((g) => (
            <p key={g.term}>
              <strong>{g.term}:</strong> {g.meaning}
            </p>
          ))}
        </aside>
      )}
    </main>
  );
}
