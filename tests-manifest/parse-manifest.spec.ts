import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parseManifest } from '../src/services/parseManifest';

/** What the player does with a manifest that is valid JSON but not fully sound. */

const good = () => JSON.parse(readFileSync('dist-manifest/data/manifest.json', 'utf8'));

function captureWarnings<T>(run: () => T): { result: T; warnings: string[] } {
  const warnings: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => void warnings.push(args.join(' '));
  try {
    return { result: run(), warnings };
  } finally {
    console.warn = original;
  }
}

test.describe('parseManifest keeps the app bootable', () => {
  test('skips a tour without metadata, with a warning, and keeps the others', () => {
    const m = good();
    delete m.tours[0].metadata;
    const { result, warnings } = captureWarnings(() => parseManifest(m));
    expect(result.tours.map((t) => t.id)).toEqual(m.tours.slice(1).map((t: { id: string }) => t.id));
    expect(warnings.join('\n')).toContain(`"${m.tours[0].id}"`);
    expect(warnings.join('\n')).toContain('no metadata');
  });

  test('skips tours that are not objects or have no id', () => {
    const m = good();
    m.tours.push(null, 'x', { metadata: {} });
    const { result, warnings } = captureWarnings(() => parseManifest(m));
    expect(result.tours).toHaveLength(good().tours.length);
    expect(warnings).toHaveLength(3);
  });

  test('drops themes without an id, as the compiled path does', () => {
    const m = good();
    m.themes = [{ id: 'a', name: 'A' }, { name: 'no id' }, null];
    const { result, warnings } = captureWarnings(() => parseManifest(m));
    expect(result.themes.map((t) => t.id)).toEqual(['a']);
    expect(warnings).toHaveLength(2);
  });

  test('a language file whose language differs from its key is warned about and re-keyed', () => {
    const m = good();
    m.tours[0].languages.de.language = 'fr'; // filed under "de"
    const { result, warnings } = captureWarnings(() => parseManifest(m));
    expect(result.tours[0].languages.de.language).toBe('de');
    expect(warnings.join('\n')).toMatch(/"de" says language "fr"; using "de"/);
    // Sound files are passed through untouched.
    expect(result.tours[0].languages.en).toBe(m.tours[0].languages.en);
  });

  test('a sound manifest produces no warnings', () => {
    const { warnings } = captureWarnings(() => parseManifest(good()));
    expect(warnings).toEqual([]);
  });
});
