import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

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
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['fonts/*.woff2', 'icons/*.svg', 'icons/*.png'],
        manifest: {
          name: 'Audio Tour Pro - Guided Historical Tours',
          short_name: 'AudioTour',
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
        workbox: {
          clientsClaim: true,
          skipWaiting: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              // App Shell - Cache First
              urlPattern: ({ url }) => url.origin === self.location.origin,
              handler: 'CacheFirst',
              options: {
                cacheName: 'app-shell',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
              }
            },
            {
              // Tour JSON Data - Network First
              urlPattern: /\/data\/tours\/.*\.json$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'tour-data',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                },
                networkTimeoutSeconds: 3
              }
            },
            {
              // Unsplash Images - Cache First
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'tour-images',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Google Fonts Stylesheets - Cache First
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            },
            {
              // Google Font Files - Cache First
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            },
            {
              // Supabase Audio Files - Cache First (for offline playback)
              urlPattern: ({ url }) => {
                return url.origin === 'https://ewrhpiibxstiipkqafwf.supabase.co' &&
                  url.pathname.includes('/storage/v1/object/public/') &&
                  (url.pathname.endsWith('.mp3') ||
                    url.pathname.endsWith('.wav') ||
                    url.pathname.endsWith('.m4a'));
              },
              handler: 'CacheFirst',
              options: {
                cacheName: 'tour-assets', // Same cache as download manager
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                },
                matchOptions: {
                  ignoreVary: true
                },
                rangeRequests: true // Enable range requests for audio seeking
              }
            },
            {
              // Supabase Images - Cache First (for offline viewing)
              urlPattern: ({ url }) => {
                return url.origin === 'https://ewrhpiibxstiipkqafwf.supabase.co' &&
                  url.pathname.includes('/storage/v1/object/public/') &&
                  (url.pathname.endsWith('.jpg') ||
                    url.pathname.endsWith('.jpeg') ||
                    url.pathname.endsWith('.png') ||
                    url.pathname.endsWith('.webp'));
              },
              handler: 'CacheFirst',
              options: {
                cacheName: 'tour-assets',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                },
                matchOptions: {
                  ignoreVary: true
                }
              }
            },
            {
              // Supabase Videos - Cache First (for offline viewing)
              urlPattern: ({ url }) => {
                return url.origin === 'https://ewrhpiibxstiipkqafwf.supabase.co' &&
                  url.pathname.includes('/storage/v1/object/public/') &&
                  (url.pathname.endsWith('.mp4') ||
                    url.pathname.endsWith('.webm'));
              },
              handler: 'CacheFirst',
              options: {
                cacheName: 'tour-assets',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                },
                matchOptions: {
                  ignoreVary: true
                },
                rangeRequests: true // Enable range requests for video seeking
              }
            },
            {
              // Supabase 3D Models - Cache First (for offline viewing)
              urlPattern: ({ url }) => {
                return url.origin === 'https://ewrhpiibxstiipkqafwf.supabase.co' &&
                  url.pathname.includes('/storage/v1/object/public/') &&
                  (url.pathname.endsWith('.glb') ||
                    url.pathname.endsWith('.gltf'));
              },
              handler: 'CacheFirst',
              options: {
                cacheName: 'tour-assets',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                },
                matchOptions: {
                  ignoreVary: true
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
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
