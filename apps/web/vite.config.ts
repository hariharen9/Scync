import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

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
  envDir: '../../',
  plugins: [
    tailwindcss(),
    react()
  ],
  define: {
    __APP_VERSION__: JSON.stringify(getVersion())
  }
})
