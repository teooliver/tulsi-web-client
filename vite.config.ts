import type { IncomingMessage } from 'node:http'

import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const backendUrl = process.env.API_PROXY_TARGET ?? 'http://localhost:8080'

// Backend API roots that should be forwarded to the API server in dev.
const apiRoots = ['/auth', '/boards', '/labels', '/plans', '/projects', '/tasks', '/users']

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
  server: {
    proxy: Object.fromEntries(
      apiRoots.map((root) => [
        root,
        {
          target: backendUrl,
          changeOrigin: true,
          // Some API roots (e.g. /tasks) share a path with a frontend page
          // route. Don't proxy browser page navigations to the backend —
          // only actual API/fetch calls, which never ask for text/html.
          bypass: (req: IncomingMessage) =>
            req.headers.accept?.includes('text/html') ? req.url : undefined,
        },
      ]),
    ),
  },
})

export default config
