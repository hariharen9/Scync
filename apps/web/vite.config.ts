import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

import { VitePWA } from 'vite-plugin-pwa'

const getVersion = () => {
  try {
    const gitVersion = execSync('git describe --tags --long --abbrev=5 --always').toString().trim()
    // Format: v0.1.0-2-g99870 -> v0.1.0-2-99870
    return gitVersion.replace(/-g([0-9a-f]{5,})$/, '-$1')
  } catch (e) {
    return 'v0.0.0-unknown'
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  envDir: '../../',
  build: {
    modulePreload: {
      polyfill: false
    }
  },
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.png'],
      manifest: {
        name: 'Scync',
        short_name: 'Scync',
        description: 'Zero-Knowledge Secrets Manager for Developers',
        theme_color: '#060606',
        background_color: '#060606',
        display: 'standalone',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(getVersion())
  }
})
