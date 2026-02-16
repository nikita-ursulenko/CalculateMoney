import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Beauty Balance',
        short_name: 'Beauty Balance',
        description: 'Финансовый трекер для мастеров бьюти-сферы',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'favicon/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'favicon/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
