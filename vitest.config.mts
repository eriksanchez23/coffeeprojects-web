import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  // `server-only` throws unless resolved with the react-server condition (as Next.js does for server code).
  // Tests run server modules directly, so resolve it to the package's empty server entry.
  resolve: { alias: { 'server-only': fileURLToPath(new URL('./node_modules/server-only/empty.js', import.meta.url)) } },
  test: {
    environment: 'node',
    server: { deps: { inline: ['next-intl'] } },
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    // Defaults so modules that parse env at import time (src/lib/env.ts) load under test.
    env: { NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', NEXT_PUBLIC_SITE_ENV: 'development' },
  },
})
