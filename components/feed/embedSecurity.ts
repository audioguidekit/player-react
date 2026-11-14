/**
 * What an embed stop may put in an iframe. The URL comes from content authors
 * (a hosted-editor user, or a manifest from anywhere), and an iframe given
 * `allow-scripts allow-same-origin` runs with its page's origin, so a `javascript:`
 * URL, or an uploaded HTML/SVG under the player's own /media/ origin, would run as the player.
 */

export interface EmbedFrame {
  /** The type the embed is framed as: a `youtube` or `spotify` embed on another host is `generic`. */
  type: string;
  src: string;
  sandbox: string;
}

/**
 * `allow-same-origin` here only lets the embed use ITS OWN storage and cookies (it is
 * cross-origin to the player, which is enforced below), and the YouTube and Spotify
 * players do need that to work. A generic embed gets none of it: scripts only.
 */
const SANDBOX: Record<string, string> = {
  youtube: 'allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox',
  spotify: 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox',
  video: 'allow-scripts allow-same-origin allow-presentation',
  generic: 'allow-scripts',
};

/**
 * What to do with an embed: frame it, show a notice in its place (the app's allowlist does not
 * include its website), or show nothing (a URL that must never be framed).
 */
export type EmbedResolution =
  | { kind: 'frame'; frame: EmbedFrame }
  | { kind: 'blocked' }
  | { kind: 'invalid' };

/**
 * Is `hostname` on the app's embed allowlist (`app.embedAllowlist`)? An entry is a hostname, matched
 * exactly, or `*.example.org`, which matches every subdomain but not `example.org` itself. Case and a
 * trailing dot do not matter. No list, or an empty one, means no limit.
 */
export function isEmbedHostAllowed(hostname: string, allowlist: readonly string[] | undefined): boolean {
  const entries = (allowlist ?? []).map((entry) => entry.trim().toLowerCase().replace(/\.$/, '')).filter(Boolean);
  if (entries.length === 0) return true;
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return entries.some((entry) =>
    entry.startsWith('*.') ? host.endsWith(entry.slice(1)) && host.length > entry.length - 1 : host === entry,
  );
}

/** Hosts a `youtube` embed may come from (https only). Others are downgraded to generic. */
const YOUTUBE_HOSTS: readonly string[] = ['youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'];
/** Hosts a `spotify` embed may come from (https only). */
const SPOTIFY_HOSTS: readonly string[] = ['open.spotify.com'];

/**
 * The embed rules in one place: https only, never the player's own origin, and the app's host
 * allowlist for every embed type. `youtube` and `spotify` embeds get their more permissive sandbox
 * only from their own hosts; on any other host they are treated as generic (scripts-only sandbox).
 * YouTube is always framed from `www.youtube-nocookie.com`.
 */
export function resolveEmbed(
  embedUrl: string,
  embedType: string | undefined,
  playerOrigin: string,
  allowlist?: readonly string[],
): EmbedResolution {
  let url: URL;
  try {
    url = new URL(embedUrl);
  } catch {
    return { kind: 'invalid' }; // relative, empty or malformed
  }
  if (url.protocol !== 'https:') return { kind: 'invalid' }; // javascript:, data:, blob:, http:
  if (url.origin === playerOrigin) return { kind: 'invalid' }; // would run as the player

  // Types with a sandbox of their own are the known players; anything else is framed as generic.
  let type = embedType !== undefined && Object.hasOwn(SANDBOX, embedType) ? embedType : 'generic';
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (type === 'youtube' && !YOUTUBE_HOSTS.includes(host)) type = 'generic';
  if (type === 'spotify' && !SPOTIFY_HOSTS.includes(host)) type = 'generic';

  if (!isEmbedHostAllowed(host, allowlist)) return { kind: 'blocked' };

  if (type === 'youtube') url.hostname = 'www.youtube-nocookie.com'; // privacy-enhanced mode
  return { kind: 'frame', frame: { type, src: url.href, sandbox: SANDBOX[type] } };
}

/** The iframe source and sandbox for an embed, or `null` when it must not be framed (for any reason). */
export function resolveEmbedFrame(
  embedUrl: string,
  embedType: string | undefined,
  playerOrigin: string,
  allowlist?: readonly string[],
): EmbedFrame | null {
  const result = resolveEmbed(embedUrl, embedType, playerOrigin, allowlist);
  return result.kind === 'frame' ? result.frame : null;
}
