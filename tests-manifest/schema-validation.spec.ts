import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { validateManifest, SCHEMA_VERSION } from '@audioguidekit/schema';

/** validateManifest() — no browser needed, runs in the Playwright runner. */

const good = () => JSON.parse(readFileSync('dist-manifest/data/manifest.json', 'utf8'));

test.describe('validateManifest', () => {
  test('accepts the manifest built from the barcelona fixture', () => {
    expect(validateManifest(good())).toEqual({ valid: true, errors: [] });
  });

  test('reports readable errors, with paths, for a broken manifest', () => {
    const m = good();
    m.tours[0].languages.en.stops[0].type = 'hologram'; // not a stop type
    m.tours[0].metadata.mapProvider = 'google'; // not a provider
    m.tours[0].languages.en.titel = 'typo'; // unsupported property
    delete m.tours[0].languages.de.title; // missing required property
    m.themes[0].buttons.primary.backgroundColour = '#fff'; // typo inside a theme

    const result = validateManifest(m);
    expect(result.valid).toBe(false);
    const text = result.errors.join('\n');
    expect(text).toContain('tours[0].languages.en.stops[0]');
    expect(text).toContain('tours[0].metadata.mapProvider');
    expect(text).toContain('unsupported property "titel"');
    expect(text).toContain('tours[0].languages.de: missing required property "title"');
    expect(text).toContain('themes[0].buttons.primary: unsupported property "backgroundColour"');
  });

  test('checks what the schema cannot express', () => {
    const m = good();
    m.tours[0].languages.en.totalStops = 99;
    m.tours[0].metadata.id = 'other';
    expect(validateManifest(m).errors).toEqual([
      expect.stringContaining('tours[0].metadata.id: "other" does not match'),
      expect.stringContaining('tours[0].languages.en.totalStops: is 99'),
    ]);
  });

  test('refuses another schema version before anything else', () => {
    const result = validateManifest({ ...good(), schemaVersion: SCHEMA_VERSION + 1 });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain(`version ${SCHEMA_VERSION + 1}`);
  });

  test('rejects things that are not manifests', () => {
    expect(validateManifest(null).valid).toBe(false);
    expect(validateManifest([]).valid).toBe(false);
    expect(validateManifest({}).errors[0]).toContain('schemaVersion');
  });
});

test.describe('custom themes in a manifest', () => {
  const withTheme = (theme: Record<string, unknown>) => ({ ...good(), themes: [{ id: 'brand', ...theme }] });

  test('accept a font stack as an array', () => {
    const result = validateManifest(withTheme({ typography: { fontFamily: { sans: ['Inter', 'sans-serif'], heading: ['Space Grotesk'] } } }));
    expect(result).toEqual({ valid: true, errors: [] });
  });

  test('refuse a font stack that is not an array', () => {
    const result = validateManifest(withTheme({ typography: { fontFamily: { sans: 'Inter' } } }));
    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('themes[0].typography.fontFamily.sans');
  });
});
