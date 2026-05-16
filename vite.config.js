import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'BuildCRM - CRM Handlowca',
        short_name: 'BuildCRM',
        description: 'CRM dla handlowca budowlanego',
        theme_color: '#0B0F1A',
        background_color: '#0B0F1A',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'https://placehold.co/192x192/3B7EF6/white?text=CRM',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://placehold.co/512x512/3B7EF6/white?text=CRM',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})