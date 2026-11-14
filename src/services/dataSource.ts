/**
 * Where the player gets its tours, themes, UI text and app config from.
 * Fixed at BUILD time by VITE_DATA_SOURCE, so a build only ever contains the
 * code for its own source (the other is dead-code-eliminated):
 *
 *   compiled (default)  src/data/** is bundled into the app. What OSS
 *                       self-hosters get; nothing to configure.
 *   manifest            one generic build; /data/manifest.json is fetched at
 *                       startup. See docs/manifest-mode.md.
 */
export type DataSource = 'compiled' | 'manifest';

export const DATA_SOURCE: DataSource =
  import.meta.env.VITE_DATA_SOURCE === 'manifest' ? 'manifest' : 'compiled';
