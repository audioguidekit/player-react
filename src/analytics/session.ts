/**
 * A random id for one visit. Lives in sessionStorage (so a reload keeps it and
 * a new tab or a closed browser starts a new one), falling back to memory when
 * storage is blocked. It is never written anywhere else: no cookie, no
 * localStorage, no install id, nothing derived from the device.
 */
const KEY = 'agk_sid';
let memoryId: string | null = null;

function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function getSessionId(): string {
  if (memoryId) return memoryId;
  try {
    const stored = sessionStorage.getItem(KEY);
    if (stored) return (memoryId = stored);
    memoryId = randomId();
    sessionStorage.setItem(KEY, memoryId);
  } catch {
    memoryId ??= randomId();
  }
  return memoryId;
}
