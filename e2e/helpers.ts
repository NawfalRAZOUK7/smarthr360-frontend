import { type Page, expect } from "@playwright/test";

/** Seeded HR account (real backend) — falls back to demo/demo if login fails. */
export const HR_EMAIL = process.env.E2E_EMAIL ?? "hr@demo.smarthr360.dev";
export const HR_PASSWORD = process.env.E2E_PASSWORD ?? "Demo#2026!hr360";

/**
 * Log in through the UI. Tries the seeded HR account first; if the auth
 * service is down (or the account doesn't exist), falls back to the built-in
 * demo/demo account so the suite still exercises the UI on mock data.
 */
export async function login(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("you@company.com").fill(HR_EMAIL);
  await page.getByPlaceholder("••••••••").fill(HR_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Either we reach the dashboard, or login failed -> retry with demo/demo.
  const reached = await page
    .waitForURL("**/", { timeout: 8000 })
    .then(() => true)
    .catch(() => false);

  if (!reached || page.url().includes("/login")) {
    await page.getByPlaceholder("you@company.com").fill("demo");
    await page.getByPlaceholder("••••••••").fill("demo");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/", { timeout: 8000 });
  }

  await expect(page.getByText("Executive Dashboard")).toBeVisible();
}

/** Wait for either a success toast or an explicit text on the page. */
export async function expectToast(page: Page, text: RegExp | string) {
  await expect(page.getByText(text).first()).toBeVisible({ timeout: 10_000 });
}
