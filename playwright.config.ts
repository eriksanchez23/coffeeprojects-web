import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'

// Local runs read the same .env.local as the app (E2E credentials, site env). Never overrides real env vars (CI).
loadEnv({ path: '.env.local' })

// An empty E2E_BASE_URL (CI) means: start the local production server below.
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: 'tests/e2e',
  // Removes the contacts the suite submits, before and after the run (see tests/e2e/support/cleanup.ts).
  globalSetup: './tests/e2e/support/cleanup.ts',
  globalTeardown: './tests/e2e/support/cleanup.ts',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  // CI keeps a browsable HTML report (uploaded on failure) next to the console log.
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // CI builds in its own step; locally a missing server is built first.
        command: process.env.CI ? 'pnpm start' : 'pnpm build && pnpm start',
        url: baseURL,
        timeout: 300_000,
        reuseExistingServer: true,
      },
})
