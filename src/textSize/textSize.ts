/**
 * Text size: three steps the visitor can pick, remembered on their device.
 *
 * It is a multiplier, not a size. The player never sets a root font size, so every `rem` and `em`
 * already follows the browser's or phone's own text size setting (OS font scaling); this step
 * multiplies on top of that. The multiplier is published as the CSS variable `--agk-text-scale`
 * on `<html>`, and `scaled()` / the rich text component read it, so the size changes with no re-render.
 *
 * What it scales: rich text (stop texts, captions, credits), transcripts and the titles, headlines
 * and quotes of the stop list. Controls, the header and the players stay at their designed size.
 */
import { useEffect, useSyncExternalStore } from 'react';

export const TEXT_SIZES = ['default', 'large', 'larger'] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export const DEFAULT_TEXT_SIZE: TextSize = 'default';
export const TEXT_SIZE_STORAGE_KEY = 'agk-text-size';
export const TEXT_SCALE_VARIABLE = '--agk-text-scale';

/** The multiplier of each step. */
export const TEXT_SCALES: Record<TextSize, number> = { default: 1, large: 1.15, larger: 1.3 };

export function parseTextSize(raw: unknown): TextSize {
  return TEXT_SIZES.find((size) => size === raw) ?? DEFAULT_TEXT_SIZE;
}

/** A CSS length multiplied by the visitor's text scale: `scaled('1.125rem')`. */
export const scaled = (size: string): string => `calc(${size} * var(${TEXT_SCALE_VARIABLE}, 1))`;

/** Write the multiplier on `<html>`. `size` is what to show; pass `default` to switch the feature off. */
export function applyTextSize(size: TextSize, root: HTMLElement = document.documentElement): void {
  root.style.setProperty(TEXT_SCALE_VARIABLE, String(TEXT_SCALES[size]));
  root.dataset.textSize = size;
}

function readStored(): TextSize {
  try {
    return parseTextSize(localStorage.getItem(TEXT_SIZE_STORAGE_KEY));
  } catch {
    return DEFAULT_TEXT_SIZE; // storage blocked
  }
}

let current: TextSize = readStored();
const listeners = new Set<() => void>();

export const getTextSize = (): TextSize => current;

export function setTextSize(size: TextSize): void {
  current = parseTextSize(size);
  try {
    if (current === DEFAULT_TEXT_SIZE) localStorage.removeItem(TEXT_SIZE_STORAGE_KEY);
    else localStorage.setItem(TEXT_SIZE_STORAGE_KEY, current);
  } catch {
    // storage blocked: the choice still holds until the page closes
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

export const useTextSize = (): TextSize => useSyncExternalStore(subscribe, getTextSize, () => DEFAULT_TEXT_SIZE);

/**
 * Keep `<html>` in step with the visitor's choice. Call once, near the root. A tour that hides the
 * control (`showTextSize: false`) is shown at the default size whatever was chosen elsewhere.
 */
export function useApplyTextSize(enabled: boolean): void {
  const size = useTextSize();
  const effective = enabled ? size : DEFAULT_TEXT_SIZE;
  useEffect(() => applyTextSize(effective), [effective]);
}

// Before React renders anything, so a returning visitor does not see the text grow after load.
if (typeof document !== 'undefined') applyTextSize(current);
