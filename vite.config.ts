import { defineConfig } from 'vite'

import { foldkit } from '@foldkit/vite-plugin'

// The backend only allows this origin (CORS_ALLOWED_ORIGINS), so the dev and
// preview servers fail instead of silently moving to another port.
const origin = { host: 'localhost', port: 5173, strictPort: true }

export default defineConfig({
  plugins: [foldkit()],
  server: origin,
  preview: origin,
  optimizeDeps: {
    entries: ['src/entry.ts'],
  },
})
