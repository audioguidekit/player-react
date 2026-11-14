import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DATA_SOURCE } from '../services/dataSource';
import { loadInitialData, applyManifest } from '../services/dataBootstrap';

/**
 * Startup shell: gets the data in, then mounts the app.
 *
 * It exists because the data may arrive over the network (manifest mode), and
 * everything else in the app assumes the data is already there. So the app —
 * the whole module graph that derives state from the data — is only imported
 * once the data is installed, and until then the visitor sees a loading screen,
 * or an error screen with a way to retry. The text here is English only: the
 * translations are part of the data it is waiting for.
 *
 * In a framed preview the shell can also wait for a host to send a manifest
 * (see services/previewBridge) instead of failing when none is served.
 */

type Phase =
  | { name: 'loading' }
  | { name: 'waiting-for-preview' }
  | { name: 'error'; kind: string; message: string }
  | { name: 'ready' };

const frame: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100dvh',
  padding: 24,
  boxSizing: 'border-box',
  fontFamily: '"Inter", sans-serif',
  color: '#666',
  textAlign: 'center',
};

const LoadingScreen: React.FC<{ label: string }> = ({ label }) => (
  <div style={frame} data-testid="boot-loading">
    <div>
      <style>{'@keyframes agk-boot-spin { to { transform: rotate(360deg); } }'}</style>
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #3498db',
          borderRadius: '50%',
          animation: 'agk-boot-spin 1s linear infinite',
          margin: '0 auto 16px',
        }}
      />
      <div>{label}</div>
    </div>
  </div>
);

const TITLES: Record<string, string> = {
  network: "This guide can't be opened right now",
  'unsupported-version': 'This guide needs a newer version of the app',
  invalid: "This guide's content is unreadable",
};

const HINTS: Record<string, string> = {
  network: 'Check your connection and try again. Once a guide has opened, it also works offline.',
  'unsupported-version': 'Reload the page to get the latest version. If it keeps happening, tell the guide’s owner.',
  invalid: 'Try again in a moment. If it keeps happening, tell the guide’s owner.',
};

const ErrorScreen: React.FC<{ kind: string; message: string; onRetry: () => void }> = ({ kind, message, onRetry }) => (
  <div style={frame} role="alert" data-testid="boot-error">
    <div style={{ maxWidth: 360 }}>
      <h1 style={{ margin: '0 0 8px', fontSize: 20, color: '#222' }}>{TITLES[kind] ?? TITLES.invalid}</h1>
      <p style={{ margin: '0 0 20px', lineHeight: 1.5 }}>{HINTS[kind] ?? HINTS.invalid}</p>
      <button
        type="button"
        onClick={onRetry}
        style={{
          padding: '10px 20px',
          border: 0,
          borderRadius: 999,
          background: '#222',
          color: '#fff',
          fontSize: 15,
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
      <p style={{ margin: '20px 0 0', fontSize: 12, color: '#999', wordBreak: 'break-word' }}>{message}</p>
    </div>
  </div>
);

export const BootApp: React.FC = () => {
  const [phase, setPhase] = useState<Phase>({ name: 'loading' });
  const [App, setApp] = useState<React.ComponentType | null>(null);
  // Bumped per live-preview manifest: remounts the app so every screen re-reads the data.
  const [version, setVersion] = useState(0);
  const started = useRef(false);
  // Set once a live-preview manifest is installed. The initial /data/manifest.json
  // fetch may still be in flight (agk:ready goes out before it settles); its result,
  // success or failure, must not touch what the host has shown since.
  const previewApplied = useRef(false);

  const showApp = useCallback(async () => {
    const { AppRoot } = await import('../AppRoot');
    setApp(() => AppRoot);
    setPhase({ name: 'ready' });
  }, []);

  const start = useCallback(async () => {
    setPhase({ name: 'loading' });
    try {
      const applied = await loadInitialData(() => previewApplied.current);
      if (applied) await showApp();
    } catch (error) {
      if (previewApplied.current) return; // the preview is on screen; the failed fetch is moot
      if (DATA_SOURCE === 'manifest') {
        const { canPreview } = await import('../services/previewBridge');
        if (canPreview()) {
          setPhase({ name: 'waiting-for-preview' });
          return;
        }
      }
      console.error('[Boot] startup failed:', error);
      setPhase({
        name: 'error',
        kind: (error as { kind?: string })?.kind ?? 'invalid',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }, [showApp]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
  }, [start]);

  // Manifest mode: accept whole manifests from an allowed parent page.
  useEffect(() => {
    if (DATA_SOURCE !== 'manifest') return;
    let stop = () => {};
    let cancelled = false;
    void import('../services/previewBridge').then(({ startPreviewBridge }) => {
      if (cancelled) return;
      stop = startPreviewBridge((manifest) => {
        previewApplied.current = true;
        applyManifest(manifest);
        setVersion((v) => v + 1);
        void showApp();
      });
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [showApp]);

  if (phase.name === 'ready' && App) return <React.Fragment key={version}><App /></React.Fragment>;
  if (phase.name === 'error') return <ErrorScreen kind={phase.kind} message={phase.message} onRetry={() => void start()} />;
  return <LoadingScreen label={phase.name === 'waiting-for-preview' ? 'Waiting for preview…' : 'Loading…'} />;
};
