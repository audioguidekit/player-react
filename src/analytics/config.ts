import type { AppConfig } from '@audioguidekit/schema';

export interface AnalyticsConfig {
  /** Where events go. Same-origin `/e` in manifest mode. */
  endpoint: string;
}

export interface ConfigInputs {
  dataSource: 'compiled' | 'manifest';
  /** VITE_ANALYTICS_ENDPOINT. */
  envEndpoint?: string;
  /** manifest.app, or app.json in a compiled build. */
  app?: Pick<AppConfig, 'analytics'>;
}

export const DEFAULT_ENDPOINT = '/e';

/**
 * True when the visitor asked not to be tracked: Global Privacy Control, or the
 * older Do Not Track signal. Either one means nothing is sent, ever.
 */
export function privacySignalOn(nav: Partial<Navigator> & { globalPrivacyControl?: boolean; msDoNotTrack?: string } = navigator): boolean {
  return nav.globalPrivacyControl === true || nav.doNotTrack === '1' || nav.doNotTrack === 'yes' || nav.msDoNotTrack === '1';
}

/**
 * The analytics configuration, or null when analytics is off.
 *
 *   manifest mode  on, endpoint `/e`, unless app.analytics is false
 *   compiled mode  off, unless VITE_ANALYTICS_ENDPOINT is set (and app.analytics is not false)
 */
export function resolveAnalyticsConfig({ dataSource, envEndpoint, app }: ConfigInputs): AnalyticsConfig | null {
  if (app?.analytics === false) return null;
  const custom = envEndpoint?.trim();
  if (dataSource === 'manifest') return { endpoint: custom || DEFAULT_ENDPOINT };
  return custom ? { endpoint: custom } : null;
}
