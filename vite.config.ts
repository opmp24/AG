import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig(({ mode }) => {
    const base = mode === 'production' ? '/AG/' : '/';
    return {
        base,
        plugins: [
            react(),
            VitePWA({
                registerType: 'autoUpdate',
                injectRegister: 'auto',
                includeAssets: ['favicon.svg', 'icons/*.png'],
                manifest: {
                    name: 'Gastop - Control de Gastos',
                    short_name: 'Gastop',
                    description: 'Gestión y control de gastos del hogar con privacidad total',
                    theme_color: '#4ade80',
                    background_color: '#0f0f23',
                    display: 'standalone',
                    orientation: 'portrait-primary',
                    scope: base,
                    start_url: base,
                lang: 'es',
                categories: ['finance', 'utilities'],
                icons: [
                    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
                    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
                ],
                shortcuts: [
                    {
                        name: 'Agregar Gasto',
                        short_name: 'Gasto',
                        description: 'Registrar un nuevo gasto',
                        url: '/?action=add',
                        icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }]
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                            cacheableResponse: { statuses: [0, 200] }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                            cacheableResponse: { statuses: [0, 200] }
                        }
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    server: {
        port: 3000,
        host: true
    }
};
});
