/**
 * Turning an untrusted value into a manifest the player can run. No
 * `import.meta.env` in here, so it runs in a plain unit test too.
 */
import { SCHEMA_VERSION, type Manifest, type CustomTheme } from '@audioguidekit/schema';

export type ManifestErrorKind =
  /** Could not fetch it and nothing is cached. */
  | 'network'
  /** Fetched, but not usable JSON, or not shaped like a manifest. */
  | 'invalid'
  /** A manifest from a different schemaVersion than this build understands. */
  | 'unsupported-version';

export class ManifestError extends Error {
  constructor(public readonly kind: ManifestErrorKind, message: string) {
    super(message);
    this.name = 'ManifestError';
  }
}

/**
 * Check that a parsed value is a manifest this build can run, and fill the
 * optional collections. Deliberately light: the full JSON Schema check
 * (`validateManifest`) belongs in the publisher; the player only needs to know
 * it will not crash on what it was given, and refuses a version it does not know.
 */
/**
 * Keep a tour the player can run, or drop it (with a console warning) rather than let
 * one broken tour take the whole app down at boot. A language file's `language` must
 * be its key in `languages`: the key is what the picker and the URL use, so it wins.
 */
function sanitizeTour(tour: unknown): Manifest['tours'] {
  const t = tour as Partial<Manifest['tours'][number]> | null;
  if (!t || typeof t !== 'object' || typeof t.id !== 'string' || !t.id) {
    console.warn('[Manifest] Skipping a tour without an id');
    return [];
  }
  if (!t.metadata || typeof t.metadata !== 'object' || Array.isArray(t.metadata)) {
    console.warn(`[Manifest] Skipping tour "${t.id}": it has no metadata`);
    return [];
  }
  const languages: Manifest['tours'][number]['languages'] = {};
  const source = t.languages && typeof t.languages === 'object' ? t.languages : {};
  for (const [key, file] of Object.entries(source)) {
    if (!file || typeof file !== 'object') {
      console.warn(`[Manifest] Tour "${t.id}": skipping language "${key}", it is not an object`);
      continue;
    }
    if (file.language !== key) {
      console.warn(`[Manifest] Tour "${t.id}": language file "${key}" says language "${file.language}"; using "${key}"`);
      languages[key] = { ...file, language: key };
    } else {
      languages[key] = file;
    }
  }
  return [{ ...(t as Manifest['tours'][number]), languages }];
}

export function parseManifest(value: unknown): Manifest {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ManifestError('invalid', 'The manifest is not a JSON object.');
  }
  const data = value as Partial<Manifest>;

  if (!Number.isInteger(data.schemaVersion)) {
    throw new ManifestError('invalid', 'The manifest has no schemaVersion.');
  }
  if (data.schemaVersion !== SCHEMA_VERSION) {
    throw new ManifestError(
      'unsupported-version',
      `The manifest is schema version ${data.schemaVersion}; this player understands version ${SCHEMA_VERSION}.`,
    );
  }
  if (!Array.isArray(data.tours)) {
    throw new ManifestError('invalid', 'The manifest has no tours list.');
  }

  return {
    schemaVersion: data.schemaVersion,
    app: data.app,
    // A theme without an id can't be referenced by a themeId (the compiled path drops it too).
    themes: (Array.isArray(data.themes) ? data.themes : []).filter((theme: CustomTheme) => {
      const keep = !!theme && typeof theme === 'object' && !!theme.id;
      if (!keep) console.warn('[Manifest] Skipping a theme without an id');
      return keep;
    }),
    ui: data.ui && typeof data.ui === 'object' ? data.ui : {},
    tours: data.tours.flatMap(sanitizeTour),
  };
}

