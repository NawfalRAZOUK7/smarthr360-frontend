import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests run against a already-running app + backend.
 *
 *   BASE_URL   default http://localhost:3100  (the frontend)
 *   Backend    the tests log in via the UI using the seeded HR account
 *              (hr@demo.smarthr360.dev / Demo#2026!hr360) when a real
 *              backend is up; otherwise they fall back to demo/demo.
 *
 * Run:  npm run test:e2e         (headless)
 *       npm run test:e2e -- --ui (interactive)
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  // Chart-heavy pages (employees, wellbeing) can be slow to load on a busy
  // machine; a single worker avoids CPU contention and one retry absorbs
  // transient navigation timeouts.
  workers: 1,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3100",
    navigationTimeout: 45_000,
    actionTimeout: 15_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
