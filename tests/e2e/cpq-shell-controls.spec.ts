import { expect, test } from "@playwright/test";
import { seedWorkspace } from "./support/cpq";

test.describe("cpq shell controls e2e", () => {
  test("hides and restores the desktop workflow sidebar", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedWorkspace(page);
    await page.reload();
    await expect(page.getByText("Workflow")).toBeVisible();
    await expect(page.getByText("0 of 15 steps")).toBeVisible();
    await expect(page.getByText("0%")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Lead Created" }),
    ).toHaveAttribute("aria-current", "step");
    const sidebarGap = page.locator('[data-slot="sidebar-gap"]').first();
    const sidebarContainer = page.locator('[data-slot="sidebar-container"]').first();

    await expect(sidebarGap).toHaveCSS("width", "256px");
    await expect(sidebarContainer).toHaveCSS("left", "0px");

    await page.getByRole("button", { name: "Toggle workflow sidebar" }).click();

    await expect(sidebarGap).toHaveCSS("width", "0px");
    await expect(sidebarContainer).toHaveCSS("left", "-256px");
    await expect(page.getByRole("heading", { name: "DR INC" })).toBeVisible();

    await page.getByRole("button", { name: "Toggle workflow sidebar" }).click();

    await expect(sidebarGap).toHaveCSS("width", "256px");
    await expect(sidebarContainer).toHaveCSS("left", "0px");
  });

  test("renders dark mode with neutral shell colors on desktop and mobile", async ({
    page,
  }) => {
    /**
     * The shell colors come from a mix of CSS variables and dark-only utility
     * classes, so the regression check reads the actual rendered values.
     */
    const readShellColors = async (): Promise<{
      isDark: boolean;
      shellBackground: string | null;
      headerBackground: string;
      cardBackground: string | null;
    }> =>
      page.evaluate(() => {
        const shell = document.querySelector(".min-h-screen.bg-background");
        const header = document.querySelector("header");
        const card = document.querySelector("section.rounded-xl");

        return {
          isDark: document.documentElement.classList.contains("dark"),
          shellBackground: shell ? getComputedStyle(shell).backgroundColor : null,
          headerBackground: header
            ? getComputedStyle(header).backgroundColor
            : "",
          cardBackground: card ? getComputedStyle(card).backgroundColor : null,
        };
      });

    await page.goto("/");
    await seedWorkspace(page);
    await page.reload();

    await page.getByRole("button", { name: "Theme utility" }).click();

    await expect(page.locator("html")).toHaveClass(/dark/);

    const desktopColors = await readShellColors();

    expect(desktopColors).toEqual({
      isDark: true,
      shellBackground: "rgb(24, 24, 27)",
      headerBackground: "rgb(34, 34, 37)",
      cardBackground: "rgb(34, 34, 37)",
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Toggle workflow sidebar" }).click();
    await expect(page.getByRole("dialog", { name: "Sidebar" })).toBeVisible();

    const mobileColors = await readShellColors();

    expect(mobileColors.shellBackground).toBe("rgb(24, 24, 27)");
    expect(mobileColors.headerBackground).toBe("rgb(34, 34, 37)");
  });

  test("supports division creation and temporary read-only role preview", async ({
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
    await expect(
      page.getByRole("textbox", { name: "Filter build options" }),
    ).toBeVisible();
    await expect(page.getByText("What do you need?")).toHaveCount(0);

    await page.getByRole("navigation").getByRole("link", { name: "Dashboard" }).click();

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
    ).toHaveCount(0);
    await expect(page.getByLabel("Build total")).not.toHaveText("Hidden");
    await expect(page.getByRole("button", { name: "Add" }).first()).toBeEnabled();
  });

  test("closes the mobile workflow drawer after selecting a step", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await seedWorkspace(page);
    await page.reload();

    await page.getByRole("button", { name: "Toggle workflow sidebar" }).click();

    await expect(page.getByRole("dialog", { name: "Sidebar" })).toBeVisible();

    await page
      .getByRole("dialog", { name: "Sidebar" })
      .getByRole("button", { name: "Equipment Selected" })
      .click();

    await expect(page).toHaveURL(/\/configure\/est-001002$/);
    await expect(page.getByRole("heading", { name: "Configure" })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Sidebar" })).toHaveCount(0);
  });
});
