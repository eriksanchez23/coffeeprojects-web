import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    // Defaults so modules that parse env at import time (src/lib/env.ts) load under test.
    env: { NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', NEXT_PUBLIC_SITE_ENV: 'development' },
  },
})
