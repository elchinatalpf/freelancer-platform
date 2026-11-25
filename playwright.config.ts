// Browser tests against a production build. Not part of `pnpm check`.
// First run on a machine: pnpm exec playwright install chromium
import { defineConfig, devices } from "@playwright/test";

const PORT = "3100";
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: BASE_URL },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm build && pnpm start",
    url: `${BASE_URL}/api/health`,
    // These win over .env.local, which Next.js would otherwise supply.
    env: { APP_URL: BASE_URL, PORT },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000, // the build runs first
  },
});
