import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

import { VitePWA } from 'vite-plugin-pwa'

const getVersion = () => {
  // 1. Check CI environment variables first
  const ciTag = process.env.GITHUB_REF_NAME || process.env.TAG || process.env.COMMIT_REF;
  if (ciTag && ciTag.startsWith('v')) return ciTag;

  try {
    // 2. Try git describe with tags
    // --tags: include lightweight tags
    // --always: fallback to hash if no tags found
    // --abbrev=7: standard hash length
    const gitVersion = execSync('git describe --tags --always').toString().trim();

    // If it's just a hash, it means no tags were found (likely shallow clone)
    if (/^[0-9a-f]{7,}$/.test(gitVersion)) {
      return `v0.1.0-dev-${gitVersion.slice(0, 7)}`;
    }

    return gitVersion;
  } catch (e) {
    return 'v1.0.0-unknown';
  }
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
