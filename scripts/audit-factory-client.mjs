import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { INDUSTRIAL_DIALOGUES } from "../packages/simulator/src/modules/ingenieria-industrial.ts";
async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}
const secrets = [
  "envaplast-industrial",
  ...Object.values(INDUSTRIAL_DIALOGUES).flatMap((options) =>
    Object.values(options).map((o) => o.reaction),
  ),
];
let files = 0,
  gzip = 0;
for await (const file of walk("apps/web/.next/static")) {
  if (!file.endsWith(".js")) continue;
  const source = await readFile(file, "utf8");
  for (const secret of secrets)
    if (
      source.includes(secret) ||
      source.includes(JSON.stringify(secret).slice(1, -1))
    )
      throw new Error(
        `Authoritative content leaked into ${file}: ${secret.slice(0, 60)}`,
      );
  files++;
  gzip += gzipSync(source).length;
}
let serverDependencyReferences = 0;
for await (const file of walk("apps/web/.next")) {
  if (!file.endsWith(".nft.json")) continue;
  const source = await readFile(file, "utf8");
  if (/@babylonjs|babylonjs-gltf2interface/.test(source))
    serverDependencyReferences++;
}
if (serverDependencyReferences)
  throw new Error("Babylon dependencies leaked into SSR traces.");
console.log(
  JSON.stringify(
    {
      clientFiles: files,
      gzipBytesAllClientChunks: gzip,
      serverBabylonDependencyReferences: serverDependencyReferences,
      privateNarrativeChecks: secrets.length,
    },
    null,
    2,
  ),
);
