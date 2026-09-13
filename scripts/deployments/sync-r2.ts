/**
 * Uploads a deployment's local asset originals (tours-content/<name>/assets/**)
 * to the shared R2 bucket, under that deployment's own prefix (deployment.json's
 * r2Prefix), and deletes any object under that prefix that this same script
 * uploaded before but no longer has a matching local file for — otherwise a
 * renamed/removed local asset would leave an orphaned file in the bucket
 * forever. Requires `wrangler` to already be authenticated locally.
 *
 * `bun run tour:sync-r2 <deployment>`
 *
 * Dev-only tooling — never runs in CI, never imported by app code. Always uses
 * --remote (wrangler defaults to the local emulator otherwise, see
 * ~/.claude/projects/.../memory/r2-uploads.md).
 *
 * wrangler's R2 CLI has no "list objects" command (only get/put/delete), so
 * staleness can't be detected by asking the bucket what's there — instead this
 * keeps its own record of what it last uploaded, in
 * tours-content/<name>/.r2-sync-manifest.json (commit it in that repo so a
 * sync from a different clone still knows what's already up there).
 */
import { resolve, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const BUCKET = 'superguided-audio';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const deployment = process.argv[2];
if (!deployment) {
  console.error('Usage: bun run tour:sync-r2 <deployment>');
  process.exit(1);
}

const deploymentDir = resolve(root, 'tours-content', deployment);
const assetsDir = join(deploymentDir, 'assets');
if (!existsSync(assetsDir)) {
  console.error(`No assets/ folder at tours-content/${deployment}/assets`);
  process.exit(1);
}

const deploymentManifestPath = join(deploymentDir, 'deployment.json');
const r2Prefix: string = existsSync(deploymentManifestPath)
  ? require(deploymentManifestPath).r2Prefix ?? deployment
  : deployment;

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      yield* walk(full);
    } else if (!name.startsWith('.')) {
      yield full;
    }
  }
}

const currentKeys = new Set<string>();
for (const file of walk(assetsDir)) {
  currentKeys.add(`${r2Prefix}/${relative(assetsDir, file).split(sep).join('/')}`);
}

const syncManifestPath = join(deploymentDir, '.r2-sync-manifest.json');
const previousKeys: string[] = existsSync(syncManifestPath)
  ? JSON.parse(readFileSync(syncManifestPath, 'utf-8')).keys ?? []
  : [];

const staleKeys = previousKeys.filter((key) => !currentKeys.has(key));

for (const key of staleKeys) {
  console.log(`x  ${BUCKET}/${key} (no longer present locally)`);
  execSync(`wrangler r2 object delete ${JSON.stringify(`${BUCKET}/${key}`)} --remote`, {
    cwd: root,
    stdio: 'inherit',
  });
}

let uploaded = 0;
for (const file of walk(assetsDir)) {
  const key = `${r2Prefix}/${relative(assetsDir, file).split(sep).join('/')}`;
  console.log(`-> ${BUCKET}/${key}`);
  execSync(
    `wrangler r2 object put ${JSON.stringify(`${BUCKET}/${key}`)} --file ${JSON.stringify(file)} --remote`,
    { cwd: root, stdio: 'inherit' }
  );
  uploaded++;
}

writeFileSync(syncManifestPath, JSON.stringify({ keys: [...currentKeys].sort() }, null, 2) + '\n');

console.log(`\nSynced ${uploaded} file(s) to ${BUCKET}/${r2Prefix}/, removed ${staleKeys.length} stale file(s).`);
if (staleKeys.length === 0 && previousKeys.length === 0) {
  console.log(`(First sync for this deployment — nothing to compare staleness against yet.)`);
}
