import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { BUILT_IN_THEME_IDS, validateManifest, type CustomTheme } from '@audioguidekit/schema';
import { resolveCustomThemes } from '../src/theme/themes/resolveCustomThemes';
import { defaultLightTheme } from '../src/theme/themes/default-light';
import { defaultDarkTheme } from '../src/theme/themes/default-dark';
import type { ThemeConfig } from '../src/theme/types';

/** Theme and tour references in a manifest, and `extends` between custom themes. */

const good = () => JSON.parse(readFileSync('dist-manifest/data/manifest.json', 'utf8'));
const errorsOf = (change: (m: ReturnType<typeof good>) => void) => {
  const m = good();
  change(m);
  return validateManifest(m).errors;
};

test.describe('BUILT_IN_THEME_IDS', () => {
  test('are exactly the themes the player ships', () => {
    expect([...BUILT_IN_THEME_IDS].sort()).toEqual([defaultLightTheme.id, defaultDarkTheme.id].sort());
  });
});

test.describe('validateManifest: optional collections', () => {
  test('a manifest with no themes and no ui is valid', () => {
    const m = good();
    delete m.themes;
    delete m.ui;
    expect(validateManifest(m)).toEqual({ valid: true, errors: [] });
  });
});

test.describe('validateManifest: references', () => {
  test('a tour theme that exists nowhere is reported, built-in and custom ones are fine', () => {
    expect(errorsOf((m) => (m.tours[0].metadata.themeId = 'default-dark'))).toEqual([]);
    expect(errorsOf((m) => ((m.themes = [{ id: 'brand' }]), (m.tours[0].metadata.themeId = 'brand')))).toEqual([]);
    expect(errorsOf((m) => (m.tours[0].metadata.themeId = 'nope'))).toEqual([
      expect.stringContaining('tours[0].metadata.themeId: unknown theme "nope"'),
    ]);
    expect(errorsOf((m) => (m.tours[0].languages.en.themeId = 'nope'))).toEqual([
      expect.stringContaining('tours[0].languages.en.themeId: unknown theme "nope"'),
    ]);
  });

  test('app.themeId must exist', () => {
    expect(errorsOf((m) => (m.app.themeId = 'default-dark'))).toEqual([]);
    expect(errorsOf((m) => (m.app.themeId = 'nope'))).toEqual([expect.stringContaining('app.themeId: unknown theme "nope"')]);
  });

  test('every id in app.tourOrder must be a tour', () => {
    expect(errorsOf((m) => (m.app.tourOrder = m.tours.map((t: { id: string }) => t.id).reverse()))).toEqual([]);
    expect(errorsOf((m) => (m.app.tourOrder = [m.tours[0].id, 'ghost']))).toEqual([
      expect.stringContaining('app.tourOrder[1]: no tour with id "ghost"'),
    ]);
  });

  test('a custom theme cannot reuse a built-in id', () => {
    expect(errorsOf((m) => (m.themes = [{ id: 'default-light' }]))).toEqual([
      expect.stringContaining('themes[0].id: "default-light" is a built-in theme'),
    ]);
  });
});

test.describe('validateManifest: extends', () => {
  test('may name a built-in theme or another custom theme, in any order', () => {
    expect(
      errorsOf((m) => (m.themes = [{ id: 'b', extends: 'a' }, { id: 'a', extends: 'default-dark' }])),
    ).toEqual([]);
  });

  test('must name a theme that exists', () => {
    expect(errorsOf((m) => (m.themes = [{ id: 'a', extends: 'ghost' }]))).toEqual([
      expect.stringContaining('themes[0].extends: unknown theme "ghost"'),
    ]);
  });

  test('a cycle is rejected, and reported once', () => {
    const errors = errorsOf((m) => (m.themes = [{ id: 'a', extends: 'b' }, { id: 'b', extends: 'c' }, { id: 'c', extends: 'a' }, { id: 'tail', extends: 'a' }]));
    expect(errors).toEqual([expect.stringContaining('cycle a → b → c → a')]);
    expect(errorsOf((m) => (m.themes = [{ id: 'self', extends: 'self' }]))).toEqual([expect.stringContaining('cycle self → self')]);
  });
});

test.describe('the player resolves extends between custom themes', () => {
  const light = defaultLightTheme;
  const dark = defaultDarkTheme;
  const base = { 'default-light': light, 'default-dark': dark };
  const resolve = (themes: object[]) => resolveCustomThemes(themes as CustomTheme[], base, light);

  test('a theme builds on another custom theme, which builds on a built-in', () => {
    const themes = resolve([
      { id: 'child', extends: 'parent', header: { textColor: '#111111' } },
      { id: 'parent', extends: 'default-dark', header: { backgroundColor: '#222222' } },
    ]);
    // From default-dark, through parent, then child's own override.
    expect(themes.child.header.backgroundColor).toBe('#222222');
    expect(themes.child.header.textColor).toBe('#111111');
    expect(themes.child.mainContent.backgroundColor).toBe(dark.mainContent.backgroundColor);
    expect(themes.child.mainContent.backgroundColor).not.toBe(light.mainContent.backgroundColor);
    expect(themes.child.id).toBe('child');
    expect('extends' in themes.child).toBe(false);
    // The parent itself is untouched by the child.
    expect(themes.parent.header.textColor).toBe(dark.header.textColor);
  });

  test('without extends a theme starts from default light', () => {
    const themes = resolve([{ id: 'plain', header: { textColor: '#333333' } }]);
    expect(themes.plain.mainContent.backgroundColor).toBe(light.mainContent.backgroundColor);
  });

  test('a cycle does not hang or throw: the closing link falls back to the default theme', () => {
    const warnings: string[] = [];
    const original = console.warn;
    console.warn = (...args: unknown[]) => void warnings.push(args.join(' '));
    let themes: Record<string, ThemeConfig>;
    try {
      themes = resolve([{ id: 'a', extends: 'b', header: { textColor: '#aaaaaa' } }, { id: 'b', extends: 'a', header: { textColor: '#bbbbbb' } }]);
    } finally {
      console.warn = original;
    }
    expect(themes.a.header.textColor).toBe('#aaaaaa');
    expect(themes.b.header.textColor).toBe('#bbbbbb');
    expect(warnings.join('\n')).toContain('cycle');
  });

  test('an unknown extends falls back to the default theme with a warning', () => {
    const original = console.warn;
    const warnings: string[] = [];
    console.warn = (...args: unknown[]) => void warnings.push(args.join(' '));
    try {
      const themes = resolve([{ id: 'x', extends: 'ghost' }]);
      expect(themes.x.mainContent.backgroundColor).toBe(light.mainContent.backgroundColor);
    } finally {
      console.warn = original;
    }
    expect(warnings.join('\n')).toContain('ghost');
  });

  test('a custom theme with a built-in id is ignored (the built-in wins)', () => {
    expect(resolve([{ id: 'default-light', header: { textColor: '#999999' } }])).toEqual({});
  });
});
