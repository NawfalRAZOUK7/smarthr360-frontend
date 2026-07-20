import { test, expect } from "@playwright/test";
import { login, expectToast } from "./helpers";

/**
 * Covers the second batch of features: org-chart + CSV export, reviews
 * write forms, policy simulate, and career-sim profile/history.
 */

test.describe("extended features", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("rbac: Users & Roles is now ADMIN-only (HR is blocked)", async ({ page }) => {
    // Identity/role management is ADMIN-only (separation of duties); the
    // signed-in HR user must hit the restricted state, not the admin page.
    await page.goto("/admin");
    await expect(page.getByText("Restricted area")).toBeVisible();
    await expect(page.getByText(/requires a/i)).toBeVisible();
  });

  test("global search palette opens and responds", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search" }).click();
    const input = page.getByPlaceholder("Search people, skills, departments…");
    await expect(input).toBeVisible();
    await expect(page.getByText(/Type at least 2 characters/i)).toBeVisible();
    // Typing ≥2 chars dismisses the hint (results / no-match / loading take over).
    await input.fill("eng");
    await expect(page.getByText(/Type at least 2 characters/i)).toHaveCount(0);
  });

  test("action center aggregates pending items across modules", async ({ page }) => {
    await page.goto("/actions");
    // Topbar + page both title "Action Center" — scope to the page body.
    await expect(page.getByRole("main").getByRole("heading", { name: "Action Center" })).toBeVisible();
    await expect(page.getByText(/Everything waiting on you/i)).toBeVisible();
    // Either a prioritized summary of items, or the caught-up empty state.
    await expect(
      page.getByText(/need your attention|You're all caught up/i).first()
    ).toBeVisible();
  });

  test("notification center opens and marks all notifications read", async ({ page }) => {
    await page.goto("/");

    const bell = page.getByRole("button", { name: "Notifications", exact: true });
    await expect(bell).toBeVisible();
    await bell.click();

    const panel = page.locator("#notification-center");
    await expect(panel).toBeVisible();
    await expect(
      panel.getByRole("heading", { name: "Notification center", exact: true })
    ).toBeVisible();

    const markAll = panel.getByRole("button", { name: "Mark all read", exact: true });
    await expect(markAll).toBeVisible();
    if (await markAll.isEnabled()) {
      await markAll.click();
      await expect(markAll).toBeDisabled();
    } else {
      // Real seeded environments may legitimately begin with no unread items.
      await expect(panel.getByText("You're all caught up", { exact: true })).toBeVisible();
    }
  });

  test("employees: org-chart view renders", async ({ page }) => {
    await page.goto("/employees");
    await page.getByRole("button", { name: "Org chart" }).click();
    await expect(page.getByText(/Reporting structure/i)).toBeVisible();
  });

  test("reviews: open the new-goal modal", async ({ page }) => {
    await page.goto("/reviews");
    await page.getByRole("button", { name: "Goals" }).click();
    await page.getByRole("button", { name: "New goal" }).click();
    await expect(page.getByRole("heading", { name: "New goal" })).toBeVisible();
    await page.getByPlaceholder("e.g. Reach Lead readiness 80%").fill(`E2E goal ${Date.now()}`);
    await page.getByRole("dialog").getByRole("button", { name: "Create" }).click();
    await expectToast(page, /Goal created/i);
  });

  test("policy-gen: simulate a single policy", async ({ page }) => {
    await page.goto("/modules/policy-gen");
    await page.getByRole("button", { name: "Simulate" }).click();
    await expect(page.getByText("Simulate a single policy")).toBeVisible();
    await page.getByRole("button", { name: "Simulate", exact: true }).last().click();
    await expect(page.getByText(/Turnover/i).first()).toBeVisible();
  });

  test("policy-gen: apply a policy then record its real outcome", async ({ page }) => {
    await page.goto("/modules/policy-gen");
    await page.getByRole("button", { name: "Simulate" }).click();
    await expect(page.getByText("Simulate a single policy")).toBeVisible();
    await expect(page.getByText(/Applied policies/i)).toBeVisible();

    // Run a simulation, then apply it — this persists a trackable applied policy.
    await page.getByRole("button", { name: "Simulate", exact: true }).last().click();
    await page.getByRole("button", { name: /Apply this policy/i }).click();
    await expectToast(page, /Applied/i);

    // The newest applied policy is untracked -> record its real outcome.
    await page.getByRole("button", { name: "Record outcome" }).first().click();
    await expect(page.getByRole("heading", { name: "Record real outcome" })).toBeVisible();
    await page.getByPlaceholder("e.g. -2.1").fill("-2.4");
    await page.getByRole("dialog").getByRole("button", { name: /Save outcome/i }).click();
    await expectToast(page, /Outcome recorded/i);
  });

  test("policy-gen: outcomes dashboard aggregates delivery", async ({ page }) => {
    await page.goto("/modules/policy-gen");
    await page.getByRole("button", { name: "Outcomes" }).click();
    await expect(page.getByText(/Did policies deliver/i)).toBeVisible();
    await expect(page.getByText("Delivered rate")).toBeVisible();
  });

  test("career-sim: mobility tab ranks reachable roles", async ({ page }) => {
    await page.goto("/modules/career-sim");
    await page.getByRole("button", { name: "Mobility" }).click();
    await expect(page.getByText(/Roles you.?re most ready for/i)).toBeVisible();
  });

  test("career-sim: succession tab shows critical-role coverage", async ({ page }) => {
    await page.goto("/modules/career-sim");
    await page.getByRole("button", { name: "Succession" }).click();
    await expect(page.getByText(/Critical-role coverage/i)).toBeVisible();
  });

  test("career-sim: profile and history tabs render", async ({ page }) => {
    await page.goto("/modules/career-sim");
    await page.getByRole("button", { name: "My profile" }).click();
    await expect(page.getByRole("heading", { name: "Competencies" })).toBeVisible();
    await page.getByRole("button", { name: "History" }).click();
    await expect(page.getByText(/Target position|No simulations/i).first()).toBeVisible();
  });

  test("organization: skill matrix heatmap renders", async ({ page }) => {
    await page.goto("/organization");
    await page.getByRole("button", { name: "Skill matrix" }).click();
    await expect(page.getByText(/skill\s+coverage/i)).toBeVisible();
  });

  test("settings: 2FA setup and danger zone are present", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText("Two-factor authentication")).toBeVisible();
    await expect(page.getByText("Danger zone")).toBeVisible();
    await expect(page.getByRole("button", { name: "Set up 2FA" })).toBeVisible();
  });

  test("skill-gaps: training plan section renders", async ({ page }) => {
    await page.goto("/skill-gaps");
    await expect(page.getByText("Training plan")).toBeVisible();
    await expect(page.getByRole("button", { name: "New action" })).toBeVisible();
  });

  test("skill-gaps: training action can be linked to a goal", async ({ page }) => {
    await page.goto("/skill-gaps");
    await page.getByRole("button", { name: "New action" }).click();
    await expect(page.getByRole("dialog").getByLabel("Link to goal")).toBeVisible();
  });

  test("retention: cost-of-attrition ROI panel renders", async ({ page }) => {
    await page.goto("/modules/retention");
    await expect(page.getByText(/Cost of attrition/i)).toBeVisible();
    await expect(page.getByText("Risk exposure", { exact: true })).toBeVisible();
    await expect(page.getByText("Realized savings", { exact: true })).toBeVisible();
  });

  test("workload: import-tasks modal validates rows", async ({ page }) => {
    await page.goto("/modules/workload");
    await page.getByRole("button", { name: "Tasks" }).click();
    await page.getByRole("button", { name: "Import tasks" }).click();
    await expect(page.getByRole("heading", { name: "Import tasks" })).toBeVisible();
    await page.getByPlaceholder(/Ship Q3 export/).fill("5, E2E imported task, 8, 3");
    await expect(page.getByText(/1 valid row ready/i)).toBeVisible();
  });

  test("workload & retention: CSV export buttons are available", async ({ page }) => {
    await page.goto("/modules/workload");
    await expect(page.getByRole("button", { name: /Export CSV/i })).toBeVisible();
    await page.goto("/modules/retention");
    await expect(page.getByRole("button", { name: /Export CSV/i })).toBeVisible();
  });

  test("policy-gen: documents tab lists contracts and policy templates", async ({ page }) => {
    await page.goto("/modules/policy-gen");
    await page.getByRole("button", { name: "Documents" }).click();
    await expect(page.getByText("Employment contracts")).toBeVisible();
    await expect(page.getByText("HR policy documents")).toBeVisible();
    await expect(page.getByText(/Remote Work Policy/i)).toBeVisible();
  });

  test("organization: HR-Open interop browser renders and switches resources", async ({ page }) => {
    await page.goto("/organization");
    await page.getByRole("button", { name: "Interop" }).click();
    await expect(page.getByText(/HR-Open interoperability export/i)).toBeVisible();
    await page.getByRole("button", { name: "Person competencies" }).click();
    await expect(page.getByText(/GET \/api\/hr\/interop\/person-competencies/i)).toBeVisible();
  });

  test("future-skills: economic data and monitoring tabs render", async ({ page }) => {
    await page.goto("/modules/future-skills");
    await page.getByRole("button", { name: "Economic data" }).click();
    await expect(page.getByText(/Macro-economic indicators/i)).toBeVisible();
    await page.getByRole("button", { name: "Monitoring" }).click();
    await expect(page.getByRole("heading", { name: "Prediction drift", exact: true })).toBeVisible();
    await expect(page.getByText("Last-run delta")).toBeVisible();
    await expect(page.getByText(/Infrastructure/i)).toBeVisible();
    await expect(page.getByText("Rate limits")).toBeVisible();
  });

  test("future-skills: bulk import modal validates and imports rows", async ({ page }) => {
    await page.goto("/modules/future-skills");
    await page.getByRole("button", { name: "ML training" }).click();
    await expect(page.getByLabel("Training dataset CSV", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Import employees" }).click();
    await expect(page.getByRole("heading", { name: "Import employees" })).toBeVisible();
    await page
      .getByPlaceholder(/a\.karimi@acme\.dev/)
      .fill(`E2E Person ${Date.now()}, e2e.${Date.now()}@acme.dev, ENG, QA Engineer, Python;Kubernetes`);
    await expect(page.getByText(/1 valid row ready/i)).toBeVisible();
    await expect(page.getByLabel(/Generate skill predictions after import/i)).toBeChecked();
    await page.getByRole("dialog").getByRole("button", { name: /Import 1 row/i }).click();
    await expectToast(page, /Imported/i);
  });
});
