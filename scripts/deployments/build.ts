/**
 * Produces a standalone build for one deployment.
 *
 * `bun run tour:build <deployment>`                  — local-asset build (images/audio
 *                                                        served from public/, same as dev).
 * `bun run tour:build <deployment> --remote-assets`   — rewrites local asset paths in the
 *                                                        staged src/data/tour copy to that
 *                                                        deployment's R2 URLs first, for a
 *                                                        build meant to be shared standalone.
 *
 * Dev-only tooling — never runs in CI, never imported by app code.
 */
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';

const DEFAULT_R2_PUBLIC_BASE = 'https://pub-f2d1a02a5dea4125b3453ea5789cc9b1.r2.dev';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const deployment = process.argv[2];
const remoteAssets = process.argv.includes('--remote-assets');

if (!deployment) {
  console.error('Usage: bun run tour:build <deployment> [--remote-assets]');
  process.exit(1);
}

execSync(`bun scripts/deployments/use.ts ${JSON.stringify(deployment)}`, { cwd: root, stdio: 'inherit' });

if (remoteAssets) {
  const manifestPath = resolve(root, 'tours-content', deployment, 'deployment.json');
  if (!existsSync(manifestPath)) {
    console.error(`--remote-assets needs tours-content/${deployment}/deployment.json (r2Prefix).`);
    process.exit(1);
  }
  const manifest = require(manifestPath);
  const r2Prefix: string = manifest.r2Prefix ?? deployment;
  const r2Base: string = manifest.r2PublicBase ?? DEFAULT_R2_PUBLIC_BASE;
  const remoteRoot = `${r2Base}/${r2Prefix}`;

  const replacements: [string, string][] = [
    ['/images/tours/', `${remoteRoot}/images/`],
    ['/images/app/', `${remoteRoot}/images/app/`],
    ['/audio/tours/', `${remoteRoot}/audio/`],
  ];

  const tourDataDir = resolve(root, 'src/data/tour');
  const jsonFiles: string[] = [];
  for (const name of readdirSync(tourDataDir)) {
    if (name === '_fixture') continue;
    const entryPath = join(tourDataDir, name);
    if (statSync(entryPath).isDirectory()) {
      for (const file of readdirSync(entryPath)) {
        if (file.endsWith('.json')) jsonFiles.push(join(entryPath, file));
      }
    } else if (name.endsWith('.json')) {
      jsonFiles.push(entryPath); // e.g. app.json
    }
  }

  let rewritten = 0;
  for (const filePath of jsonFiles) {
    let text = readFileSync(filePath, 'utf-8');
    for (const [from, to] of replacements) {
      if (text.includes(from)) {
        text = text.split(from).join(to);
        rewritten++;
      }
    }
    writeFileSync(filePath, text);
  }
  console.log(`Rewrote local asset paths to ${remoteRoot}/... in ${rewritten} file(s).`);
  console.log('(Run `bun run tour:sync-r2 ' + deployment + '` beforehand so those URLs actually resolve.)');
}

execSync('bun run build', { cwd: root, stdio: 'inherit' });
