import { test, expect, type Page } from '@playwright/test';
import type { Stop } from '@audioguidekit/schema';
import { applyTextSize, parseTextSize, scaled, TEXT_SCALES, TEXT_SIZES } from '../src/textSize/textSize';
import { audioStop, draftOf, startDraft, type Draft } from './visitor-helpers';

/** Text size: three steps, per device, scaling rich text, transcripts and stop text on top of the OS text size. */

test.use({ serviceWorkers: 'block', viewport: { width: 430, height: 900 } });

const KEY = 'agk-text-size';

function tourWithText(): Draft {
  const draft = draftOf();
  draft.tour.stops = [
    audioStop('a1', 'Opening stop', { audioFile: (draft.tour.stops.find((s) => s.type === 'audio') as { audioFile?: string }).audioFile, transcription: 'The words spoken in this stop.' }),
    { id: 't1', type: 'text', title: 'A text stop', content: 'Body copy with <strong>bold</strong> words.' },
    { id: 'q1', type: 'quote', quote: 'A short quotation', author: 'Someone' },
    { id: 'h1', type: 'headline', text: 'Section' },
  ] as Stop[];
  draft.tour.totalStops = 1;
  draft.tour.transcriptAvailable = true;
  return draft;
}

const control = (page: Page) => page.getByRole('group', { name: 'Text size' });
const step = (page: Page, name: string) => control(page).getByRole('button', { name });
const px = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

test.describe('the steps', () => {
  test('three steps, each a bigger multiplier, and the first changes nothing', () => {
    expect([...TEXT_SIZES]).toEqual(['default', 'large', 'larger']);
    expect(TEXT_SCALES.default).toBe(1);
    expect(TEXT_SCALES.large).toBeGreaterThan(1);
    expect(TEXT_SCALES.larger).toBeGreaterThan(TEXT_SCALES.large);
  });

  test('a stored value that is not a step means the default', () => {
    expect(parseTextSize('large')).toBe('large');
    for (const bad of [null, undefined, '', 'huge', '1.5', 2]) expect(parseTextSize(bad), String(bad)).toBe('default');
  });

  test('a size is a multiplier on the size the design gives, never a fixed size', () => {
    expect(scaled('1.125rem')).toBe('calc(1.125rem * var(--agk-text-scale, 1))');
  });

  test('applying a step writes the variable on the root element', () => {
    const style = new Map<string, string>();
    const root = { style: { setProperty: (k: string, v: string) => style.set(k, v) }, dataset: {} as Record<string, string> };
    applyTextSize('larger', root as unknown as HTMLElement);
    expect(style.get('--agk-text-scale')).toBe(String(TEXT_SCALES.larger));
    expect(root.dataset.textSize).toBe('larger');
  });
});

test.describe('in the player', () => {
  test('the control is a named group of three toggle buttons, the default one pressed', async ({ page }) => {
    await startDraft(page, tourWithText());
    await expect(control(page)).toBeVisible();
    await expect(control(page).getByRole('button')).toHaveCount(3);
    await expect(step(page, 'Default text size')).toHaveAttribute('aria-pressed', 'true');
    await expect(step(page, 'Large text')).toHaveAttribute('aria-pressed', 'false');
    await expect(step(page, 'Largest text')).toHaveAttribute('aria-pressed', 'false');
  });

  test('picking a step scales rich text, titles and quotes by that step', async ({ page }) => {
    await startDraft(page, tourWithText());
    const selectors = { body: '#stop-t1 strong', title: '#stop-t1 h3', quote: '#stop-q1 p', headline: '#stop-h1 h3' };
    const base: Record<string, number> = {};
    for (const [name, selector] of Object.entries(selectors)) base[name] = await px(page, selector);

    for (const [label, size] of [['Large text', 'large'], ['Largest text', 'larger']] as const) {
      await step(page, label).click();
      await expect(step(page, label)).toHaveAttribute('aria-pressed', 'true');
      for (const [name, selector] of Object.entries(selectors)) {
        expect(await px(page, selector), `${name} at ${size}`).toBeCloseTo(base[name] * TEXT_SCALES[size], 1);
      }
    }
    await step(page, 'Default text size').click();
    for (const [name, selector] of Object.entries(selectors)) expect(await px(page, selector), name).toBeCloseTo(base[name], 1);
  });

  test('transcripts scale too', async ({ page }) => {
    await startDraft(page, tourWithText());
    const toggle = page.getByTestId('mini-player').getByRole('button', { name: 'Show transcription' });
    await toggle.click();
    const words = page.getByTestId('mini-player').getByText('The words spoken in this stop.');
    await expect(words).toBeVisible();
    const before = await words.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    await step(page, 'Largest text').click();
    expect(await words.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeCloseTo(before * TEXT_SCALES.larger, 1);
  });

  test('the choice is remembered on the device and applied again on the next visit', async ({ page }) => {
    await startDraft(page, tourWithText());
    await step(page, 'Large text').click();
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe('large');
    await page.reload();
    await expect(page.getByTestId('boot-loading')).toHaveCount(0, { timeout: 15000 });
    await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--agk-text-scale'))).toBe(String(TEXT_SCALES.large));
    await startDraft(page, tourWithText());
    await expect(step(page, 'Large text')).toHaveAttribute('aria-pressed', 'true');
    await step(page, 'Default text size').click();
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull();
  });

  test('builds on the phone\'s own text size: a bigger browser default makes every step bigger', async ({ page }) => {
    await startDraft(page, tourWithText());
    const normal = await px(page, '#stop-t1 strong');
    // What a visitor with a larger system text size gives the page: a bigger root font size.
    await page.addStyleTag({ content: 'html { font-size: 125%; }' });
    const system = await px(page, '#stop-t1 strong');
    expect(system).toBeCloseTo(normal * 1.25, 1);
    await step(page, 'Large text').click();
    expect(await px(page, '#stop-t1 strong')).toBeCloseTo(normal * 1.25 * TEXT_SCALES.large, 1);
  });

  test('works from the keyboard: Tab to a step, Space picks it', async ({ page }) => {
    await startDraft(page, tourWithText());
    await step(page, 'Large text').focus();
    await page.keyboard.press('Space');
    await expect(step(page, 'Large text')).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Tab');
    await expect(step(page, 'Largest text')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(step(page, 'Largest text')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('the tour setting', () => {
  test('on by default; showTextSize: false removes the control and ignores a stored size', async ({ page }) => {
    await page.addInitScript((k) => localStorage.setItem(k, 'larger'), KEY);
    const draft = tourWithText();
    draft.metadata.showTextSize = false;
    await startDraft(page, draft);
    await expect(page.locator('#stop-t1')).toBeVisible();
    await expect(control(page)).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--agk-text-scale'))).toBe('1');
  });
});
