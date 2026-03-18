import { expect, test } from "@playwright/test";
import { seedWorkspace } from "./support/cpq";

test.describe("cpq shell controls e2e", () => {
  test("supports division creation and read-only role preview", async ({
    page,
  }) => {
    await page.goto("/");
    await seedWorkspace(page);
    await page.reload();

    await page.getByRole("button", { name: "Add Division" }).click();

    await expect(page).toHaveURL(/\/configure\/est-/);
    await expect(
      page.getByText("Add packages or products to start the build."),
    ).toBeVisible();

    await page.locator("main").getByRole("link", { name: "Dashboard" }).click();

    await expect(
      page.getByRole("heading", { name: "Opportunities (2)" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "View as Role" }).click();
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Viewer" }).click();

    await expect(page.getByText("Active role: viewer")).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByRole("link", { name: /Retro Brand Focal Walls/ }).click();

    await expect(
      page.getByRole("button", { name: "Approval Role Required" }),
    ).toBeDisabled();

    await page.getByRole("link", { name: "Open Configure" }).click();

    await expect(
      page.getByText("viewer role is read-only", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Read Only" }).first(),
    ).toBeDisabled();
    await expect(page.getByLabel("Build total")).toHaveText("Hidden");

    await page.reload();

    await expect(
      page.getByText("viewer role is read-only", { exact: false }),
    ).toBeVisible();
    await expect(page.getByLabel("Build total")).toHaveText("Hidden");
  });

  test("closes the mobile workflow drawer after selecting a step", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await seedWorkspace(page);
    await page.reload();

    await page.getByRole("button", { name: "Open workflow" }).click();

    await expect(page.getByRole("dialog", { name: "Workflow" })).toBeVisible();

    await page
      .getByRole("dialog", { name: "Workflow" })
      .getByRole("button", { name: "Equipment Selected" })
      .click();

    await expect(page).toHaveURL(/\/configure\/est-001002$/);
    await expect(page.getByRole("heading", { name: "Configure" })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Workflow" })).toHaveCount(0);
  });
});
