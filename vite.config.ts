import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3040',
        changeOrigin: true,
      },
      '/c': {
        target: 'http://127.0.0.1:3040',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
          if (id.includes('lucide-react')) return 'vendor-lucide';
          if (id.includes('docx')) return 'vendor-docx';
          if (id.includes('leaflet')) return 'vendor-leaflet';
          if (id.includes('gsap') || id.includes('lenis')) return 'vendor-motion';
          if (id.includes('qrcode')) return 'vendor-qrcode';
          return 'vendor-misc';
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'Developer Sales OS',
        short_name: 'DevSalesOS',
        description: 'Dashboard performa CRM Developer Sales OS — PT Andara Rejo Makmur.',
        lang: 'id',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F5F2EB',
        theme_color: '#B45309',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/c\//],
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|webp|gif|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dsos-images-v1',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 14 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
});
