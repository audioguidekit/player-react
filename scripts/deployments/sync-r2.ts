/**
 * Uploads a deployment's local asset originals (tours-content/<name>/assets/**)
 * to the shared R2 bucket, under that deployment's own prefix (deployment.json's
 * r2Prefix). Requires `wrangler` to already be authenticated locally.
 *
 * `bun run tour:sync-r2 <deployment>`
 *
 * Dev-only tooling — never runs in CI, never imported by app code. Always uses
 * --remote (wrangler defaults to the local emulator otherwise, see
 * ~/.claude/projects/.../memory/r2-uploads.md).
 */
import { resolve, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync, statSync } from 'node:fs';
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

const manifestPath = join(deploymentDir, 'deployment.json');
const r2Prefix: string = existsSync(manifestPath)
  ? require(manifestPath).r2Prefix ?? deployment
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

console.log(`\nSynced ${uploaded} file(s) to ${BUCKET}/${r2Prefix}/.`);
