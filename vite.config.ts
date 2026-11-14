import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA, type ManifestOptions } from 'vite-plugin-pwa';
import macrosPlugin from 'vite-plugin-babel-macros';

// Sync tour data from src to public for test HTTP access
function syncTourDataPlugin(): Plugin {
  const srcDir = 'src/data/tour';
  const destDir = 'public/data/tour';

  // Recursively walk srcDir (tours now live in per-tour subfolders, e.g.
  // src/data/tour/<tourId>/metadata.json) and mirror the structure into destDir.
  function syncDir(srcRoot: string, destRoot: string) {
    for (const entry of fs.readdirSync(srcRoot, { withFileTypes: true })) {
      // Hidden fixture tours (id/dir prefixed "_") are loaded by the app from the
      // build-time glob in dev/test only; they never need static HTTP copies, so
      // keep them out of public/ and dist/ entirely.
      if (entry.isDirectory() && entry.name.startsWith('_')) continue;
      const src = path.join(srcRoot, entry.name);
      const dest = path.join(destRoot, entry.name);
      if (entry.isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        syncDir(src, dest);
      } else if (entry.name.endsWith('.json')) {
        // The public copy lives deeper than src, so rewrite the editor-only
        // `$schema` hint to keep it resolving to packages/schema/src/schemas/*.
        const content = fs.readFileSync(src, 'utf8').replace(/"(\.\.\/)+packages\/schema\/src\/schemas\//g, '"../../../packages/schema/src/schemas/');
        fs.writeFileSync(dest, content);
      } else if (entry.name.endsWith('.geojson')) {
        fs.copyFileSync(src, dest);
      }
    }
  }

  // Mirror a single tour folder's data files flat into destRoot (no subfolder).
  function syncTourFlat(tourDir: string, destRoot: string) {
    for (const file of fs.readdirSync(tourDir)) {
      const src = path.join(tourDir, file);
      const dest = path.join(destRoot, file);
      if (file.endsWith('.json')) {
        const content = fs.readFileSync(src, 'utf8').replace(/"(\.\.\/)+schema\//g, '"../../../src/schema/');
        fs.writeFileSync(dest, content);
      } else if (file.endsWith('.geojson')) {
        fs.copyFileSync(src, dest);
      }
    }
  }

  function syncFiles() {
    if (!fs.existsSync(srcDir)) return;
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    // Mirror every per-tour subfolder into public/data/tour/<tourId>/.
    syncDir(srcDir, destDir);

    // Also emit a flat copy of the default (first, alphabetically — matching
    // Vite's import.meta.glob ordering) tour at the public root, so the legacy
    // /data/tour/metadata.json paths used by the Playwright HTTP tests keep
    // resolving to the default tour.
    const tourDirs = fs.readdirSync(srcDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && !e.name.startsWith('_')) // skip hidden fixture tours
      .map(e => e.name)
      .sort();
    if (tourDirs.length > 0) {
      syncTourFlat(path.join(srcDir, tourDirs[0]), destDir);
    }
  }

  return {
    name: 'sync-tour-data',
    buildStart() {
      syncFiles();
    },
    handleHotUpdate({ file }) {
      if (file.includes('src/data/tour') && (file.endsWith('.json') || file.endsWith('.geojson'))) {
        syncFiles();
      }
    }
  };
}

// React Grab plugin - injects client scripts when enabled
function reactGrabPlugin(): Plugin {
  let enabled = false;

  return {
    name: 'react-grab-inject',
    configResolved() {
      try {
        const envFile = fs.readFileSync('.env', 'utf8');
        enabled = envFile.includes('REACT_GRAB=true');
      } catch {
        enabled = false;
      }
    },
    transformIndexHtml(html) {
      if (!enabled) return html;

      const script = `
    <script type="module">
      import("react-grab");
      import("@react-grab/claude-code/client");
    </script>`;

      return html.replace('<head>', '<head>' + script);
    }
  };
}

/**
 * The app's own identity for the PWA manifest, from src/data/tour/app.json.
 *
 * Read at build time because the manifest is generated at build time. Without
 * it every deployment installs itself on a phone's home screen as
 * "AudioGuideKit", which is right for exactly one of them. Absent file or
 * absent field falls back to the defaults below, so nothing changes for anyone
 * who never sets it.
 */
function appIdentity(): Record<string, string | undefined> {
  try {
    const raw = fs.readFileSync(path.resolve(__dirname, 'src/data/tour/app.json'), 'utf8');
    const config = JSON.parse(raw);
    return {
      name: config.name,
      short_name: config.shortName ?? config.name,
      description: config.description,
      theme_color: config.themeColor,
      background_color: config.backgroundColor,
      display: config.display,
      orientation: config.orientation,
      icon: config.icon,
    };
  } catch {
    return {};
  }
}

/**
 * The same identity, in index.html.
 *
 * The manifest is only half of it: the browser tab, the address-bar colour and
 * the name iOS writes under the home-screen icon all come from the HTML head,
 * which used to say "AudioGuideKit" no matter what app.json said — so the
 * editor's "these take effect after you publish" was only half true.
 *
 * Replacements, not a template, so index.html stays a valid page on its own and
 * a deployment that sets nothing is byte-identical to before.
 */
function appIdentityHtml(): Plugin {
  const escape = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  return {
    name: 'app-identity-html',
    // `pre`: VitePWA also rewrites the head, and this only touches tags it owns.
    enforce: 'pre',
    transformIndexHtml(html) {
      const app = appIdentity();

      const replace = (pattern: RegExp, build: (value: string) => string, value?: string) => {
        // `$$` because the result is a replacement *string*: a `$&` in
        // someone's app name would otherwise splice the match back in.
        if (value) html = html.replace(pattern, build(escape(value).replace(/\$/g, '$$$$')));
      };

      replace(/<title>[^<]*<\/title>/, (v) => `<title>${v}</title>`, app.name);
      replace(
        /(<meta name="apple-mobile-web-app-title" content=")[^"]*"/,
        (v) => `$1${v}"`,
        app.short_name,
      );
      // `\s+`, not a literal space: index.html breaks this tag across lines.
      replace(/(<meta\s+name="description"\s+content=")[^"]*"/, (v) => `$1${v}"`, app.description);
      replace(/(<meta name="theme-color" content=")[^"]*"/, (v) => `$1${v}"`, app.theme_color);

      // A PNG source leaves public/favicon.svg as whatever it was, so point the
      // tab at the 32px file the icon upload just wrote instead.
      if (app.icon && !app.icon.endsWith('.svg')) {
        html = html.replace(
          /<link rel="icon" type="image\/svg\+xml" href="\/favicon.svg" \/>/,
          '<link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />',
        );
      }

      return html;
    },
  };
}

/**
 * Manifest mode (VITE_DATA_SOURCE=manifest): one generic build that fetches
 * /data/manifest.json at runtime instead of compiling src/data/** in. Nothing
 * tenant-specific may end up in the build, so the identity plugins and the
 * data sync are off, and the PWA manifest and icons are left to the host.
 * See docs/manifest-mode.md.
 */
/**
 * Manifest mode generates no web app manifest (the host serves it), so
 * vite-plugin-pwa adds no link either. Add it here; compiled builds get theirs from the plugin.
 */
function manifestModeLink(): Plugin {
  return {
    name: 'manifest-mode-link',
    transformIndexHtml: () => [
      { tag: 'link', attrs: { rel: 'manifest', href: '/manifest.webmanifest' }, injectTo: 'head' },
    ],
  };
}

function devWebManifest(manifest: Partial<ManifestOptions>): Plugin {
  return {
    name: 'dev-web-manifest',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/manifest.webmanifest', (_req, res) => {
        res.setHeader('Content-Type', 'application/manifest+json');
        res.end(JSON.stringify(manifest));
      });
    },
    transformIndexHtml: () => [
      { tag: 'link', attrs: { rel: 'manifest', href: '/manifest.webmanifest' }, injectTo: 'head' },
    ],
  };
}

function manifestModeCleanup(): Plugin {
  let outDir = 'dist';
  return {
    name: 'manifest-mode-cleanup',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    // public/data/tour is a stale dev mirror of src/data (gitignored); it must
    // never ride along into a build that promises to contain no tour data.
    closeBundle() {
      const data = path.join(outDir, 'data');
      fs.rmSync(path.join(data, 'tour'), { recursive: true, force: true });
      if (fs.existsSync(data) && fs.readdirSync(data).length === 0) fs.rmdirSync(data);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';
  const manifestMode = env.VITE_DATA_SOURCE === 'manifest';

  // The web app manifest the build emits (vite-plugin-pwa). The dev server serves the same
  // object at /manifest.webmanifest (see devWebManifest), so dev and the Playwright suite see
  // the installable manifest the build ships.
  const webManifest: Partial<ManifestOptions> | null = manifestMode ? null : {
    name: 'AudioGuideKit',
    short_name: 'AudioGuideKit',
    description: 'Open source audio guide player',
    theme_color: '#ffffff',
    background_color: '#f3f4f6',
    display: 'standalone',
    orientation: 'portrait',
    // Anything set in app.json wins over the defaults above. `icon` is
    // not a manifest field — it only records what the icons were made
    // from, for the editor.
    ...Object.fromEntries(
      Object.entries(appIdentity()).filter(([k, v]) => k !== 'icon' && v != null && v !== ''),
    ),
    scope: '/',
    start_url: '/',
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png'
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png'
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png'
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png'
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png'
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    optimizeDeps: {
      include: ['web-haptics/react'],
    },
    build: {
      minify: 'esbuild',
    },
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
      logOverride: { 'this-is-undefined-in-esm': 'silent' }
    },
    plugins: [
      // HTTPS by default (self-signed, for PWA/geolocation). Set HTTP=1 to serve
      // plain HTTP — useful for previewing on mobile browsers that refuse the
      // self-signed cert (e.g. Arc): `HTTP=1 bun run dev`.
      ...(process.env.HTTP ? [] : [basicSsl()]),
      // Treat .geojson files as JSON modules (Vite only handles .json by default)
      {
        name: 'vite-plugin-geojson',
        transform(src: string, id: string) {
          if (id.endsWith('.geojson')) {
            return { code: `export default ${src}`, map: null };
          }
        },
      } satisfies Plugin,
      ...(manifestMode ? [manifestModeCleanup(), manifestModeLink()] : [syncTourDataPlugin()]),
      reactGrabPlugin(),
      react({
        babel: {
          plugins: [
            'babel-plugin-macros',
            ['babel-plugin-styled-components', {
              displayName: true,
              fileName: true,
            }],
          ],
        },
      }),
      macrosPlugin(),
      // Manifest mode takes the identity from the manifest at runtime instead.
      ...(manifestMode ? [] : [appIdentityHtml()]),
      // Dev only: serve the manifest and link it (vite-plugin-pwa does neither in dev, and the
      // SPA fallback would answer /manifest.webmanifest with index.html).
      ...(webManifest ? [devWebManifest(webManifest)] : []),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        injectRegister: null, // We register manually in index.html
        // Manifest mode: no web app manifest is generated. index.html links
        // /manifest.webmanifest and the host serves it, generated from the
        // data's `app` block, so no tenant name or icon is baked into the build.
        manifest: webManifest ?? false,
        injectManifest: {
          globPatterns: [
            '**/*.{js,css,html,ico,png,svg}'
            // Fonts (woff2) are not precached: there are ~60 files and a page uses a few.
            // The same-origin app-shell route caches the ones it actually loads.
            // Tour data is bundled via import.meta.glob, not served as static files
          ],
          globIgnores: [
            '**/node_modules/**/*',
            // Host-served identity (manifest mode): precaching the neutral
            // fallbacks would pin them over the tenant's own icons forever.
            ...(manifestMode
              ? ['icons/**', 'apple-touch-icon.png', 'favicon.svg', 'manifest.webmanifest', 'data/**']
              : []),
          ],
        }
      })
    ],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, '.') },
        // Read the schema package from source, so dev and build need no `dist` build.
        { find: /^@audioguidekit\/schema\/fields$/, replacement: path.resolve(__dirname, 'packages/schema/src/fields/index.ts') },
        { find: /^@audioguidekit\/schema$/, replacement: path.resolve(__dirname, 'packages/schema/src/index.ts') },
      ]
    }
  };
});
