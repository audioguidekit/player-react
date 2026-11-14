import { test, expect } from '@playwright/test';
import { canPreviewFrom, parseOrigins, resolvePreviewOrigins } from '../src/services/previewBridge';

/** Which origins may send live-preview manifests: parsing the configuration. */

test.describe('parseOrigins', () => {
  test('keeps exact origins, trims, and normalises a trailing slash or path', () => {
    expect(parseOrigins(' https://app.example.com , http://localhost:5173/ ,https://x.example/y/z')).toEqual([
      'https://app.example.com',
      'http://localhost:5173',
      'https://x.example',
    ]);
  });

  test('rejects the literal "null" origin, wildcards and garbage', () => {
    expect(parseOrigins('null')).toEqual([]);
    expect(parseOrigins('NULL, *, , not a url, data:text/html,hi, file:///x')).toEqual([]);
    expect(parseOrigins('null,https://app.example.com')).toEqual(['https://app.example.com']);
  });

  test('empty, missing and duplicate input', () => {
    expect(parseOrigins('')).toEqual([]);
    expect(parseOrigins(undefined)).toEqual([]);
    expect(parseOrigins(null)).toEqual([]);
    expect(parseOrigins('https://a.example,https://a.example/')).toEqual(['https://a.example']);
  });
});

test.describe('canPreviewFrom', () => {
  test('framing alone is not enough: with no origins the normal error screen must show', () => {
    expect(canPreviewFrom([], true)).toBe(false);
    expect(canPreviewFrom(parseOrigins('null'), true)).toBe(false);
    expect(canPreviewFrom(['https://app.example.com'], false)).toBe(false);
    expect(canPreviewFrom(['https://app.example.com'], true)).toBe(true);
  });
});

test.describe('resolvePreviewOrigins (runtime meta tag, env fallback)', () => {
  test('the injected meta tag wins over the build-time env value', () => {
    expect(resolvePreviewOrigins('https://editor.example.com', 'https://old.example.com')).toEqual(['https://editor.example.com']);
  });

  test('falls back to the env value when the tag is absent, empty or only has invalid entries', () => {
    expect(resolvePreviewOrigins(null, 'https://env.example.com')).toEqual(['https://env.example.com']);
    expect(resolvePreviewOrigins('', 'https://env.example.com')).toEqual(['https://env.example.com']);
    expect(resolvePreviewOrigins('null', 'https://env.example.com')).toEqual(['https://env.example.com']);
  });

  test('no tag and no env value: no origins', () => {
    expect(resolvePreviewOrigins(null, undefined)).toEqual([]);
    expect(resolvePreviewOrigins(undefined, '')).toEqual([]);
  });
});
