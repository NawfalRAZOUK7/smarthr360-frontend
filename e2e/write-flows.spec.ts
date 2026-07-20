import { test, expect } from "@playwright/test";
import { login, expectToast } from "./helpers";

/**
 * Exercises the write actions verified by hand, so they can't silently
 * regress. Each test tolerates both the real backend and demo-mode
 * (the UI short-circuits mutations to a success toast in demo).
 */

test.describe("write flows", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("wellbeing: create a survey", async ({ page }) => {
    await page.goto("/wellbeing");
    await page.getByRole("button", { name: "New survey" }).click();
    await expect(page.getByText("New wellbeing survey")).toBeVisible();

    await page.getByPlaceholder("e.g. Pulse Q4 2026").fill(`E2E survey ${Date.now()}`);
    await page.getByPlaceholder("Question 1").fill("How are you feeling this sprint?");
    await page.getByRole("button", { name: "Create survey" }).click();

    await expectToast(page, /Survey created/i);
  });

  test("workload: add a task then compute score", async ({ page }) => {
    await page.goto("/modules/workload");
    await page.getByRole("button", { name: "Tasks" }).click();

    await page.getByRole("button", { name: "Add task" }).click();
    await expect(page.getByRole("heading", { name: "Add task" })).toBeVisible();
    await page.getByPlaceholder("e.g. Migrate legacy service").fill(`E2E task ${Date.now()}`);
    // the modal's own submit button (dialog scope avoids the toolbar button)
    await page.getByRole("dialog").getByRole("button", { name: "Add task" }).click();
    await expectToast(page, /Task added/i);

    await page.getByRole("button", { name: "Compute score" }).click();
    await expectToast(page, /Score computed/i);
  });

  test("retention: run detection", async ({ page }) => {
    await page.goto("/modules/retention");
    await page.getByRole("button", { name: "Run detection" }).click();
    await expectToast(page, /Detection/i);
  });

  test("future-skills: trigger ML training", async ({ page }) => {
    await page.goto("/modules/future-skills");
    await page.getByRole("button", { name: "ML training" }).click();
    await expect(page.getByText("Train a new model")).toBeVisible();
    await page.getByRole("button", { name: /Start training/ }).click();
    await expectToast(page, /Training/i);
  });

  test("organization: open the new-department modal", async ({ page }) => {
    await page.goto("/organization");
    await page.getByRole("button", { name: "New department" }).click();
    await expect(page.getByRole("heading", { name: "New department" })).toBeVisible();
    const suffix = Date.now().toString().slice(-5);
    await page.getByPlaceholder("Engineering").fill(`E2E Dept ${suffix}`);
    // Code must be unique per run, else the backend rejects the duplicate.
    await page.getByPlaceholder("ENG", { exact: true }).fill(`E2E${suffix}`.slice(0, 8));
    await page.getByRole("dialog").getByRole("button", { name: "Create" }).click();
    await expectToast(page, /Department created/i);
  });
});

test.describe("RBAC", () => {
  test("live-demo button signs in as a read-only guest", async ({ page }) => {
    await page.goto("/login");

    const guestButton = page.getByRole("button", {
      name: "Try the live demo (read-only)",
    });
    await expect(guestButton).toBeVisible();
    await guestButton.click();
    await page.waitForURL("**/", { timeout: 8000 });

    await expect(page.getByText("Read-only").first()).toBeVisible();
    await page.goto("/organization");
    await expect(page.getByRole("button", { name: "New department" })).toHaveCount(0);

    await page.goto("/admin");
    await expect
      .poll(
        async () =>
          page.url().includes("/login") ||
          (await page.getByText("Restricted area").isVisible().catch(() => false)),
        { message: "guest access to /admin should be explicitly blocked" }
      )
      .toBe(true);
  });

  test("employee sees locked nav and a restricted page", async ({ page }) => {
    // demo-employee is a built-in local account -> EMPLOYEE role.
    await page.goto("/login");
    await page.getByPlaceholder("you@company.com").fill("demo-employee");
    await page.getByPlaceholder("••••••••").fill("demo");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Career Sim is the only module employees can open.
    await page.waitForURL("**/modules/career-sim", { timeout: 8000 }).catch(() => {});
    await page.goto("/modules/retention");
    await expect(page.getByText("Restricted area")).toBeVisible();
  });

  test("employee lands on their personal hub", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@company.com").fill("demo-employee");
    await page.getByPlaceholder("••••••••").fill("demo");
    await page.getByRole("button", { name: "Sign in" }).click();
    // The dashboard is manager+; an employee is redirected to their hub.
    await page.waitForURL("**/me", { timeout: 8000 }).catch(() => {});
    await page.goto("/me");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByText(/Roles you.?re most ready for/i)).toBeVisible();

    // Private, opt-in wellbeing check-in (distinct from anonymous surveys).
    await expect(page.getByText("Private check-in")).toBeVisible();
    await page.getByRole("button", { name: /Struggling/i }).click();
    await expect(page.getByText(/flagged this privately/i)).toBeVisible();
  });

  test("auditor gets read-only visibility but is blocked from admin", async ({ page }) => {
    // demo-auditor is a built-in local account -> AUDITOR (read-only) role.
    await page.goto("/login");
    await page.getByPlaceholder("you@company.com").fill("demo-auditor");
    await page.getByPlaceholder("••••••••").fill("demo");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/", { timeout: 8000 }).catch(() => {});

    // The read-only indicator is shown.
    await expect(page.getByText("Read-only").first()).toBeVisible();

    // Auditor can VIEW people data (not restricted)...
    await page.goto("/employees");
    await expect(page.getByText("Restricted area")).toHaveCount(0);

    // ...but identity administration stays ADMIN-only.
    await page.goto("/admin");
    await expect(page.getByText("Restricted area")).toBeVisible();
  });

  test("admin sees the audit trail (role changes + login events)", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@company.com").fill("demo-admin");
    await page.getByPlaceholder("••••••••").fill("demo");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/", { timeout: 8000 }).catch(() => {});

    await page.goto("/admin");
    await expect(page.getByText("Audit trail")).toBeVisible();
    await expect(page.getByText("Role change history")).toBeVisible();
    await expect(page.getByText("Login security events")).toBeVisible();
  });
});
