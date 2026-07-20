import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("navigation smoke", () => {
  test("logs in and every nav destination renders", async ({ page }) => {
    await login(page);

    const routes: [string, string][] = [
      ["/employees", "Employees"],
      ["/skill-gaps", "Skill Gap Predictions"],
      ["/wellbeing", "Wellbeing Surveys"],
      ["/reviews", "Performance Reviews"],
      ["/modules/workload", "Workload"],
      ["/modules/retention", "Attrition Prediction"],
      ["/modules/career-sim", "Career Simulator"],
      ["/modules/future-skills", "Future Skills"],
      ["/modules/policy-gen", "Policy Generator"],
      ["/organization", "Organization"],
      ["/actions", "Action Center"],
      ["/settings", "Settings"],
    ];

    for (const [path, heading] of routes) {
      await page.goto(path);
      await expect(page.getByText(heading).first()).toBeVisible();
    }
  });

  test("theme toggle flips light/dark", async ({ page }) => {
    await login(page);
    const html = page.locator("html");
    const before = await html.getAttribute("class");
    await page.getByLabel("Toggle theme").click();
    await expect(html).not.toHaveClass(before ?? "");
  });
});
