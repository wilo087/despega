import { readFile, stat, readdir } from "node:fs/promises";
import path from "node:path";
const dir = path.resolve("apps/web/public/game-assets/envaplast");
const required = [
  "alma",
  "leo",
  "altagracia",
  "wilfredo",
  "yuleisy",
  "kevin",
  "marcos",
  "operator",
  "machine",
  "box",
  "table",
  "puddle",
  "cable",
  "guard",
  "bottle",
  "bottle-open",
  ...["feed", "fill", "seal", "label", "pack"].map((id) => "machine-" + id),
  ...["entrance", "office", "line", "warehouse", "quality", "canteen"].map(
    (z) => "zone-" + z,
  ),
];
let bytes = 0,
  triangles = 0;
for (const name of required) {
  const b = await readFile(path.join(dir, name + ".glb"));
  if (
    b.toString("ascii", 0, 4) !== "glTF" ||
    b.readUInt32LE(4) !== 2 ||
    b.readUInt32LE(8) !== b.length
  )
    throw new Error("Invalid GLB: " + name);
  const json = JSON.parse(b.toString("utf8", 20, 20 + b.readUInt32LE(12)));
  if (!json.meshes?.length) throw new Error("Missing geometry: " + name);
  for (const mesh of json.meshes)
    for (const p of mesh.primitives) {
      triangles += (json.accessors[p.indices]?.count ?? 0) / 3;
    }
  if (required.indexOf(name) < 8) {
    const clips = new Set(json.animations?.map((a) => a.name));
    for (const clip of [
      "Idle",
      "Walk",
      "Talk",
      "Work",
      "Point",
      "Inspect",
      "React",
      "Celebrate",
      "Listen",
      "Greet",
    ])
      if (!clips.has(clip)) throw new Error(`Missing ${clip} for ${name}`);
    const signatures = json.animations.map((a) =>
      a.channels
        .map((c) => `${c.target.node}:${c.target.path}`)
        .sort()
        .join("|"),
    );
    if (new Set(signatures).size !== 1)
      throw new Error(
        `Incomplete pose channels for ${name}: clips must share all animated transforms for blending.`,
      );
  }
  bytes += b.length;
}
if (bytes > 8 * 1024 * 1024)
  throw new Error("3D resources exceed the initial 8 MiB budget.");
const portraitBytes = (
  await Promise.all(
    ["alma", "leo"].map((id) => stat(path.join(dir, `portrait-${id}.png`))),
  )
).reduce((sum, s) => sum + s.size, 0);
const blend = await stat("assets/3d/envaplast.blend");
if (blend.size < 1000) throw new Error("Missing editable source.");
console.log(
  JSON.stringify(
    {
      assets: required.length,
      portraits: 2,
      portraitBytes,
      totalDownloadBytes: bytes + portraitBytes,
      bytes,
      mebibytes: Math.round((bytes / 1048576) * 100) / 100,
      sourceBytes: blend.size,
      trianglesAcrossAllAssets: triangles,
    },
    null,
    2,
  ),
);
