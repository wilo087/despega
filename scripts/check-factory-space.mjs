import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import {
  DEFAULT_LAYOUT,
  FACTORY_TARGETS,
  FACTORY_ZONES,
  FACTORY_PLAYER_RADIUS,
  FACTORY_ACTOR_RADIUS,
  STATIONS,
  FACTORY_MACHINE_ROTATION,
  factoryNavigation,
} from "../packages/simulator/src/factory/world.ts";
import { smoothFacing } from "../apps/web/src/components/factory/motion.ts";
const require = createRequire(
  new URL("../apps/web/package.json", import.meta.url),
);
const babylon = async (name) =>
  import(pathToFileURL(require.resolve(name)).href);
const { NullEngine } = await babylon("@babylonjs/core/Engines/nullEngine.js");
const { Scene } = await babylon("@babylonjs/core/scene.js");
const { TransformNode } = await babylon(
  "@babylonjs/core/Meshes/transformNode.js",
);
const { Vector3 } = await babylon("@babylonjs/core/Maths/math.vector.js");
const { LoadAssetContainerAsync } = await babylon(
  "@babylonjs/core/Loading/sceneLoader.js",
);
await babylon("@babylonjs/loaders/glTF/index.js");
await babylon("@babylonjs/core/Meshes/instancedMesh.js");
await babylon("@babylonjs/core/Animations/animatable.js");
const engine = new NullEngine(),
  scene = new Scene(engine),
  containers = new Map();
const geometry = JSON.parse(
  await readFile("packages/simulator/src/factory/geometry.json", "utf8"),
);
const source = await readFile(
  "apps/web/src/components/factory/canvas.tsx",
  "utf8",
);
assert.ok(source.includes("smoothFacing("), "renderer uses smoothed facing");
let boundsChecked = 0,
  directionsChecked = 0;
async function instance(id, x = 0, z = 0) {
  if (!containers.has(id))
    containers.set(
      id,
      await LoadAssetContainerAsync(
        new Uint8Array(
          await readFile(`apps/web/public/game-assets/envaplast/${id}.glb`),
        ),
        scene,
        { pluginExtension: ".glb" },
      ),
    );
  const entry = containers
    .get(id)
    .instantiateModelsToScene((name) => `${id}-${name}`, false, {
      doNotInstantiate: id.startsWith("zone-"),
    });
  const root = new TransformNode(id, scene);
  entry.rootNodes.forEach((n) => (n.parent = root));
  root.position.set(x, 0, z);
  return { root, groups: entry.animationGroups };
}
function update(root) {
  root.computeWorldMatrix(true);
  root.getDescendants().forEach((n) => n.computeWorldMatrix(true));
}
function contains(proxy, root) {
  update(root);
  const { min, max } = root.getHierarchyBoundingVectors();
  const epsilon = 0.003;
  assert.ok(
    min.x >= proxy.x - proxy.w / 2 - epsilon &&
      max.x <= proxy.x + proxy.w / 2 + epsilon &&
      min.z >= proxy.z - proxy.d / 2 - epsilon &&
      max.z <= proxy.z + proxy.d / 2 + epsilon,
    `${proxy.id}: GLB extends beyond its navigation collider`,
  );
  boundsChecked++;
}
try {
  const navigation = factoryNavigation(DEFAULT_LAYOUT, { installed: true });
  for (const s of navigation.solids) {
    const actor = navigation.actors.find((a) => a.id === s.id),
      target = FACTORY_TARGETS.find((t) => t.id === s.id);
    const model =
      actor?.model ??
      (STATIONS.some((p) => p.id === s.id) ? "machine-" + s.id : undefined) ??
      target?.model ??
      (s.id === "parallel" ? "machine-seal" : null);
    if (!model) continue;
    const object = await instance(
      model,
      actor?.x ?? target?.x ?? s.x,
      actor?.z ?? target?.z ?? s.z,
    );
    object.root.rotation.y =
      actor?.rotation ??
      (model.startsWith("machine") ? FACTORY_MACHINE_ROTATION : 0);
    contains(s, object.root);
    object.groups.forEach((g) => g.dispose());
    object.root.dispose();
  }
  for (const zone of FACTORY_ZONES) {
    const object = await instance("zone-" + zone.id, zone.x, zone.z);
    for (const f of geometry.furniture.filter((f) => f.zone === zone.id)) {
      const node = object.root
        .getDescendants()
        .find((n) => n.name === `zone-${zone.id}-${f.id}`);
      assert.ok(node, `${f.id}: editable furniture node missing`);
      contains({ ...f, x: zone.x + f.x, z: zone.z + f.z }, node);
    }
    assert.ok(
      object.root
        .getChildMeshes()
        .some((m) => m.metadata?.gltf?.extras?.occluder),
      `${zone.id}: wall occlusion metadata missing`,
    );
    object.root.dispose();
  }
  let maximumWalkRadius = 0;
  for (const id of ["alma", "leo"]) {
    const avatar = await instance(id),
      collar = avatar.root
        .getChildMeshes()
        .find((m) => m.name.startsWith(`${id}-Collar`));
    for (const [x, z] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      let angle = 0;
      for (let frame = 0; frame < 160; frame++)
        angle = smoothFacing(angle, Math.atan2(x, z), 1 / 60);
      avatar.root.rotation.y = angle;
      update(avatar.root);
      const front = collar.getAbsolutePosition().subtract(avatar.root.position);
      front.y = 0;
      front.normalize();
      assert.ok(
        Vector3.Dot(front, new Vector3(x, 0, z).normalize()) > 0.999999,
        `${id}: faces away from movement`,
      );
      directionsChecked++;
    }
    avatar.root.rotation.y = 0;
    const walk = avatar.groups.find((g) => g.name.includes("Walk"));
    walk.start(true);
    const fractions = new Set(Array.from({ length: 65 }, (_, i) => i / 64));
    for (const target of walk.targetedAnimations)
      for (const key of target.animation.getKeys())
        fractions.add((key.frame - walk.from) / (walk.to - walk.from));
    for (const fraction of fractions) {
      walk.goToFrame(walk.from + (walk.to - walk.from) * fraction);
      update(avatar.root);
      for (const mesh of avatar.root.getChildMeshes()) {
        const positions = mesh.getVerticesData("position") ?? [],
          matrix = mesh.getWorldMatrix();
        for (let i = 0; i < positions.length; i += 3) {
          const v = Vector3.TransformCoordinates(
            new Vector3(positions[i], positions[i + 1], positions[i + 2]),
            matrix,
          );
          maximumWalkRadius = Math.max(maximumWalkRadius, Math.hypot(v.x, v.z));
        }
      }
    }
    avatar.groups.forEach((g) => g.dispose());
    avatar.root.dispose();
  }
  assert.ok(
    maximumWalkRadius <= FACTORY_PLAYER_RADIUS + 0.003,
    `Walk extends to ${maximumWalkRadius.toFixed(3)} m; collider radius is ${FACTORY_PLAYER_RADIUS} m`,
  );
  const poseEnvelopes = [],
    poseViolations = [];
  for (const id of [
    "alma",
    "leo",
    "altagracia",
    "wilfredo",
    "yuleisy",
    "kevin",
    "marcos",
    "operator",
  ]) {
    const avatar = await instance(id);
    for (const group of avatar.groups) {
      group.start(true);
      const fractions = new Set(Array.from({ length: 33 }, (_, i) => i / 32));
      for (const target of group.targetedAnimations)
        for (const key of target.animation.getKeys())
          fractions.add((key.frame - group.from) / (group.to - group.from));
      let radius = 0,
        minY = Infinity;
      for (const fraction of fractions) {
        group.goToFrame(group.from + (group.to - group.from) * fraction);
        update(avatar.root);
        for (const mesh of avatar.root.getChildMeshes()) {
          const vertices = mesh.getVerticesData("position") ?? [],
            matrix = mesh.getWorldMatrix();
          for (let i = 0; i < vertices.length; i += 3) {
            const p = Vector3.TransformCoordinates(
              new Vector3(vertices[i], vertices[i + 1], vertices[i + 2]),
              matrix,
            );
            radius = Math.max(radius, Math.hypot(p.x, p.z));
            minY = Math.min(minY, p.y);
          }
        }
      }
      const clip = group.name.split("-").at(-1);
      const isPlayer =
        ["alma", "leo"].includes(id) &&
        ["Walk", "Idle", "Inspect", "Listen", "React", "Celebrate"].includes(
          clip,
        );
      const limit = isPlayer ? FACTORY_PLAYER_RADIUS : FACTORY_ACTOR_RADIUS;
      if (radius > limit + 0.003)
        poseViolations.push(
          `${id}/${clip} extends to ${radius.toFixed(3)} m, collider ${limit}`,
        );
      assert.ok(minY >= -0.005, `${id}/${clip} crosses the floor: ${minY}`);
      poseEnvelopes.push({ id, clip, radius, minY });
      group.stop();
    }
    avatar.groups.forEach((g) => g.dispose());
    avatar.root.dispose();
  }
  console.log(
    JSON.stringify(
      {
        boundsChecked,
        directionsChecked,
        maximumWalkRadius,
        playerRadius: FACTORY_PLAYER_RADIUS,
        actorRadius: FACTORY_ACTOR_RADIUS,
        animationEnvelopesChecked: poseEnvelopes.length,
        maximumGestureRadius: Math.max(...poseEnvelopes.map((p) => p.radius)),
      },
      null,
      2,
    ),
  );
  assert.deepEqual(
    poseViolations,
    [],
    "Animation envelopes must fit their colliders",
  );
} finally {
  engine.dispose();
}
