import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:4180', viewport: { width: 1366, height: 768 }, launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {} },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4180 --strictPort', url: 'http://127.0.0.1:4180', reuseExistingServer: false },
});
