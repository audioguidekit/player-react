/**
 * Switches which tour-content set is active in src/data/tour + public/{images,audio}.
 *
 * `bun run tour:use barcelona`  — restores the repo's own tracked demo content
 *                                 (git checkout of the tracked defaults).
 * `bun run tour:use <name>`     — stages tours-content/<name>/ into place:
 *                                 tours/* -> src/data/tour/* (_fixture/ kept as-is),
 *                                 assets/* -> public/{images,audio}/*.
 *
 * tours-content/ is a separate, gitignored repo (see tours-content/README.md) —
 * this script never touches it, only reads from it. Dev-only; never runs in CI
 * and is never imported by app code.
 */
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readdirSync, rmSync, cpSync } from 'node:fs';
import { execSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const tourDataDir = resolve(root, 'src/data/tour');
const contentDir = resolve(root, 'tours-content');

const deployment = process.argv[2];
if (!deployment) {
  console.error('Usage: bun run tour:use <deployment>   (e.g. "barcelona" or a folder under tours-content/)');
  process.exit(1);
}

/** Every entry directly under src/data/tour except the always-on test fixture. */
function nonFixtureEntries(): string[] {
  if (!existsSync(tourDataDir)) return [];
  return readdirSync(tourDataDir).filter((name) => name !== '_fixture');
}

function clearActiveDeployment() {
  for (const name of nonFixtureEntries()) {
    rmSync(join(tourDataDir, name), { recursive: true, force: true });
  }
  rmSync(resolve(root, 'public/images'), { recursive: true, force: true });
  rmSync(resolve(root, 'public/audio'), { recursive: true, force: true });
}

if (deployment === 'barcelona') {
  // Remove whatever a previous `tour:use <deployment>` staged (untracked leftovers
  // only — barcelona/_fixture are git-tracked and untouched by clean), then restore
  // the tracked defaults. Order matters: never rmSync barcelona itself, since it's
  // the thing being restored, not staged content to clear.
  execSync('git clean -fd -- src/data/tour public/images public/audio', { cwd: root, stdio: 'inherit' });
  execSync('git checkout -- src/data/tour', { cwd: root, stdio: 'inherit' });
  console.log('Restored the repo\'s default (barcelona) tour content.');
} else {
  const deploymentDir = join(contentDir, deployment);
  if (!existsSync(deploymentDir)) {
    console.error(`No deployment "${deployment}" found at tours-content/${deployment}/`);
    console.error(existsSync(contentDir)
      ? `Available: ${readdirSync(contentDir).join(', ') || '(none)'}`
      : 'tours-content/ does not exist locally — clone/create it first.');
    process.exit(1);
  }

  clearActiveDeployment();

  const toursSrc = join(deploymentDir, 'tours');
  if (existsSync(toursSrc)) {
    for (const tourId of readdirSync(toursSrc)) {
      cpSync(join(toursSrc, tourId), join(tourDataDir, tourId), { recursive: true });
    }
  }

  const appJson = join(deploymentDir, 'app.json');
  if (existsSync(appJson)) {
    cpSync(appJson, join(tourDataDir, 'app.json'));
  }

  const imagesSrc = join(deploymentDir, 'assets/images');
  if (existsSync(imagesSrc)) {
    const dest = resolve(root, 'public/images');
    mkdirSync(dest, { recursive: true });
    for (const name of readdirSync(imagesSrc)) {
      // "app" (logo/hero/splash) goes to public/images/app, everything else is a
      // per-tour image folder and goes to public/images/tours/<id>.
      const target = name === 'app' ? join(dest, 'app') : join(dest, 'tours', name);
      cpSync(join(imagesSrc, name), target, { recursive: true });
    }
  }

  const audioSrc = join(deploymentDir, 'assets/audio');
  if (existsSync(audioSrc) && readdirSync(audioSrc).length > 0) {
    const dest = resolve(root, 'public/audio/tours');
    mkdirSync(dest, { recursive: true });
    for (const name of readdirSync(audioSrc)) {
      cpSync(join(audioSrc, name), join(dest, name), { recursive: true });
    }
  }

  console.log(`Switched to deployment "${deployment}".`);
}

execSync('bun run validate', { cwd: root, stdio: 'inherit' });
