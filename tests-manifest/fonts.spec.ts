import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

/**
 * src/fonts/index.ts must import every writing-system subset the fontsource packages
 * ship (unicode-range keeps the downloads lazy), or Cyrillic, Greek and Vietnamese text
 * silently falls back to a system font.
 */

const families = ['inter', 'ibm-plex-sans', 'space-grotesk', 'jetbrains-mono'];
const subsets = ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek', 'vietnamese'];
const weights = [400, 500, 600, 700];
const source = readFileSync('src/fonts/index.ts', 'utf8');

for (const family of families) {
  test(`${family}: every available subset and weight is imported`, () => {
    const missing: string[] = [];
    for (const subset of subsets) {
      if (!existsSync(`node_modules/@fontsource/${family}/${subset}-400.css`)) continue; // not shipped
      for (const weight of weights) {
        if (!source.includes(`'@fontsource/${family}/${subset}-${weight}.css'`)) missing.push(`${subset}-${weight}`);
      }
    }
    expect(missing).toEqual([]);
  });
}

test('the four extra subsets are really there for the families that ship them', () => {
  for (const subset of ['cyrillic', 'cyrillic-ext', 'greek', 'vietnamese']) {
    expect(source, subset).toContain(`/inter/${subset}-400.css`);
  }
  expect(source).toContain('/space-grotesk/vietnamese-400.css');
});
