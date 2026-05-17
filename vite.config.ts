import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-icon-512.png'],
      manifest: {
        name: 'MovelaSystem',
        short_name: 'MovelaSystem',
        description: 'Sistema de Gerenciamento para Movelaria',
        theme_color: '#f59e0b',
        background_color: '#0c0a09',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-icon-512.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
