import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import macrosPlugin from 'vite-plugin-babel-macros';

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    build: {
      minify: 'esbuild',
    },
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
      logOverride: { 'this-is-undefined-in-esm': 'silent' }
    },
    plugins: [
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
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        injectRegister: null, // We register manually in index.html
        manifest: {
          name: 'Audio Tour Player by Superguided',
          short_name: 'Audio Tour',
          description: 'Explore rich history with immersive guided audio tours',
          theme_color: '#ffffff',
          background_color: '#f3f4f6',
          display: 'standalone',
          orientation: 'portrait',
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
        },
        injectManifest: {
          globPatterns: [
            '**/*.{js,css,html,ico,png,svg,woff2}',
            'data/tour/**/*.json' // Precache tour data for offline access
          ],
          globIgnores: ['**/node_modules/**/*'],
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
