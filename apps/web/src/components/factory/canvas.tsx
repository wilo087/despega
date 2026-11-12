"use client";
import { useEffect, useRef } from "react";
import type { PublicFactoryWorld } from "@despega/simulator";
import {
  FACTORY_TARGETS,
  FACTORY_ZONES,
  STATIONS,
  factoryPath,
  factoryNavigation,
  factoryNearestPosition,
  factoryMovement,
  factoryLayoutConflicts,
  factoryPracticePoint,
  FACTORY_CAMERA_ALPHA,
  FACTORY_MACHINE_ROTATION,
} from "@despega/simulator/factory-world";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3, Matrix } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import type { AssetContainer } from "@babylonjs/core/assetContainer";
import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import type { LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import "@babylonjs/loaders/glTF";
import "@babylonjs/core/Animations/animatable";
import "@babylonjs/core/Meshes/instancedMesh";
import "@babylonjs/core/Culling/ray";
import { FactoryAnimator, smoothFacing } from "./motion";

export default function FactoryCanvas({
  world,
  onInteract,
  onPosition,
  onReady,
  onError,
  moveRef,
  actionRef,
  controlsEnabled,
  onNearby,
  onNavigationHint,
  onPracticeReached,
  focusTarget,
}: {
  world: PublicFactoryWorld;
  onInteract: (id: string) => void;
  onPosition: (p: { x: number; z: number }) => void;
  onReady: () => void;
  onError: (message: string) => void;
  moveRef: React.RefObject<{ x: number; z: number }>;
  actionRef: React.RefObject<(() => void) | null>;
  controlsEnabled: boolean;
  onNearby: (target: { id: string; label: string } | null) => void;
  onNavigationHint: (message: string) => void;
  onPracticeReached: () => void;
  focusTarget?: string;
}) {
  const labels = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const refs = useRef({
    world,
    onInteract,
    onPosition,
    onReady,
    onError,
    focusTarget,
    controlsEnabled,
    onNearby,
    onNavigationHint,
    onPracticeReached,
  });
  useEffect(() => {
    refs.current = {
      world,
      onInteract,
      onPosition,
      onReady,
      onError,
      focusTarget,
      controlsEnabled,
      onNearby,
      onNavigationHint,
      onPracticeReached,
    };
  }, [
    world,
    onInteract,
    onPosition,
    onReady,
    onError,
    focusTarget,
    controlsEnabled,
    onNearby,
    onNavigationHint,
    onPracticeReached,
  ]);
  useEffect(() => {
    const element = canvas.current!;
    let disposed = false;
    let engine: Engine | undefined;
    let resize: ResizeObserver | undefined;
    const keys = new Set<string>();
    const down = (e: KeyboardEvent) => {
      if (
        !refs.current.controlsEnabled ||
        (e.target as HTMLElement).closest(
          "input,textarea,select,button,[contenteditable=true],[role=dialog]",
        )
      )
        return;
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      )
        e.preventDefault();
      keys.add(e.key.toLowerCase());
    };
    const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const blur = () => keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    void (async () => {
      try {
        engine = new Engine(element, true, {
          preserveDrawingBuffer: true,
          stencil: true,
          adaptToDeviceRatio: false,
        });
        engine.getCaps().parallelShaderCompile = undefined;
        const baseScaling =
          window.innerWidth < 768
            ? 1.5
            : Math.min(window.devicePixelRatio, 1.5);
        engine.setHardwareScalingLevel(baseScaling);
        const scene = new Scene(engine);
        const css = getComputedStyle(document.documentElement);
        const color = (token: string) =>
          Color3.FromHexString(css.getPropertyValue(token).trim());
        const accent = color("--color-brand");
        scene.clearColor = new Color4(0.76, 0.83, 0.87, 1);
        const camera = new ArcRotateCamera(
          "Isometric",
          FACTORY_CAMERA_ALPHA,
          Math.PI / 3.3,
          27,
          new Vector3(
            refs.current.world.position.x,
            0,
            refs.current.world.position.z,
          ),
          scene,
        );
        camera.mode = 1;
        let zoom = window.innerWidth < 768 ? 8 : 10;
        const setProjection = () => {
          const aspect = engine!.getRenderWidth() / engine!.getRenderHeight();
          const panel = element.parentElement
            ?.querySelector(".factory-panel:not([hidden])")
            ?.getBoundingClientRect();
          const width = element.clientWidth,
            height = element.clientHeight;
          const mobile = width < 768;
          const right = !mobile && panel ? panel.left - 20 : width;
          const hud = element.parentElement
            ?.querySelector(".factory-hud")
            ?.getBoundingClientRect();
          const top = Math.max(mobile ? 155 : 195, (hud?.bottom ?? 0) + 16);
          const bottom = mobile && panel ? panel.top - 12 : height - 50;
          const centerX =
            (width / 2 - right / 2) * ((2 * zoom * aspect) / width);
          const centerY =
            ((top + Math.max(top + 100, bottom)) / 2 - height / 2) *
            ((2 * zoom) / height);
          camera.orthoTop = zoom + centerY;
          camera.orthoBottom = -zoom + centerY;
          camera.orthoLeft = -zoom * aspect + centerX;
          camera.orthoRight = zoom * aspect + centerX;
        };
        setProjection();
        new HemisphericLight("Sky", new Vector3(0.3, 1, 0.2), scene).intensity =
          0.65;
        const sun = new DirectionalLight(
          "Daylight",
          new Vector3(-0.4, -1, 0.25),
          scene,
        );
        sun.intensity = 0.85;
        const ground = MeshBuilder.CreateGround(
          "Courtyard",
          { width: 44, height: 36 },
          scene,
        );
        const gm = new StandardMaterial("Courtyard surface", scene);
        gm.diffuseColor = new Color3(0.36, 0.44, 0.46);
        ground.material = gm;
        ground.position.y = -0.15;
        const containers = new Map<string, Promise<AssetContainer>>();
        const shadowMaterial = new StandardMaterial("Contact shadow", scene);
        shadowMaterial.diffuseColor = color("--color-night");
        shadowMaterial.disableLighting = true;
        shadowMaterial.alpha = 0.16;
        const get = (id: string) => {
          let result = containers.get(id);
          if (!result) {
            result = LoadAssetContainerAsync(
              `/game-assets/envaplast/${id}.glb`,
              scene,
            );
            containers.set(id, result);
          }
          return result;
        };
        const walls: {
          zone: (typeof FACTORY_ZONES)[number];
          materials: StandardMaterial[];
        }[] = [];
        const model = async (id: string, x: number, z: number) => {
          const data = await get(id);
          if (disposed) return null;
          const entry = data.instantiateModelsToScene(
            (name) => `${id}-${name}`,
            false,
            { doNotInstantiate: id.startsWith("zone-") },
          );
          const root = new TransformNode(id + "-instance", scene);
          entry.rootNodes.forEach((n) => (n.parent = root));
          root.position.set(x, 0, z);
          if (id.startsWith("machine") || id.startsWith("bottle"))
            root.rotation.y = FACTORY_MACHINE_ROTATION;
          if (
            [
              "alma",
              "leo",
              "altagracia",
              "wilfredo",
              "yuleisy",
              "kevin",
              "operator",
            ].includes(id)
          ) {
            const shadow = MeshBuilder.CreateCylinder(
              "Contact shadow",
              { diameter: 0.85, height: 0.008, tessellation: 24 },
              scene,
            );
            shadow.parent = root;
            shadow.position.y = 0.012;
            shadow.material = shadowMaterial;
            shadow.isPickable = false;
          }
          if (id.startsWith("zone-")) {
            const materials: StandardMaterial[] = [];
            for (const mesh of root.getChildMeshes()) {
              if (mesh.metadata?.gltf?.extras?.occluder && mesh.material) {
                const material = mesh.material.clone(mesh.name + "-wall")!;
                mesh.material = material;
                materials.push(material as StandardMaterial);
              }
            }
            walls.push({
              zone: FACTORY_ZONES.find((z) => id === "zone-" + z.id)!,
              materials,
            });
          }
          return { root, groups: entry.animationGroups };
        };
        const zones = new Set<string>();
        const ensureZones = () => {
          for (const zone of FACTORY_ZONES)
            if (
              !zones.has(zone.id) &&
              Math.hypot(
                zone.x - player.position.x,
                zone.z - player.position.z,
              ) < 30
            ) {
              zones.add(zone.id);
              void model("zone-" + zone.id, zone.x, zone.z).catch(() =>
                refs.current.onError(
                  "No se pudo cargar una zona. Reintenta para recuperar tu progreso.",
                ),
              );
            }
        };
        const player = new TransformNode("Player", scene);
        player.position.set(
          refs.current.world.position.x,
          0,
          refs.current.world.position.z,
        );
        let navigation = factoryNavigation(refs.current.world.layout);
        let geometryVersion = "";
        let groups: AnimationGroup[] = [];
        let playerAnimator: FactoryAnimator | undefined;
        const motionPreference = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        );
        let reducedMotion = motionPreference.matches;
        const updateMotionPreference = () => {
          reducedMotion = motionPreference.matches;
        };
        motionPreference.addEventListener("change", updateMotionPreference);
        scene.onDisposeObservable.add(() =>
          motionPreference.removeEventListener(
            "change",
            updateMotionPreference,
          ),
        );
        let avatar = "";
        let lastAnimation = "";
        const avatarLoad = async (id: string) => {
          avatar = id;
          const result = await model(id, 0, 0);
          if (!result) return;
          if (id !== refs.current.world.avatar) {
            result.groups.forEach((g) => g.dispose());
            result.root.dispose();
            return;
          }
          playerAnimator?.dispose();
          player.getChildren().forEach((c) => c.dispose());
          result.root.parent = player;
          result.root.position.setAll(0);
          groups = result.groups;
          playerAnimator = new FactoryAnimator(groups, "player");
          playerAnimator.update("Idle", 0, 0, reducedMotion);
          lastAnimation = "";
        };
        await avatarLoad(refs.current.world.avatar);
        const machineRoots = new Map<string, TransformNode>();
        const overlapMarkers = new Map<string, TransformNode>();
        const overlapMaterial = new StandardMaterial(
          "Occupied floor area",
          scene,
        );
        overlapMaterial.diffuseColor = color("--color-bad");
        overlapMaterial.emissiveColor = color("--color-bad").scale(0.3);
        overlapMaterial.alpha = 0.45;
        const machineGroups = new Map<string, AnimationGroup[]>();
        await Promise.all(
          STATIONS.map(async (s) => {
            const m = await model("machine-" + s.id, s.x, s.z);
            if (m) {
              machineRoots.set(s.id, m.root);
              machineGroups.set(s.id, m.groups);
              const warning = MeshBuilder.CreateGround(
                "Overlap-" + s.id,
                { width: 2.6, height: 2.1 },
                scene,
              );
              warning.position.set(s.x, 0.035, s.z);
              warning.material = overlapMaterial;
              warning.isPickable = false;
              warning.setEnabled(false);
              overlapMarkers.set(s.id, warning);
              const animation = m.groups.find((g) => g.name.includes("Work"));
              if (animation) {
                animation.speedRatio = animation.getLength() / s.cycle;
                animation.start(true);
              }
            }
          }),
        );
        const objectRoots = new Map<
          string,
          { root: TransformNode; groups: AnimationGroup[]; mode?: string }
        >();
        for (const t of FACTORY_TARGETS.filter(
          (t) =>
            !STATIONS.some((s) => s.id === t.id) &&
            ![
              "operator",
              "altagracia",
              "wilfredo",
              "yuleisy",
              "kevin",
            ].includes(t.model),
        )) {
          void model(t.model, t.x, t.z)
            .then((m) => {
              if (m) {
                objectRoots.set(t.id, m);
                m.groups.find((g) => g.name.includes("Idle"))?.start(true);
              }
            })
            .catch(() =>
              refs.current.onError(
                "No se pudo cargar un objeto. Reintenta la carga.",
              ),
            );
        }
        ensureZones();
        const extraSeal = await model("machine-seal", 3, 1);
        extraSeal?.root.setEnabled(false);
        if (extraSeal) {
          machineGroups.set("parallel", extraSeal.groups);
          extraSeal.groups.find((g) => g.name.includes("Work"))?.start(true);
        }
        const boxes = await Promise.all(
          STATIONS.map(async (s) => {
            const box = await model(
              s.id === "pack"
                ? "box"
                : ["feed", "fill"].includes(s.id)
                  ? "bottle-open"
                  : "bottle",
              s.x,
              s.z,
            );
            if (box) {
              box.root.scaling.setAll(s.id === "pack" ? 0.4 : 0.55);
              box.root.position.y = 1.025;
            }
            return { station: s, model: box };
          }),
        );
        const actorRoots = new Map<
          string,
          {
            root: TransformNode;
            groups: AnimationGroup[];
            model: string;
            mode?: string;
            animator: FactoryAnimator;
            greeted?: boolean;
            greetUntil?: number;
          }
        >();
        const actorLoading = new Set<string>();
        const syncActors = () => {
          for (const [id, entry] of actorRoots)
            entry.root.setEnabled(navigation.actors.some((a) => a.id === id));
          for (const actor of navigation.actors) {
            const entry = actorRoots.get(actor.id);
            if (entry?.model === actor.model) {
              entry.root.position.set(actor.x, 0, actor.z);
              entry.root.rotation.y = actor.rotation;
            } else if (!actorLoading.has(actor.id)) {
              actorLoading.add(actor.id);
              void model(actor.model, actor.x, actor.z)
                .then((result) => {
                  actorLoading.delete(actor.id);
                  if (!result) return;
                  const current = navigation.actors.find(
                    (a) => a.id === actor.id,
                  );
                  if (!current || current.model !== actor.model) {
                    result.groups.forEach((g) => g.dispose());
                    result.root.dispose();
                    syncActors();
                    return;
                  }
                  const old = actorRoots.get(actor.id);
                  old?.animator.dispose();
                  old?.root.dispose();
                  result.root.rotation.y = actor.rotation;
                  const animator = new FactoryAnimator(result.groups, actor.id);
                  animator.update("Idle", 0, 0, reducedMotion);
                  actorRoots.set(actor.id, {
                    ...result,
                    model: actor.model,
                    animator,
                  });
                })
                .catch(() =>
                  refs.current.onError(
                    "No se pudo cargar un personaje. Reintenta la carga.",
                  ),
                );
            }
          }
        };
        const markers = FACTORY_TARGETS.map((t) => {
          const marker = MeshBuilder.CreateTorus(
            "target-" + t.id,
            { diameter: 1.15, thickness: 0.045, tessellation: 24 },
            scene,
          );
          marker.position.set(t.x, 0.06, t.z);
          const mat = new StandardMaterial("marker-" + t.id, scene);
          mat.diffuseColor = accent;
          mat.emissiveColor = accent.scale(0.3);
          marker.material = mat;
          marker.isPickable = false;
          return { target: t, mesh: marker };
        });
        const canWalk = (x: number, z: number) => navigation.walkable(x, z);
        let practiceTarget: (typeof FACTORY_TARGETS)[number] | undefined;
        let practiceVersion = "";
        let reachedPractice = false;
        const practiceMarker = MeshBuilder.CreateTorus(
          "Practice beacon",
          { diameter: 1.55, thickness: 0.065, tessellation: 32 },
          scene,
        );
        const practiceMaterial = new StandardMaterial("Practice light", scene);
        practiceMaterial.diffuseColor = accent;
        practiceMaterial.emissiveColor = accent.scale(0.55);
        practiceMarker.material = practiceMaterial;
        practiceMarker.isPickable = false;
        practiceMarker.setEnabled(false);
        const targets = () =>
          refs.current.world.tutorial?.active && practiceTarget
            ? [practiceTarget]
            : FACTORY_TARGETS.map(at);
        const at = (t: (typeof FACTORY_TARGETS)[number]) => {
          const actor = navigation.actors.find(
            (a) =>
              a.id === t.id || (t.id === "wilfredo" && a.model === "wilfredo"),
          );
          if (actor) return { ...t, x: actor.x, z: actor.z };
          const p = refs.current.world.layout.find((p) => p.id === t.id);
          return p ? { ...t, x: p.x, z: p.z } : t;
        };
        let qualitySeconds = 0;
        let scaling = baseScaling;
        let stableQualityWindows = 0;
        let visualSeconds = 0;
        let actingSeconds = 0;
        let velocity = 0;
        let lastRunning = true;
        let route: { x: number; z: number }[] = [];
        let pathVisual: LinesMesh | undefined;
        const showRoute = () => {
          pathVisual?.dispose();
          pathVisual = undefined;
          if (!route.length) return;
          pathVisual = MeshBuilder.CreateLines(
            "Walking route",
            {
              points: [
                new Vector3(player.position.x, 0.035, player.position.z),
                ...route.map((p) => new Vector3(p.x, 0.035, p.z)),
              ],
            },
            scene,
          );
          pathVisual.color = accent;
          pathVisual.isPickable = false;
        };
        let selected: string | undefined;
        let targetVersion = "";
        let eDown = false;
        let moving = false;
        let nearbyId: string | undefined;
        const availableTargets = () =>
          targets().filter((t) => {
            const w = refs.current.world;
            if (w.tutorial?.active)
              return (
                t.id === "practice" &&
                ["move", "interact"].includes(w.tutorial.step)
              );
            if (
              !w.openZones.includes(t.zone) ||
              (t.id === "yuleisy" && w.yuleisyAbsent)
            )
              return false;
            if (w.task.kind === "hazards")
              return (
                ["puddle", "guard", "exit", "gloves", "cable"].includes(t.id) &&
                !w.hazards.includes(t.id)
              );
            if (w.task.kind === "explore")
              return [
                "wilfredo",
                "yuleisy",
                "kevin",
                "spare",
                "canteen",
              ].includes(t.id);
            if (w.task.kind === "measure")
              return STATIONS.some((s) => s.id === t.id);
            return t.zone === w.task.zone;
          });
        const choose = (id: string) => {
          const target = targets().find((t) => t.id === id);
          if (!target) return;
          if (!refs.current.world.openZones.includes(target.zone)) {
            refs.current.onNavigationHint(
              "Esta zona se abre al avanzar en la experiencia. Sigue el objetivo actual.",
            );
            return;
          }
          selected = id;
          route = factoryPath(
            { x: player.position.x, z: player.position.z },
            target,
            canWalk,
            id === "practice" ? 0.4 : 2.2,
          );
          showRoute();
          if (
            !route.length &&
            Math.hypot(
              target.x - player.position.x,
              target.z - player.position.z,
            ) > 3.5
          ) {
            selected = undefined;
            refs.current.onNavigationHint(
              "No hay un recorrido despejado hasta ese lugar. Revisa la distribución o elige otro acceso.",
            );
          }
        };
        const interactNearest = () => {
          if (refs.current.world.paused || !refs.current.controlsEnabled)
            return;
          const t = availableTargets().sort(
            (a, b) =>
              Math.hypot(a.x - player.position.x, a.z - player.position.z) -
              Math.hypot(b.x - player.position.x, b.z - player.position.z),
          )[0];
          if (
            t &&
            Math.hypot(t.x - player.position.x, t.z - player.position.z) <
              (t.id === "practice" ? 1.6 : 3.5)
          ) {
            player.rotation.y = Math.atan2(
              t.x - player.position.x,
              t.z - player.position.z,
            );
            refs.current.onInteract(t.id);
          }
        };
        actionRef.current = interactNearest;
        scene.onPointerObservable.add((info) => {
          if (
            info.type !== 1 ||
            refs.current.world.paused ||
            !refs.current.controlsEnabled
          )
            return;
          const picked = scene.pick(scene.pointerX, scene.pointerY);
          if (!picked?.pickedPoint) return;
          const p = picked.pickedPoint;
          const nearest = availableTargets().find(
            (t) => Math.hypot(t.x - p.x, t.z - p.z) < 1.6,
          );
          if (nearest) choose(nearest.id);
          else {
            selected = undefined;
            route = factoryPath(
              { x: player.position.x, z: player.position.z },
              { x: p.x, z: p.z },
              canWalk,
            );
            showRoute();
          }
        });
        const wheel = (e: WheelEvent) => {
          e.preventDefault();
          zoom = Math.max(6, Math.min(16, zoom + Math.sign(e.deltaY)));
          setProjection();
        };
        element.addEventListener("wheel", wheel, { passive: false });
        resize = new ResizeObserver(() => {
          engine?.resize();
          setProjection();
        });
        resize.observe(element);
        refs.current.onReady();
        engine.runRenderLoop(() => {
          if (disposed || !engine) return;
          const w = refs.current.world;
          const signature = JSON.stringify([
            w.layout,
            w.hazards,
            w.budget.includes("install") && w.machineFound,
            w.yuleisyAbsent,
            w.staff,
            w.openZones,
          ]);
          if (signature !== geometryVersion) {
            geometryVersion = signature;
            navigation = factoryNavigation(w.layout, {
              installed: w.machineFound && w.budget.includes("install"),
              hazards: w.hazards,
              yuleisyAbsent: w.yuleisyAbsent,
              staff: w.staff,
              openZones: w.openZones,
            });
            const overlaps = factoryLayoutConflicts(
              w.layout,
              w.machineFound && w.budget.includes("install"),
            );
            for (const [id, marker] of overlapMarkers) {
              const p = w.layout.find((p) => p.id === id)!;
              marker.position.set(p.x, 0.035, p.z);
              marker.setEnabled(overlaps.includes(id));
            }
            const safe = factoryNearestPosition(player.position, canWalk);
            player.position.x = safe.x;
            player.position.z = safe.z;
            route = [];
            selected = undefined;
            showRoute();
            syncActors();
          }
          const tutorialVersion = JSON.stringify([
            w.tutorial?.active,
            w.tutorial?.origin,
            geometryVersion,
          ]);
          if (tutorialVersion !== practiceVersion) {
            practiceVersion = tutorialVersion;
            reachedPractice = false;
            if (w.tutorial?.active) {
              const point = factoryPracticePoint(w.tutorial.origin, canWalk);
              const room = FACTORY_ZONES.find(
                (r) =>
                  Math.abs(point.x - r.x) < r.w / 2 &&
                  Math.abs(point.z - r.z) < r.d / 2,
              );
              practiceTarget = {
                id: "practice",
                label: "Marcador de práctica",
                zone: room?.id ?? "entrance",
                model: "",
                ...point,
              };
              practiceMarker.position.set(point.x, 0.06, point.z);
            } else practiceTarget = undefined;
          }
          practiceMarker.setEnabled(
            !!w.tutorial?.active &&
              ["move", "interact"].includes(w.tutorial.step),
          );
          practiceMarker.scaling.setAll(
            reducedMotion ? 1 : 1 + Math.sin(performance.now() / 480) * 0.06,
          );
          if (
            w.tutorial?.active &&
            w.tutorial.step === "move" &&
            practiceTarget &&
            !reachedPractice &&
            Math.hypot(
              player.position.x - practiceTarget.x,
              player.position.z - practiceTarget.z,
            ) < 0.85 &&
            !w.paused &&
            refs.current.controlsEnabled
          ) {
            reachedPractice = true;
            refs.current.onPracticeReached();
          }
          if (!refs.current.controlsEnabled) {
            keys.clear();
            moving = false;
          }
          const closest = availableTargets().sort(
            (a, b) =>
              Math.hypot(a.x - player.position.x, a.z - player.position.z) -
              Math.hypot(b.x - player.position.x, b.z - player.position.z),
          )[0];
          const nearby =
            closest &&
            Math.hypot(
              closest.x - player.position.x,
              closest.z - player.position.z,
            ) < (closest.id === "practice" ? 1.6 : 3.5)
              ? closest
              : null;
          if (nearbyId !== (nearby?.id ?? "")) {
            nearbyId = nearby?.id ?? "";
            refs.current.onNearby(nearby);
          }
          element.dataset.frameRate = String(Math.round(engine.getFps()));
          const frameSeconds = engine.getDeltaTime() / 1000;
          const dt = Math.min(0.05, frameSeconds);
          if (!w.paused) actingSeconds += dt;
          qualitySeconds += frameSeconds;
          if (qualitySeconds > 3) {
            qualitySeconds = 0;
            const target = window.innerWidth < 768 ? 30 : 60;
            const fps = engine.getFps();
            if (fps < target * 0.8 && scaling < 2.5) {
              stableQualityWindows = 0;
              scaling = Math.min(2.5, scaling + 0.25);
              engine.setHardwareScalingLevel(scaling);
              setProjection();
            } else if (fps >= target * 0.97 && scaling > baseScaling) {
              stableQualityWindows++;
              if (stableQualityWindows >= 2) {
                scaling = Math.max(baseScaling, scaling - 0.25);
                engine.setHardwareScalingLevel(scaling);
                setProjection();
                stableQualityWindows = 0;
              }
            } else {
              stableQualityWindows = 0;
            }
            element.dataset.quality = scaling >= 2 ? "economy" : "balanced";
          }
          if (!w.paused && w.lineRunning)
            visualSeconds += Math.min(1, frameSeconds);
          scene.animationsEnabled = !w.paused;
          if (w.lineRunning !== lastRunning) {
            lastRunning = w.lineRunning;
            for (const groups of machineGroups.values())
              for (const group of groups)
                if (w.lineRunning) group.play(true);
                else group.pause();
          }
          for (const [id, groups] of machineGroups)
            for (const group of groups)
              group.speedRatio =
                group.getLength() /
                (w.stationCycles[id === "parallel" ? "seal" : id] ?? 8);
          if (w.avatar !== avatar) void avatarLoad(w.avatar);
          const focus = refs.current.focusTarget;
          if (focus && focus !== targetVersion) {
            targetVersion = focus;
            choose(focus.split(":")[0]!);
          }
          if (!w.paused && refs.current.controlsEnabled) {
            let dx =
              (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
              (keys.has("a") || keys.has("arrowleft") ? 1 : 0) +
              moveRef.current.x;
            let dz =
              (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
              (keys.has("w") || keys.has("arrowup") ? 1 : 0) +
              moveRef.current.z;
            if (dx || dz) {
              route = [];
              if (pathVisual) showRoute();
              selected = undefined;
              const len = Math.hypot(dx, dz);
              dx /= Math.max(1, len);
              dz /= Math.max(1, len);
            } else if (route.length) {
              const next = route[0]!;
              const distance = Math.hypot(
                next.x - player.position.x,
                next.z - player.position.z,
              );
              if (distance < 0.2) route.shift();
              else {
                dx = (next.x - player.position.x) / distance;
                dz = (next.z - player.position.z) / distance;
              }
            }
            if (
              !route.length &&
              (keys.size || moveRef.current.x || moveRef.current.z)
            ) {
              const groundDirection = factoryMovement(dx, dz);
              dx = groundDirection.x;
              dz = groundDirection.z;
            }
            const beforeX = player.position.x,
              beforeZ = player.position.z;
            const nx = player.position.x + dx * dt * 4,
              nz = player.position.z + dz * dt * 4;
            if (canWalk(nx, player.position.z)) player.position.x = nx;
            if (canWalk(player.position.x, nz)) player.position.z = nz;
            const movedX = player.position.x - beforeX,
              movedZ = player.position.z - beforeZ;
            moving = Math.hypot(movedX, movedZ) > 0.0001;
            velocity = dt > 0 ? Math.hypot(movedX, movedZ) / dt : 0;
            // The imported avatars face +Z at rest; align that axis with movement.
            if (moving)
              player.rotation.y = reducedMotion
                ? Math.atan2(movedX, movedZ)
                : smoothFacing(
                    player.rotation.y,
                    Math.atan2(movedX, movedZ),
                    dt,
                  );
            if (selected && !route.length) {
              const t = targets().find((t) => t.id === selected);
              if (!t) {
                selected = undefined;
                route = [];
                showRoute();
              }
              if (
                t &&
                t.id !== "practice" &&
                Math.hypot(t.x - player.position.x, t.z - player.position.z) <
                  3.5
              ) {
                player.rotation.y = Math.atan2(
                  t.x - player.position.x,
                  t.z - player.position.z,
                );
                refs.current.onInteract(t.id);
                selected = undefined;
              }
              if (t?.id === "practice") selected = undefined;
            }
            if (keys.has("e") && !eDown) interactNearest();
            eDown = keys.has("e");
          } else moving = false;
          if (!route.length && pathVisual) showRoute();
          const animation = moving
            ? "Walk"
            : w.shipment === 9000
              ? "Celebrate"
              : w.task.kind === "cutscene"
                ? "React"
                : w.task.kind === "inspection"
                  ? "Inspect"
                  : w.task.kind === "dialogue" ||
                      w.task.kind === "message" ||
                      w.task.kind === "spreadsheet"
                    ? "Listen"
                    : "Idle";
          if (!w.paused)
            playerAnimator?.update(
              animation,
              dt,
              moving ? velocity : 0,
              reducedMotion,
            );
          lastAnimation = animation;
          camera.target = Vector3.Lerp(
            camera.target,
            player.position.add(new Vector3(0, 0.7, 0)),
            1 - Math.exp(-6 * dt),
          );
          setProjection();
          for (const wall of walls) {
            const z = wall.zone.z - wall.zone.d / 2;
            const t =
              (z - camera.position.z) / (player.position.z - camera.position.z);
            const x =
              camera.position.x + (player.position.x - camera.position.x) * t;
            const y = camera.position.y + (1 - camera.position.y) * t;
            const alpha =
              t > 0 &&
              t < 1 &&
              Math.abs(x - wall.zone.x) < wall.zone.w / 2 &&
              y < 2.1
                ? 0.2
                : 1;
            for (const material of wall.materials) material.alpha = alpha;
          }
          refs.current.onPosition({
            x: player.position.x,
            z: player.position.z,
          });
          extraSeal?.root.setEnabled(
            w.machineFound && w.budget.includes("install"),
          );
          for (const [id, object] of objectRoots) {
            if (id === "yuleisy") object.root.setEnabled(!w.yuleisyAbsent);
            if (
              w.hazards.includes(id) &&
              ["puddle", "guard", "exit", "cable"].includes(id)
            )
              object.root.setEnabled(false);
            const distance = Math.hypot(
              object.root.position.x - player.position.x,
              object.root.position.z - player.position.z,
            );
            if (distance > (scaling >= 2 ? 17 : 25)) {
              object.root.setEnabled(false);
              continue;
            }
            if (!w.hazards.includes(id))
              object.root.setEnabled(id !== "yuleisy" || !w.yuleisyAbsent);
            const mood =
              w.shipment === 9000 && w.climate >= 60
                ? "Celebrate"
                : w.task.kind === "dialogue" && w.task.speaker === id
                  ? "Talk"
                  : "Idle";
            if (object.mode !== mood) {
              object.mode = mood;
              object.groups.forEach((g) => g.stop());
              object.groups.find((g) => g.name.includes(mood))?.start(true);
            }
          }
          for (const [id, actor] of actorRoots) {
            const distance = Math.hypot(
              actor.root.position.x - player.position.x,
              actor.root.position.z - player.position.z,
            );
            const visible =
              navigation.actors.some((a) => a.id === id) &&
              distance < (scaling >= 2 ? 18 : 25);
            actor.root.setEnabled(visible);
            actor.animator.setVisible(visible);
            if (!visible) continue;
            if (
              !id.startsWith("operator-") &&
              !actor.greeted &&
              distance < 5 &&
              !w.paused
            ) {
              actor.greeted = true;
              actor.greetUntil = actingSeconds + 1.2;
            }
            const mode =
              w.shipment === 9000 && w.climate >= 60
                ? "Celebrate"
                : (actor.greetUntil ?? 0) > actingSeconds
                  ? "Greet"
                  : id.startsWith("operator-")
                    ? w.lineRunning
                      ? "Work"
                      : "Idle"
                    : w.task.kind === "dialogue" && w.task.speaker === id
                      ? "Talk"
                      : id === "yuleisy" && w.task.kind === "measure"
                        ? "Inspect"
                        : id === "wilfredo" &&
                            w.task.kind === "explore" &&
                            distance < 7 &&
                            actingSeconds % 8 < 1.2
                          ? "Point"
                          : distance < 5
                            ? "Listen"
                            : "Idle";
            if (!w.paused) actor.animator.update(mode, dt, 0, reducedMotion);
            actor.mode = mode;
            if (!id.startsWith("operator-") && distance < 7 && !w.paused)
              actor.root.rotation.y = smoothFacing(
                actor.root.rotation.y,
                Math.atan2(
                  player.position.x - actor.root.position.x,
                  player.position.z - actor.root.position.z,
                ),
                reducedMotion ? 1 : dt,
              );
          }
          for (const item of boxes) {
            if (item.model) {
              const duration =
                w.stationCycles[item.station.id] ?? item.station.cycle;
              const phase = (visualSeconds % duration) / duration;
              const placement = w.layout.find((p) => p.id === item.station.id)!;
              item.model.root.position.set(
                placement.x - 0.9 + phase * 1.8,
                1.025,
                placement.z - 0.63,
              );
            }
          }
          const occupiedLabels: {
            x: number;
            y: number;
            w: number;
            h: number;
          }[] = [
            ...(element.parentElement?.querySelectorAll(
              ".factory-topbar,.factory-hud,.factory-panel,.factory-touch-pad,.factory-world-caption",
            ) ?? []),
          ]
            .map((node) => {
              const r = node.getBoundingClientRect();
              return { x: r.x, y: r.y, w: r.width, h: r.height };
            })
            .filter((r) => r.w > 0 && r.h > 0);
          for (const node of Array.from(labels.current?.children ?? [])) {
            const html = node as HTMLElement;
            const t = [
              ...FACTORY_TARGETS.map(at),
              ...(practiceTarget ? [practiceTarget] : []),
            ].find((t) => t.id === html.dataset.target);
            if (!t) {
              html.style.visibility = "hidden";
              continue;
            }
            const d = Math.hypot(
              t.x - player.position.x,
              t.z - player.position.z,
            );
            const point = Vector3.Project(
              new Vector3(t.x, 2.3, t.z),
              Matrix.Identity(),
              scene.getTransformMatrix(),
              camera.viewport.toGlobal(
                engine.getRenderWidth(),
                engine.getRenderHeight(),
              ),
            );
            const ratio = element.clientWidth / engine.getRenderWidth();
            html.style.transform = `translate(${point.x * ratio}px,${point.y * ratio}px) translate(-50%,-100%)`;
            const px = point.x * ratio,
              py = point.y * ratio;
            const rect = {
              x: px - html.offsetWidth / 2,
              y: py - 24,
              w: html.offsetWidth || 100,
              h: 24,
            };
            const overlaps = occupiedLabels.some(
              (r) =>
                rect.x < r.x + r.w + 6 &&
                rect.x + rect.w + 6 > r.x &&
                rect.y < r.y + r.h + 4 &&
                rect.y + rect.h + 4 > r.y,
            );
            const visible =
              (!w.tutorial?.active ||
                (t.id === "practice" &&
                  ["move", "interact"].includes(w.tutorial.step))) &&
              d < 12 &&
              point.z < 1 &&
              w.openZones.includes(t.zone) &&
              !(t.id === "yuleisy" && w.yuleisyAbsent) &&
              !overlaps;
            html.style.visibility = visible ? "visible" : "hidden";
            if (visible) occupiedLabels.push(rect);
          }
          for (const p of w.layout) {
            const root = machineRoots.get(p.id);
            if (root) {
              root.position.x = p.x;
              root.position.z = p.z;
            }
          }
          for (const { target, mesh } of markers) {
            const currentTarget = at(target);
            mesh.position.x = currentTarget.x;
            mesh.position.z = currentTarget.z;
            mesh.setEnabled(
              !w.tutorial?.active &&
                (target.id === selected ||
                  (w.task.kind === "hazards" &&
                    !w.hazards.includes(target.id) &&
                    ["puddle", "guard", "exit", "gloves", "cable"].includes(
                      target.id,
                    )) ||
                  (w.task.kind === "explore" &&
                    [
                      "wilfredo",
                      "yuleisy",
                      "kevin",
                      "spare",
                      "canteen",
                    ].includes(target.id)) ||
                  target.zone === w.task.zone),
            );
            mesh.scaling.x = mesh.scaling.z = reducedMotion
              ? 1
              : 1 + Math.sin(performance.now() / 400) * 0.15;
          }
          ensureZones();
          element.dataset.position = JSON.stringify({
            x: player.position.x,
            z: player.position.z,
          });
          element.dataset.heading = String(player.rotation.y);
          element.dataset.animation = lastAnimation;
          element.dataset.actorAnimations = JSON.stringify(
            Object.fromEntries([...actorRoots].map(([id, a]) => [id, a.mode])),
          );
          scene.render();
        });
        scene.onDisposeObservable.add(() =>
          element.removeEventListener("wheel", wheel),
        );
      } catch (error) {
        if (!disposed)
          refs.current.onError(
            error instanceof Error
              ? error.message
              : "No se pudo iniciar el mundo 3D.",
          );
      }
    })();
    return () => {
      disposed = true;
      resize?.disconnect();
      engine?.dispose();
      actionRef.current = null;
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [moveRef, actionRef]);
  return (
    <>
      <canvas
        ref={canvas}
        className="factory-canvas"
        aria-label="Fábrica EnvaPlast en tres dimensiones. Usa WASD o flechas para caminar, E para interactuar y la lista de lugares como alternativa al mapa."
        tabIndex={0}
      />
      <div ref={labels} className="factory-label-overlay" aria-hidden>
        <span data-target="practice">Marcador de práctica</span>
        {FACTORY_TARGETS.filter(
          (t) => !["puddle", "guard", "exit", "gloves", "cable"].includes(t.id),
        ).map((t) => (
          <span data-target={t.id} key={t.id}>
            {t.label}
          </span>
        ))}
      </div>
    </>
  );
}
