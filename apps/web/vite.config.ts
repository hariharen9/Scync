import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

import { VitePWA } from 'vite-plugin-pwa'

const getVersion = () => {
  // 1. Check CI environment variables first (only official releases)
  const ciTag = process.env.GITHUB_REF_NAME || process.env.TAG || process.env.COMMIT_REF;
  if (ciTag && ciTag.startsWith('v') && /^\d+\.\d+\.\d+/.test(ciTag)) {
    return ciTag;
  }

  try {
    // 2. Try git describe with tags
    // --tags: include lightweight tags
    // --abbrev=0: no abbreviation, exact tag only
    const gitVersion = execSync('git describe --tags --abbrev=0').toString().trim();

    // Only return if it's a proper version tag (e.g., v1.0.0)
    if (/^v\d+\.\d+\.\d+/.test(gitVersion)) {
      return gitVersion;
    }
  } catch (e) {
    // No tags found, don't show version in dev builds
  }

  // Return empty string for dev builds - version will be hidden
  return '';
};

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
