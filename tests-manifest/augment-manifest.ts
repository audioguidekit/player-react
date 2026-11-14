/**
 * Turns the manifest built from the barcelona fixture into the one the
 * manifest-mode tests run against: a second tour (so the picker shows a list),
 * an app title for English and a UI text override for Czech.
 *
 *   bun tests-manifest/augment-manifest.ts <manifest.json>
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { validateManifest, type Manifest } from '@audioguidekit/schema';

const file = process.argv[2];
const manifest: Manifest = JSON.parse(readFileSync(file, 'utf8'));

const [original] = manifest.tours;
const second = structuredClone(original);
second.id = 'barcelona-evening';
second.metadata.id = second.id;
for (const tour of Object.values(second.languages)) {
  tour.id = second.id;
  tour.title = `${tour.title} (evening)`;
}

// The evening tour's audio is served SAME-ORIGIN at /media/{orgId}/{sha256}.{ext}, the way
// the production Worker serves it (one fixture file, content-addressed). The first tour keeps
// its external (R2) URLs, so both shapes are covered.
function silentWav(seconds: number): Buffer {
  const rate = 8000;
  const data = Buffer.alloc(rate * seconds, 128); // 8-bit unsigned PCM: 128 is silence
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate, 28);
  header.writeUInt16LE(1, 32);
  header.writeUInt16LE(8, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}
const wav = silentWav(20);
const sha = createHash('sha256').update(wav).digest('hex');
const mediaPath = `/media/test-org/${sha}.wav`;
const mediaFile = join(dirname(file), '..', mediaPath.slice(1));
mkdirSync(dirname(mediaFile), { recursive: true });
writeFileSync(mediaFile, wav);
for (const tour of Object.values(second.languages)) {
  for (const stop of tour.stops) if (stop.type === 'audio') stop.audioFile = mediaPath;
}

manifest.tours.push(second);

manifest.app = {
  ...manifest.app,
  title: { en: 'Test museum guides' },
  name: 'Test museum',
  themeColor: '#123456',
};
manifest.ui = { ...manifest.ui, cs: { tourSelection: { title: 'Vyberte si průvodce' } } };

const result = validateManifest(manifest);
if (!result.valid) {
  console.error(result.errors.join('\n'));
  process.exit(1);
}
writeFileSync(file, JSON.stringify(manifest) + '\n');
console.log(`✓ augmented ${file}: ${manifest.tours.map((t) => t.id).join(', ')}`);
